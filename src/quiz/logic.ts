import type { Quiz, QuizQuestion } from '../content/types'
import { createRng, shuffle } from '../sims/rng'

/** Every selected id must be correct and every correct id selected. */
export function gradeQuestion(q: QuizQuestion, selected: string[]): boolean {
  if (selected.length !== q.correct.length) return false
  return q.correct.every((c) => selected.includes(c))
}

/**
 * A fresh attempt: question order is shuffled, and so are choices (except true/false,
 * which keeps its natural order), so retakes cannot be memorized by position.
 */
export function buildAttempt(quiz: Quiz, seed: number): QuizQuestion[] {
  const rng = createRng(seed)
  return shuffle(rng, quiz.questions).map((q) => (q.kind === 'truefalse' ? q : { ...q, choices: shuffle(rng, q.choices) }))
}

export const scorePercent = (score: number, total: number): number => (total ? Math.round((score / total) * 100) : 0)
