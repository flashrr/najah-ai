interface BadgeProps {
  icon: string
  name: string
  description: string
  earned?: boolean
}

export default function Badge({ icon, name, description, earned = true }: BadgeProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${earned ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      {earned && <span className="ml-auto text-yellow-500 text-lg">★</span>}
    </div>
  )
}
