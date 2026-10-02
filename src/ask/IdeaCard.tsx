import { Link } from 'react-router-dom'
import SourceNote, { RevisionBadge } from '../components/SourceNote'
import { ui } from '../components/ui'
import { sourceText } from '../content/labels'
import type { Idea } from './notes'

const KIND_LABEL: Record<Idea['kind'], string> = {
  fault: 'Fault code',
  reading: 'Reading',
  match: 'Possible match',
  question: 'Ask the customer',
}

export default function IdeaCard({ idea, onOpenEntry }: { idea: Idea; onOpenEntry: (entryId: string) => void }) {
  return (
    <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {KIND_LABEL[idea.kind]}
        </span>
        <span className="font-semibold">{idea.title}</span>
      </div>
      {idea.detail && (
        <p className="mt-1 text-sm">
          {idea.detail}
          {idea.sources && idea.sources.length > 0 && idea.kind !== 'match' && (
            <span className="block text-xs text-slate-500 dark:text-slate-400">Source: {idea.sources.map(sourceText).join('; ')}</span>
          )}
        </p>
      )}
      {idea.kind === 'question' && idea.sources && idea.sources.length > 0 && (
        <span className="block text-xs text-slate-500 dark:text-slate-400">Source: {idea.sources.map(sourceText).join('; ')}</span>
      )}
      {idea.lines.length > 0 && (
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
          {idea.lines.map((l, i) => (
            <li key={i}>
              <RevisionBadge revisions={l.revisions} />
              {l.text}
              <SourceNote sources={l.sources} />
            </li>
          ))}
        </ul>
      )}
      {idea.link?.type === 'entry' && (
        <p className="mt-2 text-xs">
          <button type="button" onClick={() => onOpenEntry((idea.link as { entryId: string }).entryId)} className={ui.link}>
            Open the full entry
          </button>
        </p>
      )}
      {idea.link?.type === 'page' && (
        <p className="mt-2 text-xs">
          <Link to={idea.link.to} className={ui.link}>
            {idea.link.label}
          </Link>
        </p>
      )}
      {idea.link?.type === 'lesson' && (
        <p className="mt-2 text-xs">
          <Link to={`/module/${idea.link.moduleId}/lesson/${idea.link.lessonId}`} className={ui.link}>
            Open the lesson
          </Link>
        </p>
      )}
    </li>
  )
}
