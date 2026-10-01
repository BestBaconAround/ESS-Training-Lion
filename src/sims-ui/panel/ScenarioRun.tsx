import { useMemo, useState } from 'react'
import type { Module } from '../../content/types'
import { sourceText } from '../../content/labels'
import { progressActions } from '../../progress/store'
import { randomSeed } from '../../sims/rng'
import {
  generateRun,
  gradeChoice,
  gradeSet,
  runScore,
  type ChooseGrade,
  type ChooseScenario,
  type PanelScenario,
  type SetGrade,
  type SetScenario,
} from '../../sims/panel/scenarios'
import { computeStatus } from '../../sims/panel/state'
import type { PanelState } from '../../content/sims/panelTypes'
import InverterFace from './InverterFace'
import StatusPanel from './StatusPanel'
import WorldControls from './WorldControls'

const RUN_SIZE = 6
const primary =
  'rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300'

type Grade = { kind: 'set'; grade: SetGrade } | { kind: 'choose'; grade: ChooseGrade }

export default function ScenarioRun({ module }: { module: Module }) {
  const [seed, setSeed] = useState(randomSeed)
  const run = useMemo(() => generateRun(seed, RUN_SIZE), [seed])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])

  const finished = results.length === run.length

  const again = () => {
    setSeed(randomSeed())
    setIndex(0)
    setResults([])
  }

  if (finished) {
    const score = runScore(results)
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-3xl font-bold">
            {results.filter(Boolean).length}/{results.length} ({score}%)
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Your score was saved. Run again for a different set of scenarios.</p>
        </div>
        <button className={primary} onClick={again}>
          Run again
        </button>
      </div>
    )
  }

  return (
    <Scenario
      key={run[index].id + seed}
      scenario={run[index]}
      number={index + 1}
      total={run.length}
      onNext={(correct) => {
        const next = [...results, correct]
        setResults(next)
        setIndex((i) => i + 1)
        // Saved here, in the click handler, not during render.
        if (next.length === run.length) progressActions.recordSimAttempt(module.id, module.sim.id, runScore(next))
      }}
    />
  )
}

function Scenario({
  scenario,
  number,
  total,
  onNext,
}: {
  scenario: PanelScenario
  number: number
  total: number
  onNext: (correct: boolean) => void
}) {
  const [grade, setGrade] = useState<Grade | null>(null)
  const correct = grade?.grade.correct ?? false

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Scenario {number} of {total}
      </p>
      <blockquote className="rounded-xl border-l-4 border-amber-400 bg-white p-4 text-lg italic dark:bg-slate-900">
        &ldquo;{scenario.customerSays}&rdquo;
      </blockquote>
      <p className="font-medium">{scenario.prompt}</p>

      {scenario.type === 'set' ? (
        <SetBody scenario={scenario} graded={grade?.kind === 'set' ? grade.grade : null} onGrade={(g) => setGrade({ kind: 'set', grade: g })} />
      ) : (
        <ChooseBody scenario={scenario} graded={grade?.kind === 'choose' ? grade.grade : null} onGrade={(g) => setGrade({ kind: 'choose', grade: g })} />
      )}

      {grade && (
        <div
          aria-live="polite"
          className={`space-y-2 rounded-xl border p-4 ${
            correct
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
              : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
          }`}
        >
          <div className="font-semibold">{correct ? 'Correct' : 'Not quite'}</div>
          {grade.kind === 'choose' && (
            <>
              <p className="text-sm">
                <span className="font-semibold">Your answer: </span>
                {grade.grade.chosen.why}
              </p>
              {!correct && (
                <p className="text-sm">
                  <span className="font-semibold">Correct answer: </span>
                  {grade.grade.right.text}. {grade.grade.right.why}
                </p>
              )}
            </>
          )}
          <p className="text-sm">{scenario.explanation}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Source: {scenario.sources.map(sourceText).join('; ')}</p>
          <button className={primary} onClick={() => onNext(correct)}>
            {number === total ? 'See results' : 'Next scenario'}
          </button>
        </div>
      )}
    </div>
  )
}

function SetBody({
  scenario,
  graded,
  onGrade,
}: {
  scenario: SetScenario
  graded: SetGrade | null
  onGrade: (g: SetGrade) => void
}) {
  const [state, setState] = useState<PanelState>(scenario.start)
  const locked = graded !== null
  const live = computeStatus(state)
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <InverterFace
            state={state}
            lights={locked ? live.lights : undefined}
            disabled={locked}
            onSwitches={(switches) => setState({ ...state, switches })}
          />
          <WorldControls world={state.world} lockSun onChange={(world) => setState({ ...state, world })} />
        </div>
        <div className="space-y-4">
          {locked ? (
            <>
              <StatusPanel status={graded.status} family={state.family} />
              <ul className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                {graded.lines.map((l) => (
                  <li key={l.label}>
                    <span className={l.met ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}>
                      {l.met ? '✓' : '✗'}
                    </span>{' '}
                    <span className="font-medium">{l.label}:</span> needed {l.needed ? 'yes' : 'no'}, got{' '}
                    {l.actual === null ? 'unknown' : l.actual ? 'yes' : 'no'}. {l.why}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
              Set the switches and outside power, then check your answer. The status is shown after you check.
            </p>
          )}
        </div>
      </div>
      {!locked && (
        <div className="flex gap-3">
          <button className={primary} onClick={() => onGrade(gradeSet(scenario, state))}>
            Check answer
          </button>
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => setState(scenario.start)}
          >
            Reset switches
          </button>
        </div>
      )}
    </div>
  )
}

function ChooseBody({
  scenario,
  graded,
  onGrade,
}: {
  scenario: ChooseScenario
  graded: ChooseGrade | null
  onGrade: (g: ChooseGrade) => void
}) {
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="sr-only">{scenario.prompt}</legend>
        {scenario.options.map((o) => {
          const isPicked = picked === o.id
          let tone = 'border-slate-300 hover:border-amber-400 dark:border-slate-700'
          if (graded && o.correct) tone = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
          else if (graded && isPicked) tone = 'border-red-500 bg-red-50 dark:bg-red-950/40'
          else if (isPicked) tone = 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
          return (
            <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${tone}`}>
              <input
                type="radio"
                name={scenario.id}
                className="mt-1"
                checked={isPicked}
                disabled={graded !== null}
                onChange={() => setPicked(o.id)}
              />
              <span>{o.text}</span>
            </label>
          )
        })}
      </fieldset>
      {!graded && (
        <button
          className={primary}
          disabled={picked === null}
          onClick={() => {
            const g = picked ? gradeChoice(scenario, picked) : null
            if (g) onGrade(g)
          }}
        >
          Check answer
        </button>
      )}
    </div>
  )
}
