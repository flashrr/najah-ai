interface ProgressBarProps {
  value: number      // 0–100
  label?: string
  color?: string
  size?: 'sm' | 'md'
}

export default function ProgressBar({ value, label, color = 'bg-brand-500', size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  const h   = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full ${h}`}>
        <div
          className={`${h} rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
