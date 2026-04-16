import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: studentCount },
    { count: lessonCount  },
    { count: exerciseCount},
    { count: attemptCount },
    { data: recentStudents},
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*',  { count: 'exact', head: true }),
    supabase.from('exercises').select('*',{ count: 'exact', head: true }),
    supabase.from('attempts').select('*', { count: 'exact', head: true }),
    supabase
      .from('students')
      .select('id, created_at, profile:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { icon: '🧑‍🎓', label: 'Students',   value: studentCount  ?? 0, href: null           },
    { icon: '📚',    label: 'Lessons',    value: lessonCount   ?? 0, href: '/admin/lessons'   },
    { icon: '✏️',    label: 'Exercises',  value: exerciseCount ?? 0, href: '/admin/exercises' },
    { icon: '🎯',    label: 'Attempts',   value: attemptCount  ?? 0, href: null           },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard 🛠️</h1>
        <p className="text-sm text-gray-500 mt-1">Manage curriculum, monitor student activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`card text-center ${s.href ? 'hover:shadow-md transition-shadow' : ''}`}>
            {s.href ? (
              <Link href={s.href} className="block">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-brand-600">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </Link>
            ) : (
              <>
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-brand-600">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/admin/lessons"   className="card hover:shadow-md transition-shadow flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <div className="font-medium text-sm">Manage Lessons</div>
              <div className="text-xs text-gray-400">View, add, edit lessons</div>
            </div>
          </Link>
          <Link href="/admin/exercises" className="card hover:shadow-md transition-shadow flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <div className="font-medium text-sm">Manage Exercises</div>
              <div className="text-xs text-gray-400">Add & edit exercises</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent students */}
      <div className="card">
        <h2 className="font-semibold mb-3">Recent students</h2>
        {recentStudents && recentStudents.length > 0 ? (
          <div className="space-y-2">
            {recentStudents.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧑‍🎓</span>
                  <span>{(s.profile as unknown as { full_name: string })?.full_name ?? 'Unknown'}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No students yet.</p>
        )}
      </div>
    </div>
  )
}
