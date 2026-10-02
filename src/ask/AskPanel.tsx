import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sourceText } from '../content/labels'
import { RevisionBadge } from '../components/SourceNote'
import { Chevron, ui } from '../components/ui'
import { useHistory } from '../history/HistoryContext'
import { snapshotAnswer } from '../history/entries'
import type { RevisionChoice } from '../troubleshooting/filter'
import { buildCorpus, type Chunk } from './corpus'
import { SearchIndex, type Hit } from './search'

const SUGGESTIONS = ["Battery reads 0 volts", 'A2_11', 'App cannot connect', 'Which pins are the CTs on?']

type Message =
  | { id: number; from: 'user'; text: string }
  | { id: number; from: 'bot'; text: string; hits?: Hit[] }

let index: SearchIndex | null = null
const getIndex = () => (index ??= new SearchIndex(buildCorpus()))

const appliesTo = (revisions: 'all' | readonly string[], rev: RevisionChoice) => rev === 'all' || revisions === 'all' || revisions.includes(rev)

export default function AskPanel({ onOpenEntry, rev }: { onOpenEntry: (entryId: string) => void; rev: RevisionChoice }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'bot',
      text: 'Ask about a battery, inverter or power problem. Answers come only from the reference material in this app.',
    },
  ])
  const [input, setInput] = useState('')
  const nextId = useRef(1)
  const history = useHistory()
  const lastQuestion = useRef<HTMLDivElement | null>(null)

  // After each new answer, bring the question and the start of its reply into view. Not on first render.
  useEffect(() => {
    if (messages.length <= 1) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    lastQuestion.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [messages.length])

  const ask = (question: string) => {
    const q = question.trim()
    if (!q) return
    const hits = getIndex().search(q, 3)
    // Saved only while the private history is unlocked; otherwise nothing is kept.
    history.recordAsk(q, snapshotAnswer(hits))
    const reply: Message =
      hits.length > 0
        ? { id: nextId.current + 1, from: 'bot', text: 'Here is what the reference material says.', hits }
        : {
            id: nextId.current + 1,
            from: 'bot',
            text: 'Nothing in the reference material matches that. Try a fault code, a symptom or a part name.',
          }
    setMessages((m) => [...m, { id: nextId.current, from: 'user', text: q }, reply])
    nextId.current += 2
    setInput('')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  const started = messages.length > 1

  return (
    <section aria-label="Ask the notes">
      <div className="space-y-3" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) =>
          m.from === 'user' ? (
            <div
              key={m.id}
              ref={i === messages.length - 2 ? lastQuestion : undefined}
              className="scroll-mt-28 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {m.text}
            </div>
          ) : m.hits ? (
            <Answer key={m.id} hits={m.hits} rev={rev} onOpenEntry={onOpenEntry} />
          ) : (
            <p key={m.id} className={`text-sm ${i === 0 ? ui.muted : ''}`}>
              {m.text}
            </p>
          ),
        )}
      </div>

      {!started && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Example questions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="ask-input">
          Your question
        </label>
        <input id="ask-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question" className={ui.input} />
        <button type="submit" disabled={!input.trim()} className={ui.primary}>
          Ask
        </button>
      </form>
    </section>
  )
}

function OpenLink({ chunk, onOpenEntry }: { chunk: Chunk; onOpenEntry: (id: string) => void }) {
  if (chunk.link.type === 'entry') {
    const id = chunk.link.entryId
    return (
      <button type="button" onClick={() => onOpenEntry(id)} className={ui.link}>
        Open the full entry
      </button>
    )
  }
  if (chunk.link.type === 'lesson') {
    return (
      <Link to={`/module/${chunk.link.moduleId}/lesson/${chunk.link.lessonId}`} className={ui.link}>
        Open the lesson
      </Link>
    )
  }
  if (chunk.link.type === 'page') {
    return (
      <Link to={chunk.link.to} className={ui.link}>
        {chunk.link.label}
      </Link>
    )
  }
  return null
}

/** Steps shown before "Show all". Keeps one answer from filling the screen. */
const PREVIEW_LINES = 3

function Answer({ hits, rev, onOpenEntry }: { hits: Hit[]; rev: RevisionChoice; onOpenEntry: (id: string) => void }) {
  const [best, ...others] = hits
  const [all, setAll] = useState(false)
  const lines = best.chunk.lines.filter((l) => appliesTo(l.revisions, rev)).slice(0, 8)
  const shown = all ? lines : lines.slice(0, PREVIEW_LINES)
  const sources = [...new Set(lines.flatMap((l) => l.sources.map(sourceText)))]
  return (
    <div className="rounded-2xl rounded-bl-md bg-slate-100 p-4 text-sm dark:bg-slate-800">
      <div className="font-semibold">{best.chunk.title}</div>
      <div className={`text-xs ${ui.muted}`}>{best.chunk.where}</div>
      {lines.length > 0 ? (
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {shown.map((l, i) => (
            <li key={i}>
              <RevisionBadge revisions={l.revisions} />
              {l.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs">Nothing in this passage applies to the revision you chose.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {lines.length > PREVIEW_LINES && (
          <button type="button" onClick={() => setAll((v) => !v)} className={ui.link} aria-expanded={all}>
            {all ? 'Show fewer' : `Show all ${lines.length} steps`}
          </button>
        )}
        <OpenLink chunk={best.chunk} onOpenEntry={onOpenEntry} />
      </div>
      {sources.length > 0 && (
        <details className="group mt-2 text-xs">
          <summary className={`inline-flex cursor-pointer items-center gap-1 ${ui.muted}`}>
            <Chevron className="h-3 w-3" />
            Sources
          </summary>
          <ul className={`mt-1 list-disc pl-8 ${ui.muted}`}>
            {sources.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </details>
      )}
      {others.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={ui.muted}>Also relevant:</span>
          {others.map((h) =>
            h.chunk.link.type === 'entry' ? (
              <button key={h.chunk.id} type="button" onClick={() => onOpenEntry((h.chunk.link as { entryId: string }).entryId)} className="rounded-full border border-slate-300 px-2.5 py-0.5 hover:bg-white dark:border-slate-600 dark:hover:bg-slate-700">
                {h.chunk.title}
              </button>
            ) : h.chunk.link.type === 'page' ? (
              <Link key={h.chunk.id} to={h.chunk.link.to} className="rounded-full border border-slate-300 px-2.5 py-0.5 no-underline hover:bg-white dark:border-slate-600 dark:hover:bg-slate-700">
                {h.chunk.title}
              </Link>
            ) : h.chunk.link.type === 'lesson' ? (
              <Link key={h.chunk.id} to={`/module/${h.chunk.link.moduleId}/lesson/${h.chunk.link.lessonId}`} className="rounded-full border border-slate-300 px-2.5 py-0.5 no-underline hover:bg-white dark:border-slate-600 dark:hover:bg-slate-700">
                {h.chunk.title}
              </Link>
            ) : (
              <span key={h.chunk.id}>{h.chunk.title}</span>
            ),
          )}
        </div>
      )}
    </div>
  )
}
