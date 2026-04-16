'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgressBar from '@/components/ProgressBar'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiagnosticSummary {
  subjectName: string
  subjectIcon: string
  score: number
}

export interface OnboardingModalProps {
  studentId:             string
  firstName:             string
  hasDiagnostic:         boolean
  completedLessonsCount: number
  points:                number
  diagnosticResults:     DiagnosticSummary[]
}

type OnboardingStep = '1' | '2' | '3' | 'done'

function storageKey(studentId: string) {
  return `najah_onboarding_${studentId}`
}

function readStep(studentId: string): OnboardingStep {
  try {
    const raw = localStorage.getItem(storageKey(studentId))
    if (raw === '1' || raw === '2' || raw === '3' || raw === 'done') return raw
  } catch {
    // localStorage not available (SSR / private mode)
  }
  return '1'
}

function saveStep(studentId: string, step: OnboardingStep) {
  try {
    localStorage.setItem(storageKey(studentId), step)
  } catch { /* no-op */ }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingModal({
  studentId,
  firstName,
  hasDiagnostic,
  completedLessonsCount,
  points,
  diagnosticResults,
}: OnboardingModalProps) {
  const router = useRouter()
  const [step, setStep]       = useState<OnboardingStep | null>(null)
  const [visible, setVisible] = useState(false)

  // ── Resolve step on mount (client-only) ────────────────────────────────────
  useEffect(() => {
    let stored = readStep(studentId)

    // Auto-advance: if stored says step 1 but user already did the diagnostic
    if (stored === '1' && hasDiagnostic) {
      stored = '2'
      saveStep(studentId, '2')
    }

    // Auto-advance: if stored says step 2 but user already completed a lesson
    if (stored === '2' && completedLessonsCount > 0) {
      stored = '3'
      saveStep(studentId, '3')
    }

    // Auto-advance: if stored says step 3 and user has already invited (points > threshold)
    // We don't auto-complete here — let user explicitly dismiss step 3

    if (stored !== 'done') {
      setStep(stored)
      // Small delay so the page renders first, then modal fades in gracefully
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    }
  }, [studentId, hasDiagnostic, completedLessonsCount])

  function advance(next: OnboardingStep) {
    setVisible(false)
    setTimeout(() => {
      saveStep(studentId, next)
      setStep(next)
      // Re-fade in new step
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    }, 200) // wait for fade-out
  }

  function dismiss() {
    setVisible(false)
    setTimeout(() => {
      saveStep(studentId, 'done')
      setStep('done')
    }, 200)
  }

  function goTo(href: string) {
    dismiss()
    // Let dismiss animation complete before navigating
    setTimeout(() => router.push(href), 250)
  }

  // Nothing to show
  if (!step || step === 'done') return null

  // ── Shared modal shell ─────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

          {step === '1' && <Step1 firstName={firstName} onStart={() => goTo('/student/diagnostic')} onSkip={dismiss} />}
          {step === '2' && <Step2 diagnosticResults={diagnosticResults} onViewPlan={() => goTo('/student/weekly-plan')} onSkip={dismiss} />}
          {step === '3' && <Step3 points={points} firstName={firstName} onInvite={() => goTo('/student/invite')} onSkip={dismiss} />}

        </div>
      </div>
    </>
  )
}

// ── Step 1 — Welcome ──────────────────────────────────────────────────────────

function Step1({ firstName, onStart, onSkip }: { firstName: string; onStart: () => void; onSkip: () => void }) {
  return (
    <div>
      {/* Header strip */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-8 text-white text-center">
        <div className="text-5xl mb-3">🎓</div>
        <h2 className="text-2xl font-bold">Welcome, {firstName}!</h2>
        <p className="text-brand-100 text-sm mt-1">Let&apos;s get you set up in 2 minutes.</p>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-5">
        {/* What is Najah AI */}
        <div className="space-y-3">
          {[
            { icon: '🎯', title: 'Diagnose your level', desc: 'A short test reveals your strengths and weak spots across 5 subjects.' },
            { icon: '📅', title: 'Get your personal plan', desc: 'Your weekly plan adapts to focus on what you actually need to improve.' },
            { icon: '🤖', title: 'AI tutor, always available', desc: 'Stuck on a problem? Your AI tutor guides you step by step — 24/7.' },
          ].map(item => (
            <div key={item.title} className="flex gap-3 items-start">
              <span className="text-xl mt-0.5 flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Step indicator */}
        <StepDots current={1} total={3} />

        {/* CTA */}
        <button
          onClick={onStart}
          className="btn-primary w-full py-3 text-base"
        >
          Start the diagnostic test 🎯
        </button>
        <p className="text-xs text-gray-400 text-center">Takes about 10 minutes · No wrong answers</p>

        {/* Escape */}
        <div className="text-center">
          <button onClick={onSkip} className="text-xs text-gray-300 hover:text-gray-400 transition-colors">
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 2 — Diagnostic Results ───────────────────────────────────────────────

function Step2({
  diagnosticResults,
  onViewPlan,
  onSkip,
}: {
  diagnosticResults: DiagnosticSummary[]
  onViewPlan: () => void
  onSkip: () => void
}) {
  const hasResults = diagnosticResults.length > 0

  return (
    <div>
      {/* Header strip */}
      <div className="bg-gradient-to-r from-green-500 to-brand-500 px-6 py-6 text-white text-center">
        <div className="text-5xl mb-2">📊</div>
        <h2 className="text-xl font-bold">Diagnostic complete!</h2>
        <p className="text-green-100 text-sm mt-1">Here&apos;s what we found.</p>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">

        {hasResults ? (
          <div className="space-y-3">
            {diagnosticResults.map(r => (
              <div key={r.subjectName}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <span>{r.subjectIcon}</span>
                    <span>{r.subjectName}</span>
                  </span>
                  <span className={`text-xs font-bold ${
                    r.score >= 75 ? 'text-green-600' : r.score >= 50 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {Math.round(r.score)}%
                  </span>
                </div>
                <ProgressBar
                  value={Math.round(r.score)}
                  size="sm"
                  color={r.score >= 75 ? 'bg-green-500' : r.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Your results are being calculated…
          </p>
        )}

        {/* Summary message */}
        {hasResults && (() => {
          const weak    = diagnosticResults.filter(r => r.score < 60)
          const strong  = diagnosticResults.filter(r => r.score >= 75)
          if (weak.length > 0) {
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                <span className="font-semibold">Focus areas identified: </span>
                {weak.map(w => w.subjectIcon + ' ' + w.subjectName).join(', ')}
                . Your plan will prioritise these.
              </div>
            )
          }
          if (strong.length === diagnosticResults.length) {
            return (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                🌟 <span className="font-semibold">Strong start!</span> Your plan will keep you challenged.
              </div>
            )
          }
          return null
        })()}

        {/* Step indicator */}
        <StepDots current={2} total={3} />

        {/* CTA */}
        <button
          onClick={onViewPlan}
          className="btn-primary w-full py-3 text-base"
        >
          View my personalised plan 📅
        </button>

        {/* Escape */}
        <div className="text-center">
          <button onClick={onSkip} className="text-xs text-gray-300 hover:text-gray-400 transition-colors">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 3 — First Lesson Complete ────────────────────────────────────────────

function Step3({
  points,
  firstName,
  onInvite,
  onSkip,
}: {
  points: number
  firstName: string
  onInvite: () => void
  onSkip: () => void
}) {
  return (
    <div>
      {/* Celebration header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-8 text-white text-center">
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="text-xl font-bold">Great work, {firstName}!</h2>
        <p className="text-yellow-100 text-sm mt-1">You completed your first lesson.</p>
        <div className="mt-3 inline-block bg-white/20 rounded-full px-4 py-1.5 text-sm font-bold">
          {points} points earned so far ⭐
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-5">

        {/* Parent visibility card */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-2">
          <p className="font-semibold text-brand-800 text-sm">👨‍👩‍👧 Share your progress with your parents</p>
          <p className="text-xs text-brand-600">
            Your parents can track your scores, see your weak areas, and get weekly recommendations —
            all from their own account.
          </p>
          <p className="text-xs text-gray-500 font-medium">
            It takes 30 seconds: just share your invite code.
          </p>
        </div>

        {/* Step indicator */}
        <StepDots current={3} total={3} />

        {/* Primary CTA */}
        <button
          onClick={onInvite}
          className="btn-primary w-full py-3 text-base"
        >
          Get my invite code 🔗
        </button>

        {/* Skip — prominent at step 3 */}
        <button
          onClick={onSkip}
          className="btn-secondary w-full py-2.5 text-sm"
        >
          Maybe later
        </button>

        <p className="text-xs text-gray-400 text-center">
          You can always find this under <strong>Invite</strong> in the menu.
        </p>
      </div>
    </div>
  )
}

// ── Shared: step dots indicator ───────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 py-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-6 bg-brand-500'
              : i + 1 < current
              ? 'w-2 bg-brand-300'
              : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}
