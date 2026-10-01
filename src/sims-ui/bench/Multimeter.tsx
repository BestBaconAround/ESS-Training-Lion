/** A simple digital multimeter display. Always shows what it is measuring so the reading is never ambiguous. */
export default function Multimeter({
  mode,
  caption,
  reading,
}: {
  mode: 'DC volts' | 'Continuity'
  caption: string
  reading: string | null
}) {
  return (
    <section aria-label="Multimeter" className="rounded-2xl border-4 border-amber-500 bg-amber-400 p-3 text-slate-900 shadow">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
        <span>Multimeter</span>
        <span>{mode}</span>
      </div>
      <div
        role="status"
        aria-live="polite"
        className="mt-2 rounded-lg bg-slate-900 px-4 py-3 text-right font-mono text-2xl text-green-400"
      >
        {reading ?? '----'}
      </div>
      <div className="mt-1 text-xs">{caption}</div>
    </section>
  )
}
