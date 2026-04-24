import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'
import OnboardingModal from '@/components/OnboardingModal'
import { generateStudentNotifications } from '@/lib/notifications'
import { reviewDaysForScore } from '@/lib/reviewQueue'

const BADGES = [
  { icon: '🔥', name: 'First Lesson',   description: 'Completed your first lesson',  minPoints: 10  },
  { icon: '⭐', name: 'Quick Learner',   description: 'Finished a lesson in one go',   minPoints: 50  },
  { icon: '🏆', name: 'Week Champion',   description: 'Completed a full week',         minPoints: 200 },
  { icon: '💡', name: 'Problem Solver',  description: 'Got 10 exercises correct',      minPoints: 100 },
]

// ── UTC week helpers — no local-TZ day slippage ────────────────────────────
function mondayOfThisWeekUTC(): string {
  const now = new Date()
  const dow = now.getUTCDay()
  const toMon = dow === 0 ? -6 : -(dow - 1)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toMon))
    .toISOString().split('T')[0]
}
function sundayOfThisWeekUTC(): string {
  const now = new Date()
  const dow = now.getUTCDay()
  const toMon = dow === 0 ? -6 : -(dow - 1)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toMon + 6))
    .toISOString().split('T')[0]
}

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Service client bypasses RLS — safe because auth is already verified above
  // and this is server-side code only visible to the authenticated user.
  const admin = createServiceClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  const { data: student } = await admin.from('students').select('*').eq('profile_id', user.id).single()

  // Redirect to '/' not '/login' — middleware Rule B would loop us back here.
  if (!student) redirect('/')

  // Generate in-app notifications idempotently on each dashboard load.
  // Fire-and-forget — don't block the page render on notification errors.
  void generateStudentNotifications(student.id)

  // Subject progress — service client bypasses RLS recursion on admin policies
  const { data: subjects } = await admin.from('subjects').select('*')
  const { data: lessons }  = await admin.from('lessons').select('id, subject_id')
  const { data: progress } = await admin
    .from('lesson_progress')
    .select('lesson_id, status, score, completed_at')
    .eq('student_id', student.id)

  // Diagnostic results
  const { data: diagnostics } = await admin
    .from('diagnostic_results')
    .select('*, subject:subjects(name, icon)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  // Skill mastery summary — reads from skill_mastery table
  const { data: masteryRows } = await admin
    .from('skill_mastery')
    .select('skill_tag, score, status')
    .eq('student_id', student.id)

  // ── Weekly execution metrics ──────────────────────────────────────────────
  const weekStart = mondayOfThisWeekUTC()
  const weekEnd   = sundayOfThisWeekUTC()

  const { data: activeWeekPlans } = await admin
    .from('weekly_plans')
    .select('id')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .gte('generated_at', weekStart + 'T00:00:00')
    .lte('generated_at', weekEnd   + 'T23:59:59')
    .limit(1)

  const activePlanId = activeWeekPlans?.[0]?.id ?? null

  type SessionStatusRow = { status: string }
  let weeklyMetrics = { planned: 0, completed: 0, missed: 0, rate: 0, hasPlan: false }

  if (activePlanId) {
    const { data: planSessions } = await admin
      .from('weekly_plan_sessions')
      .select('status')
      .eq('plan_id', activePlanId)

    if (planSessions) {
      const rows      = planSessions as SessionStatusRow[]
      const planned   = rows.length
      const completed = rows.filter(s => s.status === 'completed').length
      const missed    = rows.filter(s => s.status === 'skipped').length
      const rate      = planned > 0 ? Math.round((completed / planned) * 100) : 0
      weeklyMetrics   = { planned, completed, missed, rate, hasPlan: planned > 0 }
    }
  }

  // Skill mastery aggregates
  type MasteryRow = { skill_tag: string; score: number; status: string }
  const mastery        = (masteryRows as MasteryRow[] | null) ?? []
  const skillTotal     = mastery.length
  const masteredCount  = mastery.filter(r => r.status === 'mastered').length
  const inProgressCount = skillTotal - masteredCount

  // Top weak skill — lowest-score non-mastered skill with a registered display name
  const weakestRow = mastery
    .filter(r => r.status !== 'mastered')
    .sort((a, b) => a.score - b.score)[0] ?? null

  let topWeakSkill: { displayName: string; score: number } | null = null
  if (weakestRow) {
    const { data: def } = await admin
      .from('skill_definitions')
      .select('display_name')
      .eq('skill_tag', weakestRow.skill_tag)
      .maybeSingle()
    if (def) {
      topWeakSkill = {
        displayName: (def as { display_name: string }).display_name,
        score:       weakestRow.score,
      }
    }
  }

  // Build subject progress map
  const progressBySubject = (subjects as { id: string; name: string; icon: string; color: string; slug: string }[] | null)?.map(sub => {
    const subLessons    = (lessons as { id: string; subject_id: string }[] | null)?.filter(l => l.subject_id === sub.id) ?? []
    const completedIds  = new Set((progress as { lesson_id: string; status: string }[] | null)?.filter(p => p.status === 'completed').map(p => p.lesson_id))
    const done          = subLessons.filter(l => completedIds.has(l.id)).length
    const total         = subLessons.length
    const pct           = total > 0 ? Math.round((done / total) * 100) : 0
    return { ...sub, done, total, pct }
  }) ?? []

  type ProgressRow    = { lesson_id: string; status: string; score: number | null; completed_at: string | null }
  type DiagnosticRow  = { id: string; score: number; subject_id: string; subject: unknown }

  const progressRows    = progress  as ProgressRow[]   | null

  // Deduplicate diagnostic results by subject — keep most-recent row per subject
  // (ordered by created_at DESC already, so first seen wins)
  const _rawDiagnostics = diagnostics as DiagnosticRow[] | null
  const _diagSeen       = new Set<string>()
  const diagnosticRows: DiagnosticRow[] = []
  for (const d of _rawDiagnostics ?? []) {
    if (_diagSeen.has(d.subject_id)) continue
    _diagSeen.add(d.subject_id)
    diagnosticRows.push(d)
  }

  const totalLessons    = lessons?.length ?? 0
  const completedCount  = progressRows?.filter(p => p.status === 'completed').length ?? 0
  const overallPct      = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const hasDiagnostic   = diagnosticRows.length > 0
  const earnedBadges    = BADGES.filter(b => student.points >= b.minPoints)

  // Shape diagnostic data for the onboarding modal
  const diagnosticSummary = (diagnosticRows ?? []).map(d => ({
    subjectName: (d.subject as { name: string } | null)?.name ?? '',
    subjectIcon: (d.subject as { icon: string } | null)?.icon ?? '',
    score:       d.score,
  }))

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  // ── Review queue widget data ──────────────────────────────────────────────
  // Lightweight: derive from already-fetched progress + mastery + one extra query
  type ProgressWithDate = { lesson_id: string; status: string; score: number | null; completed_at: string | null }
  const completedWithDate = (progress as ProgressWithDate[] | null)
    ?.filter(p => p.status === 'completed' && p.completed_at) ?? []

  const completedLessonIds = completedWithDate.map(p => p.lesson_id)

  // Primary skill_tag per completed lesson
  const lessonSkillMap: Record<string, string> = {}
  if (completedLessonIds.length) {
    type ExRow = { lesson_id: string; skill_tag: string }
    const { data: exRows } = await admin
      .from('exercises')
      .select('lesson_id, skill_tag')
      .in('lesson_id', completedLessonIds)
      .not('skill_tag', 'is', null)
      .order('order_index', { ascending: true }) as { data: ExRow[] | null }
    for (const e of exRows ?? []) {
      if (e.skill_tag && !lessonSkillMap[e.lesson_id]) {
        lessonSkillMap[e.lesson_id] = e.skill_tag
      }
    }
  }

  // Mastery score map from already-fetched masteryRows
  type MRow = { skill_tag: string; score: number; status: string }
  const masteryScoreMap: Record<string, number> = {}
  for (const m of mastery) masteryScoreMap[(m as MRow).skill_tag] = (m as MRow).score

  // Compute due counts
  const todayStr = new Date().toISOString().split('T')[0]
  let reviewDueCount   = 0
  const reviewDueItems: { lessonId: string; lessonTitle: string; subjectIcon: string; dueDate: string }[] = []

  for (const p of completedWithDate) {
    if (!p.completed_at) continue
    const skillTag    = lessonSkillMap[p.lesson_id] ?? null
    const score       = skillTag ? (masteryScoreMap[skillTag] ?? null) : null
    const days        = reviewDaysForScore(score)
    const completed   = new Date(p.completed_at)
    const due         = new Date(Date.UTC(
      completed.getUTCFullYear(), completed.getUTCMonth(),
      completed.getUTCDate() + days,
    ))
    const dueDate = due.toISOString().split('T')[0]
    if (dueDate <= todayStr) {
      reviewDueCount++
      // collect title from lessons for up-to-2 preview
      const lessonMeta = (lessons as { id: string; subject_id: string }[] | null)?.find(l => l.id === p.lesson_id)
      if (lessonMeta && reviewDueItems.length < 2) {
        reviewDueItems.push({ lessonId: p.lesson_id, lessonTitle: '', subjectIcon: '', dueDate })
      }
    }
  }
  // Fetch titles + icons for preview items if any
  if (reviewDueItems.length) {
    type LMeta = { id: string; title: string; subject: { icon: string } | null }
    const { data: previewLessons } = await admin
      .from('lessons')
      .select('id, title, subject:subjects(icon)')
      .in('id', reviewDueItems.map(r => r.lessonId)) as { data: LMeta[] | null }
    for (const pl of previewLessons ?? []) {
      const item = reviewDueItems.find(r => r.lessonId === pl.id)
      if (item) {
        item.lessonTitle  = pl.title
        item.subjectIcon  = pl.subject?.icon ?? '📚'
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Onboarding modal — client component, manages its own visibility via localStorage */}
      <OnboardingModal
        studentId={student.id}
        firstName={firstName}
        hasDiagnostic={hasDiagnostic}
        completedLessonsCount={completedCount}
        points={student.points}
        diagnosticResults={diagnosticSummary}
      />
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {firstName} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">3ème Collège — keep up the great work!</p>
        </div>
        <div className="flex gap-4">
          <div className="card text-center px-5 py-3">
            <div className="text-2xl font-bold text-brand-600">{student.points}</div>
            <div className="text-xs text-gray-500">Points</div>
          </div>
          <div className="card text-center px-5 py-3">
            <div className="text-2xl font-bold text-orange-500">{student.streak_days}🔥</div>
            <div className="text-xs text-gray-500">Day streak</div>
          </div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Overall progress</h2>
          <span className="text-sm text-gray-500">{completedCount} / {totalLessons} lessons</span>
        </div>
        <ProgressBar value={overallPct} label={`${overallPct}% complete`} />
      </div>

      {/* Weekly execution metrics — only shown when a plan exists this week */}
      {weeklyMetrics.hasPlan && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">This week&apos;s execution</h2>
            <Link href="/student/weekly-plan" className="text-xs text-brand-600 hover:underline">
              View plan →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
            <div>
              <div className="text-xl font-bold text-gray-700">{weeklyMetrics.planned}</div>
              <div className="text-xs text-gray-400">Planned</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">{weeklyMetrics.completed}</div>
              <div className="text-xs text-gray-400">Done</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-500">{weeklyMetrics.missed}</div>
              <div className="text-xs text-gray-400">Missed</div>
            </div>
            <div>
              <div className={`text-xl font-bold ${
                weeklyMetrics.rate >= 70 ? 'text-green-600'
                : weeklyMetrics.rate >= 40 ? 'text-yellow-600'
                : 'text-red-500'
              }`}>
                {weeklyMetrics.rate}%
              </div>
              <div className="text-xs text-gray-400">Rate</div>
            </div>
          </div>
          <ProgressBar
            value={weeklyMetrics.rate}
            size="sm"
            color={
              weeklyMetrics.rate >= 70 ? 'bg-green-500'
              : weeklyMetrics.rate >= 40 ? 'bg-yellow-400'
              : 'bg-orange-400'
            }
          />
        </div>
      )}

      {/* Diagnostic CTA */}
      {!hasDiagnostic && (
        <div className="card border-2 border-brand-200 bg-brand-50 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold text-brand-800">Start with your diagnostic test 🎯</h3>
            <p className="text-sm text-brand-600 mt-1">We&apos;ll identify your strengths and weak spots so your plan is truly personalised.</p>
          </div>
          <Link href="/student/diagnostic" className="btn-primary whitespace-nowrap">
            Take diagnostic
          </Link>
        </div>
      )}

      {/* Subject progress */}
      <div>
        <h2 className="font-semibold mb-3">Progress by subject</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {progressBySubject.filter(sub => sub.total > 0).map(sub => (
            <div key={sub.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{sub.icon}</span>
                <span className="font-medium text-sm">{sub.name}</span>
                <span className="ml-auto text-xs text-gray-400">{sub.done}/{sub.total}</span>
              </div>
              <ProgressBar value={sub.pct} color="bg-brand-500" size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic results */}
      {hasDiagnostic && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Diagnostic results</h2>
            <Link href="/student/diagnostic/results" className="text-xs text-brand-600 hover:underline">
              View full results →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {diagnosticRows?.map(d => (
              <div key={d.id} className="card flex items-center gap-3">
                <span className="text-2xl">{(d.subject as { icon: string })?.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{(d.subject as { name: string })?.name}</div>
                  <ProgressBar value={Math.round(d.score)} size="sm" />
                </div>
                <span className="font-bold text-lg">{Math.round(d.score)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill mastery summary widget */}
      {skillTotal > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">🧠 Skill mastery</h2>
            <Link href="/student/skills" className="text-xs text-brand-600 hover:underline">
              View all →
            </Link>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="bg-green-50 rounded-lg py-3">
              <div className="text-xl font-bold text-green-600">{masteredCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">Mastered</div>
            </div>
            <div className="bg-blue-50 rounded-lg py-3">
              <div className="text-xl font-bold text-blue-500">{inProgressCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">In Progress</div>
            </div>
            <div className="bg-gray-50 rounded-lg py-3">
              <div className="text-xl font-bold text-gray-600">{skillTotal}</div>
              <div className="text-xs text-gray-500 mt-0.5">Tracked</div>
            </div>
          </div>

          {/* Top weak skill focus area */}
          {topWeakSkill && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-orange-600 font-medium">Focus area: </span>
                <span className="text-xs text-orange-800 font-semibold">{topWeakSkill.displayName}</span>
              </div>
              <span className="text-xs font-bold text-orange-500 flex-shrink-0">
                {topWeakSkill.score}/100
              </span>
            </div>
          )}
        </div>
      )}

      {/* Review queue widget */}
      {completedWithDate.length > 0 && (
        <div className={`card ${reviewDueCount > 0 ? 'border-2 border-orange-200 bg-orange-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold flex items-center gap-1.5">
              🔁 Review queue
              {reviewDueCount > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {reviewDueCount}
                </span>
              )}
            </h2>
            <Link href="/student/review" className="text-xs text-brand-600 hover:underline">
              View all →
            </Link>
          </div>

          {reviewDueCount === 0 ? (
            <p className="text-sm text-gray-500">
              No lessons due for review right now. Keep it up! 🎉
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {reviewDueCount} lesson{reviewDueCount > 1 ? 's' : ''} due for review today.
              </p>
              {reviewDueItems.filter(r => r.lessonTitle).map(r => (
                <Link
                  key={r.lessonId}
                  href={`/student/lessons/${r.lessonId}`}
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-orange-100 hover:border-orange-300 transition-colors"
                >
                  <span className="text-base">{r.subjectIcon}</span>
                  <span className="flex-1 text-sm font-medium text-gray-700 truncate">{r.lessonTitle}</span>
                  <span className="text-orange-400 text-xs">Review →</span>
                </Link>
              ))}
              {reviewDueCount > 2 && (
                <Link href="/student/review" className="text-xs text-orange-600 hover:underline block text-center">
                  +{reviewDueCount - 2} more due →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/student/weekly-plan', icon: '📅', label: 'Weekly Plan' },
          { href: '/student/diagnostic',  icon: '🎯', label: 'Diagnostic'  },
          { href: '/student/tutor',        icon: '🤖', label: 'AI Tutor'   },
          { href: '/student/schedule',     icon: '🗓️', label: 'Schedule'   },
        ].map(item => (
          <Link key={item.label} href={item.href} className="card hover:shadow-md transition-shadow text-center py-5">
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium">{item.label}</div>
          </Link>
        ))}
      </div>

      {/* Badges */}
      <div>
        <h2 className="font-semibold mb-3">Your badges</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BADGES.map(b => (
            <Badge
              key={b.name}
              icon={b.icon}
              name={b.name}
              description={b.description}
              earned={earnedBadges.some(e => e.name === b.name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
