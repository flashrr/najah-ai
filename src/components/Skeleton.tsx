interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 2 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-16 w-20 rounded-xl" />
          <Skeleton className="h-16 w-20 rounded-xl" />
        </div>
      </div>

      {/* Progress card */}
      <Skeleton className="h-24 w-full" />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonWeeklyPlan() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Plan header card */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      {/* Day sections */}
      {[2, 1, 2].map((count, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: count }).map((_, j) => (
            <Skeleton key={j} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  )
}
