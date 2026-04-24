export default function InviteLoading() {
  return (
    <div className="max-w-md mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-56 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>
      <div className="card text-center space-y-4">
        <div className="h-4 w-32 bg-gray-100 rounded mx-auto" />
        <div className="h-20 bg-gray-100 rounded-xl" />
        <div className="h-4 w-48 bg-gray-100 rounded mx-auto" />
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>
      <div className="card space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${60 + i * 8}%` }} />
        ))}
      </div>
    </div>
  )
}
