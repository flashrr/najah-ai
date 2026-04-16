'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/lib/types'

const navItems: Record<Role, { href: string; icon: string; label: string }[]> = {
  student: [
    { href: '/student/dashboard',  icon: '🏠', label: 'Dashboard'    },
    { href: '/student/weekly-plan',icon: '📅', label: 'Weekly Plan'  },
    { href: '/student/diagnostic', icon: '🎯', label: 'Diagnostic'   },
    { href: '/student/tutor',      icon: '🤖', label: 'AI Tutor'     },
    { href: '/student/invite',     icon: '🔗', label: 'Invite'       },
  ],
  parent: [
    { href: '/parent/dashboard', icon: '🏠', label: 'Overview' },
  ],
  admin: [
    { href: '/admin/dashboard',  icon: '🏠', label: 'Dashboard' },
    { href: '/admin/lessons',    icon: '📚', label: 'Lessons'   },
    { href: '/admin/exercises',  icon: '✏️', label: 'Exercises' },
  ],
}

interface DashboardLayoutProps {
  children: React.ReactNode
  role: Role
  userName: string
}

export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const items = navItems[role]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleLabel = role === 'student' ? '🧑‍🎓' : role === 'parent' ? '👨‍👩‍👧' : '🛠️'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TOP NAV */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href={`/${role}/dashboard`} className="flex items-center gap-2 font-bold text-brand-700">
          <span>🎓</span>
          <span className="hidden sm:inline">Najah AI</span>
        </Link>

        {/* Desktop nav */}
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span>{roleLabel}</span>
            <span className="font-medium">{userName}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Sign out
          </button>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="text-lg">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex flex-col gap-1 z-20">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                pathname.startsWith(item.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
