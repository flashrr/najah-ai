'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { insertPlanReadyNotification } from '@/lib/notifications'

// ── Shared auth helper ────────────────────────────────────────────────────────
// Returns the authenticated user's student.id, or null if not authorised.
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

// ── Verify session ownership, return full session row or null ─────────────────
type OwnedSession = {
  id:              string
  lesson_id:       string | null
  subject_id:      string | null
  duration_minutes: number
  status:          string
}

async function getOwnedSession(
  sessionId: string,
  studentId: string,
): Promise<OwnedSession | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('weekly_plan_sessions')
    .select('id, lesson_id, subject_id, duration_minutes, status')
    .eq('id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle()
  return data as OwnedSession | null
}

// ── Adaptive planner constants ────────────────────────────────────────────────
// Weight formula: max(WEIGHT_FLOOR, WEIGHT_MAX - score * WEIGHT_SLOPE)
// Ensures strong subjects still receive maintenance sessions.
const WEIGHT_MAX   = 85   // maximum weight (score = 0)
const WEIGHT_SLOPE = 0.7  // how steeply weight drops as score improves
const WEIGHT_FLOOR = 15   // minimum weight — strong subjects still appear
const UNDIAG_WEIGHT = 55  // weight for undiagnosed subjects (moderate priority)
const MAX_PER_SUBJECT = 3 // max sessions per subject per week (avoid monotony)
const MAX_PER_DAY   = 2   // cognitive load cap per day

function scoreToWeight(score: number): number {
  return Math.max(WEIGHT_FLOOR, Math.round(WEIGHT_MAX - score * WEIGHT_SLOPE))
}

// ── Generate personalised weekly plan ────────────────────────────────────────
export async function generateWeeklyPlan(
  studentId: string,
): Promise<{ error?: string }> {
  const authStudentId = await getAuthStudentId()
  if (!authStudentId || authStudentId !== studentId) {
    return { error: 'Unauthorised.' }
  }

  const db = createServiceClient()

  // ── 1. Diagnostic scores — most-recent per subject ────────────────────────
  const { data: diagnostics } = await db
    .from('diagnostic_results')
    .select('subject_id, score')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  type DiagRow = { subject_id: string; score: number }
  // Deduplicate — keep most-recent per subject
  const diagMap: Record<string, number> = {}
  for (const r of (diagnostics ?? []) as DiagRow[]) {
    if (!(r.subject_id in diagMap)) diagMap[r.subject_id] = r.score
  }

  // ── 2. Skill-level signals ────────────────────────────────────────────────

  // 2a. Subject-level average from student_weak_skills (drives slot allocation weight)
  const { data: skillRows } = await db
    .from('student_weak_skills')
    .select('subject_id, mastery_pct')
    .eq('student_id', studentId)

  type SkillRow = { subject_id: string | null; mastery_pct: number }
  const skillSumMap: Record<string, { sum: number; count: number }> = {}
  for (const r of (skillRows ?? []) as SkillRow[]) {
    if (!r.subject_id) continue
    if (!skillSumMap[r.subject_id]) skillSumMap[r.subject_id] = { sum: 0, count: 0 }
    skillSumMap[r.subject_id].sum   += r.mastery_pct
    skillSumMap[r.subject_id].count += 1
  }
  const skillAvgMap: Record<string, number> = {}
  for (const [sid, { sum, count }] of Object.entries(skillSumMap)) {
    skillAvgMap[sid] = Math.round(sum / count)
  }

  // 2b. Lesson-level skill mastery scores — used to rank lessons within a subject.
  //     Lower score = more urgent to practice = higher selection priority.
  const { data: masteryRows } = await db
    .from('skill_mastery')
    .select('skill_tag, score')
    .eq('student_id', studentId)
  type MasteryRow = { skill_tag: string; score: number }
  const masteryScoreMap: Record<string, number> = {}
  for (const r of (masteryRows ?? []) as MasteryRow[]) {
    masteryScoreMap[r.skill_tag] = r.score
  }

  // 2c. Primary skill_tag per lesson (first tagged exercise by order_index).
  //     Lets us look up each lesson's mastery score directly.
  const { data: lessonSkillRows } = await db
    .from('exercises')
    .select('lesson_id, skill_tag')
    .not('skill_tag', 'is', null)
    .order('order_index', { ascending: true })
  type LessonSkillRow = { lesson_id: string; skill_tag: string | null }
  const lessonPrimarySkill: Record<string, string> = {}
  for (const r of (lessonSkillRows ?? []) as LessonSkillRow[]) {
    if (r.skill_tag && !lessonPrimarySkill[r.lesson_id]) {
      lessonPrimarySkill[r.lesson_id] = r.skill_tag
    }
  }

  // 2d. In-progress lessons — should always be scheduled before unstarted ones.
  const { data: inProgressRows } = await db
    .from('lesson_progress')
    .select('lesson_id')
    .eq('student_id', studentId)
    .eq('status', 'in_progress')
  const inProgressIds = new Set(
    ((inProgressRows ?? []) as { lesson_id: string }[]).map(p => p.lesson_id),
  )

  // ── 3. All subjects ───────────────────────────────────────────────────────
  const { data: subjectRows } = await db.from('subjects').select('id')
  const allSubjectIds = ((subjectRows ?? []) as { id: string }[]).map(s => s.id)

  // ── 4. Completed lessons (skip these) ────────────────────────────────────
  const { data: done } = await db
    .from('lesson_progress')
    .select('lesson_id')
    .eq('student_id', studentId)
    .eq('status', 'completed')
  const completedIds = new Set(((done ?? []) as { lesson_id: string }[]).map(p => p.lesson_id))

  // ── 5. Available lessons grouped by subject ───────────────────────────────
  const { data: allLessons } = await db
    .from('lessons')
    .select('id, subject_id, estimated_minutes, order_index, week:weeks(week_number)')
    .order('order_index', { ascending: true })

  type LessonRow = {
    id:                string
    subject_id:        string
    estimated_minutes: number | null
    order_index:       number | null
    week:              { week_number: number } | null
  }
  const available = ((allLessons ?? []) as LessonRow[]).filter(l => !completedIds.has(l.id))

  // Group available lessons by subject_id, preserving order_index order
  const lessonsBySubject: Record<string, LessonRow[]> = {}
  for (const l of available) {
    if (!lessonsBySubject[l.subject_id]) lessonsBySubject[l.subject_id] = []
    lessonsBySubject[l.subject_id].push(l)
  }

  if (available.length === 0) {
    return { error: 'No lessons available to schedule yet. Check back soon!' }
  }

  // ── 6. Free time slots + preferred duration ───────────────────────────────
  const { data: freeSlotRows } = await db
    .from('free_time_slots')
    .select('day_of_week, start_time')
    .eq('student_id', studentId)
    .order('day_of_week', { ascending: true })
    .order('start_time',  { ascending: true })

  type FreeSlotRow = { day_of_week: number; start_time: string }
  const freeSlotsByDay: Record<number, string[]> = {}
  for (const row of (freeSlotRows ?? []) as FreeSlotRow[]) {
    const d = row.day_of_week
    if (!freeSlotsByDay[d]) freeSlotsByDay[d] = []
    freeSlotsByDay[d].push(row.start_time.slice(0, 5))
  }
  const hasFreeSlots = (freeSlotRows ?? []).length > 0
  const FALLBACK_TIMES = ['09:00', '15:00']

  const { data: studentPrefs } = await db
    .from('students')
    .select('target_study_minutes')
    .eq('id', studentId)
    .maybeSingle()
  const defaultDuration = (studentPrefs as { target_study_minutes?: number } | null)?.target_study_minutes ?? 30

  // ── 7. Calculate total slot capacity for the week (Mon–Fri) ──────────────
  // day loop index 0=Mon … 4=Fri → day_of_week 1…5
  const slotCapacityPerDay: string[][] = []
  for (let day = 0; day < 5; day++) {
    const dayOfWeek = day + 1
    const times: string[] = hasFreeSlots
      ? (freeSlotsByDay[dayOfWeek] ?? []).slice(0, MAX_PER_DAY)
      : FALLBACK_TIMES
    // If student configured free slots but has none on this day, it's a free day off
    if (hasFreeSlots && times.length === 0) {
      slotCapacityPerDay.push([])
    } else {
      slotCapacityPerDay.push(times)
    }
  }
  const totalCapacity = slotCapacityPerDay.reduce((sum, slots) => sum + slots.length, 0)

  if (totalCapacity === 0) {
    return { error: 'No study windows available this week. Add free time slots in your schedule.' }
  }

  // ── 8. Compute subject weights and allocate sessions ──────────────────────
  //
  // Weight formula: strong subjects get WEIGHT_FLOOR (15%) — not zero.
  // This ensures maintenance sessions for mastered content.
  // Skill-level average provides a secondary signal when diagnostic exists.

  type SubjectAlloc = {
    subjectId: string
    weight:    number
    diagScore: number | null
    lessons:   LessonRow[]
    allocated: number
  }

  // Only include subjects that have available lessons
  const subjectsWithLessons = allSubjectIds.filter(id => (lessonsBySubject[id]?.length ?? 0) > 0)

  const allocations: SubjectAlloc[] = subjectsWithLessons.map(subjectId => {
    const diagScore = diagMap[subjectId] ?? null
    const skillAvg  = skillAvgMap[subjectId] ?? null

    // Blend diagnostic score with skill average (if both available)
    let effectiveScore: number
    if (diagScore !== null && skillAvg !== null) {
      // 60% diagnostic, 40% skill average — skill data is more granular
      effectiveScore = Math.round(diagScore * 0.6 + skillAvg * 0.4)
    } else if (diagScore !== null) {
      effectiveScore = diagScore
    } else if (skillAvg !== null) {
      effectiveScore = skillAvg
    } else {
      // Truly undiagnosed — moderate priority
      effectiveScore = -1  // sentinel for undiagnosed
    }

    const weight = effectiveScore === -1 ? UNDIAG_WEIGHT : scoreToWeight(effectiveScore)

    return {
      subjectId,
      weight,
      diagScore,
      lessons:   lessonsBySubject[subjectId],
      allocated: 0,
    }
  })

  if (allocations.length === 0) {
    return { error: 'No lessons available to schedule yet. Check back soon!' }
  }

  // Proportional allocation — distribute totalCapacity across subjects
  const totalWeight = allocations.reduce((sum, a) => sum + a.weight, 0)

  for (const a of allocations) {
    const raw = (a.weight / totalWeight) * totalCapacity
    // Clamp: at least 1 (if the subject has lessons), at most MAX_PER_SUBJECT
    const capped = Math.min(MAX_PER_SUBJECT, Math.max(1, Math.round(raw)))
    // Also can't exceed available lessons for that subject
    a.allocated = Math.min(capped, a.lessons.length)
  }

  // Reconcile total to match capacity exactly
  // Sort by weight descending for trimming/padding decisions
  allocations.sort((a, b) => b.weight - a.weight)

  let currentTotal = allocations.reduce((sum, a) => sum + a.allocated, 0)

  // Trim: remove from highest-allocated, lowest-priority subjects first
  while (currentTotal > totalCapacity) {
    const trimTarget = [...allocations]
      .reverse()  // lowest weight first
      .find(a => a.allocated > 1)
    if (!trimTarget) break
    trimTarget.allocated--
    currentTotal--
  }

  // Pad: add to highest-priority subjects that still have room
  while (currentTotal < totalCapacity) {
    const padTarget = allocations.find(
      a => a.allocated < MAX_PER_SUBJECT && a.allocated < a.lessons.length
    )
    if (!padTarget) break
    padTarget.allocated++
    currentTotal++
  }

  // ── In-progress guarantee ─────────────────────────────────────────────────
  // If a subject has more started-but-unfinished lessons than its current
  // allocation, raise the count so ALL in-progress lessons get scheduled.
  // Then re-trim: cut from the lowest-priority subjects that have NO
  // in-progress lessons (they can be trimmed to 0 safely) before touching
  // any subject that has active work.
  for (const a of allocations) {
    const inProgCount = a.lessons.filter(l => inProgressIds.has(l.id)).length
    if (inProgCount > a.allocated) {
      a.allocated = Math.min(inProgCount, a.lessons.length)
    }
  }

  currentTotal = allocations.reduce((sum, a) => sum + a.allocated, 0)

  while (currentTotal > totalCapacity) {
    // Prefer cutting subjects with no in-progress lessons (safe to reach 0).
    // Only cut into in-progress subjects as a last resort.
    const trimTarget = [...allocations]
      .reverse()   // lowest weight first
      .find(a => {
        const inProg = a.lessons.filter(l => inProgressIds.has(l.id)).length
        // Can trim if current allocation is above its in-progress floor
        return a.allocated > inProg
      })
    if (!trimTarget) break
    trimTarget.allocated--
    currentTotal--
  }

  // ── 9. Select lesson sequence — round-robin interleaving ─────────────────
  //
  // Instead of block-scheduling (all Math → all Physics → …),
  // interleave subjects so each day has variety.
  // Round-robin: take 1 lesson from each subject in weight-descending order,
  // repeat until all allocated lessons are placed.
  //
  // Within each subject, lessons are now ranked by need:
  //   1. In-progress first (started but not finished — highest priority)
  //   2. Weakest skill mastery score (lowest score = most urgent to practice)
  //      — lessons with no mastery data yet score as 45 (needs exploration)
  //      — lessons with no skill_tag score as 100 (de-prioritised)
  //   3. Week number ascending (earlier curriculum content as final tiebreaker)
  //
  // This replaces the old behaviour of always picking the first N lessons by
  // DB insertion order, which systematically excluded later-week lessons.

  function lessonSortKey(l: LessonRow): [number, number, number] {
    // Priority 1: in-progress (0) before unstarted (1)
    const prog = inProgressIds.has(l.id) ? 0 : 1

    // Priority 2: skill mastery score (lower = needs more practice)
    const skillTag    = lessonPrimarySkill[l.id]
    const rawScore    = skillTag ? (masteryScoreMap[skillTag] ?? -1) : null
    // -1  → skill exists on lesson but never practiced → moderate urgency (45)
    // null → no skill_tag on lesson → treat as already covered (100)
    const skillScore  = rawScore === null ? 100 : rawScore === -1 ? 45 : rawScore

    // Priority 3: week order (earlier week = slightly preferred as tiebreaker)
    const weekNum     = l.week?.week_number ?? 99

    return [prog, skillScore, weekNum]
  }

  // Build per-subject lesson queues, sorted by need rather than DB order
  const lessonQueues: LessonRow[][] = allocations
    .filter(a => a.allocated > 0)
    .map(a => {
      const sorted = [...a.lessons].sort((la, lb) => {
        const [aP, aS, aW] = lessonSortKey(la)
        const [bP, bS, bW] = lessonSortKey(lb)
        if (aP !== bP) return aP - bP
        if (aS !== bS) return aS - bS
        return aW - bW
      })
      return sorted.slice(0, a.allocated)
    })

  const interleaved: LessonRow[] = []
  const remaining    = lessonQueues.map(q => [...q])  // copy for mutation
  let   madeProgress = true

  while (madeProgress) {
    madeProgress = false
    for (const queue of remaining) {
      if (queue.length > 0) {
        interleaved.push(queue.shift()!)
        madeProgress = true
      }
    }
  }

  // ── 10. Monday anchor ────────────────────────────────────────────────────
  const now    = new Date()
  const dow    = now.getUTCDay()
  const toMon  = dow === 0 ? -6 : -(dow - 1)
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toMon))

  const planLabel = `Week of ${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`
  const weekStart = monday.toISOString().split('T')[0]
  const sunday    = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6))
  const weekEnd   = sunday.toISOString().split('T')[0]

  // ── 11. Archive any existing active plan this week ────────────────────────
  await db
    .from('weekly_plans')
    .update({ status: 'archived' })
    .eq('student_id', studentId)
    .eq('status', 'active')
    .gte('generated_at', weekStart + 'T00:00:00')
    .lte('generated_at', weekEnd   + 'T23:59:59')

  // ── 12. Create new plan row ───────────────────────────────────────────────
  const { data: plan, error: planErr } = await db
    .from('weekly_plans')
    .insert({ student_id: studentId, title: planLabel, status: 'active' })
    .select('id')
    .single()

  if (planErr || !plan) {
    console.error('[generateWeeklyPlan] plan insert error:', planErr)
    return { error: 'Failed to create your plan. Please try again.' }
  }

  // ── 13. Assign interleaved lessons to day/time slots ─────────────────────
  const sessionRows = []
  let   lessonIdx   = 0
  let   orderIdx    = 0

  for (let day = 0; day < 5 && lessonIdx < interleaved.length; day++) {
    const d       = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + day))
    const dateStr = d.toISOString().split('T')[0]
    const timesForDay = slotCapacityPerDay[day]

    if (timesForDay.length === 0) continue  // student has no free slots this day

    for (let slot = 0; slot < timesForDay.length && lessonIdx < interleaved.length; slot++) {
      const lesson = interleaved[lessonIdx++]
      sessionRows.push({
        plan_id:          plan.id,
        student_id:       studentId,
        lesson_id:        lesson.id,
        subject_id:       lesson.subject_id,
        scheduled_date:   dateStr,
        scheduled_time:   timesForDay[slot],
        duration_minutes: lesson.estimated_minutes ?? defaultDuration,
        status:           'pending',
        order_index:      orderIdx++,
      })
    }
  }

  const { error: sessErr } = await db.from('weekly_plan_sessions').insert(sessionRows)

  if (sessErr) {
    console.error('[generateWeeklyPlan] sessions insert error:', sessErr)
    await db.from('weekly_plans').delete().eq('id', plan.id)
    return { error: 'Failed to schedule sessions. Please try again.' }
  }

  // Fire-and-forget: insert "plan ready" notification — don't block on errors
  void insertPlanReadyNotification(studentId, plan.id)

  revalidatePath('/student/weekly-plan')
  return {}
}

// ── startSession ──────────────────────────────────────────────────────────────
// Sets session to in_progress, inserts a session log, marks lesson as
// in_progress in lesson_progress (only if currently not_started).
export async function startSession(
  sessionId: string,
  studentId: string,
): Promise<{ error?: string }> {
  const authStudentId = await getAuthStudentId()
  if (!authStudentId || authStudentId !== studentId) return { error: 'Unauthorised.' }

  const session = await getOwnedSession(sessionId, studentId)
  if (!session) return { error: 'Session not found or access denied.' }

  const db  = createServiceClient()
  const now = new Date().toISOString()

  // 1. Mark plan session in_progress
  await db
    .from('weekly_plan_sessions')
    .update({ status: 'in_progress' })
    .eq('id', sessionId)

  // 2. Insert session log (started_at = now, ended_at = null)
  await db.from('student_session_logs').insert({
    student_id:      studentId,
    plan_session_id: sessionId,
    lesson_id:       session.lesson_id,
    subject_id:      session.subject_id,
    started_at:      now,
  })

  // 3. Upsert lesson_progress to in_progress (only if not already further along)
  if (session.lesson_id) {
    const { data: existing } = await db
      .from('lesson_progress')
      .select('status')
      .eq('student_id', studentId)
      .eq('lesson_id', session.lesson_id)
      .maybeSingle()

    if (!existing || existing.status === 'not_started') {
      await db.from('lesson_progress').upsert(
        { student_id: studentId, lesson_id: session.lesson_id, status: 'in_progress' },
        { onConflict: 'student_id,lesson_id' },
      )
    }
  }

  revalidatePath('/student/weekly-plan')
  revalidatePath('/student/dashboard')
  return {}
}

// ── completeSession ───────────────────────────────────────────────────────────
// Sets session to completed, closes the session log with duration, marks
// lesson_progress as completed (preserves any existing exercise score).
export async function completeSession(
  sessionId: string,
  studentId: string,
): Promise<{ error?: string }> {
  const authStudentId = await getAuthStudentId()
  if (!authStudentId || authStudentId !== studentId) return { error: 'Unauthorised.' }

  const session = await getOwnedSession(sessionId, studentId)
  if (!session) return { error: 'Session not found or access denied.' }

  const db  = createServiceClient()
  const now = new Date()

  // 1. Mark plan session completed
  await db
    .from('weekly_plan_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  // 2. Close the session log — find the most recent open log for this session
  const { data: openLog } = await db
    .from('student_session_logs')
    .select('id, started_at')
    .eq('plan_session_id', sessionId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openLog) {
    // Calculate actual duration in minutes
    const startedAt = new Date(openLog.started_at as string)
    const durationMin = Math.max(1, Math.round((now.getTime() - startedAt.getTime()) / 60_000))

    await db
      .from('student_session_logs')
      .update({ ended_at: now.toISOString(), duration_minutes: durationMin })
      .eq('id', openLog.id)
  } else {
    // No open log — student may have completed without clicking Start.
    // Create a closed log so execution data is still recorded.
    await db.from('student_session_logs').insert({
      student_id:       studentId,
      plan_session_id:  sessionId,
      lesson_id:        session.lesson_id,
      subject_id:       session.subject_id,
      started_at:       now.toISOString(),
      ended_at:         now.toISOString(),
      duration_minutes: session.duration_minutes ?? 30,
    })
  }

  // 3. Upsert lesson_progress → completed (only if not already completed,
  //    to preserve scores earned via lesson exercises)
  if (session.lesson_id) {
    const { data: existing } = await db
      .from('lesson_progress')
      .select('status')
      .eq('student_id', studentId)
      .eq('lesson_id', session.lesson_id)
      .maybeSingle()

    if (existing?.status !== 'completed') {
      await db.from('lesson_progress').upsert(
        {
          student_id:   studentId,
          lesson_id:    session.lesson_id,
          status:       'completed',
          completed_at: now.toISOString(),
          score:        null,
        },
        { onConflict: 'student_id,lesson_id' },
      )
    }
  }

  revalidatePath('/student/weekly-plan')
  revalidatePath('/student/dashboard')
  return {}
}

// ── missSession ───────────────────────────────────────────────────────────────
// Marks a session as skipped. No session log — we only track executed time.
export async function missSession(
  sessionId: string,
  studentId: string,
): Promise<{ error?: string }> {
  const authStudentId = await getAuthStudentId()
  if (!authStudentId || authStudentId !== studentId) return { error: 'Unauthorised.' }

  const session = await getOwnedSession(sessionId, studentId)
  if (!session) return { error: 'Session not found or access denied.' }

  const db = createServiceClient()

  await db
    .from('weekly_plan_sessions')
    .update({ status: 'skipped' })
    .eq('id', sessionId)

  revalidatePath('/student/weekly-plan')
  return {}
}
