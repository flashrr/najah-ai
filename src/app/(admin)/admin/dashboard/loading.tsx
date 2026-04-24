export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card text-center space-y-2 py-4">
            <div className="h-7 w-7 bg-gray-200 rounded mx-auto" />
            <div className="h-7 w-12 bg-gray-200 rounded mx-auto" />
            <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Quick actions */}
      <div className="space-y-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="card flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded" />
              <div className="space-y-1">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Recent students */}
      <div className="card space-y-3">
        <div className="h-5 w-36 bg-gray-200 rounded" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
