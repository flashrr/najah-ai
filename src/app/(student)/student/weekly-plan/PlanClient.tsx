'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { generateWeeklyPlan, startSession, completeSession, missSession } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanSession {
  id:               string
  lesson_id:        string | null
  subject_id:       string | null
  scheduled_date:   string
  scheduled_time:   string | null
  duration_minutes: number
  status:           'pending' | 'in_progress' | 'completed' | 'skipped'
  order_index:      number
  lesson:  { title: string } | null
  subject: { name: string; icon: string; color: string } | null
}

export interface SubjectInsight {
  subjectId: string
  name:      string
  icon:      string
  score:     number | null   // null = undiagnosed
  sessions:  number
  priority:  'critical' | 'needs-work' | 'undiagnosed' | 'maintenance'
  reason:    string
}

// ── Generate Plan Button ───────────────────────────────────────────────────────

export function GeneratePlanButton({ studentId }: { studentId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateWeeklyPlan(studentId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="card border-2 border-brand-200 bg-brand-50 space-y-4">
      <div className="text-center space-y-3">
        <div className="text-5xl">📅</div>
        <h2 className="font-bold text-xl text-brand-800">Ready for your personalised plan?</h2>
        <p className="text-sm text-brand-700 max-w-sm mx-auto">
          We&apos;ll build a focused study schedule for this week based on your diagnostic results —
          prioritising your weakest subjects first.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={pending}
        className="btn-primary w-full py-3 text-base"
      >
        {pending ? '⏳ Building your plan…' : '✨ Generate my weekly plan'}
      </button>

      <p className="text-xs text-center text-brand-500">
        Takes about 2 seconds · You can regenerate anytime
      </p>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dayLabel(dateStr: string): string {
  // Append noon to prevent TZ-boundary flip when parsing date-only strings
  const d     = new Date(dateStr + 'T12:00:00')
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const date  = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff  = Math.round((date.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0)  return '📌 Today'
  if (diff === 1)  return '📆 Tomorrow'
  if (diff === -1) return '⬅️ Yesterday'
  if (diff < 0)   return `${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} (past)`
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function timeLabel(time: string | null): string {
  if (!time) return ''
  const [h] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour < 12 ? 'am' : 'pm'
  const h12  = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${h12}:00 ${ampm}`
}

// ── Session card — 4-state execution machine ──────────────────────────────────
//
//  State transitions:
//    pending     →  [▶ Start]          → in_progress  (writes session log + lesson in_progress)
//    pending     →  [✓ Done]           → completed    (direct complete, creates+closes log)
//    pending     →  [✗ Skip]           → skipped
//    in_progress →  [✓ Done]           → completed    (closes open log, marks lesson completed)
//    in_progress →  [✗ Missed]         → skipped
//    completed   →  "✓ Done" badge     (terminal)
//    skipped     →  "Missed" badge     (terminal)

function SessionCard({
  session,
  studentId,
}: {
  session:   PlanSession
  studentId: string
}) {
  const [pending, startTrans]  = useTransition()
  const [localStatus, setStatus] = useState(session.status)
  const [actionError, setError]  = useState<string | null>(null)

  const isCompleted   = localStatus === 'completed'
  const isSkipped     = localStatus === 'skipped'
  const isInProgress  = localStatus === 'in_progress'
  const isPending     = localStatus === 'pending'

  function run(
    action: (id: string, sid: string) => Promise<{ error?: string }>,
    nextStatus: PlanSession['status'],
  ) {
    setError(null)
    setStatus(nextStatus)   // optimistic
    startTrans(async () => {
      const result = await action(session.id, studentId)
      if (result.error) {
        setStatus(session.status) // revert
        setError(result.error)
      }
    })
  }

  const lessonHref = session.lesson_id ? `/student/lessons/${session.lesson_id}` : null

  // ── Card shell classes ───────────────────────────────────────────────────────
  const cardCls = [
    'flex items-start gap-3 p-3 rounded-xl border transition-all',
    isCompleted  ? 'bg-green-50 border-green-200 opacity-80'      : '',
    isSkipped    ? 'bg-gray-50  border-gray-100  opacity-55'      : '',
    isInProgress ? 'bg-blue-50  border-blue-300  shadow-sm'       : '',
    isPending    ? 'bg-white    border-gray-200  hover:border-brand-300' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardCls}>

      {/* Subject icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
        style={{ background: (session.subject?.color ?? '#6366f1') + '22' }}
      >
        {session.subject?.icon ?? '📚'}
      </div>

      {/* Content + inline link for in-progress */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm leading-snug ${isCompleted || isSkipped ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {session.lesson?.title ?? 'Study session'}
          {isInProgress && <span className="ml-1.5 text-blue-500 text-xs">🔄 In progress</span>}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {session.subject?.name}
          {' · '}{session.duration_minutes} min
          {session.scheduled_time ? ` · ${timeLabel(session.scheduled_time)}` : ''}
        </p>

        {/* "Open lesson" link — only shows while in progress */}
        {isInProgress && lessonHref && (
          <Link
            href={lessonHref}
            className="inline-block mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
          >
            Open lesson →
          </Link>
        )}

        {/* Inline error */}
        {actionError && (
          <p className="text-xs text-red-500 mt-1">{actionError}</p>
        )}
      </div>

      {/* Action buttons — right column */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">

        {/* COMPLETED */}
        {isCompleted && (
          <span className="text-xs font-semibold text-green-600 px-2 py-0.5 bg-green-100 rounded-full whitespace-nowrap">
            ✓ Done
          </span>
        )}

        {/* SKIPPED */}
        {isSkipped && (
          <span className="text-xs font-semibold text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">
            Missed
          </span>
        )}

        {/* PENDING */}
        {isPending && (
          <>
            {/* Primary: Start */}
            <button
              disabled={pending}
              onClick={() => run(startSession, 'in_progress')}
              className="text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
            >
              ▶ Start
            </button>
            {/* Secondary row: Done + Skip */}
            <div className="flex gap-1">
              <button
                disabled={pending}
                onClick={() => run(completeSession, 'completed')}
                title="Mark as done without starting"
                className="text-xs text-green-600 hover:text-green-700 px-2 py-0.5 hover:bg-green-50 rounded transition-colors"
              >
                ✓
              </button>
              <button
                disabled={pending}
                onClick={() => run(missSession, 'skipped')}
                title="Mark as missed"
                className="text-xs text-gray-400 hover:text-gray-500 px-2 py-0.5 hover:bg-gray-50 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </>
        )}

        {/* IN PROGRESS */}
        {isInProgress && (
          <>
            <button
              disabled={pending}
              onClick={() => run(completeSession, 'completed')}
              className="text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
            >
              ✓ Done
            </button>
            <button
              disabled={pending}
              onClick={() => run(missSession, 'skipped')}
              className="text-xs text-gray-400 hover:text-gray-500 px-2 py-0.5 hover:bg-gray-50 rounded transition-colors"
            >
              ✕ Missed
            </button>
          </>
        )}

      </div>
    </div>
  )
}

// ── Plan insights panel ───────────────────────────────────────────────────────

function priorityBadge(p: SubjectInsight['priority']) {
  switch (p) {
    case 'critical':    return { cls: 'bg-red-100 text-red-700',    label: '🔴 Weak'        }
    case 'needs-work':  return { cls: 'bg-orange-100 text-orange-700', label: '🟡 Needs work' }
    case 'undiagnosed': return { cls: 'bg-blue-100 text-blue-700',  label: '⚪ Undiagnosed'  }
    case 'maintenance': return { cls: 'bg-green-100 text-green-700', label: '🟢 Maintaining' }
  }
}

function PlanInsights({ insights }: { insights: SubjectInsight[] }) {
  const [open, setOpen] = useState(false)

  if (insights.length === 0) return null

  return (
    <div className="card border border-gray-100">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-brand-700 transition-colors"
      >
        <span>📊 Why these subjects?</span>
        <span className="text-gray-400 text-xs">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500 mb-3">
            Your plan is personalised based on diagnostic scores and skill levels.
            Weak subjects get more sessions; strong subjects receive light maintenance.
          </p>
          {insights.map(ins => {
            const badge = priorityBadge(ins.priority)
            return (
              <div key={ins.subjectId} className="flex items-center gap-3 text-sm">
                <span className="text-xl w-7 flex-shrink-0">{ins.icon}</span>
                <span className="flex-1 font-medium text-gray-800">{ins.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 w-20 text-right">
                  {ins.sessions} session{ins.sessions !== 1 ? 's' : ''}
                </span>
              </div>
            )
          })}
          <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-2">
            Sessions are interleaved across days for spaced repetition.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Plan view ─────────────────────────────────────────────────────────────────

export function PlanView({
  sessions,
  planTitle,
  studentId,
  insights,
  hasSchedule,
}: {
  sessions:    PlanSession[]
  planTitle:   string
  studentId:   string
  insights:    SubjectInsight[]
  hasSchedule: boolean
}) {
  const [pending, startTrans] = useTransition()
  const [error, setError]     = useState<string | null>(null)

  // Group sessions by date
  const byDate = sessions.reduce<Record<string, PlanSession[]>>((acc, s) => {
    if (!acc[s.scheduled_date]) acc[s.scheduled_date] = []
    acc[s.scheduled_date].push(s)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()

  const total   = sessions.length
  const done    = sessions.filter(s => s.status === 'completed').length
  const skipped = sessions.filter(s => s.status === 'skipped').length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0

  function handleRegenerate() {
    setError(null)
    startTrans(async () => {
      const result = await generateWeeklyPlan(studentId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-6">

      {/* Header card */}
      <div className="card">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">{planTitle}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {done}/{total} done
              {skipped > 0 ? ` · ${skipped} missed` : ''}
              {' · '}{pct}% execution
            </p>
          </div>
          {done === total && total > 0 && (
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
              🏆 Week complete!
            </span>
          )}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-brand-500' : 'bg-orange-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Insights — collapsible "Why these subjects?" */}
      {insights.length > 0 && <PlanInsights insights={insights} />}

      {/* Default times nudge */}
      {!hasSchedule && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
          <span>🗓️</span>
          <span>Using default times. <a href="/student/schedule" className="underline font-medium">Set your schedule</a> for a personalised timetable.</span>
        </div>
      )}

      {/* Sessions grouped by day */}
      {dates.map(date => (
        <div key={date}>
          <h3 className="font-semibold text-sm text-gray-500 mb-2">{dayLabel(date)}</h3>
          <div className="space-y-2">
            {byDate[date]
              .sort((a, b) => a.order_index - b.order_index)
              .map(s => (
                <SessionCard key={s.id} session={s} studentId={studentId} />
              ))}
          </div>
        </div>
      ))}

      {/* Footer: regenerate */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
        <p className="text-xs text-gray-400 text-center">
          Plans refresh every week. Completed lessons won&apos;t appear again.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={pending}
          className="btn-secondary w-full text-sm"
        >
          {pending ? '⏳ Rebuilding…' : '🔄 Regenerate this week\'s plan'}
        </button>
      </div>

    </div>
  )
}
