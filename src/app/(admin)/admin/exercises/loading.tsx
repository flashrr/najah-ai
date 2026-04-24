export default function AdminExercisesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-44 bg-gray-200 rounded" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>
      {/* Filter */}
      <div className="h-9 w-48 bg-gray-100 rounded-lg" />
      {/* Exercise cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-56 bg-gray-200 rounded" />
              <div className="h-5 w-14 bg-gray-100 rounded" />
            </div>
            <div className="h-3 w-32 bg-gray-100 rounded" />
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-7 w-24 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
