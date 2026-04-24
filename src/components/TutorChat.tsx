'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TutorChatProps {
  studentId: string
  subject: string
  lessonId?: string
  exerciseContext?: string
}

const GREETING = (subject: string) =>
  `Hi! I'm your AI tutor for **${subject}**. What are you working on? Tell me what you've tried so far and I'll guide you through it step by step. 🎯`

export default function TutorChat({ studentId, subject, lessonId, exerciseContext }: TutorChatProps) {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const sessionIdRef              = useRef<string | null>(null)
  const bottomRef                 = useRef<HTMLDivElement>(null)

  // ── Load existing session on mount ──────────────────────────────────
  useEffect(() => {
    async function loadSession() {
      setSessionLoading(true)
      const supabase = createClient()

      // Build query with correct null handling — avoid reassignment to keep TS happy
      const baseQuery = supabase
        .from('tutor_sessions')
        .select('id, messages')
        .eq('student_id', studentId)
        .eq('subject', subject)

      const { data } = await (lessonId
        ? baseQuery.eq('lesson_id', lessonId)
        : baseQuery.is('lesson_id', null)
      ).order('created_at', { ascending: false }).limit(1).maybeSingle()

      if (data && Array.isArray(data.messages) && (data.messages as Message[]).length > 0) {
        sessionIdRef.current = data.id
        setMessages(data.messages as Message[])
      } else {
        // No existing session — show greeting
        setMessages([{ role: 'assistant', content: GREETING(subject) }])
      }
      setSessionLoading(false)
    }
    loadSession()
  }, [studentId, subject, lessonId])

  // ── Scroll to bottom on new message ─────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Persist messages to tutor_sessions ──────────────────────────────
  async function persistMessages(msgs: Message[]) {
    const supabase = createClient()

    if (sessionIdRef.current) {
      await supabase
        .from('tutor_sessions')
        .update({ messages: msgs })
        .eq('id', sessionIdRef.current)
    } else {
      const { data } = await supabase
        .from('tutor_sessions')
        .insert({
          student_id: studentId,
          subject,
          lesson_id: lessonId ?? null,
          messages:  msgs,
        })
        .select('id')
        .single()
      if (data?.id) sessionIdRef.current = data.id
    }
  }

  // ── Send message ─────────────────────────────────────────────────────
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    const userMsg: Message  = { role: 'user', content: question }
    const nextMessages      = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:           studentId,
          subject,
          lesson_id:            lessonId,
          question,
          exercise_context:     exerciseContext,
          conversation_history: messages, // exclude userMsg — server appends question separately
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Map HTTP status to a student-friendly message — never show raw API errors
        let friendlyError: string
        if (res.status === 429) {
          friendlyError = data.error ?? "You've reached the question limit for this hour. Please wait a bit before asking again. 🕐"
        } else if (res.status === 503) {
          friendlyError = 'The AI tutor is temporarily unavailable. Please try again in a moment. 🔧'
        } else if (res.status === 400) {
          friendlyError = "I couldn't quite understand that question. Could you try rephrasing it? ✏️"
        } else {
          friendlyError = 'Something went wrong. Please try again in a moment.'
        }
        throw new Error(friendlyError)
      }

      const botMsg: Message   = { role: 'assistant', content: data.guided_response }
      const finalMessages     = [...nextMessages, botMsg]
      setMessages(finalMessages)

      // Persist conversation (fire-and-forget — don't block UI)
      persistMessages(finalMessages).catch(() => {})
    } catch (err) {
      // err.message is already student-friendly (set above for HTTP errors,
      // or a network error message for fetch failures)
      const errorMsg: Message = {
        role: 'assistant',
        content: (err as Error).message.startsWith('Failed to fetch')
          ? 'Could not reach the AI tutor. Please check your connection and try again.'
          : (err as Error).message,
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px] min-h-[400px] card p-0 overflow-hidden">
      {/* Header */}
      <div className="bg-brand-600 text-white px-4 py-3 flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <div>
          <div className="font-semibold text-sm">AI Tutor</div>
          <div className="text-xs text-brand-200">{subject} — always here to guide you</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {sessionLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Loading conversation<span className="animate-pulse">...</span>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                  Thinking<span className="animate-pulse">...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="border-t border-gray-100 px-4 py-3 flex gap-2">
        <input
          type="text"
          className="input flex-1 text-sm"
          placeholder="Ask a question or describe what you tried..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading || sessionLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || sessionLoading}
          className="btn-primary text-sm px-4"
        >
          Send
        </button>
      </form>
    </div>
  )
}
