import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { markAllRead } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifRow = {
  id:         string
  type:       'reminder' | 'achievement' | 'report' | 'system'
  title:      string
  body:       string
  read:       boolean
  action_url: string | null
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeIcon(type: NotifRow['type']): string {
  switch (type) {
    case 'reminder':    return '📅'
    case 'achievement': return '🏆'
    case 'report':      return '📊'
    case 'system':      return '✨'
  }
}

function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days} days ago`
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service client — auth already verified above; bypasses RLS for reliable reads.
  const db = createServiceClient()

  const { data: student } = await db
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!student) redirect('/')

  // Fetch all notifications, unread first then newest
  const { data: rows, error } = await db
    .from('notifications')
    .select('id, type, title, body, read, action_url, created_at')
    .eq('student_id', student.id)
    .order('read',       { ascending: true  })   // unread first
    .order('created_at', { ascending: false })   // newest within each group
    .limit(50)

  const notifications = (rows ?? []) as NotifRow[]
  const unreadCount   = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications 🔔</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You\'re all caught up'}
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllRead.bind(null, student.id)}>
            <button
              type="submit"
              className="btn-secondary text-sm"
            >
              ✓ Mark all read
            </button>
          </form>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="card border border-red-200 bg-red-50 text-sm text-red-700 text-center py-4">
          Could not load notifications. Please refresh the page.
        </div>
      )}

      {/* Empty state */}
      {!error && notifications.length === 0 && (
        <div className="card text-center py-14 space-y-3">
          <div className="text-4xl">🔕</div>
          <p className="font-semibold text-gray-600">No notifications yet</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Reminders about your sessions, streaks, and study plan will appear here.
          </p>
          <Link href="/student/dashboard" className="btn-primary inline-block text-sm mt-2">
            Go to dashboard
          </Link>
        </div>
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n: NotifRow) => (
            <NotifCard key={n.id} notif={n} />
          ))}
        </div>
      )}

      {/* Footer hint */}
      {notifications.length >= 50 && (
        <p className="text-xs text-gray-400 text-center">
          Showing the 50 most recent notifications.
        </p>
      )}

    </div>
  )
}

// ── Notification card ─────────────────────────────────────────────────────────
// Rendered as a server component — no client JS needed.
// If the notification has an action_url, it wraps in a Link.
// Read state is shown visually; "mark as read" happens via "Mark all read" button.

function NotifCard({ notif }: { notif: NotifRow }) {
  const inner = (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${
        notif.read
          ? 'bg-white border-gray-100'
          : 'bg-brand-50 border-brand-200'
      }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5 ${
        notif.read ? 'bg-gray-100' : 'bg-brand-100'
      }`}>
        {typeIcon(notif.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
            {notif.title}
          </p>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {relativeTime(notif.created_at)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" aria-label="Unread" />
      )}
    </div>
  )

  // Wrap in Link if there's an action URL
  if (notif.action_url) {
    return (
      <Link href={notif.action_url} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    )
  }

  return inner
}
