import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ProgressBar from '@/components/ProgressBar'

interface Props { params: { weekId: string } }

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function statusBadge(status: string) {
  switch (status) {
    case 'completed':   return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">✓ Done</span>
    case 'in_progress': return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">🔄 In progress</span>
    case 'skipped':     return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Missed</span>
    default:            return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-400">Pending</span>
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WeekReportPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — auth already verified above; bypasses RLS safely for server-only reads.
  const db = createServiceClient()

  // ── Resolve plan + verify parent owns a link to this student ───────────────
  const { data: plan } = await db
    .from('weekly_plans')
    .select('id, title, generated_at, student_id')
    .eq('id', params.weekId)
    .maybeSingle()

  if (!plan) notFound()

  // Verify this parent is linked to the student on this plan
  const { data: link } = await db
    .from('parent_student_links')
    .select('id')
    .eq('parent_profile_id', user.id)
    .eq('student_id', plan.student_id)
    .maybeSingle()

  if (!link) redirect('/parent/dashboard')

  // ── Load sessions ──────────────────────────────────────────────────────────
  type SessionRow = {
    id:               string
    lesson_id:        string | null
    subject_id:       string | null
    scheduled_date:   string
    scheduled_time:   string | null
    duration_minutes: number
    status:           string
    order_index:      number
    lesson:           { title: string } | null
    subject:          { name: string; icon: string; color: string } | null
  }

  const { data: sessionRows } = await db
    .from('weekly_plan_sessions')
    .select(`
      id, lesson_id, subject_id,
      scheduled_date, scheduled_time, duration_minutes,
      status, order_index,
      lesson:lessons(title),
      subject:subjects(name, icon, color)
    `)
    .eq('plan_id', plan.id)
    .order('scheduled_date')
    .order('order_index')

  const sessions = (sessionRows ?? []) as unknown as SessionRow[]

  // ── Aggregate metrics ──────────────────────────────────────────────────────
  const total     = sessions.length
  const completed = sessions.filter(s => s.status === 'completed').length
  const missed    = sessions.filter(s => s.status === 'skipped').length
  const pending   = sessions.filter(s => s.status === 'pending').length
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0

  // ── Actual study time from session logs ────────────────────────────────────
  // Get the date range of this plan
  const dates       = sessions.map(s => s.scheduled_date).sort()
  const rangeStart  = dates[0] ?? plan.generated_at.split('T')[0]
  const rangeEnd    = dates[dates.length - 1] ?? rangeStart

  const { data: sessionLogs } = await db
    .from('student_session_logs')
    .select('duration_minutes')
    .eq('student_id', plan.student_id)
    .gte('started_at', rangeStart + 'T00:00:00')
    .lte('started_at', rangeEnd   + 'T23:59:59')

  const totalMinutes = (sessionLogs ?? []).reduce(
    (acc: number, log: { duration_minutes: number | null }) => acc + (log.duration_minutes ?? 0),
    0,
  )

  // ── Group sessions by date ─────────────────────────────────────────────────
  const byDate = sessions.reduce<Record<string, SessionRow[]>>((acc, s) => {
    if (!acc[s.scheduled_date]) acc[s.scheduled_date] = []
    acc[s.scheduled_date].push(s)
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort()

  // ── Weak subjects: sessions that were skipped or still pending, grouped ────
  const subjectMissed: Record<string, { name: string; icon: string; missed: number; total: number }> = {}
  for (const s of sessions) {
    const key  = s.subject_id ?? 'unknown'
    const name = s.subject?.name ?? 'Unknown'
    const icon = s.subject?.icon ?? '📚'
    if (!subjectMissed[key]) subjectMissed[key] = { name, icon, missed: 0, total: 0 }
    subjectMissed[key].total++
    if (s.status === 'skipped') subjectMissed[key].missed++
  }
  const concernSubjects = Object.values(subjectMissed)
    .filter(s => s.missed > 0)
    .sort((a, b) => b.missed - a.missed)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto space-y-6">

      <div className="flex items-center gap-2">
        <Link href="/parent/dashboard" className="text-brand-600 hover:underline text-sm">
          ← Back to dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {sortedDates.length > 0
            ? `${new Date(sortedDates[0] + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — ${new Date(sortedDates[sortedDates.length - 1] + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : 'Weekly plan'
          }
        </p>
      </div>

      {/* Summary card */}
      <div className="card">
        <h2 className="font-semibold mb-4">Week summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-700">{total}</div>
            <div className="text-xs text-gray-400">Planned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-500">{missed}</div>
            <div className="text-xs text-gray-400">Missed</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${
              rate >= 70 ? 'text-green-600' : rate >= 40 ? 'text-yellow-600' : 'text-red-500'
            }`}>
              {rate}%
            </div>
            <div className="text-xs text-gray-400">Execution</div>
          </div>
        </div>
        <ProgressBar
          value={rate}
          color={rate >= 70 ? 'bg-green-500' : rate >= 40 ? 'bg-yellow-400' : 'bg-orange-400'}
        />

        {totalMinutes > 0 && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            ⏱ <strong>{totalMinutes} minutes</strong> of actual study time recorded
          </p>
        )}

        {completed === total && total > 0 && (
          <p className="text-center text-green-600 font-semibold mt-3">🏆 All sessions completed!</p>
        )}
      </div>

      {/* Concern subjects */}
      {concernSubjects.length > 0 && (
        <div className="card border-l-4 border-orange-400">
          <h3 className="font-semibold text-orange-700 mb-2">⚠️ Sessions missed by subject</h3>
          <div className="flex flex-wrap gap-2">
            {concernSubjects.map(s => (
              <span key={s.name} className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                {s.icon} {s.name} — {s.missed}/{s.total} missed
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sessions by day */}
      {sortedDates.length === 0 ? (
        <div className="card text-center text-gray-400 py-10">
          <div className="text-3xl mb-2">📭</div>
          <p>No sessions in this plan.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => (
            <div key={date}>
              <h3 className="font-semibold text-sm text-gray-500 mb-2">{dayLabel(date)}</h3>
              <div className="space-y-2">
                {byDate[date]
                  .sort((a, b) => a.order_index - b.order_index)
                  .map(s => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                        s.status === 'completed'   ? 'bg-green-50  border-green-200'  :
                        s.status === 'skipped'     ? 'bg-gray-50   border-gray-100 opacity-60' :
                        s.status === 'in_progress' ? 'bg-blue-50   border-blue-200'  :
                                                     'bg-white     border-gray-200'
                      }`}
                    >
                      {/* Subject icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: (s.subject?.color ?? '#6366f1') + '22' }}
                      >
                        {s.subject?.icon ?? '📚'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug ${s.status === 'completed' || s.status === 'skipped' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {s.lesson?.title ?? 'Study session'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.subject?.name}
                          {' · '}{s.duration_minutes} min
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        {statusBadge(s.status)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending sessions note */}
      {pending > 0 && (
        <p className="text-xs text-center text-gray-400">
          {pending} session{pending !== 1 ? 's' : ''} still pending this week.
        </p>
      )}

    </div>
  )
}
