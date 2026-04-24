import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ParentMetricCard from '@/components/ParentMetricCard'
import ProgressBar from '@/components/ProgressBar'
import LinkChildForm from '@/components/LinkChildForm'

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentRow = {
  id:          string
  points:      number
  streak_days: number
  profile:     { full_name: string }
}

type DiagRow = {
  id:      string
  score:   number
  subject: unknown
}

type WeakSkillDisplay = {
  label:       string
  icon:        string
  subjectName: string
  mastery:     number
}

type WeakDiagArea = {
  name:  string
  icon:  string
  score: number
}

type WeeklyExecution = {
  planned:   number
  completed: number
  missed:    number
  rate:      number
  hasPlan:   boolean
  planId:    string | null
  planTitle: string
}

type ChildData = {
  student:              StudentRow
  completedLessons:     number
  totalLessons:         number
  overallPct:           number
  avgScore:             number
  weakSkills:           WeakSkillDisplay[]
  weakDiagAreas:        WeakDiagArea[]
  recommendations:      string[]
  diagnostics:          DiagRow[]
  weeklyExecution:      WeeklyExecution
  studyMinutesThisWeek: number
}

// ── UTC week helpers ───────────────────────────────────────────────────────────
function mondayOfThisWeekUTC(): string {
  const now   = new Date()
  const dow   = now.getUTCDay()
  const toMon = dow === 0 ? -6 : -(dow - 1)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toMon))
    .toISOString().split('T')[0]
}
function sundayOfThisWeekUTC(): string {
  const now   = new Date()
  const dow   = now.getUTCDay()
  const toMon = dow === 0 ? -6 : -(dow - 1)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toMon + 6))
    .toISOString().split('T')[0]
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — auth already verified above; bypasses RLS safely for server-only reads.
  const db = createServiceClient()

  // Get linked children
  const { data: links } = await db
    .from('parent_student_links')
    .select('*, student:students(*, profile:profiles(full_name))')
    .eq('parent_profile_id', user.id)

  const hasChildren = links && links.length > 0

  const weekStart = mondayOfThisWeekUTC()
  const weekEnd   = sundayOfThisWeekUTC()

  const childData: (ChildData | null)[] = await Promise.all(
    (links ?? []).map(async (link: { student: unknown }): Promise<ChildData | null> => {
      const student = link.student as StudentRow | null
      if (!student) return null

      const [
        { data: progress },
        { data: diagnostics },
        { data: lessons },
        { data: attempts },
        { data: weakSkillRows },
      ] = await Promise.all([
        db.from('lesson_progress').select('status').eq('student_id', student.id),
        db.from('diagnostic_results').select('*, subject:subjects(name, icon, slug)').eq('student_id', student.id),
        db.from('lessons').select('id'),
        db.from('attempts').select('is_correct').eq('student_id', student.id),
        db.from('student_weak_skills')
          .select('skill_tag, mastery_pct, subject:subjects(name, icon)')
          .eq('student_id', student.id)
          .lt('mastery_pct', 60)
          .order('mastery_pct', { ascending: true })
          .limit(5),
      ])

      // Lesson completion
      const completedLessons = (progress as { status: string }[] | null)?.filter(p => p.status === 'completed').length ?? 0
      const totalLessons     = lessons?.length ?? 0
      const overallPct       = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      // Exercise accuracy
      const correctAttempts = (attempts as { is_correct: boolean }[] | null)?.filter(a => a.is_correct).length ?? 0
      const totalAttempts   = attempts?.length ?? 0
      const avgScore        = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

      // Weak skills from attempts
      const weakSkills: WeakSkillDisplay[] = (weakSkillRows as { skill_tag: string; mastery_pct: number; subject: unknown }[] | null)
        ?.map(s => ({
          label:       s.skill_tag,
          icon:        (s.subject as { icon: string } | null)?.icon ?? '📚',
          subjectName: (s.subject as { name: string } | null)?.name ?? '',
          mastery:     Math.round(Number(s.mastery_pct)),
        })) ?? []

      // Weak areas from diagnostic scores
      const diagRows: DiagRow[] = (diagnostics as DiagRow[] | null) ?? []
      const weakDiagAreas: WeakDiagArea[] = diagRows
        .filter(d => d.score < 60)
        .map(d => ({
          name:  (d.subject as { name: string })?.name ?? '',
          icon:  (d.subject as { icon: string })?.icon ?? '📚',
          score: Math.round(d.score),
        }))

      // Recommendations
      const recommendations: string[] = []
      if (weakDiagAreas.length > 0)
        recommendations.push(`Focus on ${weakDiagAreas.map(w => w.name).join(', ')} — diagnostic scores below 60%`)
      if (weakSkills.length > 0)
        recommendations.push(`Exercises show weak spots: ${weakSkills.map(s => s.label).join(', ')}`)
      if (student.streak_days === 0)
        recommendations.push('Encourage daily study — even 15 minutes per day builds momentum')
      if (completedLessons < 2)
        recommendations.push('Help your child complete at least 2 lessons this week')
      if (avgScore >= 80)
        recommendations.push('Great exercise scores! Consider harder challenge levels')

      // ── This week's plan execution ─────────────────────────────────────────
      const { data: activePlanRows } = await db
        .from('weekly_plans')
        .select('id, title')
        .eq('student_id', student.id)
        .eq('status', 'active')
        .gte('generated_at', weekStart + 'T00:00:00')
        .lte('generated_at', weekEnd   + 'T23:59:59')
        .order('generated_at', { ascending: false })
        .limit(1)

      const activePlan = activePlanRows?.[0] ?? null

      let weeklyExecution: WeeklyExecution = {
        planned: 0, completed: 0, missed: 0, rate: 0,
        hasPlan: false, planId: null, planTitle: '',
      }

      if (activePlan) {
        const { data: planSessions } = await db
          .from('weekly_plan_sessions')
          .select('status')
          .eq('plan_id', activePlan.id)

        if (planSessions) {
          const rows      = planSessions as { status: string }[]
          const planned   = rows.length
          const completed = rows.filter(s => s.status === 'completed').length
          const missed    = rows.filter(s => s.status === 'skipped').length
          const rate      = planned > 0 ? Math.round((completed / planned) * 100) : 0
          weeklyExecution = {
            planned, completed, missed, rate,
            hasPlan: planned > 0,
            planId:    activePlan.id as string,
            planTitle: activePlan.title as string,
          }
        }
      }

      // ── Study time this week ───────────────────────────────────────────────
      const { data: sessionLogs } = await db
        .from('student_session_logs')
        .select('duration_minutes')
        .eq('student_id', student.id)
        .gte('started_at', weekStart + 'T00:00:00')
        .lte('started_at', weekEnd   + 'T23:59:59')

      const studyMinutesThisWeek = (sessionLogs ?? []).reduce(
        (acc: number, log: { duration_minutes: number | null }) => acc + (log.duration_minutes ?? 0),
        0,
      )

      return {
        student,
        completedLessons,
        totalLessons,
        overallPct,
        avgScore,
        weakSkills,
        weakDiagAreas,
        recommendations,
        diagnostics: diagRows,
        weeklyExecution,
        studyMinutesThisWeek,
      }
    })
  )

  const validChildren = childData.filter((c): c is ChildData => c !== null)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Parent Dashboard 👨‍👩‍👧</h1>
          <p className="text-sm text-gray-500 mt-1">Track your child&apos;s progress and get weekly recommendations.</p>
        </div>
        <Link href="/parent/link-student" className="btn-secondary text-sm whitespace-nowrap">
          ➕ Link another child
        </Link>
      </div>

      {/* No children linked */}
      {!hasChildren && (
        <div className="card border-2 border-dashed border-gray-200 text-center py-12 space-y-5">
          <div className="text-5xl">👶</div>
          <div>
            <h2 className="font-semibold text-lg">Link your child&apos;s account</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
              Ask your child to open their <strong>Invite</strong> page and share their 8-character code.
            </p>
          </div>
          <LinkChildForm />
        </div>
      )}

      {/* Per-child sections */}
      {validChildren.map((child: ChildData) => {
        const {
          student, completedLessons, totalLessons, overallPct,
          avgScore, weakSkills, weakDiagAreas, recommendations,
          diagnostics, weeklyExecution, studyMinutesThisWeek,
        } = child

        return (
          <div key={student.id} className="space-y-5">

            {/* Child header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-xl">{student.profile.full_name}</h2>
                <p className="text-sm text-gray-500">3ème Collège</p>
              </div>
              <div className="flex gap-3">
                <div className="card text-center px-4 py-2">
                  <div className="text-xl font-bold text-brand-600">{student.points}</div>
                  <div className="text-xs text-gray-400">Points</div>
                </div>
                <div className="card text-center px-4 py-2">
                  <div className="text-xl font-bold text-orange-500">{student.streak_days}🔥</div>
                  <div className="text-xs text-gray-400">Streak</div>
                </div>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ParentMetricCard icon="📚" label="Lessons done"    value={`${completedLessons}/${totalLessons}`} />
              <ParentMetricCard icon="🎯" label="Avg score"       value={`${avgScore}%`}
                color={avgScore >= 70 ? 'text-green-600' : avgScore >= 50 ? 'text-yellow-600' : 'text-red-600'} />
              <ParentMetricCard icon="📈" label="Overall"         value={`${overallPct}%`} />
              <ParentMetricCard icon="⏱️" label="Study time (wk)" value={studyMinutesThisWeek > 0 ? `${studyMinutesThisWeek}m` : '—'} />
            </div>

            {/* Overall progress bar */}
            <div className="card">
              <h3 className="font-semibold mb-3">Overall course progress</h3>
              <ProgressBar value={overallPct} label={`${completedLessons} of ${totalLessons} lessons completed`} />
            </div>

            {/* This week's execution */}
            {weeklyExecution.hasPlan ? (
              <div className="card">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-semibold">This week&apos;s study plan</h3>
                  {weeklyExecution.planId && (
                    <Link href={`/parent/report/${weeklyExecution.planId}`} className="text-xs text-brand-600 hover:underline">
                      View full plan →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-700">{weeklyExecution.planned}</div>
                    <div className="text-xs text-gray-400">Planned</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{weeklyExecution.completed}</div>
                    <div className="text-xs text-gray-400">Done</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-500">{weeklyExecution.missed}</div>
                    <div className="text-xs text-gray-400">Missed</div>
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${
                      weeklyExecution.rate >= 70 ? 'text-green-600'
                      : weeklyExecution.rate >= 40 ? 'text-yellow-600'
                      : 'text-red-500'
                    }`}>
                      {weeklyExecution.rate}%
                    </div>
                    <div className="text-xs text-gray-400">Rate</div>
                  </div>
                </div>
                <ProgressBar
                  value={weeklyExecution.rate}
                  size="sm"
                  color={
                    weeklyExecution.rate >= 70 ? 'bg-green-500'
                    : weeklyExecution.rate >= 40 ? 'bg-yellow-400'
                    : 'bg-orange-400'
                  }
                />
              </div>
            ) : (
              <div className="card bg-gray-50 border border-gray-100 text-center py-5 space-y-1">
                <p className="text-sm font-medium text-gray-500">No study plan generated this week</p>
                <p className="text-xs text-gray-400">Your child will see a &ldquo;Generate plan&rdquo; button when they log in.</p>
              </div>
            )}

            {/* Diagnostic breakdown */}
            {diagnostics.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-3">Subject diagnostic scores</h3>
                <div className="space-y-3">
                  {diagnostics.map((d: DiagRow) => (
                    <div key={d.id} className="flex items-center gap-3">
                      <span className="text-lg">{(d.subject as { icon: string })?.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{(d.subject as { name: string })?.name}</span>
                          <span className="font-medium">{Math.round(d.score)}%</span>
                        </div>
                        <ProgressBar
                          value={Math.round(d.score)}
                          size="sm"
                          color={d.score >= 75 ? 'bg-green-500' : d.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skill-level weak spots (from attempts) */}
            {weakSkills.length > 0 && (
              <div className="card border-l-4 border-orange-400">
                <h3 className="font-semibold mb-1 text-orange-700">⚠️ Exercise weak spots</h3>
                <p className="text-xs text-gray-400 mb-2">Based on recent exercise attempts</p>
                <div className="flex flex-wrap gap-2">
                  {weakSkills.map((s: WeakSkillDisplay) => (
                    <span key={s.label} className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                      {s.icon} {s.label} — {s.mastery}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic weak subjects */}
            {weakDiagAreas.length > 0 && (
              <div className="card border-l-4 border-red-300">
                <h3 className="font-semibold mb-2 text-red-700">📊 Subjects needing focus</h3>
                <div className="flex flex-wrap gap-2">
                  {weakDiagAreas.map((w: WeakDiagArea) => (
                    <span key={w.name} className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                      {w.icon} {w.name} — {w.score}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="card border-l-4 border-brand-400">
                <h3 className="font-semibold mb-2 text-brand-700">💡 Recommendations</h3>
                <ul className="space-y-1">
                  {recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-brand-500 flex-shrink-0">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-gray-100 pt-2" />
          </div>
        )
      })}

    </div>
  )
}
