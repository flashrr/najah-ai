'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveChapterAssessment } from './actions'

/* ── Types ─────────────────────────────────────────────────────────── */
interface ChapterData {
  id:          string
  title:       string
  description: string | null
  grade:       string
  subject:     { name: string; icon: string } | null
}

interface LessonData {
  id:                string
  title:             string
  difficulty:        string
  estimated_minutes: number
  order_index:       number
}

interface ProgressRow {
  lesson_id: string
  status:    string
}

interface AssessmentData {
  type:            string
  score:           number | null
  correct_count:   number | null
  total_questions: number | null
  completed_at:    string
}

interface ExerciseData {
  id:             string
  lesson_id:      string
  question:       string
  type:           string
  options:        string[] | null
  correct_answer: string
  explanation:    string | null
  skill_tag:      string | null
}

interface Props {
  chapterId:     string
  studentId:     string
  chapter:       ChapterData
  lessons:       LessonData[]
  progressRows:  ProgressRow[]
  assessments:   AssessmentData[]
  quizExercises: ExerciseData[]
}

type Mode = 'overview' | 'assessment'

/* ── Helpers ────────────────────────────────────────────────────────── */
const diffBadge: Record<string, string> = {
  easy:   'badge-easy',
  medium: 'badge-medium',
  hard:   'badge-hard',
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
  return (
    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}%
    </span>
  )
}

/* ── Main Component ─────────────────────────────────────────────────── */
export default function ChapterView({
  chapterId, studentId, chapter, lessons,
  progressRows, assessments, quizExercises,
}: Props) {
  const router = useRouter()

  /* derived data */
  const progressMap: Record<string, string> = {}
  for (const p of progressRows) progressMap[p.lesson_id] = p.status

  const completedCount = lessons.filter(l => progressMap[l.id] === 'completed').length
  const totalLessons   = lessons.length
  const allLessonsDone = completedCount === totalLessons && totalLessons > 0

  const diagnosticResult  = assessments.find(a => a.type === 'diagnostic')  ?? null
  const evaluationResult  = assessments.find(a => a.type === 'evaluation')  ?? null

  /* assessment state */
  const [mode,       setMode]       = useState<Mode>('overview')
  const [assessType, setAssessType] = useState<'diagnostic' | 'evaluation'>('diagnostic')
  const [currentQ,   setCurrentQ]   = useState(0)
  const [selected,   setSelected]   = useState<string | null>(null)
  const [revealed,   setRevealed]   = useState(false)
  const [results,    setResults]    = useState<{ correct: boolean }[]>([])
  const [finished,   setFinished]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [saveError,  setSaveError]  = useState(false)

  /* no quiz exercises edge case */
  const hasQuiz = quizExercises.length > 0

  // Safety guard: if somehow we reach assessment mode with no exercises, exit immediately
  if (mode === 'assessment' && !hasQuiz) {
    return (
      <div className="max-w-md mx-auto pt-8 text-center space-y-3">
        <p className="text-2xl">⚠️</p>
        <p className="font-semibold text-gray-700">No quiz questions available yet.</p>
        <button onClick={() => setMode('overview')} className="btn-primary">
          Back to Chapter
        </button>
      </div>
    )
  }

  function startAssessment(type: 'diagnostic' | 'evaluation') {
    setAssessType(type)
    setCurrentQ(0)
    setSelected(null)
    setRevealed(false)
    setResults([])
    setFinished(false)
    setFinalScore(null)
    setSaveError(false)
    setMode('assessment')
  }

  function handleSelect(option: string) {
    if (revealed) return
    setSelected(option)
  }

  function handleReveal() {
    if (!selected || revealed) return
    setRevealed(true)
  }

  async function handleNext() {
    const ex          = quizExercises[currentQ]
    const isCorrect   = selected === ex.correct_answer
    const newResults  = [...results, { correct: isCorrect }]
    setResults(newResults)

    if (currentQ + 1 < quizExercises.length) {
      setCurrentQ(currentQ + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      /* finished — compute score and save */
      const correctCount = newResults.filter(r => r.correct).length
      const score        = Math.round((correctCount / quizExercises.length) * 100)
      setFinalScore(score)
      setFinished(true)
      setSaving(true)
      try {
        await saveChapterAssessment(
          studentId, chapterId, assessType,
          score, quizExercises.length, correctCount,
        )
      } catch {
        setSaveError(true)
      } finally {
        setSaving(false)
      }
    }
  }

  function backToOverview() {
    setMode('overview')
    router.refresh()
  }

  /* ── Assessment: Result Screen ────────────────────────────────────── */
  if (mode === 'assessment' && finished) {
    const correctCount  = results.filter(r => r.correct).length
    const isPre         = assessType === 'diagnostic'
    const otherResult   = isPre ? evaluationResult : diagnosticResult
    const improvement   =
      !isPre && otherResult?.score != null && finalScore != null
        ? finalScore - otherResult.score
        : null

    return (
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <div className="card text-center space-y-4">
          <p className="text-4xl">
            {finalScore! >= 80 ? '🎉' : finalScore! >= 50 ? '👍' : '💪'}
          </p>
          <div>
            <p className="text-3xl font-bold text-gray-800">{finalScore}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {correctCount} / {quizExercises.length} correct
            </p>
          </div>

          {isPre ? (
            <p className="text-sm text-gray-600">
              Chapter diagnostic complete. Start the lessons below to improve your score!
            </p>
          ) : improvement !== null ? (
            <p className="text-sm text-gray-600">
              {improvement > 0
                ? `You improved by +${improvement}% since your diagnostic! 🚀`
                : improvement === 0
                ? 'Same score as your diagnostic — keep practising!'
                : `Your diagnostic was ${Math.abs(improvement)}% higher. Review the lessons again.`}
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Chapter evaluation complete. Well done for finishing!
            </p>
          )}

          {saveError && (
            <p className="text-xs text-red-500">
              ⚠️ Result could not be saved. Please try again.
            </p>
          )}

          {saving && (
            <p className="text-xs text-gray-400 animate-pulse">Saving result…</p>
          )}

          <button
            onClick={backToOverview}
            disabled={saving}
            className="btn-primary w-full"
          >
            Back to Chapter
          </button>
        </div>
      </div>
    )
  }

  /* ── Assessment: Question Screen ──────────────────────────────────── */
  if (mode === 'assessment') {
    const ex      = quizExercises[currentQ]
    const options = ex.options ?? []
    const isLast  = currentQ + 1 === quizExercises.length
    const isCorrect = selected === ex.correct_answer

    return (
      <div className="max-w-md mx-auto space-y-4 pt-4">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>
            {assessType === 'diagnostic' ? 'Chapter Diagnostic' : 'Chapter Evaluation'}
          </span>
          <span>Question {currentQ + 1} of {quizExercises.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${((currentQ) / quizExercises.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="card space-y-4">
          <p className="font-medium text-gray-800 leading-snug">{ex.question}</p>

          {/* MCQ options */}
          {ex.type === 'mcq' && options.length > 0 && (
            <div className="space-y-2">
              {options.map((opt, i) => {
                const isSelected = selected === opt
                const isRight    = opt === ex.correct_answer

                let cls = 'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors '
                if (!revealed) {
                  cls += isSelected
                    ? 'border-brand-400 bg-brand-50 text-brand-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                } else {
                  if (isRight)       cls += 'border-green-400 bg-green-50 text-green-700 font-medium'
                  else if (isSelected) cls += 'border-red-300 bg-red-50 text-red-700'
                  else               cls += 'border-gray-100 text-gray-400'
                }

                return (
                  <button key={i} onClick={() => handleSelect(opt)} className={cls}>
                    <span className="mr-2 text-gray-400">
                      {revealed
                        ? isRight ? '✅' : isSelected ? '❌' : ''
                        : String.fromCharCode(65 + i) + '.'}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {/* Short answer — just show correct answer after selection */}
          {ex.type !== 'mcq' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                {revealed
                  ? `Correct answer: ${ex.correct_answer}`
                  : 'Tap below to reveal the answer.'}
              </p>
              {!revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  className="btn-secondary w-full text-sm"
                >
                  Reveal Answer
                </button>
              )}
            </div>
          )}

          {/* Explanation */}
          {revealed && ex.explanation && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 leading-relaxed">
              💡 {ex.explanation}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!revealed && ex.type === 'mcq' && (
            <button
              onClick={handleReveal}
              disabled={!selected}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              Check Answer
            </button>
          )}
          {revealed && (
            <button onClick={handleNext} className="btn-primary flex-1">
              {isLast ? 'See Results' : 'Next Question →'}
            </button>
          )}
        </div>

        <button
          onClick={() => setMode('overview')}
          className="text-xs text-gray-400 hover:text-gray-600 w-full text-center"
        >
          ← Back to chapter (progress will be lost)
        </button>
      </div>
    )
  }

  /* ── Overview ───────────────────────────────────────────────────────── */
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="card space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{chapter.subject?.icon ?? '📚'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-gray-900 text-lg leading-tight">{chapter.title}</h1>
              <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
                {chapter.grade}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{chapter.subject?.name}</p>
            {chapter.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{chapter.description}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Lessons</span>
            <span>{completedCount}/{totalLessons} completed</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pre-diagnostic */}
      <div className={`card border-2 ${diagnosticResult ? 'border-green-200 bg-green-50' : 'border-brand-100'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">{diagnosticResult ? '✅' : '🎯'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800">Chapter Diagnostic</p>
            {diagnosticResult ? (
              <p className="text-xs text-gray-500 mt-0.5">
                Completed · Score: {diagnosticResult.score}%
                &nbsp;({diagnosticResult.correct_count}/{diagnosticResult.total_questions} correct)
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                Quick {quizExercises.length}-question pre-test to gauge your starting level.
              </p>
            )}
          </div>
          {!diagnosticResult && hasQuiz && (
            <button
              onClick={() => startAssessment('diagnostic')}
              className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
            >
              Start
            </button>
          )}
          {diagnosticResult && (
            <ScoreBadge score={diagnosticResult.score!} />
          )}
        </div>
      </div>

      {/* Lessons */}
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-gray-700 px-1">Lessons</h2>
        {lessons.length === 0 && (
          <div className="card text-center py-8 text-gray-400 space-y-1">
            <p className="text-2xl">📚</p>
            <p className="text-sm">No lessons added to this chapter yet.</p>
          </div>
        )}
        {lessons.map((l, idx) => {
          const status       = progressMap[l.id]
          const isDone       = status === 'completed'
          const isInProgress = status === 'in_progress'
          return (
            <Link
              key={l.id}
              href={`/student/lessons/${l.id}`}
              className={`card flex items-center gap-3 hover:border-brand-200 transition-colors border-2 ${
                isDone       ? 'border-green-200 bg-green-50' :
                isInProgress ? 'border-brand-100' :
                               'border-gray-100'
              }`}
            >
              <span className="flex-shrink-0 text-lg">
                {isDone ? '✅' : isInProgress ? '📖' : '⭕'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm leading-snug ${isDone ? 'text-green-800' : 'text-gray-800'}`}>
                  {idx + 1}. {l.title}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={diffBadge[l.difficulty] ?? 'badge-medium'}>{l.difficulty}</span>
                <span className="text-xs text-gray-400">{l.estimated_minutes} min</span>
                <span className="text-gray-300 text-xs">→</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Chapter Evaluation */}
      <div className={`card border-2 ${
        evaluationResult        ? 'border-green-200 bg-green-50' :
        allLessonsDone && hasQuiz ? 'border-brand-100' :
                                  'border-gray-100 opacity-60'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">
            {evaluationResult ? '🏆' : allLessonsDone ? '🔓' : '🔒'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800">Chapter Evaluation</p>
            {evaluationResult ? (
              <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                <p>Completed · Score: {evaluationResult.score}%
                  &nbsp;({evaluationResult.correct_count}/{evaluationResult.total_questions} correct)</p>
                {diagnosticResult?.score != null && (
                  <p className="text-green-600 font-medium">
                    {evaluationResult.score! > diagnosticResult.score
                      ? `+${evaluationResult.score! - diagnosticResult.score}% improvement since diagnostic 🚀`
                      : evaluationResult.score! === diagnosticResult.score
                      ? 'Same score as diagnostic'
                      : `${diagnosticResult.score - evaluationResult.score!}% below diagnostic — review lessons`}
                  </p>
                )}
              </div>
            ) : allLessonsDone ? (
              <p className="text-xs text-gray-500 mt-0.5">
                All lessons done! Take the final evaluation to measure your progress.
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">
                Complete all {totalLessons} lessons to unlock.
              </p>
            )}
          </div>
          {allLessonsDone && !evaluationResult && hasQuiz && (
            <button
              onClick={() => startAssessment('evaluation')}
              className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
            >
              Start
            </button>
          )}
          {evaluationResult && (
            <ScoreBadge score={evaluationResult.score!} />
          )}
        </div>
      </div>

    </div>
  )
}
