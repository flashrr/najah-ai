import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminExercisesClient from './AdminExercisesClient'

export default async function AdminExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — layout already verified admin role; service client
  // ensures curriculum queries are not blocked by student-scoped RLS policies.
  const db = createServiceClient()

  const [{ data: exercises }, { data: rawLessons }] = await Promise.all([
    db
      .from('exercises')
      .select('*, lesson:lessons(title, subject:subjects(name, icon))')
      .order('order_index'),
    db
      .from('lessons')
      .select('id, title, subject:subjects(name, icon)')
      .order('order_index'),
  ])

  // Normalise Supabase join: subject comes back as array in TS types but is a single object at runtime
  const lessons = (rawLessons ?? []).map((l: { id: unknown; title: unknown; subject: unknown }) => ({
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
