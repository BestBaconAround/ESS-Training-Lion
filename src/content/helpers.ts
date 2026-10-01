import type { Block, Fact, QuizQuestion, RevisionTag, SourceRef } from './types'

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


const CHOICE_IDS = ['a', 'b', 'c', 'd', 'e', 'f']

interface QuestionInput {
  id: string
  lessonId?: string
  prompt: string
  /** Correct choice text(s). One entry makes a single-answer question, several make multi. */
  correct: string[]
  wrong: string[]
  explanation: string
  sources: SourceRef[]
  revisions?: RevisionTag
}

/**
 * Builds a question from texts. Choice order here does not matter: the quiz
 * runner reshuffles choices on every attempt.
 */
export function question(input: QuestionInput): QuizQuestion {
  const texts = [...input.correct, ...input.wrong]
  const choices = texts.map((text, i) => ({ id: CHOICE_IDS[i], text }))
  return {
    id: input.id,
    lessonId: input.lessonId,
    prompt: input.prompt,
    kind: input.correct.length > 1 ? 'multi' : 'single',
    choices,
    correct: choices.slice(0, input.correct.length).map((c) => c.id),
    explanation: input.explanation,
    sources: input.sources,
    revisions: input.revisions ?? 'all',
  }
}

export function trueFalse(input: {
  id: string
  lessonId?: string
  prompt: string
  answer: boolean
  explanation: string
  sources: SourceRef[]
  revisions?: RevisionTag
}): QuizQuestion {
  return {
    id: input.id,
    lessonId: input.lessonId,
    prompt: input.prompt,
    kind: 'truefalse',
    choices: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correct: [input.answer ? 'true' : 'false'],
    explanation: input.explanation,
    sources: input.sources,
    revisions: input.revisions ?? 'all',
  }
}

/** A photo block. Photos are from the author's training setup unless stated. */
export const image = (
  src: string,
  size: [number, number],
  alt: string,
  caption: string,
  revisions: RevisionTag = ['rev4'],
  sources: SourceRef[] = [{ source: 'author', note: 'Photo from the author\'s training setup' }],
): Block => ({ type: 'image', src, alt, caption, width: size[0], height: size[1], sources, revisions })
