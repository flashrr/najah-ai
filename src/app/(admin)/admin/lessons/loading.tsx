export default function AdminLessonsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-9 w-32 bg-gray-100 rounded-lg" />
        ))}
      </div>
      {/* Table rows */}
      <div className="card divide-y divide-gray-100">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 py-3 px-1">
            <div className="h-5 w-5 bg-gray-200 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
            <div className="h-5 w-16 bg-gray-100 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
