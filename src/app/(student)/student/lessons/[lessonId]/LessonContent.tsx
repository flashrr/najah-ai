'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { createClient } from '@/lib/supabase/client'
import ExerciseCard from '@/components/ExerciseCard'
import TutorChat from '@/components/TutorChat'
import ProgressBar from '@/components/ProgressBar'
import type { Exercise, Lesson, LessonProgress, Subject, Week } from '@/lib/types'

interface Props {
  lesson: Lesson & { subject?: Subject; week?: Week }
  exercises: Exercise[]
  studentId: string
  initialProgress: LessonProgress | null
  attemptedSet: string[]
}

type Tab = 'lesson' | 'exercises' | 'tutor'

export default function LessonContent({ lesson, exercises, studentId, initialProgress, attemptedSet }: Props) {
  const router  = useRouter()
  const [tab, setTab]               = useState<Tab>('lesson')
  const [answered, setAnswered]     = useState<Record<string, boolean>>(
    () => Object.fromEntries(attemptedSet.map(id => [id, true]))
  )
  const [correctCount, setCorrect]  = useState(0)
  const [completed, setCompleted]   = useState(initialProgress?.status === 'completed')
  const [saving, setSaving]         = useState(false)

  const totalEx    = exercises.length
  const answeredN  = Object.keys(answered).length
  const allDone    = answeredN >= totalEx && totalEx > 0
  const scorePct   = totalEx > 0 ? Math.round((correctCount / totalEx) * 100) : 0

  // Mastery threshold: student must score ≥ 50% to mark complete
  const canComplete = scorePct >= 50

  async function handleAnswer(exerciseId: string, _answer: string, isCorrect: boolean) {
    if (answered[exerciseId]) return // already answered this session

    setAnswered(prev => ({ ...prev, [exerciseId]: true }))
    if (isCorrect) setCorrect(c => c + 1)

    const supabase = createClient()

    // Save attempt
    await supabase.from('attempts').insert({
      student_id:  studentId,
      exercise_id: exerciseId,
      answer:      _answer,
      is_correct:  isCorrect,
      score:       isCorrect ? 100 : 0,
    })

    // Award points (fire-and-forget)
    if (isCorrect) {
      try { await supabase.rpc('increment_points', { student_id: studentId, amount: 5 }) } catch { /* no-op */ }
    }
  }

  async function markComplete() {
    if (saving || completed || !canComplete) return
    setSaving(true)

    const supabase = createClient()
    await supabase.from('lesson_progress').upsert({
      student_id:   studentId,
      lesson_id:    lesson.id,
      status:       'completed',
      score:        scorePct,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' })

    // Bonus points for completing (fire-and-forget)
    try { await supabase.rpc('increment_points', { student_id: studentId, amount: 20 }) } catch { /* no-op */ }

    setCompleted(true)
    setSaving(false)
    router.push('/student/weekly-plan')
  }

  async function markInProgress() {
    const supabase = createClient()
    await supabase.from('lesson_progress').upsert({
      student_id: studentId,
      lesson_id:  lesson.id,
      status:     'in_progress',
    }, { onConflict: 'student_id,lesson_id' })
  }

  const diffLabel = { easy: 'badge-easy', medium: 'badge-medium', hard: 'badge-hard' }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{lesson.subject?.icon}</span>
          <div className="flex-1">
            <h1 className="font-bold text-xl">{lesson.title}</h1>
            {lesson.objective && <p className="text-sm text-gray-500 mt-0.5">{lesson.objective}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={diffLabel[lesson.difficulty]}>{lesson.difficulty}</span>
              <span className="text-xs text-gray-400">{lesson.estimated_minutes} min</span>
              {lesson.week && <span className="text-xs text-gray-400">{lesson.week.title}</span>}
            </div>
          </div>
          {completed && (
            <span className="text-green-500 text-xl flex-shrink-0">✓ Done</span>
          )}
        </div>

        {/* Exercise progress */}
        {totalEx > 0 && (
          <div className="mt-4">
            <ProgressBar
              value={Math.round((answeredN / totalEx) * 100)}
              label={`${answeredN}/${totalEx} exercises answered`}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['lesson', 'exercises', 'tutor'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t !== 'lesson') markInProgress() }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'lesson' ? '📖 Lesson' : t === 'exercises' ? `✏️ Exercises (${totalEx})` : '🤖 AI Tutor'}
          </button>
        ))}
      </div>

      {/* Lesson content */}
      {tab === 'lesson' && (
        <div className="card prose prose-sm max-w-none prose-headings:font-bold prose-h2:text-base prose-h3:text-sm prose-p:text-gray-700 prose-strong:text-gray-900">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {lesson.content_md}
          </ReactMarkdown>
          <div className="mt-6 pt-4 border-t border-gray-100 not-prose">
            <button
              className="btn-primary"
              onClick={() => setTab('exercises')}
            >
              Go to exercises →
            </button>
          </div>
        </div>
      )}

      {/* Exercises */}
      {tab === 'exercises' && (
        <div className="space-y-4">
          {exercises.length === 0 && (
            <div className="card text-center text-gray-400 py-10">No exercises for this lesson yet.</div>
          )}

          {exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              onAnswer={handleAnswer}
              disabled={!!answered[ex.id]}
            />
          ))}

          {allDone && !completed && (
            <div className={`card border-2 flex items-center justify-between gap-4 flex-wrap ${
              canComplete ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'
            }`}>
              <div>
                <p className={`font-semibold ${canComplete ? 'text-green-800' : 'text-orange-800'}`}>
                  All exercises done! Score: {scorePct}%
                </p>
                <p className={`text-sm mt-0.5 ${canComplete ? 'text-green-700' : 'text-orange-700'}`}>
                  {scorePct >= 75
                    ? 'Great work! Mark this lesson complete to earn 20 points.'
                    : scorePct >= 50
                    ? 'Good effort. Review the explanations, then mark complete.'
                    : 'You need at least 50% to complete this lesson. Review the lesson and try again.'}
                </p>
              </div>
              {canComplete ? (
                <button className="btn-primary" onClick={markComplete} disabled={saving}>
                  {saving ? 'Saving...' : 'Mark complete (+20pts)'}
                </button>
              ) : (
                <button className="btn-secondary" onClick={() => setTab('lesson')}>
                  ↩ Review lesson
                </button>
              )}
            </div>
          )}

          {allDone && completed && (
            <div className="card border-2 border-brand-200 bg-brand-50 text-center py-6">
              <p className="text-2xl mb-1">🏆</p>
              <p className="font-semibold text-brand-800">Lesson completed! Score: {scorePct}%</p>
            </div>
          )}
        </div>
      )}

      {/* AI Tutor */}
      {tab === 'tutor' && (
        <TutorChat
          studentId={studentId}
          subject={lesson.subject?.name ?? 'General'}
          lessonId={lesson.id}
        />
      )}
    </div>
  )
}
