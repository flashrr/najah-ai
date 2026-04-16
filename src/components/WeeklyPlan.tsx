import type { Lesson, LessonProgress, Subject, Week } from '@/lib/types'
import LessonCard from './LessonCard'

interface WeeklyPlanProps {
  week: Week
  lessons: (Lesson & { subject?: Subject })[]
  progressMap: Record<string, LessonProgress>
}

export default function WeeklyPlan({ week, lessons, progressMap }: WeeklyPlanProps) {
  const completed = lessons.filter(l => progressMap[l.id]?.status === 'completed').length
  const pct       = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-lg">{week.title}</h2>
          {week.objective && <p className="text-sm text-gray-500">{week.objective}</p>}
        </div>
        <div className="text-right text-sm">
          <span className="font-semibold text-brand-600">{completed}/{lessons.length}</span>
          <span className="text-gray-400"> lessons</span>
          <div className="text-xs text-gray-400">{pct}% complete</div>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">No lessons this week yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={progressMap[lesson.id]}
            />
          ))}
        </div>
      )}
    </section>
  )
}
