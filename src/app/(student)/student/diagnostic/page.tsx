'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProgressBar from '@/components/ProgressBar'
import type { Subject } from '@/lib/types'

// Fixed diagnostic questions per subject
const DIAGNOSTIC_QUESTIONS: Record<string, { question: string; options: string[]; answer: string; skill: string }[]> = {
  math: [
    { question: 'Simplify 6/9.', options: ['1/3', '2/3', '3/4', '2/4'], answer: '2/3', skill: 'fractions' },
    { question: 'Solve: 2x + 4 = 10. What is x?', options: ['2', '3', '4', '7'], answer: '3', skill: 'equations' },
    { question: 'What is 15% of 80?', options: ['10', '12', '15', '20'], answer: '12', skill: 'percentages' },
    { question: 'What is the perimeter of a rectangle 5cm × 3cm?', options: ['15 cm', '16 cm', '8 cm', '18 cm'], answer: '16 cm', skill: 'geometry' },
  ],
  physics: [
    { question: 'What is the SI unit of force?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], answer: 'Newton', skill: 'units' },
    { question: 'V = 10 V, R = 5 Ω. What is I?', options: ['2 A', '50 A', '0.5 A', '15 A'], answer: '2 A', skill: "ohm's-law" },
    { question: 'Which is a vector quantity?', options: ['Mass', 'Temperature', 'Velocity', 'Volume'], answer: 'Velocity', skill: 'scalar-vector' },
  ],
  english: [
    { question: 'What does "hypothesis" mean?', options: ['A proof', 'A testable prediction', 'An experiment result', 'A type of data'], answer: 'A testable prediction', skill: 'vocabulary' },
    { question: 'Which sentence is grammatically correct?', options: ['She go to school every day.', 'She goes to school every day.', 'She going to school every day.', 'She gone to school every day.'], answer: 'She goes to school every day.', skill: 'grammar' },
    { question: 'What is "condensation" in the water cycle?', options: ['Water evaporating', 'Gas turning into liquid', 'Rain falling', 'Water heating'], answer: 'Gas turning into liquid', skill: 'comprehension' },
  ],
  logic: [
    { question: 'Next in sequence: 2, 4, 8, 16, ?', options: ['18', '24', '32', '20'], answer: '32', skill: 'sequences' },
    { question: 'Which shape completes the pattern: △, □, △, □, ?', options: ['○', '△', '□', '◇'], answer: '△', skill: 'patterns' },
    { question: 'If all A are B, and all B are C, then...', options: ['All C are A', 'All A are C', 'Some B are not A', 'All C are B'], answer: 'All A are C', skill: 'deduction' },
  ],
  coding: [
    { question: 'What does a variable store?', options: ['A program', 'A value in memory', 'A function', 'An error'], answer: 'A value in memory', skill: 'variables' },
    { question: 'Which Python line prints "Hello"?', options: ['echo "Hello"', 'console.log("Hello")', 'print("Hello")', 'say("Hello")'], answer: 'print("Hello")', skill: 'syntax' },
  ],
}

type Phase = 'intro' | 'testing' | 'results'

export default function DiagnosticPage() {
  const router = useRouter()
  const [subjects, setSubjects]     = useState<Subject[]>([])
  const [phase, setPhase]           = useState<Phase>('intro')
  const [hasExisting, setHasExisting] = useState(false)
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0)
  const [currentQIdx, setCurrentQIdx]             = useState(0)
  const [selectedAnswer, setSelectedAnswer]       = useState('')
  const [answers, setAnswers]       = useState<Record<string, { correct: boolean; skill: string }[]>>({})
  const [finalAnswers, setFinalAnswers] = useState<Record<string, { correct: boolean; skill: string }[]>>({})
  const [studentId, setStudentId]   = useState('')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile }  = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'student') return

      const { data: student }  = await supabase.from('students').select('id').eq('profile_id', user.id).single()
      if (student) setStudentId(student.id)

      const { data: subs } = await supabase.from('subjects').select('*')
      setSubjects(subs ?? [])

      // Check if student already has diagnostic results
      if (student) {
        const { data: existing } = await supabase
          .from('diagnostic_results')
          .select('id')
          .eq('student_id', student.id)
          .limit(1)
        if (existing && existing.length > 0) setHasExisting(true)
      }
    }
    load()
  }, [])

  async function handleRetake() {
    if (!studentId) return
    const supabase = createClient()
    await supabase.from('diagnostic_results').delete().eq('student_id', studentId)
    setHasExisting(false)
    setAnswers({})
    setFinalAnswers({})
    setCurrentSubjectIdx(0)
    setCurrentQIdx(0)
    setSelectedAnswer('')
    setPhase('testing')
  }

  const activeSubjects = subjects.filter(s => DIAGNOSTIC_QUESTIONS[s.slug])

  function currentSubject() { return activeSubjects[currentSubjectIdx] }
  function currentQuestions() {
    const sub = currentSubject()
    return sub ? DIAGNOSTIC_QUESTIONS[sub.slug] ?? [] : []
  }
  function currentQ() { return currentQuestions()[currentQIdx] }

  function handleAnswer(opt: string) { setSelectedAnswer(opt) }

  function handleNext() {
    const sub = currentSubject()
    const q   = currentQ()
    if (!q || !sub) return

    const isCorrect = selectedAnswer === q.answer

    // Compute updated answers synchronously so saveResults gets the full set
    const updatedAnswers = {
      ...answers,
      [sub.slug]: [...(answers[sub.slug] ?? []), { correct: isCorrect, skill: q.skill }],
    }
    setAnswers(updatedAnswers)
    setSelectedAnswer('')

    const qs = currentQuestions()
    if (currentQIdx < qs.length - 1) {
      setCurrentQIdx(i => i + 1)
    } else if (currentSubjectIdx < activeSubjects.length - 1) {
      setCurrentSubjectIdx(i => i + 1)
      setCurrentQIdx(0)
    } else {
      saveResults(updatedAnswers)
    }
  }

  async function saveResults(completed: Record<string, { correct: boolean; skill: string }[]>) {
    setSaving(true)
    setFinalAnswers(completed)
    setPhase('results')

    const supabase = createClient()

    for (const sub of activeSubjects) {
      const subAnswers = completed[sub.slug] ?? []
      const score      = subAnswers.length > 0
        ? Math.round((subAnswers.filter(a => a.correct).length / subAnswers.length) * 100)
        : 0
      const weakTopics = subAnswers.filter(a => !a.correct).map(a => a.skill)

      await supabase.from('diagnostic_results').insert({
        student_id: studentId,
        subject_id: sub.id,
        score,
        weak_topics: weakTopics,
      })
    }
    setSaving(false)
  }

  // Results computation — use finalAnswers (captured synchronously) to avoid stale closure
  const displayAnswers = Object.keys(finalAnswers).length > 0 ? finalAnswers : answers
  const resultsBySubject = activeSubjects.map(sub => {
    const subAnswers = displayAnswers[sub.slug] ?? []
    const score      = subAnswers.length > 0
      ? Math.round((subAnswers.filter(a => a.correct).length / subAnswers.length) * 100)
      : 0
    const weakTopics = Array.from(new Set(subAnswers.filter(a => !a.correct).map(a => a.skill)))
    return { ...sub, score, weakTopics }
  })

  // ── INTRO ─────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Diagnostic Test 🎯</h1>

        {hasExisting && (
          <div className="card border-l-4 border-orange-400 bg-orange-50">
            <p className="text-sm text-orange-800 font-medium">
              You already have diagnostic results.
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Retaking will delete your previous results and recalculate your personalised plan.
            </p>
            <div className="flex gap-3 mt-3">
              <button className="btn-primary text-sm" onClick={handleRetake}>
                🔄 Retake diagnostic
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => window.location.href = '/student/dashboard'}
              >
                View dashboard →
              </button>
            </div>
          </div>
        )}

        {!hasExisting && (
          <div className="card space-y-4">
            <p className="text-gray-700">
              This short test checks your current level in each subject. It takes about <strong>10 minutes</strong>.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Answer honestly — there is no penalty</li>
              <li>Your weak areas will shape your personal plan</li>
              <li>You can retake it anytime</li>
            </ul>
            <div className="flex gap-3 flex-wrap">
              {activeSubjects.map(s => (
                <span key={s.id} className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full">
                  <span>{s.icon}</span><span>{s.name}</span>
                </span>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={() => setPhase('testing')}>
              Start diagnostic
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── RESULTS ──────────────────────────────────────────
  if (phase === 'results') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Your Results 📊</h1>
        {saving ? (
          <div className="card text-center py-10 text-gray-400">Saving your results...</div>
        ) : (
          <>
            <div className="space-y-4">
              {resultsBySubject.map(r => (
                <div key={r.id} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{r.icon}</span>
                    <span className="font-semibold">{r.name}</span>
                    <span className="ml-auto font-bold text-lg">{r.score}%</span>
                  </div>
                  <ProgressBar
                    value={r.score}
                    color={r.score >= 75 ? 'bg-green-500' : r.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                    size="md"
                  />
                  {r.weakTopics.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Needs work: {r.weakTopics.join(', ')}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-400">
                    {r.score >= 75 ? '✓ Move to next level'
                     : r.score >= 50 ? '→ Practice exercises added to your plan'
                     : '↩ Review lessons added to your plan'}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={() => router.push('/student/weekly-plan')}>
              View your personalised plan →
            </button>
          </>
        )}
      </div>
    )
  }

  // ── TESTING ──────────────────────────────────────────
  const sub = currentSubject()
  const q   = currentQ()
  const qs  = currentQuestions()
  const totalDone = activeSubjects.slice(0, currentSubjectIdx).reduce((acc, s) => acc + (DIAGNOSTIC_QUESTIONS[s.slug]?.length ?? 0), 0) + currentQIdx
  const totalAll  = activeSubjects.reduce((acc, s) => acc + (DIAGNOSTIC_QUESTIONS[s.slug]?.length ?? 0), 0)
  const pct        = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{sub?.icon} {sub?.name}</span>
          <span className="text-sm text-gray-400">Q{currentQIdx + 1}/{qs.length}</span>
        </div>
        <ProgressBar value={pct} size="sm" />
      </div>

      {q && (
        <div className="card space-y-4">
          <p className="font-semibold text-gray-800">{q.question}</p>
          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswer(opt)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  selectedAnswer === opt
                    ? 'border-brand-500 bg-brand-50 text-brand-800 font-medium'
                    : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <button
            className="btn-primary w-full"
            disabled={!selectedAnswer}
            onClick={handleNext}
          >
            {currentQIdx < qs.length - 1 || currentSubjectIdx < activeSubjects.length - 1
              ? 'Next question →'
              : 'Finish diagnostic'}
          </button>
        </div>
      )}
    </div>
  )
}
