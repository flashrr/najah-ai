/**
 * Student layout — auth + role guard with trigger-failure recovery.
 *
 * Uses service client for profile/student reads because the regular server
 * client's auth context is not reliably propagated to RLS in server components
 * (setAll silently fails → session not committed → DB queries run unauthenticated).
 * Service client bypasses RLS safely because auth is already verified via getUser().
 */

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/DashboardLayout'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // ── Auth check ──────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()

  // ── Profile check ────────────────────────────────────────────────
  let { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    // Trigger never fired — rebuild from JWT metadata
    const metaRole = (user.user_metadata?.role as string | undefined) ?? ''
    const metaName = (user.user_metadata?.full_name as string | undefined) ?? ''

    if (metaRole !== 'student') redirect('/login')

    let repaired: { role: string; full_name: string } | null = null
    try {
      const { data, error } = await admin
        .from('profiles')
        .insert({ id: user.id, role: metaRole, full_name: metaName })
        .select('role, full_name')
        .single()
      if (!error) repaired = data
    } catch { /* service client error */ }

    if (!repaired) redirect('/login')
    profile = repaired
  }

  if (profile.role !== 'student') redirect('/login')

  // ── Student row ──────────────────────────────────────────────────
  let { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!student) {
    try {
      const { data, error } = await admin
        .from('students')
        .insert({ profile_id: user.id })
        .select('id')
        .single()
      if (!error && data) student = data
    } catch { /* service client error */ }
  }

  // ── Streak — fire-and-forget ────────────────────────────────────
  if (student) {
    void supabase.rpc('update_streak', { p_student_id: student.id })
  }

  return (
    <DashboardLayout role="student" userName={profile.full_name} studentId={student?.id ?? null}>
      {children}
    </DashboardLayout>
  )
}
