'use client'

import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from '@/components/NotificationBell'
import type { Role } from '@/lib/types'

const navItems: Record<Role, { href: string; icon: string; label: string }[]> = {
  student: [
    { href: '/student/dashboard',  icon: '🏠', label: 'Dashboard'   },
    { href: '/student/weekly-plan',icon: '📅', label: 'Plan'        },
    { href: '/student/lessons',    icon: '📚', label: 'Lessons'     },
    { href: '/student/chapters',   icon: '🗂️', label: 'Chapters'    },
    { href: '/student/skills',     icon: '🧠', label: 'Skills'      },
    { href: '/student/diagnostic', icon: '🎯', label: 'Diagnostic'  },
    { href: '/student/schedule',   icon: '🗓️', label: 'Schedule'    },
    { href: '/student/tutor',      icon: '🤖', label: 'Tutor'       },
  ],
  parent: [
    { href: '/parent/dashboard',    icon: '🏠', label: 'Overview'    },
    { href: '/parent/link-student', icon: '🔗', label: 'Link Child'  },
  ],
  admin: [
    { href: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/admin/lessons',   icon: '📚', label: 'Lessons'   },
    { href: '/admin/exercises', icon: '✏️', label: 'Exercises' },
    { href: '/admin/resources', icon: '📹', label: 'Resources' },
    { href: '/admin/pilot',     icon: '🚀', label: 'Pilot'     },
  ],
}

interface DashboardLayoutProps {
  children:   React.ReactNode
  role:       Role
  userName:   string
  studentId?: string | null  // only for student role — powers the notification bell
}

export default function DashboardLayout({ children, role, userName, studentId }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const items    = navItems[role]
  const roleIcon = role === 'student' ? '🧑‍🎓' : role === 'parent' ? '👨‍👩‍👧' : '🛠️'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── TOP NAV ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">

        {/* Logo */}
        <Link href={`/${role}/dashboard`} className="flex items-center gap-2 font-bold text-brand-700">
          <span>🎓</span>
          <span className="hidden sm:inline">Najah AI</span>
        </Link>

        {/* Desktop nav — hidden on mobile since we use bottom nav there */}
        <nav className="hidden md:flex items-center gap-1">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right side: bell (student) + user + sign out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification bell — student only */}
          {role === 'student' && studentId && (
            <NotificationBell studentId={studentId} />
          )}

          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span>{roleIcon}</span>
            <span className="font-medium truncate max-w-[120px]">{userName}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      {/* has-bottom-nav adds bottom padding on mobile so content doesn't hide
          behind the fixed bottom nav bar. On desktop (md+) it adds no padding. */}
      {/* has-bottom-nav class adds bottom padding so content doesn't hide behind
          the fixed mobile bottom nav bar. On md+ the bottom nav is hidden so
          the extra padding doesn't matter — it reads as natural whitespace. */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 has-bottom-nav">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────────────── */}
      {/* Visible only on mobile (hidden md:flex). Replaces hamburger menu.
          Uses safe-area-pb to respect iPhone home indicator in standalone mode. */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex z-30 safe-area-pb">
        {items.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 text-[10px] font-medium transition-colors ${
                active ? 'text-brand-600' : 'text-gray-400'
              }`}
            >
              <span className={`text-2xl leading-none ${active ? 'drop-shadow-sm' : ''}`}>
                {item.icon}
              </span>
              <span className="truncate w-full text-center px-0.5">{item.label}</span>
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
