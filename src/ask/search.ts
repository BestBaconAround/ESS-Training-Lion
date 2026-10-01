import { isFaultCode, tokenize } from './tokenize'
import type { Chunk } from './corpus'

export interface Hit {
  chunk: Chunk
  score: number
}

interface Doc {
  chunk: Chunk
  title: Map<string, number>
  body: Map<string, number>
  /** Adjacent word pairs, so "power supply" matches as a phrase. */
  pairs: Set<string>
  len: number
}

/** A support question is best answered by a troubleshooting entry or a reference note; lesson text is the fallback. */
const KIND_PRIOR: Record<Chunk['kind'], number> = { troubleshooting: 1.3, reference: 1.3, lesson: 1 }

const pairsOf = (tokens: string[]): string[] => tokens.slice(1).map((t, i) => `${tokens[i]} ${t}`)

const count = (tokens: string[]): Map<string, number> => {
  const m = new Map<string, number>()
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1)
  return m
}

/**
 * Word-matching search (TF-IDF with a title boost and an exact boost for fault codes).
 * It only ever returns passages that exist in the reference material. When nothing matches well,
 * it returns an empty list, and the chat says so instead of guessing.
 */
export class SearchIndex {
  private docs: Doc[]
  private idf = new Map<string, number>()

  constructor(chunks: Chunk[]) {
    this.docs = chunks.map((chunk) => {
      const title = count(tokenize(chunk.title, { stop: true }))
      const bodyTokens = tokenize(chunk.text, { stop: true })
      const pairs = new Set([...pairsOf(bodyTokens), ...pairsOf(tokenize(chunk.title, { stop: true }))])
      return { chunk, title, body: count(bodyTokens), pairs, len: Math.max(bodyTokens.length, 1) }
    })
    const df = new Map<string, number>()
    for (const d of this.docs) {
      for (const t of new Set([...d.title.keys(), ...d.body.keys()])) df.set(t, (df.get(t) ?? 0) + 1)
    }
    const n = this.docs.length
    for (const [t, c] of df) this.idf.set(t, Math.log(1 + n / c))
  }

  /** `minScore` filters weak matches: real matches score well above it, loosely related text scores near 1. */
  search(query: string, limit = 3, minScore = 2.5): Hit[] {
    const qTokens = [...new Set(tokenize(query, { stop: true, synonyms: true }))]
    if (!qTokens.length) return []
    const qPairs = pairsOf(tokenize(query, { stop: true }))
    const weight = (t: string) => this.idf.get(t) ?? 0
    const totalWeight = qTokens.reduce((sum, t) => sum + (weight(t) || 0.3), 0)

    const hits: Hit[] = []
    for (const d of this.docs) {
      let score = 0
      let matched = 0
      for (const t of qTokens) {
        const inTitle = d.title.get(t) ?? 0
        const inBody = d.body.get(t) ?? 0
        if (!inTitle && !inBody) continue
        const w = weight(t) || 0.3
        matched += w
        const exactCode = isFaultCode(t) ? 6 : 1
        score += w * exactCode * (3 * Math.min(inTitle, 1) + Math.log(1 + inBody))
      }
      if (!score) continue
      // Phrases that appear together in the question and in the passage ("power supply") count extra.
      for (const p of qPairs) {
        if (d.pairs.has(p)) {
          const [a, b] = p.split(' ')
          score += 1.5 * (((weight(a) || 0.3) + (weight(b) || 0.3)) / 2)
        }
      }
      // Prefer passages that cover more of what was asked, and do not let very long passages win by size alone.
      const coverage = matched / totalWeight
      hits.push({ chunk: d.chunk, score: (KIND_PRIOR[d.chunk.kind] * score * coverage * coverage) / Math.sqrt(Math.log(2 + d.len)) })
    }
    hits.sort((a, b) => b.score - a.score)
    const best = hits[0]
    if (!best) return []
    // Drop weak tails: keep only results reasonably close to the best, and require the best to cover enough of the question.
    const bestCoverage = this.coverageOf(best.chunk, qTokens, totalWeight)
    if (qTokens.length >= 2 && bestCoverage < 0.5) return []
    if (best.score < minScore) return []
    return hits.filter((h) => h.score >= Math.max(best.score * 0.25, minScore)).slice(0, limit)
  }

  private coverageOf(chunk: Chunk, qTokens: string[], totalWeight: number): number {
    const d = this.docs.find((x) => x.chunk === chunk)!
    let matched = 0
    for (const t of qTokens) if (d.title.has(t) || d.body.has(t)) matched += this.idf.get(t) || 0.3
    return matched / totalWeight
  }
}
