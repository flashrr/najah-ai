import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LessonContent from './LessonContent'

interface Props {
  params: { lessonId: string }
}

export default async function LessonPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, points')
    .eq('profile_id', user.id)
    .single()
  if (!student) redirect('/login')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, subject:subjects(*), week:weeks(*)')
    .eq('id', params.lessonId)
    .single()
  if (!lesson) notFound()

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', params.lessonId)
    .order('order_index')

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', student.id)
    .eq('lesson_id', params.lessonId)
    .single()

  const { data: prevAttempts } = await supabase
    .from('attempts')
    .select('exercise_id, is_correct')
    .eq('student_id', student.id)
    .in('exercise_id', (exercises ?? []).map(e => e.id))

  const attemptedSet = new Set(prevAttempts?.map(a => a.exercise_id))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4 flex items-center gap-1 flex-wrap">
        <Link href="/student/weekly-plan" className="hover:text-brand-600">Weekly Plan</Link>
        <span>/</span>
        <span>{lesson.subject?.name}</span>
        <span>/</span>
        <span className="text-gray-700">{lesson.title}</span>
      </nav>

      <LessonContent
        lesson={lesson}
        exercises={exercises ?? []}
        studentId={student.id}
        initialProgress={progress ?? null}
        attemptedSet={Array.from(attemptedSet)}
      />
    </div>
  )
}
