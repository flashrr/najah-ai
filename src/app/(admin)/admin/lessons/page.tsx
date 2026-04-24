import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminLessonsClient from './AdminLessonsClient'

export default async function AdminLessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — layout already verified admin role; service client
  // ensures curriculum queries are not blocked by student-scoped RLS policies.
  const db = createServiceClient()

  const [
    { data: lessons },
    { data: subjects },
    { data: weeks   },
  ] = await Promise.all([
    db
      .from('lessons')
      .select('*, subject:subjects(name, icon, color), week:weeks(week_number, title)')
      .order('order_index'),
    db.from('subjects').select('*'),
    db.from('weeks').select('*').order('week_number'),
  ])

  return (
    <AdminLessonsClient
      lessons={lessons ?? []}
      subjects={subjects ?? []}
      weeks={weeks ?? []}
    />
  )
}
