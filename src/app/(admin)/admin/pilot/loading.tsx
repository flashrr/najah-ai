export default function PilotLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-24 bg-gray-100" />
        ))}
      </div>
      <div className="card h-20 bg-gray-100" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-16 bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
