export default function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const p = Math.max(0, Math.min(100, percent))
  return (
    <div>
      {label && <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">{label}</div>}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}
