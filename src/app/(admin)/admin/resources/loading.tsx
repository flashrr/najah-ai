export default function AdminResourcesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="h-10 bg-gray-200 rounded" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card flex items-start gap-3">
          <div className="h-5 w-16 bg-gray-200 rounded" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-6 w-12 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}
