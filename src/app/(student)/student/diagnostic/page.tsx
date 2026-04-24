'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProgressBar from '@/components/ProgressBar'
import type { Subject } from '@/lib/types'

// ── Skill mapping: diagnostic V1 labels → skill_definitions tags ──────────────
const SKILL_MAPPING: Record<string, string> = {
  'fractions':     'math_fractions_decimals',
  'equations':     'math_algebra_linear',
  'percentages':   'math_numbers_operations',
  'geometry':      'math_geometry_area_perimeter',
  'units':         'physics_measurement_units',
  "ohm's-law":     'physics_electricity_basics',
  'scalar-vector': 'physics_mechanics_forces',
  'vocabulary':    'eng_vocabulary_context',
  'grammar':       'eng_grammar_tenses',
  'comprehension': 'eng_reading_comprehension',
  'sequences':     'logic_sequences_patterns',
  'patterns':      'logic_sequences_patterns',
  'deduction':     'logic_deductive_reasoning',
  'variables':     'code_variables_types',
  'syntax':        'code_algorithms_basics',
}

// ── Diagnostic questions — all 7 subjects ────────────────────────────────────
const DIAGNOSTIC_QUESTIONS: Record<
  string,
  { question: string; options: string[]; answer: string; skill: string }[]
> = {
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
  francais: [
    { question: 'Quelle est la conjugaison correcte du verbe "finir" à la 1ère personne du pluriel (présent) ?', options: ['nous finissons', 'nous finons', 'nous finisons', 'nous finissez'], answer: 'nous finissons', skill: 'conjugaison' },
    { question: 'Laquelle de ces phrases contient une métaphore ?', options: ['Il court comme le vent.', 'La vie est un long fleuve tranquille.', 'Le soleil brille fort.', 'Il a couru une heure.'], answer: 'La vie est un long fleuve tranquille.', skill: 'figures-de-style' },
    { question: 'Quel est le féminin du mot "acteur" ?', options: ['acteure', 'actrice', 'acteuse', 'actrisse'], answer: 'actrice', skill: 'grammaire' },
  ],
  'histoire-geo': [
    { question: "En quelle année le Maroc a-t-il obtenu son indépendance ?", options: ['1952', '1956', '1960', '1948'], answer: '1956', skill: 'histoire-maroc' },
    { question: 'Quelle est la plus grande ville du Maroc par population ?', options: ['Rabat', 'Fès', 'Casablanca', 'Marrakech'], answer: 'Casablanca', skill: 'geographie-maroc' },
    { question: "Quel événement a déclenché la Seconde Guerre mondiale ?", options: ["L'invasion de la Pologne par l'Allemagne en 1939", "L'attaque de Pearl Harbor en 1941", "La révolution russe en 1917", "L'assassinat de François-Ferdinand en 1914"], answer: "L'invasion de la Pologne par l'Allemagne en 1939", skill: 'histoire-monde' },
  ],
}

type Phase = 'intro' | 'testing' | 'saving'

export default function DiagnosticPage() {
  const router = useRouter()
  const [subjects, setSubjects]           = useState<Subject[]>([])
  const [phase, setPhase]                 = useState<Phase>('intro')
  const [hasExisting, setHasExisting]     = useState(false)
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0)
  const [currentQIdx, setCurrentQIdx]     = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [answers, setAnswers]             = useState<Record<string, { correct: boolean; skill: string }[]>>({})
  const [studentId, setStudentId]         = useState('')
  const [saveError, setSaveError]         = useState('')
  const [retakeError, setRetakeError]     = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const role = user.user_metadata?.role as string | undefined
      if (role !== 'student') return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .single()
      if (student) setStudentId(student.id)

      const { data: subs } = await supabase.from('subjects').select('*')
      setSubjects(subs ?? [])

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
    setRetakeError('')
    const supabase = createClient()
    // Clear old diagnostic data and skill baseline so retake is a clean slate
    const { error: e1 } = await supabase.from('diagnostic_results').delete().eq('student_id', studentId)
    const { error: e2 } = await supabase.from('student_weak_skills').delete().eq('student_id', studentId)
    if (e1 || e2) {
      setRetakeError('Could not reset previous results. Please try again.')
      return
    }
    setHasExisting(false)
    setSaveError('')
    setAnswers({})
    setCurrentSubjectIdx(0)
    setCurrentQIdx(0)
    setSelectedAnswer('')
    setPhase('testing')
  }

  const activeSubjects = subjects.filter(s => DIAGNOSTIC_QUESTIONS[s.slug])

  function currentSubject()   { return activeSubjects[currentSubjectIdx] }
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
    // Guard: must have a student identity before writing
    if (!studentId) {
      setSaveError('Session expired. Please refresh and try again.')
      return
    }
    setPhase('saving')
    setSaveError('')
    const supabase = createClient()

    // ── 1. Compute skill_scores for seeding (correct=65, wrong=30) ──────
    const skillScores: Record<string, number> = {}
    for (const sub of activeSubjects) {
      for (const a of (completed[sub.slug] ?? [])) {
        const mappedTag = SKILL_MAPPING[a.skill]
        if (!mappedTag) continue
        // GREATEST: keep higher score if same tag appears across subjects
        const score = a.correct ? 65 : 30
        if (skillScores[mappedTag] === undefined || score > skillScores[mappedTag]) {
          skillScores[mappedTag] = score
        }
      }
    }

    // ── 2. Save per-subject diagnostic scores ───────────────────────────
    for (const sub of activeSubjects) {
      const subAnswers = completed[sub.slug] ?? []
      const score      = subAnswers.length > 0
        ? Math.round((subAnswers.filter(a => a.correct).length / subAnswers.length) * 100)
        : 0
      const weakTopics  = subAnswers.filter(a => !a.correct).map(a => a.skill)

      // Compute per-subject slice of skillScores for storage
      const subSkillScores: Record<string, number> = {}
      for (const a of subAnswers) {
        const mappedTag = SKILL_MAPPING[a.skill]
        if (mappedTag) subSkillScores[mappedTag] = a.correct ? 65 : 30
      }

      const { error } = await supabase.from('diagnostic_results').insert({
        student_id:   studentId,
        subject_id:   sub.id,
        score,
        weak_topics:  weakTopics,
        skill_scores: subSkillScores,
      })
      if (error) {
        console.error('[saveResults] diagnostic_results insert error:', error.message)
        setSaveError('Could not save your results. Please try again.')
        setPhase('testing')
        return
      }
    }

    // ── 3. Write skill mastery to student_weak_skills (upsert) ──────────
    for (const sub of activeSubjects) {
      const subAnswers = completed[sub.slug] ?? []
      if (subAnswers.length === 0) continue

      const skillMap: Record<string, { attempts: number; correct: number }> = {}
      for (const a of subAnswers) {
        if (!skillMap[a.skill]) skillMap[a.skill] = { attempts: 0, correct: 0 }
        skillMap[a.skill].attempts++
        if (a.correct) skillMap[a.skill].correct++
      }

      const rows = Object.entries(skillMap).map(([skill_tag, stats]) => ({
        student_id:   studentId,
        subject_id:   sub.id,
        skill_tag,
        attempts:     stats.attempts,
        correct:      stats.correct,
        mastery_pct:  stats.attempts > 0
          ? Math.round((stats.correct / stats.attempts) * 100)
          : 0,
        last_seen_at: new Date().toISOString(),
      }))

      if (rows.length > 0) {
        const { error } = await supabase
          .from('student_weak_skills')
          .upsert(rows, { onConflict: 'student_id,skill_tag' })
        if (error) {
          console.error('[saveResults] student_weak_skills upsert error:', error.message)
        }
      }
    }

    // ── 4. Seed skill_mastery from diagnostic answers (server-side) ──────
    if (Object.keys(skillScores).length > 0) {
      try {
        await fetch('/api/student/seed-diagnostic', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ skill_scores: skillScores }),
        })
      } catch (err) {
        // Non-fatal — skill_mastery seeding is best-effort
        console.error('[saveResults] seed-diagnostic call error:', err)
      }
    }

    // ── 5. Navigate to dedicated results page ────────────────────────────
    router.push('/student/diagnostic/results')
  }

  // ── SAVING ─────────────────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-xl font-bold mb-2">Diagnostic complete!</h2>
          <p className="text-gray-500 text-sm">Saving your results…</p>
        </div>
      </div>
    )
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Diagnostic Test 🎯</h1>

        {/* Save error (shown after returning from failed save) */}
        {saveError && (
          <div className="card border-l-4 border-red-400 bg-red-50">
            <p className="text-sm text-red-700 font-medium">⚠️ {saveError}</p>
            <p className="text-xs text-red-600 mt-1">Your answers are still loaded — click &quot;Finish diagnostic&quot; to try again.</p>
          </div>
        )}

        {hasExisting && (
          <div className="card border-l-4 border-orange-400 bg-orange-50">
            <p className="text-sm text-orange-800 font-medium">
              You already have diagnostic results.
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Retaking will reset your skill baseline and recalculate your personalised plan.
            </p>
            {retakeError && (
              <p className="text-xs text-red-600 mt-2 font-medium">⚠️ {retakeError}</p>
            )}
            <div className="flex gap-3 mt-3 flex-wrap">
              <button className="btn-primary text-sm" onClick={handleRetake}>
                🔄 Retake diagnostic
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={() => router.push('/student/diagnostic/results')}
              >
                View your results →
              </button>
            </div>
          </div>
        )}

        {!hasExisting && activeSubjects.length === 0 && (
          <div className="card text-center py-10 space-y-3">
            <div className="text-4xl">⏳</div>
            <p className="font-semibold text-gray-600">Loading subjects…</p>
            <p className="text-sm text-gray-400">If this takes too long, please refresh the page.</p>
          </div>
        )}

        {!hasExisting && activeSubjects.length > 0 && (
          <div className="card space-y-4">
            <p className="text-gray-700">
              This short test checks your current level across all subjects. It takes about{' '}
              <strong>12–15 minutes</strong>.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Answer honestly — there is no penalty for wrong answers</li>
              <li>Your weak areas will shape your personal weekly plan</li>
              <li>You can retake it anytime</li>
            </ul>
            <div className="flex gap-2 flex-wrap">
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

  // ── TESTING ────────────────────────────────────────────────────────────────
  const sub = currentSubject()
  const q   = currentQ()
  const qs  = currentQuestions()
  const totalDone = activeSubjects
    .slice(0, currentSubjectIdx)
    .reduce((acc, s) => acc + (DIAGNOSTIC_QUESTIONS[s.slug]?.length ?? 0), 0) + currentQIdx
  const totalAll  = activeSubjects.reduce((acc, s) => acc + (DIAGNOSTIC_QUESTIONS[s.slug]?.length ?? 0), 0)
  const pct       = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Error banner when save failed and returned to testing phase */}
      {saveError && (
        <div className="card border-l-4 border-red-400 bg-red-50 py-3">
          <p className="text-sm text-red-700 font-medium">⚠️ {saveError}</p>
          <p className="text-xs text-red-600 mt-1">Your answers are preserved. Complete the last question and try again.</p>
        </div>
      )}

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
