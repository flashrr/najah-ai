import { redirect }          from 'next/navigation'
import Link                   from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { GeneratePlanButton, PlanView } from './PlanClient'
import type { PlanSession, SubjectInsight } from './PlanClient'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** ISO date string for Monday of the current week (Mon–Sun model).
 *  Uses UTC methods exclusively — setHours(local) can slip a day in UTC+X. */
function mondayOfThisWeek(): string {
  const now  = new Date()
  const dow  = now.getUTCDay()                   // 0=Sun … 6=Sat (UTC)
  const toMon = dow === 0 ? -6 : -(dow - 1)     // Sun→-6, Mon→0, Tue→-1 …
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toMon))
    .toISOString().split('T')[0]
}

/** ISO date string for Sunday of the current week (Mon–Sun). */
function sundayOfThisWeek(): string {
  const now  = new Date()
  const dow  = now.getUTCDay()
  const toMon = dow === 0 ? -6 : -(dow - 1)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toMon + 6))
    .toISOString().split('T')[0]
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function WeeklyPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  if (!student) redirect('/')

  const weekStart = mondayOfThisWeek()
  const weekEnd   = sundayOfThisWeek()

  // ── Look for an active plan generated this week ────────────────────────────
  const { data: plans } = await admin
    .from('weekly_plans')
    .select('id, title, status, generated_at')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .gte('generated_at', weekStart + 'T00:00:00')
    .lte('generated_at', weekEnd   + 'T23:59:59')
    .order('generated_at', { ascending: false })
    .limit(1)

  const activePlan = plans?.[0] ?? null

  // ── If a plan exists, load its sessions ───────────────────────────────────
  let sessions: PlanSession[] = []

  if (activePlan) {
    const { data: rows } = await admin
      .from('weekly_plan_sessions')
      .select(`
        id,
        lesson_id,
        subject_id,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        status,
        order_index,
        lesson:lessons(title),
        subject:subjects(name, icon, color)
      `)
      .eq('plan_id', activePlan.id)
      .order('scheduled_date')
      .order('order_index')

    sessions = (rows ?? []) as unknown as PlanSession[]
  }

  // ── Check if student has any diagnostic results ────────────────────────────
  const { data: diagRows } = await admin
    .from('diagnostic_results')
    .select('subject_id, score, subject:subjects(name, icon)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const hasDiagnostic = (diagRows?.length ?? 0) > 0

  // ── Check if student has configured free time slots ────────────────────────
  const { data: freeSlots } = await admin
    .from('free_time_slots')
    .select('id')
    .eq('student_id', student.id)
    .limit(1)
  const hasSchedule = (freeSlots?.length ?? 0) > 0

  // ── Build SubjectInsight list from sessions + diagnostic data ──────────────
  // Dedup diagnostic rows by subject (most-recent first)
  type DiagRow = { subject_id: string; score: number; subject: { name: string; icon: string } | null }
  const diagMap: Record<string, { score: number; name: string; icon: string }> = {}
  for (const r of (diagRows ?? []) as DiagRow[]) {
    if (!(r.subject_id in diagMap)) {
      diagMap[r.subject_id] = {
        score: r.score,
        name:  r.subject?.name ?? 'Unknown',
        icon:  r.subject?.icon ?? '📚',
      }
    }
  }

  const subjectSessionCounts: Record<string, number> = {}
  for (const s of sessions) {
    if (s.subject_id) {
      subjectSessionCounts[s.subject_id] = (subjectSessionCounts[s.subject_id] ?? 0) + 1
    }
  }

  const insights: SubjectInsight[] = Object.entries(subjectSessionCounts).map(([subId, count]) => {
    const diag  = diagMap[subId]
    const score = diag?.score ?? null
    let priority: SubjectInsight['priority']
    let reason: string
    if (score === null) {
      priority = 'undiagnosed'
      reason   = 'Not yet diagnosed — added for coverage'
    } else if (score < 40) {
      priority = 'critical'
      reason   = `Score ${score}% — intensive focus needed`
    } else if (score < 75) {
      priority = 'needs-work'
      reason   = `Score ${score}% — needs practice`
    } else {
      priority = 'maintenance'
      reason   = `Score ${score}% — light maintenance`
    }
    return { subjectId: subId, name: diag?.name ?? 'Unknown', icon: diag?.icon ?? '📚', score, sessions: count, priority, reason }
  }).sort((a, b) => {
    const rank = { critical: 0, 'needs-work': 1, undiagnosed: 2, maintenance: 3 }
    return rank[a.priority] - rank[b.priority]
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Weekly Plan 📅</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your personalised study schedule — focused on what you need most.
        </p>
      </div>

      {/* No diagnostic yet — nudge them */}
      {!hasDiagnostic && (
        <div className="card border-2 border-orange-200 bg-orange-50">
          <h3 className="font-semibold text-orange-800">Complete the diagnostic first 🎯</h3>
          <p className="text-sm text-orange-700 mt-1">
            Your weekly plan adapts to your weak areas. Take the diagnostic so we can personalise it.
          </p>
          <Link href="/student/diagnostic" className="btn-primary mt-3 inline-block text-sm">
            Start diagnostic →
          </Link>
        </div>
      )}

      {/* Schedule nudge — shown when no free slots configured */}
      {!hasSchedule && hasDiagnostic && (
        <div className="card border border-blue-200 bg-blue-50 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🗓️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800">Set your schedule for a smarter plan</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Your plan uses default times (9am &amp; 3pm). Add your real free hours so sessions fit your day.
            </p>
          </div>
          <Link href="/student/schedule" className="btn-secondary text-xs whitespace-nowrap flex-shrink-0">
            Set schedule →
          </Link>
        </div>
      )}

      {/* Plan exists — show it */}
      {activePlan && sessions.length > 0 && (
        <PlanView
          sessions={sessions}
          planTitle={activePlan.title}
          studentId={student.id}
          insights={insights}
          hasSchedule={hasSchedule}
        />
      )}

      {/* No plan yet — show generate CTA (only once diagnostic is done) */}
      {!activePlan && hasDiagnostic && (
        <GeneratePlanButton studentId={student.id} />
      )}

      {/* Empty plan (edge case: plan exists but sessions are empty) */}
      {activePlan && sessions.length === 0 && (
        <div className="card text-center text-gray-400 py-12 space-y-3">
          <div className="text-4xl">📭</div>
          <p className="font-medium">No sessions in this plan yet.</p>
          <p className="text-sm">All lessons may already be completed — great work!</p>
          <GeneratePlanButton studentId={student.id} />
        </div>
      )}

    </div>
  )
}
