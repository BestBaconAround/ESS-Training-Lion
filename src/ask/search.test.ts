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
    ['the app cannot connect to the system', 'ts-app-offline'],
    ['no light on the inverter but the buttons are in', 'ts-no-light'],
    ['how do I power cycle the inverter', 'ts-power-cycle'],
    ['sell back stuck frequency watt', 'ts-sellback-stuck'],
    ['solar drops to zero in daylight', 'ts-pv-reverse'],
    ['first call what should I ask', 'ts-first-call'],
  ]
  // Two passages are right for this one: the guided entry and the generated A1_7 fault entry. Either may lead.
  it('"which pins are the CTs on" -> ts-ct-check is in the top three', () => {
    expect(top('which pins are the CTs on').slice(0, 3).map((h) => h.chunk.id)).toContain('ts-ct-check')
  })

  it('"sanctuary 3 batteries disconnected" -> ts-gen3-battery-comm is in the top three', () => {
    expect(top('sanctuary 3 batteries disconnected').slice(0, 3).map((h) => h.chunk.id)).toContain('ts-gen3-battery-comm')
  })

  it('"battery low inverter will not charge check the CTs" -> ts-gen3-battery-comm is in the top three', () => {
    expect(top('battery low inverter will not charge check the CTs').slice(0, 3).map((h) => h.chunk.id)).toContain('ts-gen3-battery-comm')
  })

  it('"grid over voltage" -> the guided entry is in the top three', () => {
    expect(top('grid over voltage').slice(0, 2).map((h) => h.chunk.id)).toContain('ts-grid-overvoltage')
  })
  // The lesson on the same topic, or the meter-test entry, may legitimately rank next to the guided entry.
  for (const [q, id] of [
    ["Can't address gen2 battery", 'ts-battery-wont-address'],
    ['cannot address the battery', 'ts-battery-wont-address'],
    ['gen 2 battery wont address', 'ts-battery-wont-address'],
    ['check wifi hotspot', 'ts-app-offline'],
    ['how do I change my wifi', 'ts-change-wifi'],
    ['change wifi password', 'ts-change-wifi'],
    ['new router wifi', 'ts-change-wifi'],
    ['what power supply settings do I use to charge a dead battery', 'ts-battery-wont-address'],
    ['shutdown button pressed but still running', 'ts-shutdown-still-on'],
  ]) {
    it(`"${q}" -> ${id} is in the top three`, () => {
      expect(top(q).slice(0, 3).map((h) => h.chunk.id)).toContain(id)
    })
  }
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

describe('Ask the notes: plain-worded questions', () => {
  // Other passages (a fault entry, a procedure) may rank first on some of these; the guided entry must be in the top three.
  const phrasings: [string, string][] = [
    ['battery has voltage but no communication','ts-battery-no-comm'],
    ['battery lost communication replace BMS connector','ts-battery-no-comm'],
    ['BMS connector continuity 4 pin','ts-battery-no-comm'],
  ['battery wont show up in the app','ts-battery-wont-address'],
  ['battery not detected','ts-battery-wont-address'],
  ['battery shows 0v','ts-battery-wont-address'],
  ['dead battery how do I wake it up','ts-battery-wont-address'],
  ['batteries different voltages','ts-battery-spread'],
  ['inverter is dark nothing lit','ts-no-light'],
  ['no power to the inverter display','ts-no-light'],
  ['red light on inverter','ts-red-light'],
  ['orange light','ts-red-light'],
  ['green light is flashing','ts-blinking-green'],
  ['customer says app shows offline','ts-app-offline'],
  ['system not connecting to internet','ts-app-offline'],
  ['no communication with inverter','ts-app-offline'],
  ['homeowner got a new router','ts-change-wifi'],
  ['reset the wifi on the ems-c','ts-change-wifi'],
  ['reboot the inverter','ts-power-cycle'],
  ['turn the system off and back on','ts-power-cycle'],
  ['restart system','ts-power-cycle'],
  ['lights went out in the house','ts-loads-off'],
  ['no backup power loads off','ts-loads-off'],
  ['solar not producing','ts-no-solar'],
  ['pv voltage zero','ts-pv-reverse'],
  ['gfci error','ts-gfci-solar'],
  ['ground fault on solar','ts-gfci-solar'],
  ['high grid voltage','ts-grid-overvoltage'],
  ['not exporting to grid','ts-sellback-stuck'],
  ['inverter wont connect to the grid','ts-wont-connect-grid'],
  ['firmware update failed','ts-failed-firmware'],
  ['bricked inverter after update','ts-failed-firmware'],
  ['clock is wrong','ts-time-wrong'],
  ['time of use schedule off','ts-time-wrong'],
  ['battery reserve setting','ts-operating-modes'],
  ['what is emergency mode','ts-operating-modes'],
  ['A1_3 low battery','ts-battery-dod'],
  ['battery drains to zero gen 3','ts-gen3-battery-comm'],
  ['CT installed backwards','ts-ct-check'],
  ['which way do the CTs face','ts-ct-check'],
  ['remote shutdown pressed','ts-remote-shutdown'],
  ['power button does nothing','ts-power-button-test'],
  ['what do I ask the customer first','ts-first-call'],
  ['what to check before troubleshooting','ts-remote-precheck'],
  ['string voltage in cold weather','ts-voc-calc'],
  ['system still running after pressing shutdown','ts-shutdown-still-on'],
  ]
  for (const [q, id] of phrasings) {
    it(`"${q}" -> ${id} is in the top three`, () => {
      expect(top(q).slice(0, 3).map((h) => h.chunk.id)).toContain(id)
    })
  }
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

describe('Ask the notes: several fault codes in one question', () => {
  it('finds each code, in the order typed, whatever the case or separators', () => {
    const r = index.faultCodeHits('A1_3, a2_20, A2_19, A2_18, F1_21, F1_12, F1_10')
    expect(r.found.map((h) => h.chunk.id)).toEqual(['ts-fault-a1_3', 'ts-fault-a2_20', 'ts-fault-a2_19', 'ts-fault-a2_18', 'ts-fault-f1_21', 'ts-fault-f1_12', 'ts-fault-f1_10'])
    expect(r.missing).toEqual([])
  })
  it('drops repeats and names a code that has no entry instead of guessing', () => {
    const r = index.faultCodeHits('what are a1_3 and A1_3 and z9_99')
    expect(r.found.map((h) => h.chunk.id)).toEqual(['ts-fault-a1_3'])
    expect(r.missing).toEqual(['Z9_99'])
  })
  it('a question with no code has no code hits', () => {
    expect(index.faultCodeHits('battery will not address')).toEqual({ found: [], missing: [] })
  })
})
