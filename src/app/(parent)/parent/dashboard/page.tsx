import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ParentMetricCard from '@/components/ParentMetricCard'
import ProgressBar from '@/components/ProgressBar'

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get linked children
  const { data: links } = await supabase
    .from('parent_student_links')
    .select('*, student:students(*, profile:profiles(full_name))')
    .eq('parent_profile_id', user.id)

  const hasChildren = links && links.length > 0

  // For each child, build overview
  const childData = await Promise.all(
    (links ?? []).map(async link => {
      const student = link.student as {
        id: string; points: number; streak_days: number;
        profile: { full_name: string }
      }
      if (!student) return null

      const [
        { data: progress },
        { data: diagnostics },
        { data: lessons },
        { data: attempts },
      ] = await Promise.all([
        supabase.from('lesson_progress').select('*').eq('student_id', student.id),
        supabase.from('diagnostic_results').select('*, subject:subjects(name, icon, slug)').eq('student_id', student.id),
        supabase.from('lessons').select('id'),
        supabase.from('attempts').select('is_correct, created_at').eq('student_id', student.id),
      ])

      const completedLessons = progress?.filter(p => p.status === 'completed').length ?? 0
      const totalLessons     = lessons?.length ?? 0
      const overallPct       = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      const correctAttempts  = attempts?.filter(a => a.is_correct).length ?? 0
      const totalAttempts    = attempts?.length ?? 0
      const avgScore         = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

      // Weak areas from diagnostics
      const weakAreas = diagnostics
        ?.filter(d => d.score < 60)
        .map(d => ({ name: (d.subject as { name: string })?.name, icon: (d.subject as { icon: string })?.icon, score: d.score })) ?? []

      // Recommendations based on scores
      const recommendations: string[] = []
      if (weakAreas.length > 0)
        recommendations.push(`Focus on ${weakAreas.map(w => w.name).join(', ')} — scores below 60%`)
      if (student.streak_days === 0)
        recommendations.push('Encourage daily study — even 15 minutes helps')
      if (completedLessons < 2)
        recommendations.push('Help your child complete at least 2 lessons this week')
      if (avgScore >= 80)
        recommendations.push('Great progress! Consider challenging exercises')

      return {
        student,
        completedLessons,
        totalLessons,
        overallPct,
        avgScore,
        weakAreas,
        recommendations,
        diagnostics: diagnostics ?? [],
      }
    })
  )

  const validChildren = childData.filter(Boolean)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Parent Dashboard 👨‍👩‍👧</h1>
        <p className="text-sm text-gray-500 mt-1">Track your child&apos;s progress and get weekly recommendations.</p>
      </div>

      {/* No children linked */}
      {!hasChildren && (
        <div className="card border-2 border-dashed border-gray-200 text-center py-12 space-y-4">
          <div className="text-5xl">👶</div>
          <h2 className="font-semibold text-lg">Link your child&apos;s account</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Ask your child to go to their <strong>Invite</strong> page and share their 8-character invite code with you.
          </p>
          <LinkChildForm parentId={user.id} />
        </div>
      )}

      {/* Add another child (when already has children) */}
      {hasChildren && (
        <details className="card">
          <summary className="cursor-pointer font-medium text-sm text-brand-700 list-none flex items-center gap-2">
            <span>➕</span> Link another child
          </summary>
          <div className="mt-4">
            <LinkChildForm parentId={user.id} />
          </div>
        </details>
      )}

      {/* Per-child overview */}
      {validChildren.map((child) => {
        if (!child) return null
        const { student, completedLessons, totalLessons, overallPct, avgScore, weakAreas, recommendations, diagnostics } = child

        return (
          <div key={student.id} className="space-y-6">
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

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ParentMetricCard icon="📚" label="Lessons done"  value={`${completedLessons}/${totalLessons}`} />
              <ParentMetricCard icon="🎯" label="Avg score"     value={`${avgScore}%`}  color={avgScore >= 70 ? 'text-green-600' : avgScore >= 50 ? 'text-yellow-600' : 'text-red-600'} />
              <ParentMetricCard icon="📈" label="Overall"       value={`${overallPct}%`} />
              <ParentMetricCard icon="🔥" label="Day streak"    value={student.streak_days} />
            </div>

            {/* Overall progress bar */}
            <div className="card">
              <h3 className="font-semibold mb-3">Overall course progress</h3>
              <ProgressBar value={overallPct} label={`${completedLessons} of ${totalLessons} lessons completed`} />
            </div>

            {/* Diagnostic breakdown */}
            {diagnostics.length > 0 && (
              <div className="card">
                <h3 className="font-semibold mb-3">Subject scores</h3>
                <div className="space-y-3">
                  {diagnostics.map((d: { id: string; score: number; subject: unknown }) => (
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

            {/* Weak areas */}
            {weakAreas.length > 0 && (
              <div className="card border-l-4 border-orange-400">
                <h3 className="font-semibold mb-2 text-orange-700">⚠️ Areas needing attention</h3>
                <div className="flex flex-wrap gap-2">
                  {weakAreas.map(w => (
                    <span key={w.name} className="flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                      {w.icon} {w.name} — {Math.round(w.score)}%
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
                  {recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-brand-500 flex-shrink-0">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4" />
          </div>
        )
      })}
    </div>
  )
}

// Inline client component for linking a child via invite code
function LinkChildForm({ parentId }: { parentId: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        'use server'
        const code = (formData.get('code') as string)?.trim().toUpperCase()
        if (!code) return

        const { createClient: createSC } = await import('@/lib/supabase/server')
        const supabase = await createSC()

        const { data, error } = await supabase.rpc('claim_invite_code', {
          p_code:             code,
          p_parent_profile_id: parentId,
        })

        if (error || !data?.success) {
          // Server actions can't easily return errors to the UI here;
          // the page will just re-render with no change if the code is invalid.
          // For a better UX this would be a client component, but this keeps it simple.
          return
        }

        revalidatePath('/parent/dashboard')
      }}
      className="flex gap-2 justify-center max-w-sm mx-auto"
    >
      <input
        name="code"
        type="text"
        className="input flex-1 font-mono tracking-widest uppercase text-center"
        placeholder="XXXX-XXXX"
        maxLength={9}
      />
      <button type="submit" className="btn-primary">Link</button>
    </form>
  )
}
