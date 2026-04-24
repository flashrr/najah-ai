export default function NotificationsLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>

      {/* Notification skeletons */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white">
          <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex justify-between gap-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-10 flex-shrink-0" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
