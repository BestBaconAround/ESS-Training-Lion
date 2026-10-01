import { useMemo, useState } from 'react'
import { PV_DECISION_INFO } from '../../content/sims/benchParams'
import type { Module } from '../../content/types'
import { progressActions } from '../../progress/store'
import {
  generateLeakScenario,
  gradeLeak,
  measure,
  type DecisionPv,
  type LeakGrade,
  type MeterMode,
  type Measurement,
  type Node,
} from '../../sims/bench/leakage'
import { randomSeed } from '../../sims/rng'
import GradeList from './GradeList'
import Multimeter from './Multimeter'

const primary =
  'rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300'
const card = 'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'
const select = 'rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900'
const NODES: Node[] = ['PV+', 'PV-', 'GND']
const nodeText = (n: Node) => (n === 'PV+' ? 'PV(+)' : n === 'PV-' ? 'PV(-)' : 'GND')
const DECISIONS = Object.keys(PV_DECISION_INFO) as DecisionPv[]

export default function LeakageBench({ module }: { module: Module }) {
  const [seed, setSeed] = useState(randomSeed)
  const scenario = useMemo(() => generateLeakScenario(seed), [seed])
  const [pvOff, setPvOff] = useState(false)
  const [mode, setMode] = useState<MeterMode>('volts')
  const [red, setRed] = useState<Node>('PV-')
  const [black, setBlack] = useState<Node>('GND')
  const [log, setLog] = useState<Measurement[]>([])
  const [decision, setDecision] = useState<DecisionPv | undefined>()
  const [grade, setGrade] = useState<LeakGrade | null>(null)
  const locked = grade !== null
  const last = log[log.length - 1]

  const restart = () => {
    setSeed(randomSeed())
    setPvOff(false)
    setMode('volts')
    setRed('PV-')
    setBlack('GND')
    setLog([])
    setDecision(undefined)
    setGrade(null)
  }

  const check = () => {
    const g = gradeLeak(scenario, log, decision)
    setGrade(g)
    // Saved here, in the click handler, not during render.
    progressActions.recordSimAttempt(module.id, module.sim.id, g.score)
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        An installer has finished the PV wiring on a Rev 4 system and wants to power up. Run the PV-to-ground leakage test, then decide. Voltage readings
        here are simulated.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>
          The array {scenario.mlpe ? 'uses module level power electronics (MLPE, such as optimizers)' : 'does not use MLPE'}.
        </li>
        {scenario.mlpe && (
          <li>Rapid shutdown is currently {scenario.rssEnergized ? 'turning the PV panels on' : 'not turning the PV panels on'}.</li>
        )}
        <li>The PV Disconnect is currently {pvOff ? 'off' : 'on'}.</li>
      </ul>

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <section className={card} aria-label="Test controls">
          <h3 className="font-semibold">Test</h3>
          <button
            role="switch"
            aria-checked={pvOff}
            disabled={locked}
            onClick={() => setPvOff((v) => !v)}
            className={`mt-3 rounded-md border-2 px-3 py-1.5 text-sm font-medium ${pvOff ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-400'}`}
          >
            PV Disconnect: {pvOff ? 'OFF' : 'ON'} (click to switch)
          </button>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <label>
              Meter{' '}
              <select className={select} value={mode} disabled={locked} onChange={(e) => setMode(e.target.value as MeterMode)}>
                <option value="volts">DC volts</option>
                <option value="continuity">Continuity</option>
              </select>
            </label>
            <label>
              Red lead{' '}
              <select className={select} value={red} disabled={locked} onChange={(e) => setRed(e.target.value as Node)}>
                {NODES.map((n) => (
                  <option key={n} value={n}>
                    {nodeText(n)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Black lead{' '}
              <select className={select} value={black} disabled={locked} onChange={(e) => setBlack(e.target.value as Node)}>
                {NODES.map((n) => (
                  <option key={n} value={n}>
                    {nodeText(n)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="rounded-md bg-amber-500 px-3 py-1.5 font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-40"
              disabled={locked}
              onClick={() => setLog((l) => [...l, measure(scenario, pvOff, mode, red, black)])}
            >
              Measure
            </button>
          </div>
          {last?.note && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{last.note}</p>}
        </section>
        <Multimeter
          mode={last?.mode === 'continuity' ? 'Continuity' : 'DC volts'}
          caption={last ? `${nodeText(last.a)} to ${nodeText(last.b)}` : 'Choose leads and measure'}
          reading={last ? last.reading : null}
        />
      </div>

      <section className={card} aria-label="Measurement log">
        <h3 className="font-semibold">Measurements taken</h3>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">None yet.</p>
        ) : (
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1">#</th>
                <th>Mode</th>
                <th>Between</th>
                <th>Reading</th>
              </tr>
            </thead>
            <tbody>
              {log.map((m, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1">{i + 1}</td>
                  <td>{m.mode === 'volts' ? 'DC volts' : 'Continuity'}</td>
                  <td>
                    {nodeText(m.a)} / {nodeText(m.b)}
                  </td>
                  <td>{m.reading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={card} aria-label="Decision">
        <fieldset disabled={locked} className="space-y-1">
          <legend className="font-semibold">Safe to proceed to power-up?</legend>
          {DECISIONS.map((d) => (
            <label key={d} className="flex items-start gap-2 text-sm">
              <input type="radio" name="pv-decision" className="mt-1" checked={decision === d} onChange={() => setDecision(d)} />
              {PV_DECISION_INFO[d].label}
            </label>
          ))}
        </fieldset>
        {!locked && (
          <button className={`${primary} mt-3`} disabled={decision === undefined} onClick={check}>
            Check my work
          </button>
        )}
      </section>

      {grade && (
        <>
          <GradeList
            score={grade.score}
            rows={grade.items.map((i) => ({
              key: i.key,
              label: i.label,
              correct: i.correct,
              lines: [i.detail],
              why: i.why,
              sources: i.sources,
            }))}
          />
          <p className="rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
            <span className="font-semibold">What was really going on: </span>
            {grade.truth}
          </p>
          <button className={primary} onClick={restart}>
            New scenario
          </button>
        </>
      )}
    </div>
  )
}
