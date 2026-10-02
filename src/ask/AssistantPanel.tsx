import { useState } from 'react'
import { HistoryProvider, useHistory } from '../history/HistoryContext'
import HistoryTab from '../history/HistoryTab'
import type { RevisionChoice } from '../troubleshooting/filter'
import AskPanel from './AskPanel'
import CallNotes from './CallNotes'
import ReferenceTab from './ReferenceTab'

type Tab = 'ask' | 'notes' | 'reference' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'ask', label: 'Ask the notes' },
  { id: 'notes', label: 'Call notes' },
  { id: 'reference', label: 'Reference' },
  { id: 'history', label: 'History' },
]

const tabClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${
    active ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

/** Ask, Call notes and the locked History share one unlock: while History is unlocked, chats are saved to it. */
export default function AssistantPanel({ onOpenEntry, rev }: { onOpenEntry: (entryId: string) => void; rev: RevisionChoice }) {
  return (
    <HistoryProvider>
      <Panel onOpenEntry={onOpenEntry} rev={rev} />
    </HistoryProvider>
  )
}

function Panel({ onOpenEntry, rev }: { onOpenEntry: (entryId: string) => void; rev: RevisionChoice }) {
  const [tab, setTab] = useState<Tab>('ask')
  const history = useHistory()
  return (
    <section
      aria-label="Assistant"
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      onPointerDown={history.touch}
      onKeyDown={history.touch}
    >
      <div role="tablist" aria-label="Assistant" className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} className={tabClass(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'history' && <span aria-hidden> {history.status === 'unlocked' ? '\u{1F513}' : '\u{1F512}'}</span>}
            {t.id === 'history' && <span className="sr-only">{history.status === 'unlocked' ? ' (unlocked)' : ' (locked)'}</span>}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" role="status">
        {history.status === 'unlocked' ? 'Private history is unlocked: new questions are being saved.' : 'Private history is locked: nothing is being saved.'}
      </p>
      {/* All panels stay mounted so a typed question or note is not lost when you switch tabs. */}
      <div className="mt-3">
        <div role="tabpanel" id="panel-ask" aria-labelledby="tab-ask" hidden={tab !== 'ask'}>
          <AskPanel onOpenEntry={onOpenEntry} rev={rev} />
        </div>
        <div role="tabpanel" id="panel-notes" aria-labelledby="tab-notes" hidden={tab !== 'notes'}>
          <CallNotes onOpenEntry={onOpenEntry} />
        </div>
        <div role="tabpanel" id="panel-reference" aria-labelledby="tab-reference" hidden={tab !== 'reference'}>
          <ReferenceTab rev={rev} />
        </div>
        <div role="tabpanel" id="panel-history" aria-labelledby="tab-history" hidden={tab !== 'history'}>
          <HistoryTab />
        </div>
      </div>
    </section>
  )
}
