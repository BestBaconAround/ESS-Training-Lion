import { describe, expect, it } from 'vitest'
import { buildCorpus, referenceChunks } from './corpus'
import { parseMarkdownSections } from './markdown'
import { SearchIndex } from './search'
import { stem, tokenize } from './tokenize'

const corpus = buildCorpus({})
const index = new SearchIndex(corpus)
const top = (q: string) => index.search(q, 3)

describe('tokenize', () => {
  it('keeps fault codes and decimals whole', () => {
    expect(tokenize('Fault A2_10 at 51.5 V')).toEqual(expect.arrayContaining(['a2_10', '51.5']))
  })
  it('stems plurals and endings so batteries meets battery', () => {
    expect(stem('batteries')).toBe(stem('battery'))
    expect(tokenize('charging')).toEqual(tokenize('charge'))
  })
  it("treats won't like wont and drops apostrophes", () => {
    expect(tokenize("won't")).toEqual(['wont'])
  })
})

describe('Ask the notes: finds the right passage', () => {
  const cases: [string, string][] = [
    ['A2_10', 'ts-fault-a2_10'],
    ['what is fault A1_12', 'ts-fault-a1_12'],
    ["my battery won't address", 'ts-battery-wont-address'],
    ['battery reads 0 volts during commissioning', 'ts-battery-wont-address'],
    ['what power supply settings do I use to charge a dead battery', 'ts-battery-wont-address'],
    ['the app cannot connect to the system', 'ts-app-offline'],
    ['check wifi hotspot', 'ts-app-offline'],
    ['no light on the inverter but the buttons are in', 'ts-no-light'],
    ['how do I power cycle the inverter', 'ts-power-cycle'],
    ['shutdown button pressed but still running', 'ts-shutdown-still-on'],
    ['sell back stuck frequency watt', 'ts-sellback-stuck'],
    ['solar drops to zero in daylight', 'ts-pv-reverse'],
    ['first call what should I ask', 'ts-first-call'],
    ['which pins are the CTs on', 'ts-ct-check'],
  ]
  // Two passages are right for this one: the guided entry and the generated A1_7 fault entry. Either may lead.
  it('"grid over voltage" -> the guided entry is in the top two', () => {
    expect(top('grid over voltage').slice(0, 2).map((h) => h.chunk.id)).toContain('ts-grid-overvoltage')
  })
  for (const [q, id] of cases) {
    it(`"${q}" -> ${id}`, () => {
      const hits = top(q)
      expect(hits.length).toBeGreaterThan(0)
      expect(hits[0].chunk.id).toBe(id)
    })
  }

  it('finds lesson material too', () => {
    const hits = top('which pins are the rapid solar shutdown connector')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.chunk.kind === 'lesson')).toBe(true)
  })
})

describe('Ask the notes: does not guess', () => {
  for (const q of ['what is the best pizza recipe', 'who won the world cup', 'qqqq zzzz', '', '   ', 'the']) {
    it(`returns nothing for "${q}"`, () => {
      expect(top(q)).toEqual([])
    })
  }

  it('only ever returns passages that exist in the corpus', () => {
    const ids = new Set(corpus.map((c) => c.id))
    for (const q of ['battery', 'inverter light', 'solar', 'a1_2', 'generator']) {
      for (const h of top(q)) expect(ids.has(h.chunk.id)).toBe(true)
    }
  })

  it('every returned line carries a source', () => {
    for (const h of top('battery will not address')) {
      for (const l of h.chunk.lines) expect(l.sources.length).toBeGreaterThan(0)
    }
  })
})

describe('reference markdown', () => {
  const md = '# Heading A\n\nFirst line.\n- bullet one\n- bullet two\n\n## Heading B\n\nSecond section text.\n'
  it('splits into sections at headings', () => {
    expect(parseMarkdownSections(md, 'file').map((s) => s.title)).toEqual(['Heading A', 'Heading B'])
  })
  it('text before the first heading is titled with the file name', () => {
    expect(parseMarkdownSections('intro text\n# H\nbody', 'notes')[0].title).toBe('notes')
  })
  it('drops empty sections', () => {
    expect(parseMarkdownSections('# A\n\n# B\ntext', 'f').map((s) => s.title)).toEqual(['B'])
  })

  it('makes dropped-in files searchable, with a source', () => {
    const files = { '../content/reference/field-tips.md': '# Zebra relay\n\nIf the zebra relay clicks twice, replace the zebra module.\n' }
    expect(referenceChunks(files)[0].lines[0].sources[0].source).toBe('notes')
    const idx = new SearchIndex(buildCorpus(files))
    const hits = idx.search('zebra relay clicks')
    expect(hits[0].chunk.kind).toBe('reference')
    expect(hits[0].chunk.title).toBe('Zebra relay')
  })
})
