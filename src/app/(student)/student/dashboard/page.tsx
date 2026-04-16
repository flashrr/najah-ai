import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProgressBar from '@/components/ProgressBar'
import Badge from '@/components/Badge'
import OnboardingModal from '@/components/OnboardingModal'

const BADGES = [
  { icon: '🔥', name: 'First Lesson',   description: 'Completed your first lesson',  minPoints: 10  },
  { icon: '⭐', name: 'Quick Learner',   description: 'Finished a lesson in one go',   minPoints: 50  },
  { icon: '🏆', name: 'Week Champion',   description: 'Completed a full week',         minPoints: 200 },
  { icon: '💡', name: 'Problem Solver',  description: 'Got 10 exercises correct',      minPoints: 100 },
]

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile }  = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: student }  = await supabase.from('students').select('*').eq('profile_id', user.id).single()

  if (!student) redirect('/login')

  // Subject progress
  const { data: subjects } = await supabase.from('subjects').select('*')
  const { data: lessons }  = await supabase.from('lessons').select('id, subject_id')
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, score')
    .eq('student_id', student.id)

  // Diagnostic results
  const { data: diagnostics } = await supabase
    .from('diagnostic_results')
    .select('*, subject:subjects(name, icon)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  // Skill-level analysis from attempts (last 100 attempts)
  const { data: recentAttempts } = await supabase
    .from('attempts')
    .select('is_correct, exercise:exercises(skill_tag)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Aggregate skill performance
  const skillMap: Record<string, { correct: number; total: number }> = {}
  for (const attempt of recentAttempts ?? []) {
    const skill = (attempt.exercise as { skill_tag?: string } | null)?.skill_tag
    if (!skill) continue
    if (!skillMap[skill]) skillMap[skill] = { correct: 0, total: 0 }
    skillMap[skill].total++
    if (attempt.is_correct) skillMap[skill].correct++
  }

  const skillStats = Object.entries(skillMap)
    .map(([skill, s]) => ({ skill, pct: Math.round((s.correct / s.total) * 100), total: s.total }))
    .sort((a, b) => a.pct - b.pct) // weakest first
    .slice(0, 6) // top 6 skills to show

  const weakSkills = skillStats.filter(s => s.pct < 60)

  // Build subject progress map
  const progressBySubject = subjects?.map(sub => {
    const subLessons    = lessons?.filter(l => l.subject_id === sub.id) ?? []
    const completedIds  = new Set(progress?.filter(p => p.status === 'completed').map(p => p.lesson_id))
    const done          = subLessons.filter(l => completedIds.has(l.id)).length
    const total         = subLessons.length
    const pct           = total > 0 ? Math.round((done / total) * 100) : 0
    return { ...sub, done, total, pct }
  }) ?? []

  const totalLessons    = lessons?.length ?? 0
  const completedCount  = progress?.filter(p => p.status === 'completed').length ?? 0
  const overallPct      = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const hasDiagnostic   = (diagnostics?.length ?? 0) > 0
  const earnedBadges    = BADGES.filter(b => student.points >= b.minPoints)

  // Shape diagnostic data for the onboarding modal
  const diagnosticSummary = (diagnostics ?? []).map(d => ({
    subjectName: (d.subject as { name: string } | null)?.name ?? '',
    subjectIcon: (d.subject as { icon: string } | null)?.icon ?? '',
    score:       d.score,
  }))

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

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
          {progressBySubject.map(sub => (
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
          <h2 className="font-semibold mb-3">Diagnostic results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {diagnostics?.map(d => (
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

      {/* Skill analysis from attempts */}
      {skillStats.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Skill performance</h2>
          {weakSkills.length > 0 && (
            <div className="card border-l-4 border-orange-400 mb-3">
              <h3 className="font-medium text-orange-700 mb-2">⚠️ Skills needing work</h3>
              <div className="flex flex-wrap gap-2">
                {weakSkills.map(s => (
                  <span key={s.skill} className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                    {s.skill} — {s.pct}%
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skillStats.map(s => (
              <div key={s.skill} className="card">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium capitalize">{s.skill}</span>
                  <span className={`text-xs font-bold ${s.pct >= 70 ? 'text-green-600' : s.pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {s.pct}%
                  </span>
                </div>
                <ProgressBar
                  value={s.pct}
                  size="sm"
                  color={s.pct >= 70 ? 'bg-green-500' : s.pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                />
                <p className="text-xs text-gray-400 mt-1">{s.total} attempt{s.total !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/student/weekly-plan', icon: '📅', label: 'Weekly Plan' },
          { href: '/student/diagnostic',  icon: '🎯', label: 'Diagnostic'  },
          { href: '/student/tutor',        icon: '🤖', label: 'AI Tutor'   },
          { href: '/student/invite',       icon: '🔗', label: 'Invite'     },
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
