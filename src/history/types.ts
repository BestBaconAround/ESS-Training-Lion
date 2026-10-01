export interface AskAnswerSnapshot {
  title: string
  where: string
  lines: { text: string; sources: string }[]
}

export interface AskEntry {
  id: string
  at: number
  kind: 'ask'
  question: string
  /** null when nothing matched. */
  answer: AskAnswerSnapshot | null
}

export interface NotesEntry {
  id: string
  at: number
  kind: 'notes'
  text: string
  ideas: { kind: string; title: string }[]
}

export type HistoryEntry = AskEntry | NotesEntry

export interface HistoryData {
  version: 1
  entries: HistoryEntry[]
}

export const emptyHistory = (): HistoryData => ({ version: 1, entries: [] })
