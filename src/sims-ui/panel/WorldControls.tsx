import type { PanelWorld } from '../../content/sims/panelTypes'

export default function WorldControls({
  world,
  onChange,
  lockSun,
}: {
  world: PanelWorld
  onChange: (w: PanelWorld) => void
  /** In scenarios the sun is part of the situation, not something the learner controls. */
  lockSun?: boolean
}) {
  const row = 'flex items-center gap-3 text-sm'
  return (
    <fieldset className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <legend className="px-1 text-sm font-semibold">Outside power</legend>
      <label className={row}>
        <input type="checkbox" checked={world.grid} onChange={(e) => onChange({ ...world, grid: e.target.checked })} />
        Grid breaker on
      </label>
      <label className={row}>
        <input type="checkbox" checked={world.other} onChange={(e) => onChange({ ...world, other: e.target.checked })} />
        Generator, AC solar or wind running
      </label>
      <label className={row}>
        <input
          type="checkbox"
          checked={world.solar}
          disabled={lockSun}
          onChange={(e) => onChange({ ...world, solar: e.target.checked })}
        />
        Sun on the panels{lockSun ? ' (fixed for this scenario)' : ''}
      </label>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Solar only counts as a power source while the PV switch is on.
      </p>
    </fieldset>
  )
}
