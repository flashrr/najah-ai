export default function TutorLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="h-3 w-3/4 bg-gray-100 rounded" />
        </div>
        <div className="p-4 flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-6 w-20 bg-gray-100 rounded-full" />
          ))}
        </div>
      </div>
      <div className="card h-64 bg-gray-50" />
    </div>
  )
}
