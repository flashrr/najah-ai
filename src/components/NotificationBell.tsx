'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface NotificationBellProps {
  studentId: string
}

export default function NotificationBell({ studentId }: NotificationBellProps) {
  const [unread, setUnread]   = useState(0)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchCount() {
      try {
        const supabase = createClient()
        // The notifications SELECT RLS policy allows students to read their own rows.
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .eq('read', false)

        if (!cancelled) {
          setUnread(count ?? 0)
          setLoaded(true)
        }
      } catch {
        // Silently fail — bell is informational only
        if (!cancelled) setLoaded(true)
      }
    }

    fetchCount()
    return () => { cancelled = true }
  }, [studentId])

  // Don't show anything until loaded — avoids badge flicker on mount
  if (!loaded) return null

  return (
    <Link
      href="/student/notifications"
      className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
    >
      <span className="text-xl leading-none select-none">🔔</span>
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
          aria-hidden="true"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
