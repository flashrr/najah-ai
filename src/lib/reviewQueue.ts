/**
 * Review Queue — spaced repetition timing logic (V1)
 *
 * Rules:
 *   mastery score < 50  → review in 1 day  (weak)
 *   mastery score 50-74 → review in 3 days (medium)
 *   mastery score ≥ 75  → review in 7 days (good)
 *   no mastery data     → review in 3 days (unknown → medium default)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ReviewItem {
  lessonId:         string
  lessonTitle:      string
  subjectName:      string
  subjectIcon:      string
  estimatedMinutes: number
  completedAt:      string   // ISO timestamp
  dueDate:          string   // YYYY-MM-DD
  masteryScore:     number | null
  skillTag:         string | null
  reviewDays:       number   // 1 | 3 | 7
  isOverdue:        boolean  // dueDate < today
  isDueToday:       boolean  // dueDate === today
}

export function reviewDaysForScore(score: number | null): number {
  if (score === null)  return 3
  if (score < 50)      return 1
  if (score < 75)      return 3
  return 7
}

export function reviewLabel(days: number): string {
  if (days === 1) return '⚠️ Weak — review soon'
  if (days === 3) return '📝 Medium — review in a few days'
  return '✅ Good — review in a week'
}

export async function computeReviewQueue(
  admin: SupabaseClient,
  studentId: string,
): Promise<ReviewItem[]> {
  // 1. Completed lessons with completion timestamp
  type ProgressRow = { lesson_id: string; completed_at: string }
  const { data: progressRows } = await admin
    .from('lesson_progress')
    .select('lesson_id, completed_at')
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null) as { data: ProgressRow[] | null }

  if (!progressRows?.length) return []

  const lessonIds = progressRows.map(p => p.lesson_id)

  // 2. Lessons with subject info
  type LessonRow = {
    id: string
    title: string
    estimated_minutes: number
    subject: { name: string; icon: string } | null
  }
  const { data: lessonRows } = await admin
    .from('lessons')
    .select('id, title, estimated_minutes, subject:subjects(name, icon)')
    .in('id', lessonIds) as { data: LessonRow[] | null }

  const lessonMap: Record<string, LessonRow> = {}
  for (const l of lessonRows ?? []) lessonMap[l.id] = l

  // 3. Primary skill_tag per lesson (lowest order_index exercise with a tag)
  type ExRow = { lesson_id: string; skill_tag: string; order_index: number }
  const { data: exerciseRows } = await admin
    .from('exercises')
    .select('lesson_id, skill_tag, order_index')
    .in('lesson_id', lessonIds)
    .not('skill_tag', 'is', null)
    .order('order_index', { ascending: true }) as { data: ExRow[] | null }

  const lessonSkillMap: Record<string, string> = {}
  for (const e of exerciseRows ?? []) {
    if (e.skill_tag && !lessonSkillMap[e.lesson_id]) {
      lessonSkillMap[e.lesson_id] = e.skill_tag
    }
  }

  // 4. Skill mastery scores for relevant tags
  const skillTags = Array.from(new Set(Object.values(lessonSkillMap)))
  const masteryMap: Record<string, number> = {}
  if (skillTags.length) {
    type MasteryRow = { skill_tag: string; score: number }
    const { data: masteryRows } = await admin
      .from('skill_mastery')
      .select('skill_tag, score')
      .eq('student_id', studentId)
      .in('skill_tag', skillTags) as { data: MasteryRow[] | null }

    for (const m of masteryRows ?? []) masteryMap[m.skill_tag] = m.score
  }

  // 5. Compute due dates
  const todayStr = new Date().toISOString().split('T')[0]

  const items: ReviewItem[] = []
  for (const p of progressRows) {
    const lesson = lessonMap[p.lesson_id]
    if (!lesson || !p.completed_at) continue

    const skillTag    = lessonSkillMap[p.lesson_id] ?? null
    const masteryScore = skillTag ? (masteryMap[skillTag] ?? null) : null
    const reviewDays   = reviewDaysForScore(masteryScore)

    const completed = new Date(p.completed_at)
    const due       = new Date(Date.UTC(
      completed.getUTCFullYear(),
      completed.getUTCMonth(),
      completed.getUTCDate() + reviewDays,
    ))
    const dueDate   = due.toISOString().split('T')[0]

    items.push({
      lessonId:         p.lesson_id,
      lessonTitle:      lesson.title,
      subjectName:      lesson.subject?.name ?? '',
      subjectIcon:      lesson.subject?.icon ?? '📚',
      estimatedMinutes: lesson.estimated_minutes,
      completedAt:      p.completed_at,
      dueDate,
      masteryScore,
      skillTag,
      reviewDays,
      isOverdue:   dueDate < todayStr,
      isDueToday:  dueDate === todayStr,
    })
  }

  // Sort: overdue first → today → future; within group by due date ASC
  items.sort((a, b) => {
    const urgA = a.isOverdue ? 0 : a.isDueToday ? 1 : 2
    const urgB = b.isOverdue ? 0 : b.isDueToday ? 1 : 2
    if (urgA !== urgB) return urgA - urgB
    return a.dueDate.localeCompare(b.dueDate)
  })

  return items
}
