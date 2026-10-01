// Tiny text normalization for the "Ask the notes" search. No AI, no network: plain word matching.

const STOP = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'do', 'does', 'for', 'from', 'how', 'i', 'if', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or',
  'so', 'that', 'the', 'then', 'this', 'to', 'was', 'what', 'when', 'which', 'with', 'you', 'your', 'can', 'should', 'would', 'about', 'tell', 'there',
])

/** A few spoken-language shortcuts mapped to the words the notes use. Keep this small and obvious. */
const SYNONYMS: Record<string, string[]> = {
  wont: ['will', 'not'],
  cant: ['cannot'],
  cannot: ['cannot'],
  dont: ['not'],
  doesnt: ['not'],
  offline: ['connect', 'comms'],
  wifi: ['wi', 'fi'],
  zero: ['0'],
  dead: ['asleep', '0', 'wake'],
}

/** "sett" -> "set", "plugg" -> "plug": drop a doubled final consonant left by removing -ing/-ed. */
const undouble = (w: string): string => (w.length > 3 && w[w.length - 1] === w[w.length - 2] && !/[aeiouls]/.test(w[w.length - 1]) ? w.slice(0, -1) : w)

/** Light stemming so "batteries"/"battery" and "charging"/"charge" meet. */
export function stem(word: string): string {
  let w = word
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y'
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  if (w.length > 5 && w.endsWith('ing')) w = undouble(w.slice(0, -3))
  else if (w.length > 4 && w.endsWith('ed')) w = undouble(w.slice(0, -2))
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1)
  return w
}

const WORD = /[a-z0-9_]+(?:\.[0-9]+)?/g

/** Lowercase word tokens. Fault codes (a2_10) and decimals (51.5) stay whole. */
export function tokenize(text: string, opts: { stop?: boolean; synonyms?: boolean } = {}): string[] {
  const { stop = true, synonyms = false } = opts
  const cleaned = text.toLowerCase().replace(/['’]/g, '')
  const out: string[] = []
  for (const raw of cleaned.match(WORD) ?? []) {
    const parts = synonyms && SYNONYMS[raw] ? SYNONYMS[raw] : [raw]
    for (const w of parts) {
      if (stop && STOP.has(w)) continue
      out.push(/^[a-z]\d_\d+$/.test(w) ? w : stem(w))
    }
  }
  return out
}

export const isFaultCode = (token: string): boolean => /^[a-z]\d_\d+$/.test(token)
