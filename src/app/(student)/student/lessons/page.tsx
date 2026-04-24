import { redirect }  from 'next/navigation'
import Link           from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface LessonRow {
  id: string
  title: string
  difficulty: string
  estimated_minutes: number
  subject_name: string
  subject_icon: string
  subject_id: string
  week_title: string
  week_number: number
}

interface ProgressRow {
  lesson_id: string
  status: string
}

export default async function LessonsPage() {
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

  // All lessons — ordered for grouping
  const { data: lessonRows } = await admin
    .from('lessons')
    .select(`
      id, title, difficulty, estimated_minutes,
      subject:subjects(id, name, icon),
      week:weeks(title, week_number)
    `)
    .order('order_index')

  // Student's completion status
  const { data: progressRows } = await admin
    .from('lesson_progress')
    .select('lesson_id, status')
    .eq('student_id', student.id)

  const progressMap: Record<string, string> = {}
  for (const p of (progressRows ?? []) as ProgressRow[]) {
    progressMap[p.lesson_id] = p.status
  }

  // Normalize rows
  type RawLesson = {
    id: string; title: string; difficulty: string; estimated_minutes: number
    subject: { id: string; name: string; icon: string } | null
    week: { title: string; week_number: number } | null
  }

  const lessons: LessonRow[] = ((lessonRows ?? []) as RawLesson[])
    .filter(l => l.subject && l.week)
    .map(l => ({
      id:                l.id,
      title:             l.title,
      difficulty:        l.difficulty,
      estimated_minutes: l.estimated_minutes,
      subject_name:      l.subject!.name,
      subject_icon:      l.subject!.icon,
      subject_id:        l.subject!.id,
      week_title:        l.week!.title,
      week_number:       l.week!.week_number,
    }))

  // Group by subject, sorted alphabetically
  const grouped: Record<string, { icon: string; lessons: LessonRow[] }> = {}
  for (const l of lessons) {
    if (!grouped[l.subject_name]) {
      grouped[l.subject_name] = { icon: l.subject_icon, lessons: [] }
    }
    grouped[l.subject_name].lessons.push(l)
  }
  // Sort lessons within each subject by week_number
  for (const g of Object.values(grouped)) {
    g.lessons.sort((a, b) => a.week_number - b.week_number)
  }
  const subjectNames = Object.keys(grouped).sort()

  const diffLabel: Record<string, string> = {
    easy:   'badge-easy',
    medium: 'badge-medium',
    hard:   'badge-hard',
  }

  const totalLessons    = lessons.length
  const completedCount  = lessons.filter(l => progressMap[l.id] === 'completed').length

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">All Lessons 📚</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse every lesson — click one to study it anytime.
          </p>
        </div>
        {completedCount > 0 && (
          <span className="text-sm text-gray-500">
            {completedCount}/{totalLessons} completed
          </span>
        )}
      </div>

      {/* Subjects */}
      {subjectNames.map(subjectName => {
        const { icon, lessons: subLessons } = grouped[subjectName]
        return (
          <div key={subjectName} className="space-y-2">
            {/* Subject header */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-lg">{icon}</span>
              <h2 className="font-semibold text-gray-800 text-sm">{subjectName}</h2>
            </div>

            {/* Lesson cards */}
            {subLessons.map(l => {
              const status = progressMap[l.id]
              const isDone = status === 'completed'
              const isInProgress = status === 'in_progress'

              return (
                <Link
                  key={l.id}
                  href={`/student/lessons/${l.id}`}
                  className={`card flex items-center gap-3 hover:border-brand-200 transition-colors border-2 ${
                    isDone ? 'border-green-200 bg-green-50' :
                    isInProgress ? 'border-brand-100' :
                    'border-gray-100'
                  }`}
                >
                  {/* Status indicator */}
                  <span className="flex-shrink-0 text-lg">
                    {isDone ? '✅' : isInProgress ? '📖' : '⭕'}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm leading-snug ${isDone ? 'text-green-800' : 'text-gray-800'}`}>
                      {l.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{l.week_title}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={diffLabel[l.difficulty] ?? 'badge-medium'}>
                      {l.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">{l.estimated_minutes} min</span>
                    <span className="text-gray-300 text-xs">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      })}

      {lessons.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          No lessons available yet.
        </div>
      )}
    </div>
  )
}
