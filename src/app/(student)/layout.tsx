import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/DashboardLayout'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/login')

  // Fire-and-forget streak update on every student page visit
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (student) {
    // Fire-and-forget — void to silence unhandled-promise warning
    void supabase.rpc('update_streak', { p_student_id: student.id })
  }

  return (
    <DashboardLayout role="student" userName={profile.full_name}>
      {children}
    </DashboardLayout>
  )
}
