export default function SkillsLoading() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-pulse">

      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-36 bg-gray-200 rounded" />
        <div className="h-4 w-56 bg-gray-100 rounded" />
      </div>

      {/* Summary strip skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="card py-4 flex flex-col items-center gap-2">
            <div className="h-7 w-10 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Subject card skeletons */}
      {[0, 1].map(i => (
        <div key={i} className="card space-y-3">
          {/* Subject header */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="h-6 w-6 bg-gray-200 rounded" />
            <div className="h-5 w-28 bg-gray-200 rounded" />
          </div>
          {/* Skill rows */}
          {[0, 1, 2].map(j => (
            <div key={j} className="py-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ))}

    </div>
  )
}
