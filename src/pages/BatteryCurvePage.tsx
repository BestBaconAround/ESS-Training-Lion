import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SourceNote from '../components/SourceNote'
import { Disclosure, PageHeader, ui } from '../components/ui'
import { CELLS_IN_SERIES, CELLS_SOURCE, CURVE_NOTES, CURVE_POINTS, CURVE_SOURCE, IMBALANCE_NOTE, LION_LIMITS, REV4_PACK_RANGE } from '../content/sims/lfpCurve'
import { cellVoltageAt, packVolts, zoneAt } from '../sims/lfp/curve'

type Unit = 'cell' | 'pack'

const W = 760
const H = 380
const M = { left: 56, right: 150, top: 16, bottom: 44 }
const CELL_RANGE: [number, number] = [2.2, 3.7]

/** Voltage versus state of charge for an LFP cell and the Sanctuary battery, with Lion's own limits drawn on it. */
export default function BatteryCurvePage() {
  const [unit, setUnit] = useState<Unit>('pack')
  const [soc, setSoc] = useState(50)
  const svgRef = useRef<SVGSVGElement>(null)

  const k = unit === 'pack' ? CELLS_IN_SERIES : 1
  const [lo, hi] = [CELL_RANGE[0] * k, CELL_RANGE[1] * k]
  const x = (s: number) => M.left + ((100 - s) / 100) * (W - M.left - M.right) // discharge runs left to right
  const y = (v: number) => M.top + ((hi - v) / (hi - lo)) * (H - M.top - M.bottom)
  const fmt = (v: number) => (unit === 'pack' ? v.toFixed(1) : v.toFixed(2))

  const path = useMemo(() => CURVE_POINTS.map((p, i) => `${i ? 'L' : 'M'}${x(p.soc).toFixed(1)},${y(p.cell * k).toFixed(1)}`).join(' '), [k]) // eslint-disable-line react-hooks/exhaustive-deps
  const yTicks = unit === 'pack' ? [36, 40, 44, 48, 52, 56, 60] : [2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6]
  const cell = cellVoltageAt(soc)
  const zone = zoneAt(cell)

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const s = 100 - ((px - M.left) / (W - M.left - M.right)) * 100
    setSoc(Math.round(Math.min(100, Math.max(0, s))))
  }

  // Limit labels can sit close together near the bottom: spread them so the text never overlaps.
  const labels = useMemo(() => {
    const items = LION_LIMITS.map((l) => ({ l, y: y((l.mV / 1000) * k) })).sort((a, b) => a.y - b.y)
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 14) items[i].y = items[i - 1].y + 14
    return items
  }, [k]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <PageHeader
        title="LFP discharge graph"
        lead="How the voltage of a lithium iron phosphate (LFP) battery falls as it discharges, with the limits Lion's battery and inverter use drawn on it."
      />

      <p className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100" role="note">
        <strong>The curve is a typical LFP curve, not a Lion curve.</strong> It comes from a third-party article, and exact values vary by cell maker. The Lion documents read do not
        publish a voltage-versus-charge table. The dashed limit lines are Lion's own numbers from the Technical Service Manual.
      </p>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Units">
        {(['pack', 'cell'] as const).map((u) => (
          <button
            key={u}
            type="button"
            aria-pressed={unit === u}
            onClick={() => setUnit(u)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${unit === u ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border border-slate-300 dark:border-slate-700'}`}
          >
            {u === 'pack' ? 'Sanctuary battery (16 cells)' : 'One cell'}
          </button>
        ))}
        <span className={`text-sm ${ui.muted}`}>Resting voltage as the battery discharges, left to right.</span>
      </div>

      <section className={`${ui.card} p-4`}>
        <h2 className="text-base font-semibold">Resting voltage versus state of charge ({unit === 'pack' ? 'volts, whole battery' : 'volts, one cell'})</h2>
        <div className="overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="min-w-[640px] w-full touch-none select-none"
            role="img"
            aria-label={`Graph of ${unit === 'pack' ? 'battery' : 'cell'} voltage against state of charge. The curve is flat from 90 to 20 percent and drops steeply below 10 percent.`}
            onPointerMove={onMove}
            onPointerDown={onMove}
          >
            {/* Rev 4 pack range band (pack view only) */}
            {unit === 'pack' && (
              <rect x={M.left} y={y(REV4_PACK_RANGE.max)} width={W - M.left - M.right} height={y(REV4_PACK_RANGE.min) - y(REV4_PACK_RANGE.max)} className="fill-slate-200/50 dark:fill-slate-700/30" />
            )}
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className="stroke-slate-200 dark:stroke-slate-800" />
                <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[11px] dark:fill-slate-400">{fmt(t)}</text>
              </g>
            ))}
            {[100, 80, 60, 40, 20, 0].map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={H - M.bottom} y2={H - M.bottom + 5} className="stroke-slate-400" />
                <text x={x(t)} y={H - M.bottom + 18} textAnchor="middle" className="fill-slate-500 text-[11px] dark:fill-slate-400">{t}%</text>
              </g>
            ))}
            <text x={(M.left + W - M.right) / 2} y={H - 6} textAnchor="middle" className="fill-slate-600 text-[12px] dark:fill-slate-300">State of charge (discharging to the right)</text>
            <line x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} className="stroke-slate-400" />
            <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} className="stroke-slate-400" />

            {/* Lion limits: dashed reference lines with direct labels in text color */}
            {labels.map(({ l, y: ly }) => {
              const lineY = y((l.mV / 1000) * k)
              return (
                <g key={l.id}>
                  <line x1={M.left} x2={W - M.right} y1={lineY} y2={lineY} strokeDasharray="5 4" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.2" />
                  <text x={W - M.right + 6} y={ly + 4} className="fill-slate-700 text-[10.5px] dark:fill-slate-200">{l.short.replace(/ [\d.]+ V$/, '')} {fmt((l.mV / 1000) * k)} V</text>
                </g>
              )
            })}

            {/* The curve: one series, 2px, with the 100% range shown as a short bar */}
            <line x1={x(100)} x2={x(100)} y1={y(3.4 * k)} y2={y(3.3 * k)} className="stroke-sky-600 dark:stroke-sky-400" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
            <path d={path} fill="none" className="stroke-sky-600 dark:stroke-sky-400" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {CURVE_POINTS.filter((p) => p.soc % 10 === 0).map((p) => (
              <circle key={p.soc} cx={x(p.soc)} cy={y(p.cell * k)} r="3" className="fill-sky-600 stroke-white dark:fill-sky-400 dark:stroke-slate-900" strokeWidth="2" />
            ))}

            {/* Hover crosshair */}
            <line x1={x(soc)} x2={x(soc)} y1={M.top} y2={H - M.bottom} className="stroke-slate-500" strokeDasharray="2 3" />
            <circle cx={x(soc)} cy={y(cell * k)} r="5.5" className="fill-sky-600 stroke-white dark:fill-sky-400 dark:stroke-slate-900" strokeWidth="2" />
          </svg>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="block text-sm">
            State of charge: <strong>{soc}%</strong>
            <input type="range" min={0} max={100} step={1} value={soc} onChange={(e) => setSoc(Number(e.target.value))} className="mt-1 block w-full" aria-label="State of charge in percent" />
          </label>
          <div className="text-sm" aria-live="polite">
            <div>
              One cell: <strong>{cell.toFixed(2)} V</strong>
            </div>
            <div>
              Sanctuary battery: <strong>{packVolts(cell).toFixed(1)} V</strong>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm">{zone.text}</p>
        {unit === 'pack' && (
          <p className={`mt-1 text-xs ${ui.muted}`}>
            The grey band is the Rev 4 battery voltage range, 40 to 58.4 VDC. <SourceNote sources={REV4_PACK_RANGE.sources} />
          </p>
        )}
        <p className={`mt-1 text-xs ${ui.muted}`}>Drag across the graph, or use the slider, to read a point. Curve: typical resting voltage from the article, straight lines between its table points.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What to take from it</h2>
        <ul className="list-disc space-y-3 pl-5 text-sm">
          {CURVE_NOTES.map((n) => (
            <li key={n.text}>
              {n.text}
              <SourceNote sources={n.sources} />
            </li>
          ))}
          <li>
            A Sanctuary battery is sixteen 3.2 V LFP cells in series, so battery volts are cell volts times 16. 3.2 V per cell is the nominal 51.2 V, and 3.65 V per cell is 58.4 V.
            <SourceNote sources={CELLS_SOURCE} />
          </li>
          <li>
            {IMBALANCE_NOTE.text}
            <SourceNote sources={IMBALANCE_NOTE.sources} />
          </li>
        </ul>
      </section>

      <Disclosure title={<span className="font-semibold">Lion's limits</span>} right={<span className={`text-xs ${ui.muted}`}>{LION_LIMITS.length}</span>} defaultOpen>
        <ul className="space-y-3 text-sm">
          {LION_LIMITS.map((l) => (
            <li key={l.id}>
              <strong>{l.label}:</strong> {(l.mV / 1000).toFixed(2)} V per cell, {packVolts(l.mV / 1000).toFixed(1)} V for the battery. {l.explain}
              <SourceNote sources={l.sources} />
            </li>
          ))}
        </ul>
      </Disclosure>

      <Disclosure title={<span className="font-semibold">Show the numbers as a table</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <th className="py-1 pr-4">State of charge</th>
                <th className="py-1 pr-4">One cell (V)</th>
                <th className="py-1">Sanctuary battery (V)</th>
              </tr>
            </thead>
            <tbody>
              {CURVE_POINTS.map((p) => (
                <tr key={p.soc} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1 pr-4">{p.soc}%{p.soc === 100 ? ' (3.30 to 3.40 V range)' : ''}</td>
                  <td className="py-1 pr-4">{p.cell.toFixed(2)}</td>
                  <td className="py-1">{packVolts(p.cell).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNote sources={[CURVE_SOURCE]} />
      </Disclosure>

      <p className={`text-sm ${ui.muted}`}>
        Related: <Link className={ui.link} to="/troubleshooting#ts-battery-wont-address">battery will not address or reads 0 V</Link>, and the{' '}
        <Link className={ui.link} to="/module/dc-wiring-batteries">DC wiring and batteries module</Link> (battery voltage check).
      </p>
    </div>
  )
}
