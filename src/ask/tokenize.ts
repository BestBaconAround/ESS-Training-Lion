// Tiny text normalization for the "Ask the notes" search. No AI, no network: plain word matching.

const STOP = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'do', 'does', 'for', 'from', 'how', 'i', 'if', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or',
  'so', 'that', 'the', 'then', 'this', 'to', 'was', 'what', 'when', 'which', 'with', 'you', 'your', 'can', 'should', 'would', 'about', 'tell', 'there', 'will', 'not', 'also', 'just', 'any', 'out',
  // "gen2" names the whole product family, so it says nothing about which passage answers the question.
  'gen2',
])

/** A few spoken-language shortcuts mapped to the words the notes use. Keep this small and obvious. */
const SYNONYMS: Record<string, string[]> = {
  wont: ['will', 'not'],
  cant: ['not'],
  cannot: ['not'],
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

/** Spoken phrases rewritten to the words the notes use. Applied to questions only. Keep this small and obvious. */
const PHRASES: [RegExp, string][] = [
  [/\b(?:show|shows|showing|come|comes|coming|pop|pops) up\b/g, 'address'],
  [/\b(?:not|never|wont|cant|cannot|doesnt|didnt) (?:be )?(?:detect|detected|found|find|recogni[sz]e|recogni[sz]ed|see|seen|read)\b/g, 'wont address'],
  [/\bwake (?:it |the battery |a battery )?up\b/g, 'wake address'],
  [/\b(?:reboot|restart|cycle|turn (?:the )?(?:system|inverter|it) off and (?:back )?on)\b/g, 'power cycle'],
  [/\b(?:lights? (?:went |are |keeps? |goes? )?out|power (?:went |is )?out (?:in|at|of) the (?:house|home))\b/g, 'loads off'],
  [/\b(?:not|isnt|arent|never|stopped|stops?) (?:exporting|export|selling|sending)\b/g, 'sell back stuck'],
  [/\bexport(?:ing)?\b/g, 'sell back'],
  [/\b(?:not|isnt|arent|never|stopped|stops?|no) (?:producing|production|making power|generating)\b/g, 'solar not used'],
  [/\b(?:dark|blank|unlit|lit)\b/g, 'no light'],
  [/\b(?:panels?|pv|array|strings?) (?:not|isnt|arent|no)\b/g, 'solar not used'],
  [/\b(?:dead|flat|drained|empty) batter(?:y|ies)\b/g, 'battery wont address 0 volt'],
  [/\bwhat (?:do|should|to) i? ?ask\b|\bask (?:the )?(?:customer|caller|homeowner)\b/g, 'first call approach'],
  [/\b(?:no|lost|lose|losing|bad) (?:communication|comms|connection)\b/g, 'offline connect comms'],
  [/\bbutton (?:does ?nt|doesnt|wont|will not) (?:do anything|work|turn)\b|\bbutton does nothing\b/g, 'power button will not turn on'],
]

const WORD = /[a-z0-9_]+(?:\.[0-9]+)?/g

/** Lowercase word tokens. Fault codes (a2_10) and decimals (51.5) stay whole. */
export function tokenize(text: string, opts: { stop?: boolean; synonyms?: boolean } = {}): string[] {
  const { stop = true, synonyms = false } = opts
  let cleaned = text.toLowerCase().replace(/['’]/g, '').replace(/\b(\d+(?:\.\d+)?)(v|vdc|volts?)\b/g, '$1 $2').replace(/\bgen\s+2\b/g, 'gen2')
  if (synonyms) for (const [re, to] of PHRASES) cleaned = cleaned.replace(re, to)
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
