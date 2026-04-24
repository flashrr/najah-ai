/**
 * Notification generation utilities — server-side only.
 * All writes use the service client (bypasses RLS).
 * Reads from the browser use the regular client (student SELECT policy applies).
 *
 * Dedup strategy:
 *   - Daily reminders  (sessions today, missed): one per title per day
 *   - Achievements     (streak milestones):       one per title per 7 days
 *   - Plan ready:      one per plan ID (encoded in action_url)
 */

import { createServiceClient } from '@/lib/supabase/server'

type NotifType = 'reminder' | 'achievement' | 'report' | 'system'

type NotifRow = {
  student_id: string
  type:       NotifType
  title:      string
  body:       string
  action_url: string | null
  read:       boolean
}

// ── UTC helpers ───────────────────────────────────────────────────────────────

function utcDateStr(offsetDays = 0): string {
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays,
  )).toISOString().split('T')[0]
}

function mondayOfThisWeekUTC(): string {
  const now   = new Date()
  const dow   = now.getUTCDay()
  const toMon = dow === 0 ? -6 : -(dow - 1)
  return utcDateStr(toMon)
}

// ── Main generator (called on student dashboard page load) ────────────────────

export async function generateStudentNotifications(studentId: string): Promise<void> {
  const db      = createServiceClient()
  const today   = utcDateStr()
  const dayAgo7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch notifications already created today (for daily reminders)
  const { data: todaysNotifs } = await db
    .from('notifications')
    .select('title, type')
    .eq('student_id', studentId)
    .gte('created_at', today + 'T00:00:00')

  const todayTitles = new Set((todaysNotifs ?? []).map((n: { title: string }) => n.title))

  // Fetch recent achievements to avoid repeating milestones within 7 days
  const { data: recentAchievements } = await db
    .from('notifications')
    .select('title')
    .eq('student_id', studentId)
    .eq('type', 'achievement')
    .gte('created_at', dayAgo7)

  const recentAchievementTitles = new Set(
    (recentAchievements ?? []).map((n: { title: string }) => n.title),
  )

  const toInsert: NotifRow[] = []

  function addDaily(
    type: NotifType, title: string, body: string, action_url: string | null,
  ) {
    if (!todayTitles.has(title)) {
      toInsert.push({ student_id: studentId, type, title, body, action_url, read: false })
      todayTitles.add(title) // prevent same-batch duplicate
    }
  }

  function addAchievement(title: string, body: string, action_url: string | null) {
    if (!recentAchievementTitles.has(title) && !todayTitles.has(title)) {
      toInsert.push({ student_id: studentId, type: 'achievement', title, body, action_url, read: false })
      recentAchievementTitles.add(title)
      todayTitles.add(title)
    }
  }

  // ── 1. Sessions scheduled today (pending) ─────────────────────────────────
  const { data: todaySessions } = await db
    .from('weekly_plan_sessions')
    .select('id')
    .eq('student_id', studentId)
    .eq('scheduled_date', today)
    .eq('status', 'pending')

  const pendingCount = (todaySessions ?? []).length
  if (pendingCount > 0) {
    const title = pendingCount === 1
      ? '📅 1 study session scheduled today'
      : `📅 ${pendingCount} study sessions scheduled today`
    const body = pendingCount === 1
      ? 'You have a study session planned for today. Tap to start.'
      : `You have ${pendingCount} study sessions planned for today. Let's get started!`
    addDaily('reminder', title, body, '/student/weekly-plan')
  }

  // ── 2. Missed sessions this week (skipped, before today) ─────────────────
  const weekStart = mondayOfThisWeekUTC()
  const yesterday = utcDateStr(-1)

  // Only check if yesterday is within this week (i.e. don't fire on Monday for last week)
  if (yesterday >= weekStart) {
    const { data: missedSessions } = await db
      .from('weekly_plan_sessions')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'skipped')
      .gte('scheduled_date', weekStart)
      .lte('scheduled_date', yesterday)

    const missedCount = (missedSessions ?? []).length
    if (missedCount > 0) {
      const title = missedCount === 1
        ? '⚠️ 1 missed session this week'
        : `⚠️ ${missedCount} missed sessions this week`
      addDaily('reminder', title,
        `You missed ${missedCount} session${missedCount !== 1 ? 's' : ''} so far. Every session counts — tap to get back on track!`,
        '/student/weekly-plan',
      )
    }
  }

  // ── 3. Streak encouragement (milestone-based, max once per 7 days) ────────
  const { data: student } = await db
    .from('students')
    .select('streak_days')
    .eq('id', studentId)
    .maybeSingle()

  if (student?.streak_days) {
    const streak    = student.streak_days as number
    const MILESTONES = [3, 7, 14, 21, 30, 60, 100]
    const milestone  = [...MILESTONES].reverse().find(m => streak >= m)

    if (milestone) {
      const title = `🔥 ${streak}-day streak!`
      addAchievement(
        title,
        `You've studied ${streak} days in a row. Outstanding consistency — keep going!`,
        '/student/dashboard',
      )
    }
  }

  if (toInsert.length > 0) {
    await db.from('notifications').insert(toInsert)
  }
}

// ── Plan-ready notification (called from generateWeeklyPlan action) ───────────

export async function insertPlanReadyNotification(
  studentId: string,
  planId:    string,
): Promise<void> {
  const db = createServiceClient()

  // Dedup: check if we already sent a notification for this exact plan
  const { count } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('type', 'system')
    .eq('action_url', `/student/weekly-plan?plan=${planId}`)

  if ((count ?? 0) > 0) return // already sent

  await db.from('notifications').insert({
    student_id: studentId,
    type:       'system',
    title:      '✨ Your weekly plan is ready',
    body:       'Your personalised study plan has been generated. Tap to see your sessions for this week.',
    action_url: '/student/weekly-plan',
    read:       false,
  })
}
