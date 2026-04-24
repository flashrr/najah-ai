import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface ChapterRow {
  id:          string
  title:       string
  description: string | null
  grade:       string
  order_index: number
  subject:     { name: string; icon: string } | null
}

export default async function ChaptersPage() {
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

  /* All chapters with subject */
  const { data: chapters } = await admin
    .from('chapters')
    .select('id, title, description, grade, order_index, subject:subjects(name, icon)')
    .order('order_index') as { data: ChapterRow[] | null }

  /* Per-chapter lesson counts + student completion */
  type LessonMeta = { chapter_id: string; id: string }
  const { data: allLessons } = await admin
    .from('lessons')
    .select('id, chapter_id')
    .not('chapter_id', 'is', null) as { data: LessonMeta[] | null }

  const lessonsByChapter: Record<string, string[]> = {}
  for (const l of (allLessons ?? [])) {
    if (!l.chapter_id) continue
    if (!lessonsByChapter[l.chapter_id]) lessonsByChapter[l.chapter_id] = []
    lessonsByChapter[l.chapter_id].push(l.id)
  }

  const allLessonIds = (allLessons ?? []).map(l => l.id)
  const { data: progressRows } = allLessonIds.length
    ? await admin
        .from('lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', student.id)
        .in('lesson_id', allLessonIds)
    : { data: [] }

  const completedSet = new Set(
    ((progressRows ?? []) as { lesson_id: string; status: string }[])
      .filter(p => p.status === 'completed')
      .map(p => p.lesson_id),
  )

  const chapterList = (chapters ?? [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Chapters 🗂️</h1>
        <p className="text-sm text-gray-500 mt-1">
          Structured learning paths — complete a chapter from start to finish.
        </p>
      </div>

      {/* Chapter cards */}
      {chapterList.map(ch => {
        const lessonIds   = lessonsByChapter[ch.id] ?? []
        const total       = lessonIds.length
        const done        = lessonIds.filter(id => completedSet.has(id)).length
        const pct         = total > 0 ? Math.round((done / total) * 100) : 0
        const allDone     = total > 0 && done === total

        return (
          <Link
            key={ch.id}
            href={`/student/chapters/${ch.id}`}
            className="card block hover:border-brand-200 border-2 border-gray-100 transition-colors space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{ch.subject?.icon ?? '📚'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{ch.title}</p>
                  <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
                    {ch.grade}
                  </span>
                  {allDone && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                      ✅ Complete
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{ch.subject?.name}</p>
                {ch.description && (
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                    {ch.description}
                  </p>
                )}
              </div>
              <span className="text-gray-300 text-sm flex-shrink-0">→</span>
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{done}/{total} lessons</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-brand-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </Link>
        )
      })}

      {chapterList.length === 0 && (
        <div className="card text-center text-gray-400 py-12">
          No chapters available yet.
        </div>
      )}
    </div>
  )
}
