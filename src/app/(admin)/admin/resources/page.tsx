import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminResourcesClient from './AdminResourcesClient'

export default async function AdminResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  const [
    { data: resources },
    { data: subjects  },
    { data: lessons   },
  ] = await Promise.all([
    db
      .from('lesson_resources')
      .select('*, subject:subjects(name, icon), lesson:lessons(title)')
      .order('subject_id')
      .order('order_index'),
    db.from('subjects').select('id, name, icon, slug').order('name'),
    db.from('lessons').select('id, title, subject_id').order('title'),
  ])

  return (
    <AdminResourcesClient
      resources={resources ?? []}
      subjects={subjects ?? []}
      lessons={lessons ?? []}
    />
  )
}
