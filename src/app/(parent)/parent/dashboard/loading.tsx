export default function ParentDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-56 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card text-center space-y-2 py-4">
            <div className="h-6 w-6 bg-gray-200 rounded mx-auto" />
            <div className="h-6 w-12 bg-gray-200 rounded mx-auto" />
            <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Progress */}
      <div className="card space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded-full" />
      </div>
      {/* Subjects */}
      <div className="card space-y-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 rounded" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-8 bg-gray-200 rounded" />
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
