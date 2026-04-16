import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProgressBar from '@/components/ProgressBar'

interface Props { params: { weekId: string } }

export default async function WeekReportPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get first linked child
  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_profile_id', user.id)
    .limit(1)

  if (!links || links.length === 0) redirect('/parent/dashboard')
  const studentId = links[0].student_id

  const { data: week } = await supabase
    .from('weeks')
    .select('*')
    .eq('id', params.weekId)
    .single()
  if (!week) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, subject:subjects(name, icon)')
    .eq('week_id', params.weekId)

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .in('lesson_id', (lessons ?? []).map(l => l.id))

  const completedLessons = progress?.filter(p => p.status === 'completed') ?? []
  const avgScore = completedLessons.length > 0
    ? Math.round(completedLessons.reduce((acc, p) => acc + (p.score ?? 0), 0) / completedLessons.length)
    : 0
  const pct = lessons && lessons.length > 0
    ? Math.round((completedLessons.length / lessons.length) * 100) : 0

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/parent/dashboard" className="text-brand-600 hover:underline text-sm">← Back</Link>
      </div>

      <h1 className="text-2xl font-bold">{week.title}</h1>
      {week.objective && <p className="text-sm text-gray-500">{week.objective}</p>}

      <div className="card">
        <h2 className="font-semibold mb-3">Week summary</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-600">{completedLessons.length}/{lessons?.length ?? 0}</div>
            <div className="text-xs text-gray-500">Lessons done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{avgScore}%</div>
            <div className="text-xs text-gray-500">Avg score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{pct}%</div>
            <div className="text-xs text-gray-500">Completion</div>
          </div>
        </div>
        <ProgressBar value={pct} />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Lessons this week</h2>
        <div className="space-y-3">
          {lessons?.map(lesson => {
            const prog = progress?.find(p => p.lesson_id === lesson.id)
            const status = prog?.status ?? 'not_started'
            return (
              <div key={lesson.id} className="flex items-center gap-3">
                <span className="text-lg">{(lesson.subject as { icon: string })?.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{lesson.title}</div>
                  <div className="text-xs text-gray-400">{(lesson.subject as { name: string })?.name}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  status === 'completed'   ? 'bg-green-100 text-green-700'  :
                  status === 'in_progress' ? 'bg-blue-100 text-blue-700'    :
                                             'bg-gray-100 text-gray-500'
                }`}>
                  {status === 'completed' ? `✓ ${prog?.score ?? 0}%` : status.replace('_', ' ')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
