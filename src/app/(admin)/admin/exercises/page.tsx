import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminExercisesClient from './AdminExercisesClient'

export default async function AdminExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: exercises }, { data: rawLessons }] = await Promise.all([
    supabase
      .from('exercises')
      .select('*, lesson:lessons(title, subject:subjects(name, icon))')
      .order('order_index'),
    supabase
      .from('lessons')
      .select('id, title, subject:subjects(name, icon)')
      .order('order_index'),
  ])

  // Normalise Supabase join: subject comes back as array in TS types but is a single object at runtime
  const lessons = (rawLessons ?? []).map(l => ({
    id:      l.id as string,
    title:   l.title as string,
    subject: (Array.isArray(l.subject) ? l.subject[0] : l.subject) as
      { name: string; icon: string } | undefined,
  }))

  return (
    <AdminExercisesClient
      exercises={exercises ?? []}
      lessons={lessons}
    />
  )
}
