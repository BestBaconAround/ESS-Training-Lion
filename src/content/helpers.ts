import type { Block, Fact, RevisionTag, SourceRef } from './types'

export const src = (source: SourceRef['source'], ...pages: number[]): SourceRef => ({
  source,
  ...(pages.length ? { pages } : {}),
})

export const fact = (text: string, sources: SourceRef[], revisions: RevisionTag = 'all'): Fact => ({
  text,
  sources,
  revisions,
})

export const todo = (text: string): Block => ({ type: 'todo', text })
