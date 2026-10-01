import { useMemo, useState } from 'react'
import { CLASS_INFO, DECISION_INFO } from '../../content/sims/benchParams'
import type { Module } from '../../content/types'
import { progressActions } from '../../progress/store'
import {
  generateBatteryScenario,
  gradeBattery,
  type BatteryClass,
  type BatteryGrade,
  type SystemDecision,
} from '../../sims/bench/batteries'
import { randomSeed } from '../../sims/rng'
import GradeList from './GradeList'
import Multimeter from './Multimeter'

const primary =
  'rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300'
const card = 'rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900'
const CLASS_KEYS = Object.keys(CLASS_INFO) as BatteryClass[]
const DECISION_KEYS = Object.keys(DECISION_INFO) as SystemDecision[]

export default function BatteryBench({ module }: { module: Module }) {
  const [seed, setSeed] = useState(randomSeed)
  const scenario = useMemo(() => generateBatteryScenario(seed), [seed])
  const [probed, setProbed] = useState<string[]>([])
  const [meter, setMeter] = useState<{ label: string; volts: number } | null>(null)
  const [classes, setClasses] = useState<Record<string, BatteryClass | undefined>>({})
  const [decision, setDecision] = useState<SystemDecision | undefined>()
  const [order, setOrder] = useState<string[]>([])
  const [grade, setGrade] = useState<BatteryGrade | null>(null)

  const all = scenario.batteries
  const allProbed = probed.length === all.length
  const locked = grade !== null
  const answered = all.every((b) => classes[b.id]) && decision !== undefined

  const restart = () => {
    setSeed(randomSeed())
    setProbed([])
    setMeter(null)
    setClasses({})
    setDecision(undefined)
    setOrder([])
    setGrade(null)
  }

  const check = () => {
    const g = gradeBattery(scenario, { classes, decision, order })
    setGrade(g)
    // Saved here, in the click handler, not during render.
    progressActions.recordSimAttempt(module.id, module.sim.id, g.score)
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        An installer is checking {all.length === 1 ? 'a battery' : `${all.length} batteries`} before wiring. Readings are resting voltage at room
        temperature. The system has not been commissioned yet.
      </p>

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <section className={card} aria-label="Step 1: probe each battery">
          <h3 className="font-semibold">1. Probe each battery</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {all.map((b) => (
              <li key={b.id} className="rounded-lg border border-slate-300 p-3 dark:border-slate-700">
                <div className="font-medium">{b.label}</div>
                <button
                  className="mt-2 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-amber-400"
                  onClick={() => {
                    setMeter({ label: b.label, volts: b.volts })
                    setProbed((p) => (p.includes(b.id) ? p : [...p, b.id]))
                  }}
                >
                  Probe
                </button>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {probed.includes(b.id) ? `Reads ${b.volts.toFixed(2)} V` : 'Not probed'}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <Multimeter
          mode="DC volts"
          caption={meter ? `Leads on ${meter.label} terminals` : 'Probe a battery to read it'}
          reading={meter ? `${meter.volts.toFixed(2)} V` : null}
        />
      </div>

      {allProbed && (
        <>
          <section className={card} aria-label="Step 2: classify each battery">
            <h3 className="font-semibold">2. What does each battery need?</h3>
            <div className="mt-3 space-y-4">
              {all.map((b) => (
                <fieldset key={b.id} disabled={locked} className="space-y-1">
                  <legend className="text-sm font-medium">
                    {b.label}: {b.volts.toFixed(2)} V
                  </legend>
                  {CLASS_KEYS.map((k) => (
                    <label key={k} className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        name={`class-${b.id}`}
                        className="mt-1"
                        checked={classes[b.id] === k}
                        onChange={() => setClasses((c) => ({ ...c, [b.id]: k }))}
                      />
                      {CLASS_INFO[k].label}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </section>

          <section className={card} aria-label="Step 3: can the system be wired">
            <fieldset disabled={locked} className="space-y-1">
              <legend className="font-semibold">3. Can the system be wired?</legend>
              {DECISION_KEYS.map((k) => (
                <label key={k} className="flex items-start gap-2 text-sm">
                  <input type="radio" name="decision" className="mt-1" checked={decision === k} onChange={() => setDecision(k)} />
                  {DECISION_INFO[k].label}
                </label>
              ))}
            </fieldset>
          </section>

          {all.length >= 2 && (
            <section className={card} aria-label="Step 4: positive plug-in order">
              <h3 className="font-semibold">4. In what order do you plug in the positive cables?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click batteries in the order you would plug them in. If nothing should be plugged in yet, leave this empty.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {all.map((b) => (
                  <button
                    key={b.id}
                    disabled={locked || order.includes(b.id)}
                    onClick={() => setOrder((o) => [...o, b.id])}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Plug in {b.label}
                  </button>
                ))}
                <button
                  disabled={locked || order.length === 0}
                  onClick={() => setOrder([])}
                  className="text-sm text-amber-700 underline disabled:opacity-40 dark:text-amber-400"
                >
                  Clear
                </button>
              </div>
              <p className="mt-2 text-sm" aria-live="polite">
                Your order: {order.length ? order.map((id) => all.find((b) => b.id === id)?.label).join(', then ') : 'nothing yet'}
              </p>
            </section>
          )}

          {!locked && (
            <button className={primary} disabled={!answered} onClick={check}>
              Check my answers
            </button>
          )}
        </>
      )}

      {grade && (
        <>
          <GradeList
            score={grade.score}
            rows={grade.items.map((i) => ({
              key: i.key,
              label: i.label,
              correct: i.correct,
              lines: [`You: ${i.yours}`, `Expected: ${i.expected}`],
              why: i.why,
              sources: i.sources,
            }))}
          />
          <button className={primary} onClick={restart}>
            New scenario
          </button>
        </>
      )}
    </div>
  )
}
