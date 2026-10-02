import { modules } from '../content'
import { PROCEDURES } from '../content/procedures'
import { REFERENCE_SECTIONS } from '../content/reference'
import { TROUBLESHOOTING, AREA_LABELS, type TroubleshootingEntry } from '../content/troubleshooting'
import type { Block, RevisionTag, SourceRef } from '../content/types'
import { parseMarkdownSections } from './markdown'

export type ChunkLink =
  | { type: 'entry'; entryId: string }
  | { type: 'lesson'; moduleId: string; lessonId: string }
  | { type: 'page'; to: string; label: string }
  | { type: 'none' }

export interface Chunk {
  id: string
  kind: 'troubleshooting' | 'lesson' | 'reference'
  title: string
  /** Where it lives, for the result card. */
  where: string
  /** Searchable body text. */
  text: string
  /** Lines shown in the answer. */
  lines: { text: string; sources: SourceRef[]; revisions: RevisionTag }[]
  link: ChunkLink
}

function fromEntry(e: TroubleshootingEntry): Chunk {
  return {
    id: e.id,
    kind: 'troubleshooting',
    title: e.title,
    where: `Troubleshooting: ${AREA_LABELS[e.area]}`,
    text: [e.customerSays ?? '', e.description ?? '', e.faultCode ?? '', ...e.steps.map((s) => s.text)].join(' '),
    lines: e.steps.map((s) => ({ text: s.text, sources: s.sources, revisions: s.revisions })),
    link: { type: 'entry', entryId: e.id },
  }
}

function blockLines(b: Block): { text: string; sources: SourceRef[]; revisions: RevisionTag }[] {
  switch (b.type) {
    case 'facts':
      return b.items.map((f) => ({ text: f.text, sources: f.sources, revisions: f.revisions }))
    case 'call':
      return [{ text: `Customer: "${b.customer}" ${b.answer}`, sources: b.sources, revisions: b.revisions }]
    case 'callout':
      return [{ text: b.text, sources: b.sources, revisions: b.revisions }]
    default:
      return []
  }
}

function lessonChunks(): Chunk[] {
  const out: Chunk[] = []
  for (const m of modules) {
    for (const l of m.lessons) {
      l.blocks.forEach((b, i) => {
        const lines = blockLines(b)
        if (!lines.length) return
        const heading = b.type === 'facts' && b.title ? `${l.title}: ${b.title}` : l.title
        out.push({
          id: `${l.id}#${i}`,
          kind: 'lesson',
          title: heading,
          where: `Module ${m.number}, lesson: ${l.title}`,
          text: lines.map((x) => x.text).join(' '),
          lines,
          link: { type: 'lesson', moduleId: m.id, lessonId: l.id },
        })
      })
    }
  }
  return out
}

/** Procedures that have written steps, so the chat can answer "how do I ..." from them. */
function procedureChunks(): Chunk[] {
  return PROCEDURES.filter((p) => (p.steps?.length ?? 0) > 0).map((p) => ({
    id: `proc:${p.id}`,
    kind: 'troubleshooting' as const,
    title: p.title,
    where: `Procedures: ${p.group}`,
    text: [p.title, p.summary, ...(p.steps ?? []).map((x) => x.text)].join(' '),
    lines: (p.steps ?? []).map((x) => ({ text: x.text, sources: x.sources, revisions: x.revisions })),
    link: { type: 'page' as const, to: '/procedures', label: 'Open the procedure' },
  }))
}

/** The quick facts on the Reference page, one chunk per row, so the chat can answer from them too. */
function referencePageChunks(): Chunk[] {
  return REFERENCE_SECTIONS.flatMap((sec) =>
    sec.rows.map((r, i) => ({
      id: `refpage:${sec.id}#${i}`,
      kind: 'reference' as const,
      title: r.label,
      where: `Reference: ${sec.title}`,
      text: `${sec.title} ${r.label} ${r.value}`,
      lines: [{ text: r.value, sources: r.sources, revisions: r.revisions }],
      link: { type: 'none' as const },
    })),
  )
}

/** Files dropped into src/content/reference/*.md. Each heading section becomes a searchable chunk. */
const referenceFiles = import.meta.glob('../content/reference/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export function referenceChunks(files: Record<string, string> = referenceFiles): Chunk[] {
  const out: Chunk[] = []
  for (const [path, raw] of Object.entries(files)) {
    const name = path.split('/').pop()!.replace(/\.md$/, '')
    parseMarkdownSections(raw, name).forEach((s, i) => {
      out.push({
        id: `ref:${name}#${i}`,
        kind: 'reference',
        title: s.title,
        where: `Reference: ${name}`,
        text: s.text,
        lines: s.text
          .split(/\n+/)
          .map((t) => t.replace(/^\s*[-*]\s+/, '').trim())
          .filter(Boolean)
          .map((t) => ({ text: t, sources: [{ source: 'notes', note: name }], revisions: 'all' as const })),
        link: { type: 'none' },
      })
    })
  }
  return out
}

export function buildCorpus(extraReference: Record<string, string> = referenceFiles): Chunk[] {
  return [...TROUBLESHOOTING.map(fromEntry), ...procedureChunks(), ...lessonChunks(), ...referencePageChunks(), ...referenceChunks(extraReference)]
}
