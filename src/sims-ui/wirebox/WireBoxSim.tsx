import { useCallback, useMemo, useRef, useState } from 'react'
import SourceNote from '../../components/SourceNote'
import { Disclosure, ui } from '../../components/ui'
import { BOARDS, PARTS, SOCKETS, partById, socketById, type Part, type Socket } from '../../content/sims/wireBox'
import { randomSeed } from '../../sims/rng'
import { correctState, emptyState, fits, grade, makeFixScenario, occupant, place, type Grade, type WireState } from '../../sims/wirebox/engine'

type Mode = 'fix' | 'build'

const W = 1160
const H = 700

/** Sim colors only (the documents do not give wire colors). Each is dark enough for white text in both themes. */
function partColor(p: Part): string {
  switch (p.kind) {
    case 'battery': return p.tag.includes('+') ? '#b91c1c' : '#334155'
    case 'pv': return p.tag.includes('+') ? '#c2410c' : '#475569'
    case 'ac': return p.label.endsWith('L1') ? '#a16207' : p.label.endsWith('L2') ? '#1d4ed8' : '#4b5563'
    case 'ethernet': return '#0369a1'
    case 'antenna': return '#7e22ce'
    case 'plug': return '#047857'
  }
}

interface Drag {
  partId: string
  x: number
  y: number
  moved: boolean
  startX: number
  startY: number
}

/** Position of the end of the stub (where the cable tag sits). */
function stubGeometry(s: Socket, index: number) {
  const extra = (index % 2) * 22
  const len = 34 + extra
  const cx = s.x + s.w / 2
  const cy = s.y + s.h / 2
  if (s.stub === 'up') return { x1: cx, y1: s.y, x2: cx, y2: s.y - len, tx: cx, ty: s.y - len - 6, anchor: 'middle' as const }
  if (s.stub === 'down') return { x1: cx, y1: s.y + s.h, x2: cx, y2: s.y + s.h + len, tx: cx, ty: s.y + s.h + len + 12, anchor: 'middle' as const }
  return { x1: s.x, y1: cy, x2: s.x - 36, y2: cy, tx: s.x - 40, ty: cy + 4, anchor: 'end' as const }
}

export default function WireBoxSim() {
  const [mode, setMode] = useState<Mode>('fix')
  const [seed, setSeed] = useState(() => randomSeed())
  const scenario = useMemo(() => makeFixScenario(seed), [seed])
  const [state, setState] = useState<WireState>(() => scenario.state)
  const [selected, setSelected] = useState<string | null>(null)
  const [boardId, setBoardId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Grade | null>(null)
  const [checks, setChecks] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const startFix = useCallback((s: number) => {
    const sc = makeFixScenario(s)
    setSeed(s)
    setState(sc.state)
    setSelected(null)
    setChecked(null)
    setChecks(0)
    setMessage(null)
    setRevealed(false)
    setGaveUp(false)
  }, [])

  const switchMode = (m: Mode) => {
    setMode(m)
    setSelected(null)
    setChecked(null)
    setMessage(null)
    setRevealed(false)
    setGaveUp(false)
    setChecks(0)
    setState(m === 'fix' ? makeFixScenario(seed).state : emptyState())
  }

  const apply = useCallback((partId: string, socketId: string | null) => {
    const r = place(stateRef.current, partId, socketId)
    if (r.rejected) {
      setMessage(r.rejected)
      return
    }
    setState(r.state)
    setChecked(null)
    setSelected(partId)
    setMessage(
      socketId === null
        ? `${partById(partId).label} unplugged.`
        : r.displaced
          ? `${partById(partId).label} connected to ${socketById(socketId).label}. ${partById(r.displaced).label} moved.`
          : `${partById(partId).label} connected to ${socketById(socketId).label}.`,
    )
  }, [])

  const applyRef = useRef(apply)
  applyRef.current = apply

  // Drag with pointer events (mouse, touch and pen). Listeners are attached on press so a fast drag is never missed.
  // A press without movement just selects the part.
  const beginDrag = (partId: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    const start: Drag = { partId, x: e.clientX, y: e.clientY, moved: false, startX: e.clientX, startY: e.clientY }
    dragRef.current = start
    setDrag(start)
    const move = (ev: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const moved = d.moved || Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) > 6
      dragRef.current = { ...d, x: ev.clientX, y: ev.clientY, moved }
      setDrag(dragRef.current)
      if (moved) {
        // Edge scrolling. The sticky tray sits at the bottom, so a drag that starts there only scrolls up.
        if (ev.clientY < 70) window.scrollBy(0, -16)
        else if (ev.clientY > window.innerHeight - 30 && d.startY < window.innerHeight - 170) window.scrollBy(0, 16)
      }
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      const d = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (!d) return
      if (!d.moved) {
        setSelected((cur) => (cur === d.partId ? null : d.partId))
        return
      }
      const els = document.elementsFromPoint(ev.clientX, ev.clientY)
      const sockEl = els.find((el) => (el as HTMLElement).dataset?.socket) as HTMLElement | undefined
      const trayEl = els.find((el) => (el as HTMLElement).dataset?.tray)
      if (sockEl?.dataset.socket) applyRef.current(d.partId, sockEl.dataset.socket)
      else if (trayEl) applyRef.current(d.partId, null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const onSocketClick = (socketId: string) => {
    if (selected) apply(selected, socketId)
    else {
      const o = occupant(state, socketId)
      if (o) setSelected(o)
    }
  }

  const check = () => {
    const g = grade(state)
    setChecked(g)
    setChecks((n) => n + 1)
    if (g.done && mode === 'fix') setRevealed(true)
  }

  const tray = PARTS.filter((p) => !state[p.id])
  const selPart = selected ? partById(selected) : null
  const selSocketOptions = selPart ? SOCKETS.filter((s) => fits(selPart, s)) : []
  /** Alternate the cable tag height for neighbors, so tags in a row do not overlap. */
  const rank = useMemo(() => {
    const r: Record<string, number> = {}
    const keys = Array.from(new Set(SOCKETS.map((x) => `${x.group}|${x.stub}`)))
    for (const k of keys) {
      SOCKETS.filter((x) => `${x.group}|${x.stub}` === k)
        .sort((a, b) => a.x - b.x || a.y - b.y)
        .forEach((x, i) => (r[x.id] = i))
    }
    return r
  }, [])
  const statusOf = (partId: string) => checked?.results.find((r) => r.partId === partId)?.status
  const board = BOARDS.find((b) => b.id === boardId)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Mode">
        {(['fix', 'build'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${mode === m ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border border-slate-300 dark:border-slate-700'}`}
          >
            {m === 'fix' ? 'Find and fix' : 'Build it'}
          </button>
        ))}
        <span className={`text-sm ${ui.muted}`}>Rev 4 inverter wire box, single inverter. {mode === 'fix' ? 'Something is wired wrong. Find it and fix it.' : 'Wire the box from an empty tray.'}</span>
      </div>

      {mode === 'fix' && (
        <section className={`${ui.card} space-y-2 p-4`}>
          <h2 className="text-base font-semibold">Customer or technician report</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {scenario.symptoms.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className={`text-sm ${ui.muted}`}>Look over the cables, then drag or select the wrong ones and put them right. Tap a board for what it does.</p>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.primary} onClick={check}>
          Check my wiring
        </button>
        {mode === 'fix' ? (
          <>
            <button type="button" className={ui.ghost} onClick={() => startFix(randomSeed())}>
              New problem
            </button>
            <button type="button" className={ui.ghost} onClick={() => { setState(scenario.state); setChecked(null); setMessage('Back to the original wiring.') }}>
              Undo my changes
            </button>
            <button type="button" className={ui.ghost} onClick={() => { setRevealed(true); setGaveUp(true); setState(correctState()); setChecked(null) }}>
              Show the answer
            </button>
          </>
        ) : (
          <>
            <button type="button" className={ui.ghost} onClick={() => { setState(emptyState()); setChecked(null); setMessage(null) }}>
              Clear all
            </button>
            <button type="button" className={ui.ghost} onClick={() => { setState(correctState()); setChecked(null) }}>
              Show a correct build
            </button>
          </>
        )}
      </div>

      {message && (
        <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
          {message}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[860px] w-full select-none" role="group" aria-label="Rev 4 wire box diagram">
          <rect x="140" y="80" width="990" height="600" rx="10" className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-700" />
          {BOARDS.map((b) => (
            <g key={b.id} onClick={() => setBoardId(b.id === boardId ? null : b.id)} className="cursor-pointer">
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="8"
                className={`${b.id === 'wcm' ? 'fill-emerald-100 dark:fill-emerald-950' : b.id === 'busbars' ? 'fill-slate-200 dark:fill-slate-800' : 'fill-emerald-50 dark:fill-emerald-950/60'} ${boardId === b.id ? 'stroke-amber-500' : 'stroke-emerald-700/50'}`}
                strokeWidth={boardId === b.id ? 3 : 1.5}
              />
              <text x={b.x + 8} y={b.id === 'busbars' ? b.y + b.h - 8 : b.y + 16} className="fill-slate-700 text-[12px] font-semibold dark:fill-slate-200">
                {b.title.split(' (')[0]}
              </text>
            </g>
          ))}
          <text x="470" y="200" className="fill-slate-400 text-[10px]">Factory connectors (IGRID, NTC, DRMO, AC_240V, DRYO_2): not described in the documents</text>
          <text x="170" y="236" className="fill-slate-500 text-[11px]">WCM: not used on this unit</text>
          <text x="172" y="524" className="fill-slate-500 text-[9px]">Lights: STATUS CELLULAR BLUETOOTH POWER</text>
          <text x="440" y="368" className="fill-slate-600 text-[12px] font-semibold dark:fill-slate-300">PV inputs (fused)</text>
          <text x="440" y="530" className="fill-slate-600 text-[12px] font-semibold dark:fill-slate-300">GRID INPUT</text>
          <text x="680" y="530" className="fill-slate-600 text-[12px] font-semibold dark:fill-slate-300">GENERATOR</text>
          <text x="920" y="530" className="fill-slate-600 text-[12px] font-semibold dark:fill-slate-300">LOAD OUTPUT</text>
          
          {SOCKETS.map((s) => {
            const i = rank[s.id]
            const o = occupant(state, s.id)
            const part = o ? partById(o) : null
            const st = o ? statusOf(o) : undefined
            const g = stubGeometry(s, i)
            const outline = st === 'correct' ? '#16a34a' : st === 'wrong' ? '#dc2626' : selPart && fits(selPart, s) ? '#f59e0b' : undefined
            return (
              <g key={s.id}>
                <rect
                  data-socket={s.id}
                  x={s.x}
                  y={s.y}
                  width={s.w}
                  height={s.h}
                  rx={s.kind === 'rj45' ? 3 : 5}
                  className={`${s.kind === 'rj45' ? 'fill-slate-800' : s.kind === 'plug' ? 'fill-amber-100 dark:fill-amber-950' : s.kind === 'antenna' ? 'fill-violet-100 dark:fill-violet-950' : 'fill-slate-100 dark:fill-slate-800'} stroke-slate-500 cursor-pointer`}
                  strokeWidth={outline ? 3 : 1.2}
                  style={outline ? { stroke: outline } : undefined}
                  onClick={() => onSocketClick(s.id)}
                  aria-label={s.label}
                />
                <text
                  x={s.x + s.w / 2}
                  y={s.y + s.h / 2 + 4}
                  textAnchor="middle"
                  pointerEvents="none"
                  className={`${s.kind === 'plug' ? 'text-[9px]' : 'text-[10px]'} font-medium ${s.kind === 'rj45' ? 'fill-white' : 'fill-slate-700 dark:fill-slate-200'}`}
                >
                  {s.short ?? s.label}
                </text>
                {part && (
                  <g onPointerDown={beginDrag(part.id)} className="cursor-grab" style={{ touchAction: 'none' }}>
                    <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={partColor(part)} strokeWidth={part.kind === 'ethernet' ? 5 : 4} strokeLinecap="round" />
                    <circle cx={g.x1} cy={g.y1} r="5" fill={partColor(part)} />
                    <rect
                      x={g.anchor === 'end' ? g.tx - part.tag.length * 5.6 - 10 : g.tx - (part.tag.length * 5.6 + 10) / 2}
                      y={g.ty - 12}
                      width={part.tag.length * 5.6 + 10}
                      height="17"
                      rx="4"
                      fill={partColor(part)}
                      stroke={selected === part.id ? '#f59e0b' : 'transparent'}
                      strokeWidth="3"
                    />
                    <text x={g.anchor === 'end' ? g.tx - 5 : g.tx} y={g.ty} textAnchor={g.anchor} className="fill-white text-[10px] font-medium" pointerEvents="none">
                      {part.tag}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {board && (
        <section className={`${ui.card} space-y-2 p-4`}>
          <h2 className="text-base font-semibold">{board.title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {board.facts.map((f) => (
              <li key={f.text}>
                {f.text}
                <SourceNote sources={f.sources} />
              </li>
            ))}
          </ul>
          {board.todo && <p className="text-xs text-amber-800 dark:text-amber-300">Still needed: {board.todo}</p>}
        </section>
      )}

      {checked && (
        <section className={`${ui.card} space-y-3 p-4`} aria-live="polite">
          <h2 className="text-base font-semibold">
            {checked.done ? (mode === 'fix' ? (gaveUp ? 'Answer shown. This is the correct wiring.' : `Fixed in ${checks} ${checks === 1 ? 'check' : 'checks'}.`) : 'Everything required is wired correctly.') : 'Not right yet'}
          </h2>
          {!checked.done && (
            <ul className="space-y-3 text-sm">
              {checked.results
                .filter((r) => r.status === 'wrong')
                .map((r) => (
                  <li key={r.partId} className="border-l-4 border-red-500 pl-3">
                    <strong>{partById(r.partId).label}</strong> is on {socketById(state[r.partId]!).label}. {r.note}
                    <SourceNote sources={r.sources} />
                  </li>
                ))}
              {checked.missing.map((id) => (
                <li key={id} className="border-l-4 border-amber-500 pl-3">
                  <strong>{partById(id).label}</strong> is not connected. {partById(id).why}
                  <SourceNote sources={partById(id).sources} />
                </li>
              ))}
              {checked.incompletePv.map((id) => (
                <li key={id} className="border-l-4 border-amber-500 pl-3">
                  <strong>{partById(id).label}</strong> is not connected. A PV input needs both its + and - wire.
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {mode === 'fix' && revealed && (
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
        </section>
      )}

      <Disclosure title={<span className="font-semibold">Reference photos (author training unit, Rev 4)</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { src: 'images/rev4-wire-box-cover-diagram.webp', alt: 'The Rev 4 diagram inside the wire box cover with the labeled terminals and ports.', cap: 'Diagram inside the wire box cover (Rev 4).' },
            { src: 'images/rev4-wiring-compartment.webp', alt: 'The Rev 4 wiring compartment with the control board, WCM, EMS-C, terminals and cables.', cap: 'The wiring compartment.' },
            { src: 'images/rev4-board-ports.webp', alt: 'Close-up of the control board ports with their front and back labels.', cap: 'Control board ports.' },
            { src: 'images/wire-box-cables.webp', alt: 'Cables entering the wire box.', cap: 'Cables in the wire box.' },
          ].map((im) => (
            <figure key={im.src} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              <a href={`${import.meta.env.BASE_URL}${im.src}`} target="_blank" rel="noreferrer">
                <img src={`${import.meta.env.BASE_URL}${im.src}`} alt={im.alt} loading="lazy" className="w-full rounded" />
              </a>
              <figcaption className="mt-2 text-xs">{im.cap}</figcaption>
            </figure>
          ))}
        </div>
      </Disclosure>

      <div className="sticky bottom-0 z-30 -mx-4 border-t border-slate-300 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95" data-tray="1">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section
            data-tray="1"
            className="min-w-0"
            onClick={() => {
              if (selPart && state[selPart.id]) apply(selPart.id, null)
            }}
          >
            <h2 className="text-sm font-semibold">
              Parts tray ({tray.length})<span className="hidden font-normal sm:inline">. Drag a part onto a terminal or port, or tap it and then tap the spot.</span>
            </h2>
            {tray.length === 0 ? (
              <p className="mt-1 text-sm">Everything is connected. Drag a cable here to unplug it.</p>
            ) : (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 sm:max-h-32 sm:flex-wrap sm:overflow-y-auto sm:overflow-x-visible">
                {tray.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onPointerDown={beginDrag(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: partColor(p), touchAction: 'none', outline: selected === p.id ? '3px solid #f59e0b' : undefined }}
                    className="shrink-0 cursor-grab rounded-md px-2 py-1 text-xs font-medium text-white"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className={selPart ? '' : 'hidden lg:block'}>
            <h2 className="text-sm font-semibold">Selected</h2>
            {selPart ? (
              <label className="mt-1 block text-xs">
                <strong>{selPart.label}</strong>
                <select className={`${ui.input} mt-1`} value={state[selPart.id] ?? ''} onChange={(e) => apply(selPart.id, e.target.value || null)}>
                  <option value="">In the tray (unplugged)</option>
                  {selSocketOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.group}: {s.label}
                      {occupant(state, s.id) && occupant(state, s.id) !== selPart.id ? ' (in use)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className={`mt-1 text-xs ${ui.muted}`}>Tap a cable or part to select it. This list works with the keyboard.</p>
            )}
          </section>
        </div>
      </div>

      {drag?.moved && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 rounded-md px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          style={{ left: drag.x + 8, top: drag.y + 8, background: partColor(partById(drag.partId)) }}
        >
          {partById(drag.partId).label}
        </div>
      )}
    </div>
  )
}
