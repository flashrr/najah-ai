import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import LessonContent from './LessonContent'
import type { LessonResource } from '@/lib/types'

interface Props {
  params: { lessonId: string }
}

export default async function LessonPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — auth already verified above; regular server client does
  // not reliably propagate session to RLS in server components (setAll silent failure).
  // Redirect to '/' not '/login' — middleware Rule B would loop us back here.
  const admin = createServiceClient()
  const { data: student } = await admin
    .from('students')
    .select('id, points')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (!student) redirect('/')

  // Service client bypasses RLS recursion caused by admin policies referencing profiles
  const { data: lesson } = await admin
    .from('lessons')
    .select('*, subject:subjects(*), week:weeks(*)')
    .eq('id', params.lessonId)
    .single()
  if (!lesson) notFound()

  const { data: exercises } = await admin
    .from('exercises')
    .select('*')
    .eq('lesson_id', params.lessonId)
    .order('order_index')

  const { data: progress } = await admin
    .from('lesson_progress')
    .select('*')
    .eq('student_id', student.id)
    .eq('lesson_id', params.lessonId)
    .maybeSingle()

  const { data: prevAttempts } = await admin
    .from('attempts')
    .select('exercise_id, is_correct')
    .eq('student_id', student.id)
    .in('exercise_id', (exercises ?? []).map((e: { id: string }) => e.id))
    .order('created_at', { ascending: false })  // most-recent first

  // Build map: exerciseId → isCorrect (first entry wins = most recent attempt)
  type AttemptRow = { exercise_id: string; is_correct: boolean }
  const prevResultMap: Record<string, boolean> = {}
  for (const a of (prevAttempts as AttemptRow[] | null) ?? []) {
    if (!(a.exercise_id in prevResultMap)) {
      prevResultMap[a.exercise_id] = a.is_correct
    }
  }

  // ── Fetch active, validated lesson resources (quality_score >= 3) ────────────
  // is_validated = true is the safety gate — admin must watch before students see it
  const { data: resourceRows } = await admin
    .from('lesson_resources')
    .select('*')
    .eq('lesson_id', params.lessonId)
    .eq('is_active', true)
    .eq('is_validated', true)
    .gte('quality_score', 3)
    .order('order_index')

  const resources = (resourceRows ?? []) as LessonResource[]

  // ── Chapter lookup for breadcrumb ─────────────────────────────────────────
  let chapterBreadcrumb: { id: string; title: string } | null = null
  if (lesson.chapter_id) {
    const { data: ch } = await admin
      .from('chapters')
      .select('id, title')
      .eq('id', lesson.chapter_id)
      .maybeSingle()
    if (ch) chapterBreadcrumb = ch as { id: string; title: string }
  }

  // ── Skill indicator (lightweight) ──────────────────────────────────────────
  // Take the first registered skill_tag from the lesson's exercises.
  // Two fast point-reads: skill_definitions (name) + skill_mastery (score).
  // Both return null gracefully — indicator is simply hidden when absent.
  const primarySkillTag = ((exercises ?? []) as { skill_tag: string | null }[]).find(e => e.skill_tag)?.skill_tag ?? null

  let skillIndicator: { displayName: string; score: number | null } | null = null

  if (primarySkillTag) {
    const [
      { data: skillDef,     error: defErr     },
      { data: skillMastery, error: masteryErr },
    ] = await Promise.all([
      admin
        .from('skill_definitions')
        .select('display_name')
        .eq('skill_tag', primarySkillTag)
        .maybeSingle(),
      admin
        .from('skill_mastery')
        .select('score')
        .eq('student_id', student.id)
        .eq('skill_tag', primarySkillTag)
        .maybeSingle(),
    ])

    if (defErr)     console.error('[SkillIndicator] skill_definitions query error:', defErr)
    if (masteryErr) console.error('[SkillIndicator] skill_mastery query error:',     masteryErr)

    if (skillDef) {
      skillIndicator = {
        displayName: (skillDef as { display_name: string }).display_name,
        score:       (skillMastery as { score: number } | null)?.score ?? null,
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4 flex items-center gap-1 flex-wrap">
        {chapterBreadcrumb ? (
          <>
            <Link href="/student/chapters" className="hover:text-brand-600">Chapters</Link>
            <span>/</span>
            <Link href={`/student/chapters/${chapterBreadcrumb.id}`} className="hover:text-brand-600">
              {chapterBreadcrumb.title}
            </Link>
          </>
        ) : (
          <Link href="/student/weekly-plan" className="hover:text-brand-600">Weekly Plan</Link>
        )}
        <span>/</span>
        <span>{lesson.subject?.name}</span>
        <span>/</span>
        <span className="text-gray-700">{lesson.title}</span>
      </nav>

      <LessonContent
        lesson={lesson}
        exercises={exercises ?? []}
        studentId={student.id}
        initialProgress={progress ?? null}
        prevResultMap={prevResultMap}
        resources={resources}
        skillIndicator={skillIndicator}
      />
    </div>
  )
}
