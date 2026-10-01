import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SourceNote from '../components/SourceNote'
import { getModule } from '../content'
import type { Module, QuizQuestion } from '../content/types'
import { buildAttempt, gradeQuestion, scorePercent } from '../quiz/logic'
import { progressActions } from '../progress/store'
import { randomSeed } from '../sims/rng'

interface Answer {
  question: QuizQuestion
  selected: string[]
  correct: boolean
}

const primary =
  'rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300'

export default function QuizPage() {
  const { moduleId = '' } = useParams()
  const module = getModule(moduleId)
  if (!module || !module.quiz) {
    return (
      <div>
        <p>Quiz not found.</p>
        <Link className="text-amber-700 underline dark:text-amber-400" to="/">
          Back to dashboard
        </Link>
      </div>
    )
  }
  return <QuizRunner module={module} />
}

function QuizRunner({ module }: { module: Module }) {
  const quiz = module.quiz!
  const [round, setRound] = useState(0)
  // A fresh shuffle each round: `round` is a dependency only to force a new seed on retake.
  const questions = useMemo(() => buildAttempt(quiz, randomSeed()), [quiz, round])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])

  const finished = answers.length === questions.length
  const score = answers.filter((a) => a.correct).length

  const restart = () => {
    setRound((r) => r + 1)
    setIndex(0)
    setSelected([])
    setSubmitted(false)
    setAnswers([])
  }

  const header = (
    <Link className="text-sm text-amber-700 hover:underline dark:text-amber-400" to={`/module/${module.id}`}>
      &larr; Module {module.number}: {module.title}
    </Link>
  )

  if (finished) {
    const pct = scorePercent(score, questions.length)
    const passed = score / questions.length >= quiz.passMark
    const missed = answers.filter((a) => !a.correct)
    return (
      <div className="space-y-5">
        {header}
        <h1 className="text-2xl font-bold tracking-tight">Quiz results</h1>
        <div
          className={`rounded-xl border p-5 ${
            passed
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
              : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40'
          }`}
        >
          <div className="text-3xl font-bold">
            {score}/{questions.length} ({pct}%)
          </div>
          <p className="mt-1">
            {passed ? 'Passed.' : 'Not passed yet.'} Pass mark is {Math.round(quiz.passMark * 100)}%.{' '}
            {passed ? '' : 'Review the explanations below, then retake. The questions and answers are reshuffled.'}
          </p>
        </div>
        {missed.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">Review what you missed</h2>
            {missed.map((a) => (
              <Review key={a.question.id} answer={a} />
            ))}
          </section>
        )}
        <div className="flex gap-3">
          <button className={primary} onClick={restart}>
            Retake quiz
          </button>
          <Link
            to={`/module/${module.id}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Back to module
          </Link>
        </div>
      </div>
    )
  }

  const q = questions[index]
  const multi = q.kind === 'multi'
  const toggle = (id: string) => {
    if (submitted) return
    setSelected((cur) => (multi ? (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]) : [id]))
  }
  // The answer is recorded on "Next", so the learner can read the explanation first.
  const submit = () => setSubmitted(true)
  const next = () => {
    const updated = [...answers, { question: q, selected, correct: gradeQuestion(q, selected) }]
    setAnswers(updated)
    // Saved here, in the click handler, not during render.
    if (updated.length === questions.length) {
      progressActions.recordQuizAttempt(module.id, updated.filter((a) => a.correct).length, questions.length)
    }
    setSelected([])
    setSubmitted(false)
    setIndex((i) => i + 1)
  }
  const isCorrect = submitted && gradeQuestion(q, selected)

  return (
    <div className="space-y-5">
      {header}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Question {index + 1} of {questions.length}
      </p>
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold leading-snug">{q.prompt}</legend>
        {multi && <p className="text-sm text-slate-500 dark:text-slate-400">Select all that apply.</p>}
        <div className="space-y-2">
          {q.choices.map((c) => {
            const isSel = selected.includes(c.id)
            const isRight = q.correct.includes(c.id)
            let tone = 'border-slate-300 hover:border-amber-400 dark:border-slate-700'
            if (submitted && isRight) tone = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
            else if (submitted && isSel) tone = 'border-red-500 bg-red-50 dark:bg-red-950/40'
            else if (isSel) tone = 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
            return (
              <label key={c.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${tone}`}>
                <input
                  type={multi ? 'checkbox' : 'radio'}
                  name={`q-${q.id}`}
                  className="mt-1"
                  checked={isSel}
                  disabled={submitted}
                  onChange={() => toggle(c.id)}
                />
                <span>
                  {c.text}
                  {submitted && isRight && <span className="ml-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">Correct answer</span>}
                  {submitted && isSel && !isRight && <span className="ml-2 text-sm font-medium text-red-700 dark:text-red-400">Your answer</span>}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {submitted && (
          <div
            className={`rounded-xl border p-4 ${
              isCorrect
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40'
            }`}
          >
            <div className="font-semibold">{isCorrect ? 'Correct' : 'Not quite'}</div>
            <p className="mt-1">{q.explanation}</p>
            <div className="mt-1">
              <SourceNote sources={q.sources} revisions={q.revisions} />
            </div>
          </div>
        )}
      </div>

      {submitted ? (
        <button className={primary} onClick={next}>
          {index + 1 === questions.length ? 'See results' : 'Next question'}
        </button>
      ) : (
        <button className={primary} onClick={submit} disabled={selected.length === 0}>
          Check answer
        </button>
      )}
    </div>
  )
}

function Review({ answer }: { answer: Answer }) {
  const { question: q, selected } = answer
  const text = (ids: string[]) => ids.map((id) => q.choices.find((c) => c.id === id)?.text ?? id).join('; ')
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="font-medium">{q.prompt}</div>
      <p className="mt-2 text-sm">
        <span className="font-semibold text-red-700 dark:text-red-400">Your answer: </span>
        {text(selected)}
      </p>
      <p className="text-sm">
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Correct: </span>
        {text(q.correct)}
      </p>
      <p className="mt-2 text-sm">{q.explanation}</p>
      <div className="mt-1">
        <SourceNote sources={q.sources} revisions={q.revisions} />
      </div>
    </div>
  )
}
