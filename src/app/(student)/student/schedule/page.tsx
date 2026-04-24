import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import ScheduleEditor from './ScheduleEditor'
import type { TimeBlock } from '@/lib/types'

// Helper: PostgreSQL returns time as "HH:MM:SS" — normalise to "HH:MM"
function normTime(t: string): string {
  return t?.slice(0, 5) ?? '08:00'
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  const { data: student } = await db
    .from('students')
    .select('id, target_study_minutes')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (!student) redirect('/')

  // Load existing school timetable
  const { data: schoolRows, error: schoolErr } = await db
    .from('school_timetable')
    .select('id, day_of_week, start_time, end_time, label')
    .eq('student_id', student.id)
    .order('day_of_week', { ascending: true })
    .order('start_time',  { ascending: true })

  // Load existing free time slots
  const { data: freeRows, error: freeErr } = await db
    .from('free_time_slots')
    .select('id, day_of_week, start_time, end_time, label')
    .eq('student_id', student.id)
    .order('day_of_week', { ascending: true })
    .order('start_time',  { ascending: true })

  const dbError = schoolErr || freeErr

  type DBRow = { id: string; day_of_week: number; start_time: string; end_time: string; label: string | null }

  const schoolBlocks: TimeBlock[] = (schoolRows as DBRow[] ?? []).map(r => ({
    id:          r.id,
    day_of_week: r.day_of_week,
    start_time:  normTime(r.start_time),
    end_time:    normTime(r.end_time),
    label:       r.label ?? '',
  }))

  const freeSlots: TimeBlock[] = (freeRows as DBRow[] ?? []).map(r => ({
    id:          r.id,
    day_of_week: r.day_of_week,
    start_time:  normTime(r.start_time),
    end_time:    normTime(r.end_time),
    label:       r.label ?? '',
  }))

  return (
    <ScheduleEditor
      studentId={student.id}
      initialSchoolBlocks={schoolBlocks}
      initialFreeSlots={freeSlots}
      targetStudyMinutes={student.target_study_minutes ?? 45}
      loadError={dbError ? 'Could not load your schedule. Showing defaults.' : null}
    />
  )
}
