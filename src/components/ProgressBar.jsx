// Sticky bottom progress indicator used during parse / zip operations.
export default function ProgressBar({ stage, percent, label }) {
  if (stage == null) return null
  const pct = Math.max(0, Math.min(100, Math.round(percent ?? 0)))
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(560px,90vw)]">
      <div className="glass glass-specular px-4 py-3 animate-glass-in">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium capitalize">{stage.replace(/-/g, ' ')}</span>
          <span className="tabular-nums opacity-70">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-150 ease-out"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #9aa0ff, #ffb0c8, #ffd28a)'
            }}
          />
        </div>
        {label && (
          <div className="mt-1.5 text-[11px] opacity-60 truncate" title={label}>
            {label}
          </div>
        )}
      </div>
    </div>
  )
}
