import { redirect }     from 'next/navigation'
import Link             from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { computeReviewQueue, reviewLabel } from '@/lib/reviewQueue'

function ScorePill({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
        No data
      </span>
    )
  }
  const cls =
    score >= 75 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100   text-red-700'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {score}%
    </span>
  )
}

function DueDateLabel({ dueDate, isOverdue, isDueToday }: {
  dueDate:    string
  isOverdue:  boolean
  isDueToday: boolean
}) {
  if (isOverdue) {
    return <span className="text-xs text-red-500 font-semibold">Overdue</span>
  }
  if (isDueToday) {
    return <span className="text-xs text-orange-500 font-semibold">Due today</span>
  }
  const d = new Date(dueDate + 'T00:00:00Z')
  return (
    <span className="text-xs text-gray-400">
      Due {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
    </span>
  )
}

export default async function ReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()

  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (!student) redirect('/')

  const items = await computeReviewQueue(admin, student.id)

  const todayStr  = new Date().toISOString().split('T')[0]
  const in7Days   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const dueNow    = items.filter(i => i.isOverdue || i.isDueToday)
  const upcoming  = items.filter(i => !i.isOverdue && !i.isDueToday && i.dueDate <= in7Days)
  const later     = items.filter(i => !i.isOverdue && !i.isDueToday && i.dueDate > in7Days)

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Review Queue 🔁</h1>
        <p className="text-sm text-gray-500 mt-1">
          Spaced repetition — revisit lessons at the right time to lock in mastery.
        </p>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="card text-center py-12 space-y-2">
          <p className="text-3xl">📚</p>
          <p className="font-medium text-gray-600">No lessons to review yet.</p>
          <p className="text-sm text-gray-400">
            Complete a lesson and it will appear here when it&apos;s time to revisit it.
          </p>
          <Link href="/student/weekly-plan" className="btn-primary inline-block mt-2">
            Start a lesson
          </Link>
        </div>
      )}

      {/* Due now (overdue + today) */}
      {dueNow.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-red-600 px-1 flex items-center gap-1.5">
            🔴 Due now
            <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {dueNow.length}
            </span>
          </h2>
          {dueNow.map(item => (
            <ReviewCard key={item.lessonId} item={item} />
          ))}
        </div>
      )}

      {/* Upcoming (next 7 days) */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-orange-500 px-1">
            🟡 Coming up this week
          </h2>
          {upcoming.map(item => (
            <ReviewCard key={item.lessonId} item={item} />
          ))}
        </div>
      )}

      {/* Later */}
      {later.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-gray-400 px-1">
            ⚪ Later
          </h2>
          {later.map(item => (
            <ReviewCard key={item.lessonId} item={item} />
          ))}
        </div>
      )}

      {/* Legend */}
      {items.length > 0 && (
        <div className="card bg-gray-50 border border-gray-100 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 mb-1">How review timing works</p>
          {[
            { days: 1, label: 'Weak skill (< 50%) — revisit in 1 day' },
            { days: 3, label: 'Medium skill (50-74%) — revisit in 3 days' },
            { days: 7, label: 'Strong skill (≥ 75%) — revisit in 7 days' },
          ].map(r => (
            <div key={r.days} className="flex items-center gap-2 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                r.days === 1 ? 'bg-red-400' : r.days === 3 ? 'bg-yellow-400' : 'bg-green-400'
              }`} />
              {r.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({ item }: { item: import('@/lib/reviewQueue').ReviewItem }) {
  return (
    <Link
      href={`/student/lessons/${item.lessonId}`}
      className={`card flex items-center gap-3 hover:border-brand-200 transition-colors border-2 ${
        item.isOverdue   ? 'border-red-200 bg-red-50' :
        item.isDueToday  ? 'border-orange-200 bg-orange-50' :
                           'border-gray-100'
      }`}
    >
      <span className="flex-shrink-0 text-xl">{item.subjectIcon}</span>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-800 leading-snug">{item.lessonTitle}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{item.subjectName}</span>
          <span className="text-gray-200 text-xs">·</span>
          <DueDateLabel
            dueDate={item.dueDate}
            isOverdue={item.isOverdue}
            isDueToday={item.isDueToday}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <ScorePill score={item.masteryScore} />
        <span className="text-xs text-gray-400">{item.estimatedMinutes} min</span>
        <span className="text-gray-300 text-xs">→</span>
      </div>
    </Link>
  )
}
