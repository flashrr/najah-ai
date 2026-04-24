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
import type { Exercise, Lesson, LessonProgress, LessonResource, Subject, Week } from '@/lib/types'

interface SkillIndicator {
  displayName: string
  score: number | null   // null = not yet practiced
}

interface Props {
  lesson: Lesson & { subject?: Subject; week?: Week }
  exercises: Exercise[]
  studentId: string
  initialProgress: LessonProgress | null
  prevResultMap: Record<string, boolean>   // exerciseId → wasCorrect (most recent attempt)
  resources: LessonResource[]
  skillIndicator?: SkillIndicator | null
}

type Tab = 'lesson' | 'exercises' | 'tutor'

export default function LessonContent({ lesson, exercises, studentId, initialProgress, prevResultMap, resources, skillIndicator }: Props) {
  const router  = useRouter()
  const [tab, setTab]               = useState<Tab>('lesson')
  const [answered, setAnswered]     = useState<Record<string, boolean>>(
    () => Object.fromEntries(Object.keys(prevResultMap).map(id => [id, true]))
  )
  const [correctCount, setCorrect]  = useState(() => Object.values(prevResultMap).filter(Boolean).length)
  const [completed, setCompleted]   = useState(initialProgress?.status === 'completed')
  const [saving, setSaving]         = useState(false)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [reviewed,   setReviewed]   = useState(false)   // marked reviewed this session

  const totalEx    = exercises.length
  const answeredN  = Object.keys(answered).length
  // Content-only lessons (0 exercises) are considered "done" immediately
  const allDone    = totalEx === 0 || answeredN >= totalEx
  const scorePct   = totalEx > 0 ? Math.round((correctCount / totalEx) * 100) : 0
  // Content-only lessons can always be completed; exercise lessons need ≥ 50%
  const canComplete = totalEx === 0 || scorePct >= 50

  // True when the lesson was already completed before this session opened
  const alreadyCompleted = initialProgress?.status === 'completed'

  async function handleAnswer(exerciseId: string, _answer: string, isCorrect: boolean) {
    if (answered[exerciseId]) return // already answered this session

    setAnswered(prev => ({ ...prev, [exerciseId]: true }))
    if (isCorrect) setCorrect(c => c + 1)

    const supabase = createClient()

    // Save attempt
    try {
      const { error } = await supabase.from('attempts').insert({
        student_id:  studentId,
        exercise_id: exerciseId,
        answer:      _answer,
        is_correct:  isCorrect,
        score:       isCorrect ? 100 : 0,
      })
      if (error) console.error('[handleAnswer] attempt insert failed:', error.code, error.message, error.details)
    } catch (err) {
      console.error('[handleAnswer] unexpected error saving attempt:', err)
    }

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
      student_id:            studentId,
      lesson_id:             lesson.id,
      status:                'completed',
      score:                 scorePct,
      completed_at:          new Date().toISOString(),
      self_assessment_score: confidence ?? null,
    }, { onConflict: 'student_id,lesson_id' })

    // Bonus points for completing (fire-and-forget)
    try { await supabase.rpc('increment_points', { student_id: studentId, amount: 20 }) } catch { /* no-op */ }

    setCompleted(true)
    setSaving(false)
    router.back()
  }

  async function markInProgress() {
    const supabase = createClient()
    await supabase.from('lesson_progress').upsert({
      student_id: studentId,
      lesson_id:  lesson.id,
      status:     'in_progress',
    }, { onConflict: 'student_id,lesson_id' })
  }

  /**
   * markReviewed — refreshes completed_at to now so the review queue
   * recomputes a future due date. Does NOT change status or score.
   * Called when a student revisits an already-completed lesson.
   */
  async function markReviewed() {
    if (saving || reviewed) return
    setSaving(true)
    const supabase = createClient()
    try {
      await supabase.from('lesson_progress').upsert({
        student_id:   studentId,
        lesson_id:    lesson.id,
        status:       'completed',
        completed_at: new Date().toISOString(),
      }, { onConflict: 'student_id,lesson_id' })
      setReviewed(true)
    } catch (err) {
      console.error('[markReviewed] failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const diffLabel: Record<string, string> = { easy: 'badge-easy', medium: 'badge-medium', hard: 'badge-hard' }

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

            {/* Skill indicator — hidden when no skill is linked to this lesson's exercises */}
            {/* Prerequisites */}
            {lesson.prerequisites && (
              <div className="flex items-start gap-1.5 mt-2 text-xs text-gray-400">
                <span className="flex-shrink-0">📋</span>
                <span><span className="font-medium text-gray-500">Requires: </span>{lesson.prerequisites}</span>
              </div>
            )}

            {skillIndicator && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                <span>🧠</span>
                <span>Skill:</span>
                <span className="font-medium text-gray-700">{skillIndicator.displayName}</span>
                {skillIndicator.score !== null && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>Your score:</span>
                    <span className={`font-semibold ${
                      skillIndicator.score >= 75 ? 'text-green-600' : 'text-brand-600'
                    }`}>
                      {skillIndicator.score}/100
                    </span>
                  </>
                )}
              </div>
            )}
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
        <div className="space-y-4">
          {/* Before-content resources (intro video shown above lesson text) */}
          {resources.some(r => r.pedagogical_position === 'before_content') && (
            <LessonResourcesPanel resources={resources.filter(r => r.pedagogical_position === 'before_content')} />
          )}

          {/* Lesson markdown */}
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

          {/* Guided example — shown when available */}
          {lesson.guided_example_md && (
            <div className="card border-2 border-yellow-100 bg-yellow-50 prose prose-sm max-w-none prose-headings:font-bold prose-h2:text-base prose-h3:text-sm prose-p:text-gray-700 prose-strong:text-gray-900">
              <div className="flex items-center gap-2 mb-3 not-prose">
                <span className="text-lg">💡</span>
                <span className="font-semibold text-sm text-yellow-800">Guided Example</span>
              </div>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {lesson.guided_example_md}
              </ReactMarkdown>
            </div>
          )}

          {/* After-content resources (summaries, worked examples, supplemental) */}
          {resources.some(r => r.pedagogical_position !== 'before_content') && (
            <LessonResourcesPanel resources={resources.filter(r => r.pedagogical_position !== 'before_content')} />
          )}

          {/* Review CTA — shown when revisiting an already-completed lesson */}
          {alreadyCompleted && !reviewed && (
            <div className="card border-2 border-brand-100 bg-brand-50 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-brand-800">🔁 Reviewing this lesson?</p>
                <p className="text-sm text-brand-600 mt-0.5">
                  Tap to reset your review timer — it will reappear later based on your skill score.
                </p>
              </div>
              <button onClick={markReviewed} disabled={saving} className="btn-primary flex-shrink-0">
                {saving ? 'Saving…' : '✓ Mark as Reviewed'}
              </button>
            </div>
          )}
          {alreadyCompleted && reviewed && (
            <div className="card border-2 border-green-200 bg-green-50 text-center py-4">
              <p className="text-2xl mb-1">✅</p>
              <p className="font-semibold text-green-800">Review saved!</p>
              <p className="text-sm text-green-600 mt-1">This lesson will reappear in your review queue at the right time.</p>
            </div>
          )}
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
              initialCorrect={ex.id in prevResultMap ? prevResultMap[ex.id] : undefined}
            />
          ))}

          {/* Self-assessment — shown when all exercises done, lesson not yet complete, score qualifies */}
          {allDone && !completed && canComplete && (
            <div className="card border border-gray-100 space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                🤔 How well do you feel you understand this lesson?
              </p>
              <div className="flex gap-2">
                {([
                  { value: 1, emoji: '😕', label: 'Not at all' },
                  { value: 2, emoji: '😐', label: 'A little'   },
                  { value: 3, emoji: '🙂', label: 'Somewhat'   },
                  { value: 4, emoji: '😊', label: 'Confident'  },
                  { value: 5, emoji: '🤩', label: 'Very sure'  },
                ] as { value: number; emoji: string; label: string }[]).map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setConfidence(value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-colors ${
                      confidence === value
                        ? 'border-brand-400 bg-brand-50 text-brand-700 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-500'
                    }`}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
              {confidence
                ? <p className="text-xs text-green-600 text-center">✓ Answer saved</p>
                : <p className="text-xs text-gray-400 text-center">Optional — you can still mark complete without answering.</p>
              }
            </div>
          )}

          {allDone && !completed && (
            <div className={`card border-2 flex items-center justify-between gap-4 flex-wrap ${
              canComplete ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'
            }`}>
              <div>
                <p className={`font-semibold ${canComplete ? 'text-green-800' : 'text-orange-800'}`}>
                  {totalEx === 0
                    ? '📖 Lesson read!'
                    : `All exercises done! Score: ${scorePct}%`}
                </p>
                <p className={`text-sm mt-0.5 ${canComplete ? 'text-green-700' : 'text-orange-700'}`}>
                  {totalEx === 0
                    ? 'Mark this lesson complete to earn 20 points.'
                    : scorePct >= 75
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

          {allDone && completed && !alreadyCompleted && (
            <div className="card border-2 border-brand-200 bg-brand-50 text-center py-6">
              <p className="text-2xl mb-1">🏆</p>
              <p className="font-semibold text-brand-800">Lesson completed! Score: {scorePct}%</p>
            </div>
          )}

          {/* Review CTA in exercises tab — same card as lesson tab */}
          {alreadyCompleted && !reviewed && (
            <div className="card border-2 border-brand-100 bg-brand-50 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-brand-800">🔁 Reviewed this lesson?</p>
                <p className="text-sm text-brand-600 mt-0.5">
                  Tap to reset your review timer — it will reappear later based on your skill score.
                </p>
              </div>
              <button onClick={markReviewed} disabled={saving} className="btn-primary flex-shrink-0">
                {saving ? 'Saving…' : '✓ Mark as Reviewed'}
              </button>
            </div>
          )}
          {alreadyCompleted && reviewed && (
            <div className="card border-2 border-green-200 bg-green-50 text-center py-4">
              <p className="text-2xl mb-1">✅</p>
              <p className="font-semibold text-green-800">Review saved!</p>
              <p className="text-sm text-green-600 mt-1">This lesson will reappear in your review queue at the right time.</p>
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

// ── Lesson Resources Panel ─────────────────────────────────────────────────────

function LessonResourcesPanel({ resources }: { resources: LessonResource[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const isBefore = resources.every(r => r.pedagogical_position === 'before_content')
  const video    = resources.find(r => r.resource_type === 'main_video' && r.youtube_id)
  const summary  = resources.find(r => r.resource_type === 'summary' && r.content_md)
  const others   = resources.filter(r => r !== video && r !== summary)

  if (!video && !summary && others.length === 0) return null

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
        <span>{isBefore ? '📺' : '📚'}</span>
        {isBefore ? 'Watch before reading' : 'Lesson Resources'}
      </h2>

      {/* Main video */}
      {video && video.youtube_id && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Video</p>
          <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${video.youtube_id}`}
              title={video.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Summary — collapsible */}
      {summary && summary.content_md && (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenId(openId === summary.id ? null : summary.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>📋</span> {summary.title}
            </span>
            <span className="text-gray-400 text-xs">{openId === summary.id ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {openId === summary.id && (
            <div className="px-4 pb-4 prose prose-sm max-w-none border-t border-gray-100 pt-3 prose-headings:font-bold prose-h2:text-sm prose-h3:text-xs prose-p:text-gray-700 prose-table:text-xs prose-code:text-xs">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {summary.content_md}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* Other resources */}
      {others.map(r => {
        const icon = r.resource_type === 'supplemental_video' ? '🎬'
          : r.resource_type === 'exercise_set'   ? '✏️'
          : r.resource_type === 'reference'      ? '📖'
          : r.resource_type === 'worked_example' ? '📝'
          : r.resource_type === 'retrieval_quiz' ? '🧠'
          : r.resource_type === 'worksheet_pdf'  ? '📎'
          : '📄'
        const hasMarkdown = (r.resource_type === 'worked_example' || r.resource_type === 'retrieval_quiz') && !!r.content_md

        if (hasMarkdown) {
          return (
            <div key={r.id} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2"><span>{icon}</span> {r.title}</span>
                <span className="text-gray-400 text-xs">{openId === r.id ? '▲ Hide' : '▼ Show'}</span>
              </button>
              {openId === r.id && (
                <div className="px-4 pb-4 prose prose-sm max-w-none border-t border-gray-100 pt-3 prose-headings:font-bold prose-h2:text-sm prose-h3:text-xs prose-p:text-gray-700 prose-code:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {r.content_md!}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )
        }

        // Strip admin-facing notes from student view (descriptions starting with ⚠️ are admin-only)
        const studentDesc = r.description && !r.description.startsWith('⚠️') ? r.description : null
        return (
          <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <span className="text-lg flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{r.title}</p>
              {studentDesc && <p className="text-xs text-gray-500 mt-0.5">{studentDesc}</p>}
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                  Open resource →
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
