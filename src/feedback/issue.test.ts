import { describe, expect, it } from 'vitest'
import { MAX_MESSAGE, buildIssueUrl } from './issue'

const base = { type: 'wrong' as const, page: 'Reference', message: 'A2_10 says reverse polarity.\nIt is a place-holder.', source: 'TSM p.78', revision: 'Rev 4' }

describe('buildIssueUrl', () => {
  it('opens a new issue on the repo with a title and a readable body', () => {
    const url = new URL(buildIssueUrl(base))
    expect(url.origin + url.pathname).toBe('https://github.com/BestBaconAround/ESS-Training-Lion/issues/new')
    expect(url.searchParams.get('title')).toBe('Correction: A2_10 says reverse polarity.')
    const body = url.searchParams.get('body')!
    expect(body).toContain('**Page:** Reference')
    expect(body).toContain('**Source (document and page), if you know it:** TSM p.78')
    expect(body).toContain('It is a place-holder.')
  })

  it('fills in "not given" for blanks and survives special characters', () => {
    const url = new URL(buildIssueUrl({ ...base, source: '', revision: '', message: 'Use & "quotes" # ? =' }))
    const body = url.searchParams.get('body')!
    expect(body).toContain('**Revision:** not given')
    expect(body).toContain('Use & "quotes" # ? =')
  })

  it('keeps the link short enough to open, however much was typed', () => {
    const long = buildIssueUrl({ ...base, message: 'x'.repeat(MAX_MESSAGE * 5), page: 'p'.repeat(5000) })
    expect(long.length).toBeLessThan(8000)
  })
})
