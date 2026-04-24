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

// ── Types ─────────────────────────────────────────────────────────────────────

export type TimeBlockInput = {
  day_of_week: number   // 0=Sun, 1=Mon … 6=Sat
  start_time:  string   // HH:MM
  end_time:    string   // HH:MM
  label:       string | null
}

export type SchedulePayload = {
  schoolBlocks:       TimeBlockInput[]
  freeSlots:          TimeBlockInput[]
  targetStudyMinutes: number
}

// ── saveSchedule ──────────────────────────────────────────────────────────────
// Replaces the student's entire school_timetable and free_time_slots, then
// updates target_study_minutes. Uses delete-then-insert (safe since both tables
// are keyed by student_id and have no FK dependants).
export async function saveSchedule(
  studentId: string,
  payload:   SchedulePayload,
): Promise<{ error?: string }> {
  const authId = await getAuthStudentId()
  if (!authId || authId !== studentId) return { error: 'Unauthorised.' }

  const db = createServiceClient()

  // ── 1. Replace school timetable ───────────────────────────────────────────
  const { error: delSchool } = await db
    .from('school_timetable')
    .delete()
    .eq('student_id', studentId)
  if (delSchool) {
    console.error('[saveSchedule] school_timetable delete error:', delSchool.message)
    return { error: 'Failed to update school timetable. Please try again.' }
  }

  if (payload.schoolBlocks.length > 0) {
    const { error: insSchool } = await db.from('school_timetable').insert(
      payload.schoolBlocks.map(b => ({
        student_id:  studentId,
        day_of_week: b.day_of_week,
        start_time:  b.start_time,
        end_time:    b.end_time,
        label:       b.label ?? null,
      })),
    )
    if (insSchool) {
      console.error('[saveSchedule] school_timetable insert error:', insSchool.message)
      return { error: 'Failed to save school timetable. Please try again.' }
    }
  }

  // ── 2. Replace free time slots ────────────────────────────────────────────
  const { error: delFree } = await db
    .from('free_time_slots')
    .delete()
    .eq('student_id', studentId)
  if (delFree) {
    console.error('[saveSchedule] free_time_slots delete error:', delFree.message)
    return { error: 'Failed to update free time slots. Please try again.' }
  }

  if (payload.freeSlots.length > 0) {
    const { error: insFree } = await db.from('free_time_slots').insert(
      payload.freeSlots.map(s => ({
        student_id:  studentId,
        day_of_week: s.day_of_week,
        start_time:  s.start_time,
        end_time:    s.end_time,
        label:       s.label ?? null,
      })),
    )
    if (insFree) {
      console.error('[saveSchedule] free_time_slots insert error:', insFree.message)
      return { error: 'Failed to save free time slots. Please try again.' }
    }
  }

  // ── 3. Update student preferences ────────────────────────────────────────
  const clamped = Math.min(120, Math.max(15, payload.targetStudyMinutes))
  const { error: updPrefs } = await db
    .from('students')
    .update({ target_study_minutes: clamped })
    .eq('id', studentId)
  if (updPrefs) {
    // Non-fatal — schedule blocks saved; just log the preference error
    console.error('[saveSchedule] student preferences update error:', updPrefs.message)
  }

  revalidatePath('/student/schedule')
  revalidatePath('/student/weekly-plan')
  return {}
}
