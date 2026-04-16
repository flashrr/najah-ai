import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLessonsClient from './AdminLessonsClient'

export default async function AdminLessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: lessons },
    { data: subjects },
    { data: weeks   },
  ] = await Promise.all([
    supabase
      .from('lessons')
      .select('*, subject:subjects(name, icon, color), week:weeks(week_number, title)')
      .order('order_index'),
    supabase.from('subjects').select('*'),
    supabase.from('weeks').select('*').order('week_number'),
  ])

  return (
    <AdminLessonsClient
      lessons={lessons ?? []}
      subjects={subjects ?? []}
      weeks={weeks ?? []}
    />
  )
}
