import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WeeklyPlan from '@/components/WeeklyPlan'
import type { LessonProgress } from '@/lib/types'

export default async function WeeklyPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!student) redirect('/login')

  // Load all weeks, lessons (with subjects), and student progress
  const { data: weeks }   = await supabase.from('weeks').select('*').order('week_number')
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, subject:subjects(*)')
    .order('order_index')
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', student.id)

  const progressMap: Record<string, LessonProgress> = {}
  progress?.forEach(p => { progressMap[p.lesson_id] = p })

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Your Weekly Plan 📅</h1>
        <p className="text-sm text-gray-500 mt-1">Work through each week at your own pace.</p>
      </div>

      {weeks?.map(week => {
        const weekLessons = lessons?.filter(l => l.week_id === week.id) ?? []
        return (
          <WeeklyPlan
            key={week.id}
            week={week}
            lessons={weekLessons}
            progressMap={progressMap}
          />
        )
      })}

      {(!weeks || weeks.length === 0) && (
        <div className="card text-center text-gray-400 py-16">
          No weeks added yet. Check back soon!
        </div>
      )}
    </div>
  )
}
