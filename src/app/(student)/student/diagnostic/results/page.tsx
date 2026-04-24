import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ProgressBar from '@/components/ProgressBar'

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubjectResult {
  id:          string
  score:       number
  weak_topics: string[]
  subject_id:  string
  subject: {
    id:    string
    name:  string
    icon:  string
    color: string
    slug:  string
  }
}

interface WeakSkillRow {
  skill_tag:   string
  mastery_pct: number
  attempts:    number
  subject_id:  string | null
  subject: { name: string; icon: string } | null
}

// ── Score colour helper ────────────────────────────────────────────────────────
function scoreColor(score: number) {
  if (score >= 75) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-400'
  return 'bg-red-400'
}

function scoreLabel(score: number) {
  if (score >= 75) return { text: '✓ Good level', cls: 'text-green-700' }
  if (score >= 50) return { text: '→ Needs practice', cls: 'text-yellow-700' }
  return { text: '↩ Review needed', cls: 'text-red-600' }
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function DiagnosticResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (!student) redirect('/')

  // ── Fetch diagnostic results ─────────────────────────────────────────────
  const { data: rawResults } = await admin
    .from('diagnostic_results')
    .select('id, score, weak_topics, subject_id, subject:subjects(id, name, icon, color, slug)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  // Deduplicate — keep most-recent result per subject (handles retake edge cases)
  const seen = new Set<string>()
  const results: SubjectResult[] = []
  for (const r of (rawResults ?? []) as SubjectResult[]) {
    if (seen.has(r.subject_id)) continue
    seen.add(r.subject_id)
    results.push(r)
  }

  // No results yet — redirect back to start the diagnostic
  if (results.length === 0) redirect('/student/diagnostic')

  // ── Fetch skill mastery ──────────────────────────────────────────────────
  const { data: skillRows } = await admin
    .from('student_weak_skills')
    .select('skill_tag, mastery_pct, attempts, subject_id, subject:subjects(name, icon)')
    .eq('student_id', student.id)
    .order('mastery_pct', { ascending: true })

  const weakSkills   = (skillRows as WeakSkillRow[] | null)?.filter(s => s.mastery_pct < 60)  ?? []
  const strongSkills = (skillRows as WeakSkillRow[] | null)?.filter(s => s.mastery_pct >= 75) ?? []

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const avgScore    = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
  const strongSubs  = results.filter(r => r.score >= 75)
  const needsWork   = results.filter(r => r.score >= 50 && r.score < 75)
  const weakSubs    = results.filter(r => r.score < 50)

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Your Diagnostic Results 📊</h1>
        <p className="text-sm text-gray-500 mt-1">
          Based on {results.length} subject{results.length !== 1 ? 's' : ''} tested
        </p>
      </div>

      {/* Overall score */}
      <div className="card flex items-center gap-6">
        <div className="text-center">
          <div className={`text-4xl font-bold ${avgScore >= 75 ? 'text-green-600' : avgScore >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
            {avgScore}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Overall score</div>
        </div>
        <div className="flex-1 space-y-1 text-sm">
          {strongSubs.length > 0 && (
            <p className="text-green-700">✓ {strongSubs.length} subject{strongSubs.length !== 1 ? 's' : ''} at good level</p>
          )}
          {needsWork.length > 0 && (
            <p className="text-yellow-700">→ {needsWork.length} subject{needsWork.length !== 1 ? 's' : ''} need{needsWork.length === 1 ? 's' : ''} practice</p>
          )}
          {weakSubs.length > 0 && (
            <p className="text-red-600">↩ {weakSubs.length} subject{weakSubs.length !== 1 ? 's' : ''} need{weakSubs.length === 1 ? 's' : ''} review</p>
          )}
        </div>
      </div>

      {/* Per-subject scores */}
      <div>
        <h2 className="font-semibold mb-3">Score by subject</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map(r => {
            const label = scoreLabel(r.score)
            return (
              <div key={r.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{r.subject?.icon}</span>
                  <span className="font-medium text-sm">{r.subject?.name}</span>
                  <span className={`ml-auto font-bold text-lg ${r.score >= 75 ? 'text-green-600' : r.score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {Math.round(r.score)}%
                  </span>
                </div>
                <ProgressBar
                  value={Math.round(r.score)}
                  color={scoreColor(r.score)}
                  size="sm"
                />
                <p className={`text-xs mt-1.5 font-medium ${label.cls}`}>{label.text}</p>
                {(r.weak_topics as string[])?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Weak areas: {(r.weak_topics as string[]).join(', ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Weak skills detail */}
      {weakSkills.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Skills to work on first ⚠️</h2>
          <div className="card border-l-4 border-orange-400 bg-orange-50">
            <div className="flex flex-wrap gap-2">
              {weakSkills.map(s => (
                <span
                  key={s.skill_tag}
                  className="flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {s.subject?.icon} {s.skill_tag} — {Math.round(s.mastery_pct)}%
                </span>
              ))}
            </div>
            <p className="text-xs text-orange-700 mt-3">
              These skills will be prioritised in your weekly plan.
            </p>
          </div>
        </div>
      )}

      {/* Strong skills */}
      {strongSkills.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Your strengths 💪</h2>
          <div className="flex flex-wrap gap-2">
            {strongSkills.map(s => (
              <span
                key={s.skill_tag}
                className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"
              >
                {s.subject?.icon} {s.skill_tag} — {Math.round(s.mastery_pct)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="card border-2 border-brand-200 bg-brand-50 space-y-3">
        <h2 className="font-semibold text-brand-800">What happens next?</h2>
        <ul className="text-sm text-brand-700 space-y-1.5 list-disc list-inside">
          {weakSubs.length > 0 && (
            <li>
              Revision lessons for <strong>{weakSubs.map(r => r.subject?.name).join(', ')}</strong> added to your plan
            </li>
          )}
          {needsWork.length > 0 && (
            <li>
              Practice exercises for <strong>{needsWork.map(r => r.subject?.name).join(', ')}</strong> scheduled weekly
            </li>
          )}
          {strongSubs.length > 0 && (
            <li>
              <strong>{strongSubs.map(r => r.subject?.name).join(', ')}</strong> — advance-level content unlocked
            </li>
          )}
          <li>Weak skills will reappear in exercises for spaced repetition</li>
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/student/weekly-plan" className="btn-primary flex-1 text-center">
          View your personalised plan →
        </Link>
        <Link href="/student/diagnostic" className="btn-secondary text-sm">
          🔄 Retake diagnostic
        </Link>
      </div>

    </div>
  )
}
