import { useState } from 'react'
import type { PanelCondition, PanelFamily, PanelState } from '../../content/sims/panelTypes'
import { computeStatus, defaultState } from '../../sims/panel/state'
import InverterFace from './InverterFace'
import StatusPanel from './StatusPanel'
import WorldControls from './WorldControls'

export default function FreePlay() {
  const [state, setState] = useState<PanelState>(() => defaultState('rev4'))
  const status = computeStatus(state)
  const setFamily = (family: PanelFamily) => setState(defaultState(family))

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Free play is not scored. Change anything and watch the status update.
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          <span className="mr-2 font-medium">Hardware</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            value={state.family}
            onChange={(e) => setFamily(e.target.value as PanelFamily)}
          >
            <option value="rev4">Rev 4</option>
            <option value="rev1-3">Revs 1-3</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2 font-medium">Inverter condition</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
            value={state.condition}
            onChange={(e) => setState({ ...state, condition: e.target.value as PanelCondition })}
          >
            <option value="normal">Normal</option>
            <option value="alarm">Alarm</option>
            <option value="fault">Fault</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <InverterFace state={state} lights={status.lights} onSwitches={(switches) => setState({ ...state, switches })} />
          <WorldControls world={state.world} onChange={(world) => setState({ ...state, world })} />
        </div>
        <StatusPanel status={status} family={state.family} />
      </div>
    </div>
  )
}
