import { createServiceClient } from '@/lib/supabase/server'
import { redirect }            from 'next/navigation'
import { createClient }        from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────────

type StudentRow = {
  id:                   string
  full_name:            string
  joined:               string
  points:               number
  streak_days:          number
  diagnostic:           boolean
  has_plan:             boolean
  schedule_set:         boolean
  lessons_done:         number
  attempts_total:       number
  attempts_correct:     number
  sessions_done:        number
  sessions_total:       number
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function funnelStep(n: number, total: number) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0
  return { n, pct }
}

function stuckLabel(r: StudentRow): string {
  if (!r.diagnostic)    return 'Needs: Diagnostic'
  if (!r.has_plan)      return 'Needs: Weekly plan'
  if (r.lessons_done === 0) return 'Needs: First lesson'
  if (r.streak_days === 0)  return 'Needs: Streak'
  return '✓ Active'
}

function stuckColor(label: string): string {
  if (label === '✓ Active') return 'text-green-600 bg-green-50'
  return 'text-orange-700 bg-orange-50'
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AdminPilotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  // ── Funnel aggregates ──────────────────────────────────────────────────────
  const [
    { count: totalStudents },
    { count: didDiagnostic },
    { count: hasPlan       },
    { count: hasSchedule   },
    { count: hasLesson     },
    { count: parentsLinked },
  ] = await Promise.all([
    db.from('students').select('*', { count: 'exact', head: true }),
    db.from('diagnostic_results').select('student_id', { count: 'exact', head: true }),
    db.from('weekly_plans').select('student_id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('free_time_slots').select('student_id', { count: 'exact', head: true }),
    db.from('lesson_progress').select('student_id', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('parent_student_links').select('parent_profile_id', { count: 'exact', head: true }),
  ])

  const total = totalStudents ?? 0

  // ── Session completion ─────────────────────────────────────────────────────
  const { data: sessionRows } = await db
    .from('weekly_plan_sessions')
    .select('status')

  type SessRow = { status: string }
  const sessTotal     = sessionRows?.length ?? 0
  const sessDone      = (sessionRows as SessRow[] ?? []).filter(s => s.status === 'completed').length
  const sessMissed    = (sessionRows as SessRow[] ?? []).filter(s => s.status === 'skipped').length
  const sessRate      = sessTotal > 0 ? Math.round((sessDone / sessTotal) * 100) : 0

  // ── Per-student table ──────────────────────────────────────────────────────
  const { data: students } = await db
    .from('students')
    .select('id, created_at, points, streak_days, profile:profiles(full_name)')
    .order('created_at', { ascending: false })

  // Gather sets for efficient lookups
  const [
    { data: diagRows     },
    { data: planRows     },
    { data: schedRows    },
    { data: progRows     },
    { data: attemptRows  },
    { data: wpsRows      },
  ] = await Promise.all([
    db.from('diagnostic_results').select('student_id'),
    db.from('weekly_plans').select('student_id').eq('status', 'active'),
    db.from('free_time_slots').select('student_id'),
    db.from('lesson_progress').select('student_id').eq('status', 'completed'),
    db.from('attempts').select('student_id, is_correct'),
    db.from('weekly_plan_sessions')
      .select('status, plan:weekly_plans(student_id)'),
  ])

  type SidRow = { student_id: string }
  const diagSet    = new Set((diagRows  as SidRow[] ?? []).map(r => r.student_id))
  const planSet    = new Set((planRows  as SidRow[] ?? []).map(r => r.student_id))
  const schedSet   = new Set((schedRows as SidRow[] ?? []).map(r => r.student_id))
  const lessonSet  = new Set((progRows  as SidRow[] ?? []).map(r => r.student_id))

  type AttRow = { student_id: string; is_correct: boolean }
  const attemptsBy: Record<string, { total: number; correct: number }> = {}
  for (const a of (attemptRows as AttRow[] ?? [])) {
    if (!attemptsBy[a.student_id]) attemptsBy[a.student_id] = { total: 0, correct: 0 }
    attemptsBy[a.student_id].total++
    if (a.is_correct) attemptsBy[a.student_id].correct++
  }

  type WpsRow = { status: string; plan: { student_id: string } | null }
  const sessionsBy: Record<string, { done: number; total: number }> = {}
  for (const w of (wpsRows as WpsRow[] ?? [])) {
    const sid = w.plan?.student_id
    if (!sid) continue
    if (!sessionsBy[sid]) sessionsBy[sid] = { done: 0, total: 0 }
    sessionsBy[sid].total++
    if (w.status === 'completed') sessionsBy[sid].done++
  }

  type RawStudent = {
    id: string; created_at: string; points: number; streak_days: number
    profile: { full_name: string } | null
  }
  const studentRows: StudentRow[] = (students as RawStudent[] ?? []).map(s => {
    const att = attemptsBy[s.id] ?? { total: 0, correct: 0 }
    const ses = sessionsBy[s.id] ?? { done: 0, total: 0 }
    return {
      id:               s.id,
      full_name:        (s.profile as { full_name: string } | null)?.full_name ?? 'Unknown',
      joined:           new Date(s.created_at).toLocaleDateString('en-GB'),
      points:           s.points,
      streak_days:      s.streak_days,
      diagnostic:       diagSet.has(s.id),
      has_plan:         planSet.has(s.id),
      schedule_set:     schedSet.has(s.id),
      lessons_done:     lessonSet.has(s.id) ? 1 : 0, // at least 1 completed
      attempts_total:   att.total,
      attempts_correct: att.correct,
      sessions_done:    ses.done,
      sessions_total:   ses.total,
    }
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pilot Dashboard 🚀</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live funnel metrics for pilot monitoring. Refreshes on every page load.
          </p>
        </div>
        <span className="text-xs text-gray-400 self-end">
          Last updated: {new Date().toLocaleString('en-GB')}
        </span>
      </div>

      {/* ── Funnel ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold mb-3">Activation Funnel ({total} students)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { icon: '📝', label: 'Registered',         ...funnelStep(total, total)           },
            { icon: '🎯', label: 'Diagnostic done',    ...funnelStep(didDiagnostic ?? 0, total) },
            { icon: '🗓️', label: 'Schedule set',       ...funnelStep(hasSchedule ?? 0, total)  },
            { icon: '📅', label: 'Plan generated',     ...funnelStep(hasPlan ?? 0, total)      },
            { icon: '✅', label: '1+ lesson done',     ...funnelStep(hasLesson ?? 0, total)    },
            { icon: '👨‍👩‍👧', label: 'Parent linked',    ...funnelStep(parentsLinked ?? 0, total) },
          ].map(step => (
            <div key={step.label} className="card text-center">
              <div className="text-2xl mb-1">{step.icon}</div>
              <div className="text-2xl font-bold text-brand-600">{step.n}</div>
              <div className={`text-lg font-semibold mt-0.5 ${
                step.pct >= 80 ? 'text-green-600' : step.pct >= 50 ? 'text-yellow-600' : 'text-red-500'
              }`}>{step.pct}%</div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Session execution ────────────────────────────────────────────── */}
      <div className="card">
        <h2 className="font-semibold mb-3">Session Execution</h2>
        {sessTotal === 0 ? (
          <p className="text-sm text-gray-400">No plan sessions generated yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-700">{sessTotal}</div>
              <div className="text-xs text-gray-400">Total sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{sessDone}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">{sessMissed}</div>
              <div className="text-xs text-gray-400">Missed</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                sessRate >= 70 ? 'text-green-600' : sessRate >= 40 ? 'text-yellow-600' : 'text-red-500'
              }`}>{sessRate}%</div>
              <div className="text-xs text-gray-400">Completion rate</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Per-student table ────────────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold mb-3">Per-Student Progress</h2>

        {studentRows.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">No students registered yet.</div>
        ) : (
          <div className="space-y-2">
            {studentRows.map(r => {
              const stuck = stuckLabel(r)
              const stuckCls = stuckColor(stuck)
              const accPct = r.attempts_total > 0
                ? Math.round((r.attempts_correct / r.attempts_total) * 100) : null

              return (
                <div key={r.id} className="card flex flex-wrap items-start gap-4">
                  {/* Name + joined */}
                  <div className="min-w-[140px] flex-shrink-0">
                    <p className="font-medium text-sm">{r.full_name}</p>
                    <p className="text-xs text-gray-400">Joined {r.joined}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.points} pts · {r.streak_days}🔥</p>
                  </div>

                  {/* Milestone checkboxes */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 flex-1 text-xs">
                    {[
                      { label: 'Diagnostic',  done: r.diagnostic    },
                      { label: 'Schedule',    done: r.schedule_set  },
                      { label: 'Plan',        done: r.has_plan      },
                      { label: 'Lesson ≥1',   done: r.lessons_done > 0 },
                    ].map(m => (
                      <span key={m.label} className={`flex items-center gap-1 ${m.done ? 'text-green-600' : 'text-gray-400'}`}>
                        <span>{m.done ? '✓' : '○'}</span>
                        <span>{m.label}</span>
                      </span>
                    ))}
                  </div>

                  {/* Exercise accuracy */}
                  <div className="text-xs text-gray-500 flex-shrink-0 text-right min-w-[80px]">
                    {accPct !== null
                      ? <span className={`font-medium ${accPct >= 70 ? 'text-green-600' : accPct >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{accPct}% accuracy</span>
                      : <span className="text-gray-300">No attempts</span>
                    }
                    {r.sessions_total > 0 && (
                      <p className="mt-0.5">{r.sessions_done}/{r.sessions_total} sessions</p>
                    )}
                  </div>

                  {/* Stuck label */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${stuckCls}`}>
                    {stuck}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Friction watch ───────────────────────────────────────────────── */}
      <div className="card border-l-4 border-orange-300">
        <h2 className="font-semibold mb-2 text-orange-700">⚠️ Friction Watch</h2>
        <p className="text-xs text-gray-500 mb-3">Students who registered but have not completed the next key step.</p>
        <div className="space-y-1.5">
          {studentRows.filter(r => stuckLabel(r) !== '✓ Active').map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{r.full_name}</span>
              <span className="text-xs text-orange-600 font-medium">{stuckLabel(r)}</span>
            </div>
          ))}
          {studentRows.every(r => stuckLabel(r) === '✓ Active') && (
            <p className="text-sm text-green-600">All students are active 🎉</p>
          )}
        </div>
      </div>

      {/* ── Raw SQL reference ────────────────────────────────────────────── */}
      <details className="card">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 select-none">
          🔍 Raw SQL queries for manual observation
        </summary>
        <div className="mt-4 space-y-4 text-xs font-mono bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <div>
            <p className="text-gray-500 not-italic mb-1 font-sans font-medium">Full funnel per student:</p>
            <pre className="whitespace-pre-wrap text-gray-700">{`SELECT p.full_name,
  CASE WHEN dr.cnt>0 THEN '✓' ELSE '○' END AS diagnostic,
  CASE WHEN fs.cnt>0 THEN '✓' ELSE '○' END AS schedule,
  CASE WHEN wp.cnt>0 THEN '✓' ELSE '○' END AS plan,
  COALESCE(lp.done,0) AS lessons_done,
  s.points, s.streak_days
FROM students s
JOIN profiles p ON p.id = s.profile_id
LEFT JOIN (SELECT student_id,COUNT(*) cnt FROM diagnostic_results GROUP BY 1) dr ON dr.student_id=s.id
LEFT JOIN (SELECT student_id,COUNT(*) cnt FROM free_time_slots GROUP BY 1) fs ON fs.student_id=s.id
LEFT JOIN (SELECT student_id,COUNT(*) cnt FROM weekly_plans WHERE status='active' GROUP BY 1) wp ON wp.student_id=s.id
LEFT JOIN (SELECT student_id,COUNT(*) done FROM lesson_progress WHERE status='completed' GROUP BY 1) lp ON lp.student_id=s.id
ORDER BY s.created_at DESC;`}</pre>
          </div>
          <div>
            <p className="text-gray-500 not-italic mb-1 font-sans font-medium">Session completion this week:</p>
            <pre className="whitespace-pre-wrap text-gray-700">{`SELECT p.full_name,
  COUNT(*) total,
  COUNT(*) FILTER (WHERE wps.status='completed') done,
  COUNT(*) FILTER (WHERE wps.status='skipped') missed
FROM weekly_plan_sessions wps
JOIN weekly_plans wp ON wp.id = wps.plan_id
JOIN students s ON s.id = wp.student_id
JOIN profiles p ON p.id = s.profile_id
GROUP BY p.full_name
ORDER BY done DESC;`}</pre>
          </div>
        </div>
      </details>

    </div>
  )
}
