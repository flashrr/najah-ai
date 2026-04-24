export default function ReportLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-7 w-48 bg-gray-200 rounded" />
      {/* Summary card */}
      <div className="card space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center space-y-1">
              <div className="h-7 w-12 bg-gray-200 rounded mx-auto" />
              <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full" />
      </div>
      {/* Lessons */}
      <div className="card space-y-3">
        <div className="h-5 w-36 bg-gray-200 rounded" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-6 w-6 bg-gray-200 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-5 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
