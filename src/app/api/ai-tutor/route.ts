import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServiceClient } from '@/lib/supabase/server'
import type { AiTutorRequest } from '@/lib/types'

// ── System prompt ──────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = `You are a patient, encouraging AI tutor for Moroccan 3ème collège students (ages 14–16).

Your identity: A supportive learning coach who uses the Socratic method.

Your core method:
1. First ask what the student has already tried.
2. Give a hint or ask a guiding question — do NOT give the final answer immediately.
3. If the student is stuck after 2–3 exchanges, provide a worked example step by step.
4. Always explain WHY, not just WHAT.
5. After the student succeeds, increase difficulty slightly or ask them to explain the concept back.

Response style:
- SHORT and CLEAR — never more than 4 short paragraphs
- Encouraging and positive (never shame the student)
- Use simple English; you may add a French or Arabic word occasionally for clarity
- Use numbered steps when explaining procedures
- Use examples with Moroccan/everyday context when helpful

Hard rules:
- NEVER simply give the final answer to a homework question without guiding
- NEVER ask for personal information
- NEVER introduce concepts far beyond 3ème level
- If the question is off-topic or inappropriate, gently redirect to studies`

// Rate limit: 30 requests per hour per student
const RATE_LIMIT = 30
const RATE_WINDOW_MINUTES = 60

// ── Provider helpers ───────────────────────────────────────────────────────

type ChatMessages = OpenAI.Chat.Completions.ChatCompletionMessageParam[]

async function callOpenAI(model: string, messages: ChatMessages): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const completion = await client.chat.completions.create({
    model,
    messages,
    max_tokens:  600,
    temperature: 0.7,
  })
  return completion.choices[0]?.message?.content ?? ''
}

async function callOpenRouter(model: string, messages: ChatMessages): Promise<string> {
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey:  process.env.OPENROUTER_API_KEY!,
  })
  const completion = await client.chat.completions.create({
    model,
    messages,
    max_tokens:  600,
    temperature: 0.7,
  })
  return completion.choices[0]?.message?.content ?? ''
}

// Errors that are worth falling back from (quota, auth, server errors)
function isRetryableProviderError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const s = (error as { status: number }).status
    return s === 429 || s === 401 || s === 403 || s === 500 || s === 502 || s === 503
  }
  return true // network/unknown errors are also retryable
}

// ── Main route ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: AiTutorRequest = await request.json()
    const { student_id, subject, lesson_id, question, exercise_context, conversation_history } = body

    if (!student_id || !question) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // ── Verify student exists ──────────────────────────────────────────
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', student_id)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 403 })
    }

    // ── Rate limiting ──────────────────────────────────────────────────
    const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('api_rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', student_id)
      .eq('endpoint', 'ai-tutor')
      .gte('created_at', windowStart)

    if ((count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: `You've reached the ${RATE_LIMIT} questions/hour limit. Please try again later.` },
        { status: 429 }
      )
    }

    // Record this request (fire-and-forget)
    supabase.from('api_rate_limits').insert({
      student_id,
      endpoint: 'ai-tutor',
    }).then(() => {}).catch(() => {})

    // ── Build context ──────────────────────────────────────────────────
    let lessonContext = ''
    if (lesson_id) {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('title, objective, content_md')
        .eq('id', lesson_id)
        .single()
      if (lesson) {
        lessonContext = `\nLesson: "${lesson.title}"`
        if (lesson.objective) lessonContext += `\nObjective: ${lesson.objective}`
        if (lesson.content_md) {
          const preview = lesson.content_md.substring(0, 500).replace(/#{1,6}\s/g, '').trim()
          lessonContext += `\nLesson content preview: ${preview}...`
        }
      }
    }

    let weakTopicsContext = ''
    const { data: diagnostics } = await supabase
      .from('diagnostic_results')
      .select('weak_topics, subject:subjects(name)')
      .eq('student_id', student_id)
      .not('weak_topics', 'is', null)

    if (diagnostics && diagnostics.length > 0) {
      const allWeak = diagnostics.flatMap((d: { weak_topics: unknown }) => {
        const topics = d.weak_topics as string[] | null
        return topics ?? []
      }).filter(Boolean)
      if (allWeak.length > 0) {
        weakTopicsContext = `\nStudent's known weak areas: ${Array.from(new Set(allWeak)).slice(0, 8).join(', ')}`
      }
    }

    // ── Build messages array ───────────────────────────────────────────
    const contextParts = [
      `Subject: ${subject}`,
      lessonContext,
      weakTopicsContext,
      exercise_context ? `\nExercise context: ${exercise_context}` : '',
      `\nGuide the student with the Socratic method — never give the final answer directly.`,
    ].filter(Boolean).join('')

    const messages: ChatMessages = [
      { role: 'system', content: BASE_SYSTEM_PROMPT },
      { role: 'system', content: contextParts },
    ]

    const history = (conversation_history ?? []).slice(-10)
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content })
    }
    messages.push({ role: 'user', content: question })

    // ── Call AI provider with automatic fallback ───────────────────────
    // Primary: AI_PROVIDER (default openai) with AI_MODEL
    // Fallback: OpenRouter with AI_FALLBACK_MODEL when OPENROUTER_API_KEY is set
    //           and the primary provider fails with a retryable error.
    const provider      = process.env.AI_PROVIDER      ?? 'openai'
    const model         = process.env.AI_MODEL         ?? 'gpt-4o-mini'
    const fallbackModel = process.env.AI_FALLBACK_MODEL ?? 'mistralai/mistral-7b-instruct:free'
    const hasFallback   = !!process.env.OPENROUTER_API_KEY

    let aiResponse = ''

    if (provider === 'openrouter') {
      // Explicit OpenRouter config — no fallback needed
      aiResponse = await callOpenRouter(model, messages)
    } else {
      // Try OpenAI first
      try {
        aiResponse = await callOpenAI(model, messages)
      } catch (primaryErr) {
        if (hasFallback && isRetryableProviderError(primaryErr)) {
          // Primary failed — attempt OpenRouter fallback silently
          console.warn('[AI Tutor] Primary provider failed, trying OpenRouter fallback:', (primaryErr as Error).message)
          aiResponse = await callOpenRouter(fallbackModel, messages)
        } else {
          throw primaryErr // No fallback available — let outer catch handle it
        }
      }
    }

    if (!aiResponse) {
      return NextResponse.json({ error: 'No response from AI.' }, { status: 502 })
    }

    // ── Log the interaction (fire-and-forget) ──────────────────────────
    supabase.from('ai_tutor_logs').insert({
      student_id,
      subject_id:    null,
      lesson_id:     lesson_id ?? null,
      user_question: question,
      ai_response:   aiResponse,
    }).then(() => {}).catch(() => {})

    return NextResponse.json({
      guided_response:     aiResponse,
      suggested_next_step: 'Try answering the question above before I give more hints.',
      confidence:          'high',
    })

  } catch (error: unknown) {
    // Map provider error codes to student-friendly responses.
    // Never expose API keys, model names, or internal error details.
    if (error && typeof error === 'object' && 'status' in error) {
      const { status } = error as { status: number }
      if (status === 429) {
        return NextResponse.json(
          { error: 'AI tutor is temporarily unavailable. Please try again in a few minutes.' },
          { status: 503 }
        )
      }
      if (status === 401 || status === 403) {
        return NextResponse.json(
          { error: 'AI tutor is not configured correctly. Please contact support.' },
          { status: 503 }
        )
      }
      if (status === 400) {
        return NextResponse.json(
          { error: 'Could not process your question. Please try rephrasing it.' },
          { status: 400 }
        )
      }
    }
    console.error('[AI Tutor Error]', error)
    return NextResponse.json(
      { error: 'AI tutor is temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
