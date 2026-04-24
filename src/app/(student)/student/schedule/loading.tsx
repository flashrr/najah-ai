export default function ScheduleLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>

      {/* Tab selector */}
      <div className="grid grid-cols-2 gap-2">
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>

      {/* Description banner */}
      <div className="h-8 bg-gray-100 rounded-lg" />

      {/* Day pills */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="w-12 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Time blocks card */}
      <div className="card space-y-3 py-4">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
        <div className="h-10 bg-gray-50 border-2 border-dashed border-gray-100 rounded-xl" />
      </div>

      {/* Preferences card */}
      <div className="card space-y-3">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>

      {/* Save button */}
      <div className="h-12 bg-gray-200 rounded-xl" />
    </div>
  )
}
