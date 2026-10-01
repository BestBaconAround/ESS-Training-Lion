import { describe, expect, it } from 'vitest'
import type { Quiz, QuizQuestion } from '../content/types'
import { buildAttempt, gradeQuestion, scorePercent } from './logic'

const q = (id: string, kind: QuizQuestion['kind'], correct: string[]): QuizQuestion => ({
  id,
  kind,
  prompt: id,
  choices: ['a', 'b', 'c', 'd'].map((c) => ({ id: c, text: c })),
  correct,
  explanation: 'because',
  sources: [{ source: 'author' }],
  revisions: 'all',
})

describe('quiz logic', () => {
  it('grades single answers', () => {
    expect(gradeQuestion(q('x', 'single', ['b']), ['b'])).toBe(true)
    expect(gradeQuestion(q('x', 'single', ['b']), ['a'])).toBe(false)
    expect(gradeQuestion(q('x', 'single', ['b']), [])).toBe(false)
  })

  it('grades multi answers all-or-nothing', () => {
    const m = q('m', 'multi', ['a', 'c'])
    expect(gradeQuestion(m, ['c', 'a'])).toBe(true)
    expect(gradeQuestion(m, ['a'])).toBe(false)
    expect(gradeQuestion(m, ['a', 'b', 'c'])).toBe(false)
  })

  it('shuffles questions and choices, keeps all of them, and is reproducible per seed', () => {
    const quiz: Quiz = {
      passMark: 0.8,
      questions: Array.from({ length: 8 }, (_, i) => q(`q${i}`, 'single', ['a'])),
    }
    const a = buildAttempt(quiz, 1)
    const b = buildAttempt(quiz, 1)
    const c = buildAttempt(quiz, 2)
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
    expect(a.map((x) => x.id).sort()).toEqual(quiz.questions.map((x) => x.id).sort())
    expect(a.map((x) => x.id)).not.toEqual(c.map((x) => x.id))
    for (const x of a) expect(x.choices.map((ch) => ch.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('keeps true/false choices in order', () => {
    const tf: QuizQuestion = { ...q('t', 'truefalse', ['true']), choices: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }] }
    for (let seed = 0; seed < 20; seed++) {
      expect(buildAttempt({ passMark: 1, questions: [tf] }, seed)[0].choices.map((c) => c.id)).toEqual(['true', 'false'])
    }
  })

  it('computes percent', () => {
    expect(scorePercent(3, 4)).toBe(75)
    expect(scorePercent(0, 0)).toBe(0)
  })
})
