import type { PanelState, PanelSwitches } from '../../content/sims/panelTypes'
import type { LightColor, PanelLight } from '../../sims/panel/state'

const LIGHT_TEXT: Record<LightColor, string> = {
  off: 'Off',
  green: 'Solid green',
  'green-blink': 'Blinking green',
  red: 'Red',
  unknown: 'Not described in the sources',
}

function Led({ light }: { light: PanelLight }) {
  const c = light.color
  const fill =
    c === 'green' || c === 'green-blink' ? 'fill-green-500' : c === 'red' ? 'fill-red-500' : 'fill-slate-700 dark:fill-slate-600'
  return (
    <div className="flex items-center gap-3">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <circle cx="14" cy="14" r="12" className="fill-slate-900" />
        <circle
          cx="14"
          cy="14"
          r="8"
          className={`${fill} ${c === 'green-blink' ? 'motion-safe:animate-pulse' : ''}`}
          strokeDasharray={c === 'unknown' ? '3 3' : undefined}
          stroke={c === 'unknown' ? '#94a3b8' : 'none'}
        />
      </svg>
      <div className="text-sm">
        <div className="font-medium">{light.label}</div>
        <div className="text-slate-600 dark:text-slate-400">{LIGHT_TEXT[c]}</div>
      </div>
    </div>
  )
}

/** A latching push button: pushed in = on, pushed out = off. */
function Latch({
  label,
  hint,
  on,
  disabled,
  onToggle,
}: {
  label: string
  hint?: string
  on: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 text-left transition disabled:opacity-60 ${
        on
          ? 'border-slate-500 bg-slate-300 shadow-inner dark:bg-slate-700'
          : 'border-slate-300 bg-slate-100 shadow-[0_4px_0_0_rgba(100,116,139,0.6)] dark:border-slate-600 dark:bg-slate-500'
      }`}
    >
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-slate-600 dark:text-slate-300">{hint}</span>}
      </span>
      <span className={`rounded px-2 py-0.5 text-xs font-bold ${on ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
        {on ? 'IN (on)' : 'OUT (off)'}
      </span>
    </button>
  )
}

/** The PV rotary switch (Rev 4) or the DC switch (Revs 1-3). */
function Rotary({ label, on, disabled, onToggle }: { label: string; on: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-center gap-4 rounded-lg border-2 border-slate-300 bg-slate-100 px-4 py-3 text-left disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700"
    >
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="28" r="26" className="fill-slate-800" />
        <g transform={`rotate(${on ? 0 : -90} 28 28)`} style={{ transition: 'transform 150ms' }}>
          <rect x="25" y="6" width="6" height="24" rx="3" className="fill-amber-400" />
        </g>
        <text x="28" y="53" textAnchor="middle" fontSize="7" className="fill-slate-300">
          {on ? 'ON' : 'OFF'}
        </text>
      </svg>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-slate-600 dark:text-slate-300">Rotary switch: {on ? 'ON' : 'OFF'}</span>
      </span>
    </button>
  )
}

export default function InverterFace({
  state,
  lights,
  onSwitches,
  disabled,
}: {
  state: PanelState
  /** When omitted, lights are hidden (used while a scenario is being answered). */
  lights?: PanelLight[]
  onSwitches: (next: PanelSwitches) => void
  disabled?: boolean
}) {
  const s = state.switches
  const set = (patch: Partial<PanelSwitches>) => onSwitches({ ...s, ...patch })
  const rev4 = state.family === 'rev4'
  return (
    <section
      aria-label={rev4 ? 'Rev 4 inverter face' : 'Revs 1-3 inverter face'}
      className="space-y-3 rounded-2xl border-4 border-slate-400 bg-slate-200 p-4 shadow dark:border-slate-600 dark:bg-slate-800"
    >
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {rev4 ? 'Rev 4 inverter' : 'Revs 1-3 inverter'}
      </h3>
      {rev4 ? (
        <>
          <Rotary label="PV Disconnect" on={s.pv} disabled={disabled} onToggle={() => set({ pv: !s.pv })} />
          <Latch label="AC/DC" hint="Top button" on={s.power} disabled={disabled} onToggle={() => set({ power: !s.power })} />
          <Latch
            label="Complete System Shutdown"
            hint="Bottom button"
            on={s.shutdown}
            disabled={disabled}
            onToggle={() => set({ shutdown: !s.shutdown })}
          />
        </>
      ) : (
        <>
          <Rotary label="DC switch (PV disconnect)" on={s.pv} disabled={disabled} onToggle={() => set({ pv: !s.pv })} />
          <Latch label="Power button" on={s.power} disabled={disabled} onToggle={() => set({ power: !s.power })} />
        </>
      )}
      <div className="space-y-2 border-t border-slate-300 pt-3 dark:border-slate-600" aria-live="polite">
        {lights ? (
          lights.map((l) => <Led key={l.label} light={l} />)
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">The lights show after you check your answer.</p>
        )}
      </div>
    </section>
  )
}
