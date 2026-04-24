import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

type SkillStatus = 'not_started' | 'in_progress' | 'mastered'

type SkillEntry = {
  skill_tag:        string
  display_name:     string
  difficulty_band:  string
  score:            number
  attempt_count:    number
  status:           SkillStatus
  last_practiced_at: string | null
}

type SubjectGroup = {
  subject_id: string
  name:       string
  icon:       string
  skills:     SkillEntry[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateString: string | null): string {
  if (!dateString) return ''
  const diffMs   = Date.now() - new Date(dateString).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

const BAND_ORDER: Record<string, number> = { foundation: 0, core: 1, advanced: 2 }

const STATUS_CONFIG: Record<SkillStatus, { label: string; bg: string; text: string; dot: string }> = {
  mastered:    { label: 'Mastered',    bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-400'  },
  not_started: { label: 'Not Started', bg: 'bg-gray-100',  text: 'text-gray-500',  dot: 'bg-gray-300'  },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SkillsPage() {
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

  // Fetch all three tables needed, then join in JS (avoids nested-select FK ambiguity)
  const [
    { data: masteryRows },
    { data: definitions },
    { data: subjectRows },
  ] = await Promise.all([
    admin
      .from('skill_mastery')
      .select('skill_tag, score, attempt_count, status, last_practiced_at')
      .eq('student_id', student.id)
      .order('skill_tag'),
    admin
      .from('skill_definitions')
      .select('skill_tag, display_name, difficulty_band, subject_id'),
    admin
      .from('subjects')
      .select('id, name, icon'),
  ])

  // Explicit row types — strict mode rejects implicit any on ?? [] fallbacks
  type MasteryRow = { skill_tag: string; score: number; attempt_count: number; status: string; last_practiced_at: string | null }
  type DefRow     = { skill_tag: string; display_name: string; difficulty_band: string; subject_id: string }
  type SubjRow    = { id: string; name: string; icon: string | null }

  const mastery = (masteryRows  as MasteryRow[] | null) ?? []
  const defMap  = new Map<string, DefRow>( (definitions  as DefRow[]  | null ?? []).map(d => [d.skill_tag, d]))
  const subjMap = new Map<string, SubjRow>((subjectRows  as SubjRow[] | null ?? []).map(s => [s.id,        s]))

  // Join + group by subject
  const groupMap = new Map<string, SubjectGroup>()

  for (const row of mastery) {
    const def     = defMap.get(row.skill_tag)
    if (!def) continue
    const subject = subjMap.get(def.subject_id)
    if (!subject) continue

    if (!groupMap.has(subject.id)) {
      groupMap.set(subject.id, {
        subject_id: subject.id,
        name:       subject.name,
        icon:       subject.icon ?? '📘',
        skills:     [],
      })
    }

    groupMap.get(subject.id)!.skills.push({
      skill_tag:        row.skill_tag,
      display_name:     def.display_name,
      difficulty_band:  def.difficulty_band,
      score:            row.score,
      attempt_count:    row.attempt_count,
      status:           row.status as SkillStatus,
      last_practiced_at: row.last_practiced_at,
    })
  }

  // Sort skills: foundation → core → advanced, then score desc within band
  const groups = Array.from(groupMap.values())
  for (const g of groups) {
    g.skills.sort((a, b) => {
      const ba = BAND_ORDER[a.difficulty_band] ?? 9
      const bb = BAND_ORDER[b.difficulty_band] ?? 9
      if (ba !== bb) return ba - bb
      return b.score - a.score
    })
  }
  // Sort groups alphabetically
  groups.sort((a, b) => a.name.localeCompare(b.name))

  const totalTracked    = mastery.length
  const masteredCount   = mastery.filter(r => r.status === 'mastered').length
  const inProgressCount = totalTracked - masteredCount

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Your Skills</h1>
        <p className="text-sm text-gray-500 mt-1">Updated live as you answer exercises</p>
      </div>

      {/* Summary strip — only shown when there are tracked skills */}
      {totalTracked > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-green-600">{masteredCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Mastered</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">In Progress</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-gray-700">{totalTracked}</div>
            <div className="text-xs text-gray-500 mt-0.5">Tracked</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalTracked === 0 && (
        <div className="card text-center py-14 space-y-4">
          <div className="text-5xl">🗺️</div>
          <div>
            <p className="font-semibold text-gray-700 text-lg">No skills tracked yet</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              Answer exercises in your lessons and your skill map will build up automatically.
            </p>
          </div>
          <Link href="/student/weekly-plan" className="btn-primary inline-block">
            Go to Weekly Plan →
          </Link>
        </div>
      )}

      {/* Subject groups */}
      {groups.map(group => {
        const groupMastered = group.skills.filter(s => s.status === 'mastered').length
        return (
          <div key={group.subject_id} className="card space-y-1">

            {/* Subject header */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="text-xl">{group.icon}</span>
              <span className="font-semibold text-gray-800">{group.name}</span>
              <span className="ml-auto text-xs text-gray-400">
                {groupMastered}/{group.skills.length} mastered
              </span>
            </div>

            {/* Skill rows */}
            {group.skills.map((skill) => {
              const cfg      = STATUS_CONFIG[skill.status] ?? STATUS_CONFIG.in_progress
              const barColor = skill.status === 'mastered' ? 'bg-green-500' : 'bg-brand-500'
              const ago      = timeAgo(skill.last_practiced_at)

              return (
                <div key={skill.skill_tag} className="py-3 border-b border-gray-50 last:border-0">
                  {/* Row top: name + badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-800">{skill.display_name}</span>
                    <span className={`
                      flex-shrink-0 inline-flex items-center gap-1
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${cfg.bg} ${cfg.text}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-12 text-right flex-shrink-0">
                      {skill.score}/100
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-gray-400">
                      {skill.attempt_count} attempt{skill.attempt_count !== 1 ? 's' : ''}
                    </span>
                    {ago && (
                      <>
                        <span className="text-gray-200 text-xs">·</span>
                        <span className="text-xs text-gray-400">{ago}</span>
                      </>
                    )}
                    <span className="text-gray-200 text-xs">·</span>
                    <span className="text-xs text-gray-300 capitalize">{skill.difficulty_band}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

    </div>
  )
}
