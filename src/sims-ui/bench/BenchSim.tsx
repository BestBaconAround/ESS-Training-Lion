import { useState } from 'react'
import type { SimProps } from '../registry'
import SimShell from '../SimShell'
import BatteryBench from './BatteryBench'
import LeakageBench from './LeakageBench'

const tab = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    active ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export default function BenchSim({ module }: SimProps) {
  const [mode, setMode] = useState<'battery' | 'leakage'>('battery')
  return (
    <SimShell module={module}>
      <div role="tablist" aria-label="Bench scenario" className="flex gap-1">
        <button role="tab" aria-selected={mode === 'battery'} className={tab(mode === 'battery')} onClick={() => setMode('battery')}>
          Battery check
        </button>
        <button role="tab" aria-selected={mode === 'leakage'} className={tab(mode === 'leakage')} onClick={() => setMode('leakage')}>
          PV leakage test
        </button>
      </div>
      {mode === 'battery' ? <BatteryBench key="battery" module={module} /> : <LeakageBench key="leakage" module={module} />}
    </SimShell>
  )
}
