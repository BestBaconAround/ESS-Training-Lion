import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import IdeaCard from '../ask/IdeaCard'
import { buildCorpus } from '../ask/corpus'
import { EMPTY_ANALYSIS, analyzeNotes, detectFaultCodes } from '../ask/notes'
import { SearchIndex } from '../ask/search'
import { Disclosure, PageHeader, ui } from '../components/ui'
import { FAULT_CODES, faultByCode } from '../content/data/faults'
import { REVISION_LABELS } from '../content/labels'
import {
  CALLER_TYPES, CHECKLIST, CHECK_GROUPS, COMMUNICATOR_CHOICES, OUTCOMES, PATTERNS, PRIVACY_NOTE, REVISION_CHOICES, YES_NO,
} from '../content/ticket'
import { ESCALATION } from '../content/troubleshooting'
import { copyText } from '../lib/clipboard'
import { analysisText, durationText, formatTicket, isBlank, loadTicket, newTicket, saveTicket, type Ticket } from '../ticket/ticket'

let index: SearchIndex | null = null
const getIndex = () => (index ??= new SearchIndex(buildCorpus()))

function tabStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  )
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <fieldset className="text-sm">
      <legend className="mb-1 font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(value === o.value ? '' : o.value)}
            className={`rounded-lg px-3 py-1.5 ${value === o.value ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border border-slate-300 dark:border-slate-700'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** A ticket to fill out during a call. It stays in this browser tab; copy it into the ticket system when done. */
export default function TicketPage() {
  const navigate = useNavigate()
  const store = useMemo(tabStore, [])
  const [t, setT] = useState<Ticket>(() => loadTicket(store) ?? newTicket())
  const [now, setNow] = useState(() => new Date().toISOString())
  const [codeInput, setCodeInput] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')

  const set = <K extends keyof Ticket>(k: K, v: Ticket[K]) => setT((cur) => ({ ...cur, [k]: v }))

  useEffect(() => saveTicket(store, t), [store, t])
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const text = analysisText(t)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(text), 400)
    return () => window.clearTimeout(id)
  }, [text])

  const analysis = useMemo(() => (debounced.trim() ? analyzeNotes(debounced, getIndex()) : EMPTY_ANALYSIS), [debounced])
  const detectedCodes = useMemo(() => detectFaultCodes([t.reason, t.readings, t.actions, t.notes].join('\n')).filter((c) => !t.codes.includes(c)), [t.reason, t.readings, t.actions, t.notes, t.codes])
  const detectedRevision = useMemo(() => (t.revision ? [] : analysis.revisions), [t.revision, analysis.revisions])

  const addCodes = (raw: string) => {
    const found = detectFaultCodes(raw)
    if (found.length === 0) {
      setStatus(raw.trim() ? `${raw.trim()} is not a code in the fault table.` : '')
      return
    }
    setT((cur) => ({ ...cur, codes: [...cur.codes, ...found.filter((c) => !cur.codes.includes(c))] }))
    setCodeInput('')
    setStatus('')
  }

  const ticketText = useMemo(() => formatTicket(t), [t])
  const flash = (m: string) => {
    setStatus(m)
    window.setTimeout(() => setStatus(''), 2500)
  }
  const copy = async () => flash((await copyText(ticketText)) ? 'Ticket copied.' : 'Could not copy. Open the preview and select the text.')
  const download = () => {
    const url = URL.createObjectURL(new Blob([ticketText], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  const clear = () => {
    if (!isBlank(t) && !window.confirm('Clear this ticket? This cannot be undone.')) return
    setT(newTicket())
    setCodeInput('')
    setStatus('')
  }
  const endCall = () => set('endedAt', t.endedAt ? '' : new Date().toISOString())

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={ui.primary} onClick={copy}>
        Copy ticket
      </button>
      <button type="button" className={ui.ghost} onClick={download}>
        Download .txt
      </button>
      <button type="button" className={ui.ghost} onClick={() => window.print()}>
        Print
      </button>
      <button type="button" className={ui.ghost} onClick={clear}>
        New ticket
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Call ticket" lead="Fill this out while you are on the call. It checks your notes against the reference material and gives you ideas as you type." />

      <p className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100" role="note">
        {PRIVACY_NOTE}
      </p>

      <section className={`${ui.card} space-y-3 p-4 print:hidden`} aria-label="Ticket bar">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Ticket number (made here; replace it with your ticket system's number)">
            <input className={ui.input} value={t.id} onChange={(e) => set('id', e.target.value)} />
          </Field>
          <div className="text-sm">
            <div className="font-medium">{t.endedAt ? 'Call length' : 'On the call'}</div>
            <div className="text-lg font-semibold tabular-nums" aria-live="off">
              {durationText(t.startedAt, t.endedAt || now)}
            </div>
            <button type="button" className={`${ui.ghost} mt-1`} onClick={endCall}>
              {t.endedAt ? 'Reopen call' : 'End call'}
            </button>
          </div>
        </div>
        {actions}
        <p role="status" className={`text-sm ${ui.muted}`}>
          {status}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4 print:hidden">
          <Disclosure title={<span className="font-semibold">The caller</span>} defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Choice label="Who is calling" value={t.callerType} options={CALLER_TYPES} onChange={(v) => set('callerType', v)} />
              </div>
              <Field label="Name">
                <input className={ui.input} value={t.callerName} onChange={(e) => set('callerName', e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Phone">
                <input className={ui.input} inputMode="tel" value={t.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Email" wide>
                <input className={ui.input} inputMode="email" value={t.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
              </Field>
            </div>
          </Disclosure>

          <Disclosure title={<span className="font-semibold">The system</span>} defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="System name or serial number" wide>
                <input className={ui.input} value={t.systemName} onChange={(e) => set('systemName', e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Address (city and state is enough)" wide>
                <input className={ui.input} value={t.address} onChange={(e) => set('address', e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Installer or company">
                <input className={ui.input} value={t.installer} onChange={(e) => set('installer', e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Firmware version">
                <input className={ui.input} value={t.firmware} onChange={(e) => set('firmware', e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Number of inverters">
                <input className={ui.input} inputMode="numeric" value={t.inverters} onChange={(e) => set('inverters', e.target.value)} />
              </Field>
              <Field label="Number of batteries">
                <input className={ui.input} inputMode="numeric" value={t.batteries} onChange={(e) => set('batteries', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Choice label="Revision" value={t.revision} options={REVISION_CHOICES} onChange={(v) => set('revision', v)} />
                {detectedRevision.length > 0 && (
                  <p className="mt-1 text-xs">
                    Your notes mention{' '}
                    {detectedRevision.map((r) => (
                      <button key={r} type="button" className={`${ui.link} mr-2`} onClick={() => set('revision', r)}>
                        use {REVISION_LABELS[r]}
                      </button>
                    ))}
                  </p>
                )}
              </div>
              <Choice label="Communicator" value={t.communicator} options={COMMUNICATOR_CHOICES} onChange={(v) => set('communicator', v)} />
              <Choice label="Commissioned" value={t.commissioned} options={YES_NO} onChange={(v) => set('commissioned', v)} />
            </div>
          </Disclosure>

          <Disclosure title={<span className="font-semibold">The problem</span>} defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Reason for the call. What is the concern, in the customer's words?" wide>
                <textarea className={ui.input} rows={4} value={t.reason} onChange={(e) => set('reason', e.target.value)} />
              </Field>
              <Choice label="Is it intermittent or consistent?" value={t.pattern} options={PATTERNS} onChange={(v) => set('pattern', v)} />
              <Field label="When did it start?">
                <input className={ui.input} value={t.began} onChange={(e) => set('began', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">Alerts and faults</span>
                <div className="flex flex-wrap gap-2">
                  <input
                    className={`${ui.input} max-w-[12rem]`}
                    list="fault-codes"
                    placeholder="A2_11"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCodes(codeInput)
                      }
                    }}
                    aria-label="Fault code"
                  />
                  <datalist id="fault-codes">
                    {FAULT_CODES.map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.name}
                      </option>
                    ))}
                  </datalist>
                  <button type="button" className={ui.ghost} onClick={() => addCodes(codeInput)}>
                    Add code
                  </button>
                </div>
                {t.codes.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {t.codes.map((c) => (
                      <li key={c} className="flex items-center gap-1 rounded-full border border-slate-300 py-1 pl-3 pr-1 text-sm dark:border-slate-700">
                        <Link className={ui.link} to={`/troubleshooting#ts-fault-${c.toLowerCase()}`}>
                          {c} {faultByCode(c)?.name}
                        </Link>
                        <button type="button" aria-label={`Remove ${c}`} className="rounded-full px-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => set('codes', t.codes.filter((x) => x !== c))}>
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {detectedCodes.length > 0 && (
                  <p className="mt-2 text-xs">
                    Codes in your notes:{' '}
                    {detectedCodes.map((c) => (
                      <button key={c} type="button" className={`${ui.link} mr-2`} onClick={() => addCodes(c)}>
                        add {c}
                      </button>
                    ))}
                  </p>
                )}
              </div>
              <Field label="Readings (battery voltages, PV strings, grid voltage, lights)" wide>
                <textarea className={ui.input} rows={3} value={t.readings} onChange={(e) => set('readings', e.target.value)} placeholder="Battery 1 51.8V, battery 2 50.2V. Fault light red." />
              </Field>
            </div>
          </Disclosure>

          <Disclosure title={<span className="font-semibold">What you checked</span>} right={<span className={`text-xs ${ui.muted}`}>{CHECKLIST.filter((c) => t.checks[c.id]).length}/{CHECKLIST.length}</span>} defaultOpen>
            <div className="space-y-4">
              {CHECK_GROUPS.map((g) => (
                <fieldset key={g}>
                  <legend className="mb-1 text-sm font-semibold">{g}</legend>
                  <ul className="space-y-1.5">
                    {CHECKLIST.filter((c) => c.group === g).map((c) => (
                      <li key={c.id}>
                        <label className="flex items-start gap-2 text-sm">
                          <input type="checkbox" className="mt-1 h-4 w-4" checked={!!t.checks[c.id]} onChange={(e) => set('checks', { ...t.checks, [c.id]: e.target.checked })} />
                          <span>{c.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ))}
              <p className={`text-xs ${ui.muted}`}>
                The steps behind these are in <Link className={ui.link} to="/troubleshooting">Troubleshooting</Link> and <Link className={ui.link} to="/procedures">Procedures</Link>.
              </p>
            </div>
          </Disclosure>

          <Disclosure title={<span className="font-semibold">What you did and how it ended</span>} defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="What was done on the call" wide>
                <textarea className={ui.input} rows={4} value={t.actions} onChange={(e) => set('actions', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Choice label="How did the call end" value={t.outcome} options={OUTCOMES} onChange={(v) => set('outcome', v)} />
              </div>
              <Field label="Next steps" wide>
                <textarea className={ui.input} rows={3} value={t.nextSteps} onChange={(e) => set('nextSteps', e.target.value)} />
              </Field>
              <Field label="Follow up on">
                <input type="date" className={ui.input} value={t.followUp} onChange={(e) => set('followUp', e.target.value)} />
              </Field>
              {(t.outcome === 'escalated' || t.outcome === 'rma') && (
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 sm:col-span-2 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                  <span className="font-semibold">Where to send it: </span>
                  {ESCALATION.text}
                </p>
              )}
            </div>
          </Disclosure>

          <Disclosure title={<span className="font-semibold">Notes</span>} defaultOpen>
            <textarea className={ui.input} rows={5} value={t.notes} onChange={(e) => set('notes', e.target.value)} aria-label="Notes" />
          </Disclosure>
        </div>

        <aside className="space-y-3 print:hidden lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto" aria-label="Ideas to check" aria-live="polite">
          <h2 className="text-base font-semibold">Ideas to check</h2>
          {analysis.ideas.length === 0 ? (
            <p className={`rounded-lg border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700 ${ui.muted}`}>
              Type what the customer says, a fault code, a light color or a voltage reading, and ideas from the reference material appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {analysis.ideas.map((i) => (
                <IdeaCard key={i.id} idea={i} onOpenEntry={(id) => navigate(`/troubleshooting#${id}`)} />
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="print:hidden">{actions}</div>

      <pre className="hidden whitespace-pre-wrap text-sm print:block">{ticketText}</pre>

      <Disclosure title={<span className="font-semibold">Preview the text</span>} className="print:hidden">
        <pre className="whitespace-pre-wrap break-words text-sm">{ticketText}</pre>
      </Disclosure>
    </div>
  )
}
