import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/DashboardLayout'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — auth already verified above; regular server client does
  // not reliably propagate session to RLS in server components (setAll silent failure).
  // Redirect to '/' not '/login' — middleware Rule B would loop us back here.
  const admin = createServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'parent') redirect('/')

  return (
    <DashboardLayout role="parent" userName={profile.full_name}>
      {children}
    </DashboardLayout>
  )
}
