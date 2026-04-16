interface ParentMetricCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
}

export default function ParentMetricCard({ icon, label, value, sub, color = 'text-brand-600' }: ParentMetricCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`text-3xl`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
    </div>
  )
}
