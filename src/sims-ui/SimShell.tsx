import type { ReactNode } from 'react'
import type { Module } from '../content/types'
import { getModuleProgress } from '../progress/logic'
import { useProgress } from '../progress/store'

/** Shared frame for every simulator: intro plus this learner's attempts and best score. */
export default function SimShell({ module, children }: { module: Module; children: ReactNode }) {
  const progress = useProgress()
  const sim = getModuleProgress(progress, module.id).sims[module.sim.id]
  return (
    <div className="space-y-5">
      <p className="text-slate-600 dark:text-slate-400">{module.sim.intro}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Scored runs: {sim?.attempts ?? 0}. Best: {sim?.best == null ? 'none yet' : `${sim.best}%`}. Last:{' '}
        {sim?.last == null ? 'none yet' : `${sim.last}%`}.
      </p>
      {children}
    </div>
  )
}
