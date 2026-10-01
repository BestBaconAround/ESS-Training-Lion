import { useState } from 'react'
import type { SimProps } from '../registry'
import SimShell from '../SimShell'
import FreePlay from './FreePlay'
import ScenarioRun from './ScenarioRun'

const tab = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    active ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export default function PanelSim({ module }: SimProps) {
  const [mode, setMode] = useState<'free' | 'scenarios'>('scenarios')
  return (
    <SimShell module={module}>
      <div role="tablist" aria-label="Simulator mode" className="flex gap-1">
        <button role="tab" aria-selected={mode === 'scenarios'} className={tab(mode === 'scenarios')} onClick={() => setMode('scenarios')}>
          Scenarios (scored)
        </button>
        <button role="tab" aria-selected={mode === 'free'} className={tab(mode === 'free')} onClick={() => setMode('free')}>
          Free play
        </button>
      </div>
      {mode === 'free' ? <FreePlay /> : <ScenarioRun module={module} />}
    </SimShell>
  )
}
