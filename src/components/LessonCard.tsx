import Link from 'next/link'
import type { Lesson, LessonProgress, Subject } from '@/lib/types'
import ProgressBar from './ProgressBar'

interface LessonCardProps {
  lesson: Lesson & { subject?: Subject }
  progress?: LessonProgress
}

const difficultyClass = {
  easy:   'badge-easy',
  medium: 'badge-medium',
  hard:   'badge-hard',
}

const statusIcon = {
  not_started: '○',
  in_progress: '◑',
  completed:   '●',
}

const statusColor = {
  not_started: 'text-gray-400',
  in_progress: 'text-brand-500',
  completed:   'text-green-500',
}

export default function LessonCard({ lesson, progress }: LessonCardProps) {
  const status = progress?.status ?? 'not_started'
  const score  = progress?.score ?? null

  return (
    <Link
      href={`/student/lessons/${lesson.id}`}
      className="card hover:shadow-md transition-shadow flex flex-col gap-3 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {lesson.subject && (
              <span className="text-lg">{lesson.subject.icon}</span>
            )}
            <span className={`text-base font-semibold group-hover:text-brand-600 truncate`}>
              {lesson.title}
            </span>
          </div>
          {lesson.objective && (
            <p className="text-xs text-gray-500 line-clamp-2">{lesson.objective}</p>
          )}
        </div>
        <span className={`text-xl flex-shrink-0 ${statusColor[status]}`}>
          {statusIcon[status]}
        </span>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={difficultyClass[lesson.difficulty]}>{lesson.difficulty}</span>
        <span className="text-xs text-gray-400">{lesson.estimated_minutes} min</span>
        {lesson.subject && (
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ background: lesson.subject.color + '20', color: lesson.subject.color }}
          >
            {lesson.subject.name}
          </span>
        )}
      </div>

      {/* Progress */}
      {status !== 'not_started' && (
        <ProgressBar value={score ?? (status === 'completed' ? 100 : 50)} size="sm" />
      )}
    </Link>
  )
}
