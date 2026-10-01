import { sourceText } from '../content/labels'
import type { Hit } from '../ask/search'
import type { AskAnswerSnapshot, HistoryData, HistoryEntry } from './types'

export const MAX_ENTRIES = 500

export const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Newest first, capped so storage stays small. */
export function addEntry(data: HistoryData, entry: HistoryEntry): HistoryData {
  return { ...data, entries: [entry, ...data.entries].slice(0, MAX_ENTRIES) }
}

export function removeEntry(data: HistoryData, id: string): HistoryData {
  return { ...data, entries: data.entries.filter((e) => e.id !== id) }
}

/** Compact copy of the best answer, so the history shows what the assistant said at the time. */
export function snapshotAnswer(hits: Hit[]): AskAnswerSnapshot | null {
  const best = hits[0]
  if (!best) return null
  return {
    title: best.chunk.title,
    where: best.chunk.where,
    lines: best.chunk.lines.slice(0, 8).map((l) => ({ text: l.text, sources: l.sources.map(sourceText).join('; ') })),
  }
}
