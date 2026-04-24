export default function DiagnosticLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-gray-200 rounded" />
      <div className="card space-y-4">
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-7 w-24 bg-gray-100 rounded-full" />
          ))}
        </div>
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}
