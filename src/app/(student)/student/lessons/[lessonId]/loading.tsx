export default function LessonLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-48 bg-gray-200 rounded" />
      {/* Header card */}
      <div className="card space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full" />
      </div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-100 pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-4 w-20 bg-gray-200 rounded" />
        ))}
      </div>
      {/* Content */}
      <div className="card space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${70 + i * 5}%` }} />
        ))}
      </div>
    </div>
  )
}
