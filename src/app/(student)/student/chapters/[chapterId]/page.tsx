import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ChapterView from './ChapterView'

interface RawChapter {
  id:          string
  title:       string
  description: string | null
  grade:       string
  subject:     { name: string; icon: string } | null
}

interface RawLesson {
  id:                string
  title:             string
  difficulty:        string
  estimated_minutes: number
  order_index:       number
}

interface RawProgress {
  lesson_id: string
  status:    string
}

interface RawAssessment {
  type:            string
  score:           number | null
  correct_count:   number | null
  total_questions: number | null
  completed_at:    string
}

interface RawExercise {
  id:             string
  lesson_id:      string
  question:       string
  type:           string
  options:        string[] | null
  correct_answer: string
  explanation:    string | null
  skill_tag:      string | null
}

export default async function ChapterPage({
  params,
}: {
  params: { chapterId: string }
}) {
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

  /* Chapter */
  const { data: chapter } = await admin
    .from('chapters')
    .select('id, title, description, grade, subject:subjects(name, icon)')
    .eq('id', params.chapterId)
    .maybeSingle() as { data: RawChapter | null }

  if (!chapter) notFound()

  /* Lessons in chapter */
  const { data: lessons } = await admin
    .from('lessons')
    .select('id, title, difficulty, estimated_minutes, order_index')
    .eq('chapter_id', params.chapterId)
    .order('order_index') as { data: RawLesson[] | null }

  const lessonIds = (lessons ?? []).map(l => l.id)

  /* Lesson progress */
  const { data: progressRows } = lessonIds.length
    ? await admin
        .from('lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', student.id)
        .in('lesson_id', lessonIds) as { data: RawProgress[] | null }
    : { data: [] as RawProgress[] }

  /* Chapter assessments */
  const { data: assessments } = await admin
    .from('chapter_assessments')
    .select('type, score, correct_count, total_questions, completed_at')
    .eq('student_id', student.id)
    .eq('chapter_id', params.chapterId) as { data: RawAssessment[] | null }

  /* Quiz-phase exercises for assessment flow (one per lesson, ordered) */
  const { data: quizExercises } = lessonIds.length
    ? await admin
        .from('exercises')
        .select('id, lesson_id, question, type, options, correct_answer, explanation, skill_tag')
        .in('lesson_id', lessonIds)
        .eq('phase', 'quiz')
        .order('order_index') as { data: RawExercise[] | null }
    : { data: [] as RawExercise[] }

  return (
    <ChapterView
      chapterId={params.chapterId}
      studentId={student.id}
      chapter={chapter}
      lessons={lessons ?? []}
      progressRows={progressRows ?? []}
      assessments={assessments ?? []}
      quizExercises={quizExercises ?? []}
    />
  )
}
