import { useEffect, useMemo, useState } from 'react'
import { ui } from '../components/ui'
import { ESCALATION } from '../content/troubleshooting'
import { useHistory } from '../history/HistoryContext'
import { buildCorpus } from './corpus'
import IdeaCard from './IdeaCard'
import { EMPTY_ANALYSIS, analyzeNotes, loadNotes, saveNotes } from './notes'
import { REVISION_LABELS } from '../content/labels'
import { SearchIndex } from './search'

let index: SearchIndex | null = null
const getIndex = () => (index ??= new SearchIndex(buildCorpus()))

function tabStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

const PLACEHOLDER = 'What the customer says and what you see.\nFor example: Rev 3, light is red, battery 2 reads 50.2V, A2_11 on the app.'

export default function CallNotes({ onOpenEntry }: { onOpenEntry: (entryId: string) => void }) {
  const history = useHistory()
  const store = useMemo(tabStore, [])
  const [text, setText] = useState(() => loadNotes(store))
  const [debounced, setDebounced] = useState(text)
  const [saved, setSaved] = useState(false)

  // Notes may hold customer details: keep them in this tab only (sessionStorage), never in the saved history unless asked.
  useEffect(() => saveNotes(store, text), [store, text])
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(text), 350)
    return () => window.clearTimeout(t)
  }, [text])

  const analysis = useMemo(() => (debounced.trim() ? analyzeNotes(debounced, getIndex()) : EMPTY_ANALYSIS), [debounced])
  const unlocked = history.status === 'unlocked'

  const save = () => {
    history.recordNotes(
      text.trim(),
      analysis.ideas.map((i) => ({ kind: i.kind, title: i.title })),
    )
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="sr-only" htmlFor="call-notes">
          Call notes
        </label>
        <textarea id="call-notes" value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={PLACEHOLDER} className={ui.input} />
        <p className={`mt-1 text-xs ${ui.muted}`}>Ideas appear as you type, from the reference material. Notes stay in this browser tab and are cleared when you close it.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={save} disabled={!unlocked || !text.trim()} className={ui.primary}>
          Save to private history
        </button>
        <button type="button" onClick={() => setText('')} disabled={!text} className={`${ui.ghost} disabled:opacity-40`}>
          Clear
        </button>
        <span className={`text-xs ${ui.muted}`} role="status">
          {saved ? 'Saved.' : unlocked ? '' : 'Unlock History to save notes.'}
        </span>
      </div>

      {analysis.revisions.length > 0 && (
        <p className="text-xs" aria-live="polite">
          <span className="font-semibold">Revision in your notes: </span>
          {analysis.revisions.map((r) => REVISION_LABELS[r]).join(', ')}
          {analysis.revisions.length === 1 ? '. Steps for other revisions are hidden.' : '. Several revisions are mentioned, so every step is shown.'}
        </p>
      )}

      <div aria-live="polite">
        {!debounced.trim() ? null : analysis.ideas.length === 0 ? (
          <p className={`rounded-lg border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700 ${ui.muted}`}>
            No ideas yet. Add a fault code, the light color, a voltage reading, or what the customer says is wrong.
          </p>
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Ideas to check</h3>
            <ul className="space-y-2">
              {analysis.ideas.map((i) => (
                <IdeaCard key={i.id} idea={i} onOpenEntry={onOpenEntry} />
              ))}
            </ul>
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
              <span className="font-semibold">If it cannot be fixed on the call: </span>
              {ESCALATION.text}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
