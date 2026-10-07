import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SourceNote from '../../components/SourceNote'
import { Disclosure, ui } from '../../components/ui'
import { COMPONENTS, TORQUE_TODO } from '../../content/sims/inverter3d'
import { PARTS, SOCKETS, partById, socketById } from '../../content/sims/wireBox'
import type { SourceRef } from '../../content/types'
import { randomSeed } from '../../sims/rng'
import { fits } from '../../sims/wirebox/engine'
import {
  FASTENED_IDS,
  correctLab,
  emptyLab,
  gradeLab,
  makeLabScenario,
  measure,
  measureRsd,
  placeSpare,
  placeWire,
  progressOf,
  tasksFor,
  testCable,
  turnBolt,
  type LabState,
} from '../../sims/inverter3d/engine'
import { CAMERA_PRESETS } from './layout'
import { InverterScene, type Tool } from './Scene3D'

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: 'inspect', label: 'Inspect', hint: 'Click a part to learn what it is.' },
  { id: 'hand', label: 'Move cables', hint: 'Drag a cable plug to a terminal or port. Drop it on the bench to unplug it.' },
  { id: 'loosen', label: 'Loosen bolt', hint: 'Click a bolt: tight, then loose, then removed.' },
  { id: 'tighten', label: 'Tighten bolt', hint: 'Click a bolt: removed, then loose, then tight.' },
  { id: 'meter', label: 'Meter', hint: 'Click two test points to read volts or continuity. The remote shutdown plug needs one click.' },
  { id: 'tester', label: 'Cable tester', hint: 'Click an Ethernet cable to test the cable itself.' },
]

interface Note {
  title: string
  body: string
  sources?: SourceRef[]
  tone?: 'ok' | 'bad' | 'info'
}

const socketName = (id: string) => socketById(id).label

/** Dark navy panel with a blue edge, like the mockup. */
const PANEL = 'rounded-xl border border-[#1d4f80] bg-[#081a30]/90 text-white shadow-lg backdrop-blur'

/** `#/inverter-3d?seed=12` opens the same inverter every time (used for sharing a case and for tests). */
function startSeed(): number {
  const q = window.location.hash.split('?')[1]
  const n = Number(new URLSearchParams(q ?? '').get('seed'))
  return Number.isInteger(n) && n > 0 ? n : randomSeed()
}

export default function Inverter3DLab() {
  const [seed, setSeed] = useState(startSeed)
  const [creative, setCreative] = useState(false)
  const scenario = useMemo(() => makeLabScenario(seed), [seed])
  const [lab, setLab] = useState<LabState>(scenario.lab)
  const [tool, setTool] = useState<Tool>('inspect')
  const [mode, setMode] = useState<'volts' | 'continuity'>('volts')
  const [probes, setProbes] = useState<[string | null, string | null]>([null, null])
  const [note, setNote] = useState<Note | null>(null)
  const [inspected, setInspected] = useState<Set<string>>(new Set())
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showViews, setShowViews] = useState(false)
  const [view, setView] = useState('Front View')
  const [labelsOn, setLabelsOn] = useState(true)
  const [selCable, setSelCable] = useState<string>('p_bms_cable')
  const [selSocket, setSelSocket] = useState<string>('bms')
  const host = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<InverterScene | null>(null)
  const labRef = useRef(lab)
  labRef.current = lab
  const modeRef = useRef(mode)
  modeRef.current = mode
  const probesRef = useRef(probes)
  probesRef.current = probes

  const tasks = useMemo(() => tasksFor(scenario, lab, inspected), [scenario, lab, inspected])
  const progress = progressOf(tasks)
  const grade = useMemo(() => gradeLab(lab), [lab])
  const hintTool = TOOLS.find((t) => t.id === tool)!

  const update = useCallback((next: LabState) => {
    setLab(next)
    setChecked(false)
  }, [])

  const drop = useCallback(
    (id: string, socketId: string | null) => {
      const cur = labRef.current
      const r = id === 'spare' ? placeSpare(cur, socketId) : placeWire(cur, id, socketId)
      const name = id === 'spare' ? 'Spare Ethernet cable' : partById(id).label
      if (r.rejected) {
        setNote({ title: 'It would not go', body: r.rejected, tone: 'bad' })
        sceneRef.current?.sync(cur)
        return
      }
      update(r.lab)
      setNote({
        title: socketId ? `${name} plugged into ${socketName(socketId)}` : `${name} is on the bench`,
        body: r.displaced ? `${partById(r.displaced).label} came out and is on the bench.` : socketId ? 'Press Check when you think it is right, or test it with the meter.' : 'Unplugged.',
        tone: 'info',
      })
    },
    [update],
  )

  const bolt = useCallback(
    (socketId: string, dir: 'tighten' | 'loosen') => {
      const cur = labRef.current
      const next = turnBolt(cur, socketId, dir)
      if (next === cur || next.fasteners[socketId] === cur.fasteners[socketId]) {
        setNote({ title: socketName(socketId), body: dir === 'loosen' ? 'The bolt is already out.' : 'The bolt is already tight.', tone: 'info' })
        return
      }
      update(next)
      const st = next.fasteners[socketId]
      setNote({ title: `${socketName(socketId)} bolt`, body: st === 'tight' ? 'Tight.' : st === 'loose' ? 'Loose (not secure yet).' : 'Removed. It is in the bolt dish on the bench.', tone: 'info' })
    },
    [update],
  )

  const probe = useCallback((socketId: string) => {
    const cur = labRef.current
    if (socketId === 'rsd') {
      const r = measureRsd(cur, modeRef.current)
      setProbes([null, null])
      setNote({ title: `${modeRef.current === 'volts' ? 'Volts' : 'Continuity'} at the remote shutdown plug: ${r.headline}`, body: r.detail, sources: r.sources, tone: 'info' })
      return
    }
    const [a, b] = probesRef.current
    if (!a || b) {
      setProbes([socketId, null])
      setNote({ title: `Red probe on ${socketName(socketId)}`, body: 'Now click the second test point.', tone: 'info' })
      return
    }
    setProbes([a, socketId])
    const r = measure(cur, modeRef.current, a, socketId)
    setNote({ title: `${modeRef.current === 'volts' ? 'Volts' : 'Continuity'} ${socketName(a)} to ${socketName(socketId)}: ${r.headline}`, body: r.detail, sources: r.sources, tone: r.described ? 'info' : 'info' })
  }, [])

  const test = useCallback((id: string) => {
    const r = testCable(labRef.current, id)
    setNote({ title: `${id === 'spare' ? 'Spare Ethernet cable' : partById(id).label}: ${r.headline}`, body: r.detail, sources: r.sources, tone: r.pass ? 'ok' : 'bad' })
  }, [])

  const inspect = useCallback((id: string) => {
    if (id.startsWith('cable:')) {
      const pid = id.slice(6)
      if (pid === 'spare') {
        setNote({ title: 'Spare Ethernet cable', body: 'A spare cable for replacing a bad one. Use the cable tester to check a cable.', tone: 'info' })
        return
      }
      const p = partById(pid)
      setNote({ title: p.label, body: p.why, sources: p.sources, tone: 'info' })
      return
    }
    setInspected((s) => new Set(s).add(id))
    const c = COMPONENTS.find((x) => x.id === id)
    if (c) setNote({ title: c.title, body: c.facts.map((f) => f.text).join(' '), sources: c.facts.flatMap((f) => f.sources), tone: 'info' })
    else setNote({ title: id === 'wcm' ? 'WCM (not used on this unit)' : id, body: id === 'wcm' ? 'The small green board at the top left is the WCM. This unit was upgraded to an EMS-C and the WCM is not used.' : '', sources: [], tone: 'info' })
  }, [])

  // Build the scene once.
  useEffect(() => {
    if (!host.current) return
    let scene: InverterScene
    try {
      scene = new InverterScene(host.current, {
        onDrop: (id, s) => drop(id, s),
        onBolt: (s, d) => bolt(s, d),
        onProbe: (s) => probe(s),
        onTest: (id) => test(id),
        onInspect: (id) => inspect(id),
        onHover: (text, x, y) => setTip(text ? { text, x, y } : null),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WebGL is not available in this browser.')
      return
    }
    sceneRef.current = scene
    scene.sync(labRef.current)
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [drop, bolt, probe, test, inspect])

  useEffect(() => {
    sceneRef.current?.sync(lab)
  }, [lab])
  useEffect(() => {
    sceneRef.current?.setTool(tool)
    if (tool !== 'meter') setProbes([null, null])
  }, [tool])
  useEffect(() => {
    sceneRef.current?.setProbes(probes[0], probes[1])
  }, [probes])

  const newInverter = () => {
    setCreative(false)
    const s = randomSeed()
    const sc = makeLabScenario(s)
    setSeed(s)
    setLab(sc.lab)
    setInspected(new Set())
    setNote(null)
    setChecked(false)
    setRevealed(false)
    setProbes([null, null])
  }

  const startCreative = (kind: 'correct' | 'empty') => {
    setCreative(true)
    setLab(kind === 'empty' ? emptyLab() : correctLab())
    setInspected(new Set())
    setNote({ title: 'Creative mode', body: kind === 'empty' ? 'Every cable is on the bench and every bolt is loose. Build the box any way you like.' : 'A correct install. Take it apart, change it, test it. Nothing is graded unless you press Check wiring.', tone: 'info' })
    setChecked(false)
    setRevealed(false)
    setProbes([null, null])
  }

  const reveal = () => {
    setRevealed(true)
    setChecked(true)
  }

  const cableChoices = [...PARTS.map((p) => ({ id: p.id, label: p.label })), { id: 'spare', label: 'Spare Ethernet cable' }]
  const socketChoices = SOCKETS.filter((s) => (selCable === 'spare' ? s.kind === 'rj45' : fits(partById(selCable), s)))
  const kbMove = () => drop(selCable, selSocket === 'bench' ? null : selSocket)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Mode">
        <button type="button" aria-pressed={!creative} className={creative ? ui.ghost : ui.primary} onClick={() => { if (creative) { setCreative(false); setLab(scenario.lab); setNote(null); setChecked(false); setProbes([null, null]) } }}>
          Find the fault
        </button>
        <button type="button" aria-pressed={creative} className={creative ? ui.primary : ui.ghost} onClick={() => startCreative('correct')}>
          Creative sandbox
        </button>
      </div>

      {creative ? (
        <section className={`${ui.card} space-y-2 p-4`}>
          <h2 className="text-base font-semibold">Creative sandbox</h2>
          <p className="text-sm">No call, no tasks and no score. Move cables, turn bolts, test with the meter and the cable tester, and try things to see what happens. Press Check wiring any time to see what the sources say about the current wiring.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={ui.ghost} onClick={() => startCreative('correct')}>Reset to a correct install</button>
            <button type="button" className={ui.ghost} onClick={() => startCreative('empty')}>Start with an empty box</button>
            <button type="button" className={ui.ghost} aria-pressed={lab.gridOn} onClick={() => update({ ...lab, gridOn: !lab.gridOn })}>
              Grid breaker: {lab.gridOn ? 'on' : 'off'}
            </button>
          </div>
        </section>
      ) : (
        <section className={`${ui.card} space-y-1 p-4`} aria-live="polite">
          <h2 className="text-base font-semibold">The call</h2>
          <p className="text-sm">
            A Rev 4 inverter was just installed. {scenario.symptoms.join(' ')} Find what is wrong, fix it, and make every wire correct and every bolt tight.
          </p>
        </section>
      )}

      <div className="relative overflow-hidden rounded-xl border border-[#1d4f80] bg-[#0b1220]" style={{ height: 'min(80vh, 780px)', minHeight: 480 }}>
        <div ref={host} className="absolute inset-0" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
            <p>3D view is not available here ({error}). Use the 2D wire box simulator instead.</p>
          </div>
        )}

        <div className={`pointer-events-none absolute left-3 top-3 w-[min(21rem,calc(100%-5.5rem))] p-3 ${PANEL}`}>
          <div className="flex items-start gap-2.5">
            <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-8 w-8 shrink-0 text-[#3b9bff]" fill="currentColor">
              <path d="M13.5 2 5 13.2h5.4L9.6 22 19 9.8h-5.6z" />
            </svg>
            <div className="min-w-0">
              <div className="text-base font-semibold leading-tight sm:text-lg">{creative ? 'Inverter Creative Sandbox' : 'Inverter Training Simulator'}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-slate-300">
                {creative ? 'No tasks. Build it, break it, test it.' : 'Explore the inverter, identify components, and complete tasks.'}
              </div>
            </div>
          </div>
          {!creative && (
            <>
              <div className="mt-2.5 text-sm font-semibold">Progress: {progress}%</div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[#173a63]">
                <div className="h-full rounded-full bg-[#3b9bff] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          <p className="mt-2 text-[11px] leading-snug text-slate-300">{hintTool.hint}</p>
        </div>

        <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-2">
          <button
            type="button"
            aria-label="View settings"
            aria-expanded={showSettings}
            onClick={() => setShowSettings((x) => !x)}
            className={`pointer-events-auto flex h-11 w-11 items-center justify-center ${PANEL} hover:bg-[#0d2646]`}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 text-[#3b9bff]" fill="currentColor">
              <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.4 7.4 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6c-.6.2-1.2.6-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6a.5.5 0 0 0-.1.6l2 3.5c.1.2.4.3.6.2l2.5-1c.5.4 1.1.8 1.7 1l.4 2.6c0 .2.2.4.5.4h4c.3 0 .5-.2.5-.4l.4-2.6c.6-.2 1.2-.6 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
            </svg>
          </button>
          {showSettings && (
            <div className={`pointer-events-auto w-52 p-3 text-sm ${PANEL}`}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={labelsOn} onChange={(e) => { setLabelsOn(e.target.checked); sceneRef.current?.setLabels(e.target.checked) }} />
                Part labels and cable tags
              </label>
            </div>
          )}
          <div className={`${creative ? 'hidden' : 'hidden sm:block'} w-64 p-4 ${PANEL}`}>
            <div className="text-lg font-semibold text-[#3b9bff]">Task Checklist</div>
            <ul className="mt-3 space-y-3 text-[13px] leading-snug">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${t.done ? 'border-[#3b9bff] bg-[#3b9bff]' : 'border-[#3b9bff]'}`}
                  >
                    {t.done && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3 text-[#081a30]" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="m2.5 6.2 2.2 2.2 4.8-4.8" />
                      </svg>
                    )}
                  </span>
                  <span className={t.done ? 'text-slate-400 line-through' : ''}>
                    {t.label}
                    {t.done && <span className="sr-only"> (done)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
          <div className="pointer-events-auto flex min-w-0 flex-col gap-2">
            <div className={`flex flex-wrap gap-1.5 p-1.5 ${PANEL}`} role="toolbar" aria-label="Tools">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  aria-pressed={tool === t.id}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${tool === t.id ? 'bg-[#2f8cff] text-white' : 'bg-[#0f2a4a] text-slate-100 hover:bg-[#15375f]'}`}
                >
                  {t.label}
                </button>
              ))}
              {tool === 'meter' && (
                <button type="button" onClick={() => { setMode((m) => (m === 'volts' ? 'continuity' : 'volts')); setProbes([null, null]) }} className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-slate-950">
                  {mode === 'volts' ? 'Volts' : 'Continuity'}
                </button>
              )}
            </div>
            <div className={`hidden items-center gap-5 px-4 py-2.5 sm:flex ${PANEL}`} aria-hidden>
              {[
                { label: 'Rotate', icon: 'M12 3a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v1h-6V8a3 3 0 0 1 3-3z' },
                { label: 'Zoom', icon: 'M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z' },
                { label: 'Pan', icon: 'M12 2 8.5 5.5h2.5V11H5.5V8.5L2 12l3.5 3.5V13H11v5.5H8.5L12 22l3.5-3.5H13V13h5.5v2.5L22 12l-3.5-3.5V11H13V5.5h2.5z' },
              ].map((x) => (
                <div key={x.label} className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-200">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#3b9bff]" fill="currentColor">
                    <path d={x.icon} />
                  </svg>
                  {x.label}
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-auto relative shrink-0">
            {showViews && (
              <div className={`absolute bottom-full right-0 mb-2 w-44 p-1.5 ${PANEL}`} role="menu">
                {CAMERA_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitem"
                    onClick={() => { setView(c.label); setShowViews(false); sceneRef.current?.flyTo(c.id) }}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-100 hover:bg-[#15375f]"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setShowViews((x) => !x)} aria-expanded={showViews} className={`flex w-28 flex-col items-center gap-1 px-3 py-2.5 hover:bg-[#0d2646] sm:w-32 ${PANEL}`}>
              <svg aria-hidden viewBox="0 0 40 56" className="h-12 w-9">
                <rect x="6" y="2" width="28" height="52" rx="3" fill="#1b1d22" stroke="#3b9bff" strokeWidth="1.5" />
                <rect x="9" y="16" width="22" height="14" fill="#14633a" />
                <rect x="9" y="33" width="22" height="9" fill="#2a2d32" />
                <path d="M20 4v6M17 7l3-3 3 3" stroke="#3b9bff" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="text-xs font-semibold text-[#3b9bff]">{view}</span>
            </button>
          </div>
        </div>

        {tip && (
          <div className="pointer-events-none fixed z-50 rounded-lg border border-[#1d4f80] bg-[#081a30]/95 px-2.5 py-1.5 text-xs text-white shadow" style={{ left: tip.x + 12, top: tip.y + 12 }}>
            {tip.text}
          </div>
        )}
      </div>

      <section className={`${ui.card} p-4 sm:hidden ${creative ? 'hidden' : ''}`} aria-label="Task checklist">
        <h2 className="text-base font-semibold">Task checklist ({progress}%)</h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-start gap-2">
              <span aria-hidden className={`mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-full border ${t.done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-400'}`} />
              <span className={t.done ? 'line-through opacity-60' : ''}>{t.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {note && (
        <section data-testid="lab-note" className={`${ui.card} p-4 ${note.tone === 'bad' ? 'border-red-400' : note.tone === 'ok' ? 'border-emerald-400' : ''}`} aria-live="polite">
          <h2 className="text-base font-semibold">{note.title}</h2>
          {note.body && <p className="mt-1 text-sm">{note.body}</p>}
          {note.sources && note.sources.length > 0 && <SourceNote sources={note.sources} />}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.primary} onClick={() => setChecked(true)}>
          {creative ? 'Check wiring' : 'Check my work'}
        </button>
        {!creative && (
          <button type="button" className={ui.ghost} onClick={reveal}>
            Show me what was wrong
          </button>
        )}
        <button type="button" className={ui.ghost} onClick={newInverter}>
          New inverter
        </button>
      </div>

      {checked && (
        <section className={`${ui.card} space-y-3 p-4`} aria-live="polite">
          <h2 className="text-base font-semibold">{grade.done ? 'Everything is correct and every bolt is tight.' : 'Not right yet'}</h2>
          {!grade.done && (
            <ul className="space-y-3 text-sm">
              {grade.issues.map((i, n) => (
                <li key={n} className={`border-l-4 pl-3 ${i.kind === 'missing' ? 'border-amber-500' : 'border-red-500'}`}>
                  {i.kind === 'wire' && i.partId ? <strong>{partById(i.partId).label}: </strong> : null}
                  {i.text}
                  {i.sources.length > 0 && <SourceNote sources={i.sources} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {revealed && !creative && (
        <section className={`${ui.card} space-y-2 p-4`}>
          <h2 className="text-base font-semibold">What was wrong</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {scenario.titles.map((t, i) => (
              <li key={t}>
                <strong>{t}.</strong> {scenario.fixes[i]}
              </li>
            ))}
          </ul>
          <SourceNote sources={scenario.sources} />
          <p className="text-xs text-amber-800 dark:text-amber-300">{TORQUE_TODO}</p>
        </section>
      )}

      <Disclosure title={<span className="font-semibold">No mouse drag? Use the menus</span>}>
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="block">
              <span className="text-xs font-medium">Cable</span>
              <select className={`${ui.input} mt-1`} value={selCable} onChange={(e) => { setSelCable(e.target.value); setSelSocket('bench') }}>
                {cableChoices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                    {c.id !== 'spare' && lab.wires[c.id] ? ` (on ${socketName(lab.wires[c.id]!)})` : c.id === 'spare' && lab.spare ? ` (on ${socketName(lab.spare)})` : ' (on the bench)'}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium">Move to</span>
              <select className={`${ui.input} mt-1`} value={selSocket} onChange={(e) => setSelSocket(e.target.value)}>
                <option value="bench">The bench (unplug)</option>
                {socketChoices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.group}: {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={`${ui.primary} self-end`} onClick={kbMove}>
              Move cable
            </button>
          </div>
          <div>
            <div className="text-xs font-medium">Bolts</div>
            <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">
              {FASTENED_IDS.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2 rounded border border-slate-200 px-2 py-1 dark:border-slate-700">
                  <span>
                    {socketById(id).group}: {socketName(id)} <span className={ui.muted}>({lab.fasteners[id]})</span>
                  </span>
                  <span className="flex gap-1">
                    <button type="button" className={ui.ghost} onClick={() => bolt(id, 'loosen')}>
                      Loosen
                    </button>
                    <button type="button" className={ui.ghost} onClick={() => bolt(id, 'tighten')}>
                      Tighten
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Disclosure>

      <p className={`text-xs ${ui.muted}`}>
        Every explanation cites the Technical Service Manual, the EMS-C manual or the author. Colors in the 3D view are sim colors only. The layout follows the author&apos;s photos of the Rev 4 training unit, not an engineering drawing.
      </p>
    </div>
  )
}
