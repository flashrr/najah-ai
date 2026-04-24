'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// ── Shared auth guard ─────────────────────────────────────────────────────────
async function getAuthStudentId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = createServiceClient()
  const { data: stu } = await db
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()
  return stu?.id ?? null
}

// ── markAllRead ───────────────────────────────────────────────────────────────
// Marks every unread notification for this student as read.
// Returns void — used directly as a <form action>. Errors are server-logged only.
export async function markAllRead(studentId: string): Promise<void> {
  const authId = await getAuthStudentId()
  if (!authId || authId !== studentId) return

  const db = createServiceClient()
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('student_id', studentId)
    .eq('read', false)

  if (error) {
    console.error('[markAllRead] error:', error.message)
    return
  }

  revalidatePath('/student/notifications')
}

// ── markOneRead ───────────────────────────────────────────────────────────────
// Marks a single notification as read (used when navigating from a notification).
export async function markOneRead(
  notifId:   string,
  studentId: string,
): Promise<{ error?: string }> {
  const authId = await getAuthStudentId()
  if (!authId || authId !== studentId) return { error: 'Unauthorised.' }

  const db = createServiceClient()
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('id', notifId)
    .eq('student_id', studentId) // ownership check

  if (error) return { error: error.message }

  revalidatePath('/student/notifications')
  return {}
}
