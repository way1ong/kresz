import { EXAM_CONFIG } from '../../config/exam'
import type { Question } from '../../content/types'
import { shuffle, shuffledIndices, type Rng } from '../../lib/random'
import type { ExamRecord } from '../../store/progress'

export interface ExamRules {
  questionCount: number
  durationMinutes: number
  maxPoints: number
  passPoints: number
  threePointQuestions: number
  /** Скільки щонайбільше згенерованих питань «на розпізнавання» брати в один іспит. */
  maxRecognitionQuestions?: number
}

export interface ExamItem {
  qid: string
  /** Порядок показу відповідей (індекси вихідного масиву answers). */
  order: number[]
  /** Обрана відповідь (вихідний індекс) або null. */
  answer: number | null
  points: number
  /** Режим «як у програмі»: скільки часу вже витрачено на це питання, мс. */
  spentMs: number
  /** Режим «як у програмі»: питання закрито (відповідь зафіксовано або час вичерпано). */
  closed: boolean
}

export type ExamMode = 'program' | 'free'

export interface ExamOptions {
  huOnly: boolean
  mode: ExamMode
  /** Ліміт часу на питання в режимі «як у програмі», секунди. */
  perQuestionSec: number
}

export interface ExamSession {
  id: string
  startedAt: number
  /** Момент, коли час вичерпається. */
  endsAt: number
  timeLimitSec: number
  maxScore: number
  passScore: number
  /** База питань менша за справжній іспит — параметри зменшено пропорційно. */
  reduced: boolean
  huOnly: boolean
  mode: ExamMode
  perQuestionSec: number
  /** Коли показано поточне питання (для відліку часу на питання). */
  shownAt: number
  current: number
  items: ExamItem[]
}

export interface ExamPlan {
  questions: Question[]
  maxScore: number
  passScore: number
  timeLimitSec: number
  reduced: boolean
}

const pointsOf = (q: Question) => q.points ?? 1

/**
 * Вибірка питань для іспиту: потрібна кількість «трибальних» і «однобальних»
 * питань випадково з усіх тем. Якщо база замала — беремо все, що є,
 * а час і прохідний поріг зменшуємо пропорційно.
 */
export function planExam(pool: Question[], rules: ExamRules = EXAM_CONFIG, rng: Rng = Math.random): ExamPlan {
  const three = shuffle(pool.filter((q) => pointsOf(q) === 3), rng)
  const isRecognition = (q: Question) => q.generated === 'sign' || q.generated === 'term'
  const onePointers = pool.filter((q) => pointsOf(q) !== 3)
  // Питань «на розпізнавання» беремо обмежену кількість; решта йде в кінець як запас.
  const recognition = shuffle(onePointers.filter(isRecognition), rng)
  const cap = rules.maxRecognitionQuestions ?? recognition.length
  const one = [
    ...shuffle([...onePointers.filter((q) => !isRecognition(q)), ...recognition.slice(0, cap)], rng),
    ...recognition.slice(cap),
  ]

  const wantThree = Math.min(rules.threePointQuestions, rules.questionCount)
  const picked = [...three.slice(0, wantThree), ...one.slice(0, rules.questionCount - wantThree)]
  // Якщо однієї з груп не вистачило — добираємо з решти іншої групи.
  const rest = [...three.slice(wantThree), ...one.slice(rules.questionCount - wantThree)]
  const questions = shuffle([...picked, ...rest.slice(0, Math.max(0, rules.questionCount - picked.length))], rng)

  const maxScore = questions.reduce((sum, q) => sum + pointsOf(q), 0)
  const full = questions.length === rules.questionCount && maxScore === rules.maxPoints
  return {
    questions,
    maxScore,
    passScore: full ? rules.passPoints : Math.ceil((maxScore * rules.passPoints) / rules.maxPoints),
    timeLimitSec: Math.round((questions.length * rules.durationMinutes * 60) / rules.questionCount),
    reduced: !full,
  }
}

export function startExam(plan: ExamPlan, options: ExamOptions, now: number, rng: Rng = Math.random): ExamSession {
  return {
    id: `exam-${now}`,
    startedAt: now,
    endsAt: now + plan.timeLimitSec * 1000,
    timeLimitSec: plan.timeLimitSec,
    maxScore: plan.maxScore,
    passScore: plan.passScore,
    reduced: plan.reduced,
    huOnly: options.huOnly,
    mode: options.mode,
    perQuestionSec: options.perQuestionSec,
    shownAt: now,
    current: 0,
    items: plan.questions.map((q) => ({
      qid: q.id,
      order: shuffledIndices(q.hu.answers.length, rng),
      answer: null,
      points: pointsOf(q),
      spentMs: 0,
      closed: false,
    })),
  }
}

/** Режим «як у програмі»: скільки часу лишилося на поточне питання, мс. */
export function questionMsLeft(session: ExamSession, now: number): number {
  const item = session.items[session.current]
  return session.perQuestionSec * 1000 - item.spentMs - Math.max(0, now - session.shownAt)
}

/**
 * Режим «як у програмі»: перехід до наступного питання.
 * - Питання з відповіддю закривається — повернутися до нього вже не можна.
 * - Питання без відповіді пропускається: воно повернеться після решти питань
 *   із тим часом, що на ньому лишився.
 * - Якщо час на питання вичерпано (timedOut), воно закривається з тією відповіддю, що є.
 * Повертає done = true, коли відкритих питань не лишилося.
 */
export function advanceProgram(session: ExamSession, now: number, timedOut: boolean): { session: ExamSession; done: boolean } {
  const limitMs = session.perQuestionSec * 1000
  const current = session.items[session.current]
  const spentMs = Math.min(limitMs, current.spentMs + Math.max(0, now - session.shownAt))
  const closed = timedOut || current.answer !== null || spentMs >= limitMs
  const items = session.items.map((item, index) => (index === session.current ? { ...item, spentMs, closed } : item))

  for (let step = 1; step <= items.length; step++) {
    const index = (session.current + step) % items.length
    if (!items[index].closed) return { session: { ...session, items, current: index, shownAt: now }, done: false }
  }
  return { session: { ...session, items }, done: true }
}

/** Підсумок іспиту. correctOf повертає індекс правильної відповіді для питання. */
export function scoreExam(
  session: ExamSession,
  correctOf: (qid: string) => number | undefined,
  now: number,
  timedOut: boolean,
): ExamRecord {
  const items = session.items.map((item) => ({
    qid: item.qid,
    answer: item.answer,
    correct: item.answer !== null && item.answer === correctOf(item.qid),
    points: item.points,
  }))
  const score = items.reduce((sum, item) => sum + (item.correct ? item.points : 0), 0)
  const finishedAt = Math.min(now, session.endsAt)
  return {
    id: session.id,
    startedAt: session.startedAt,
    finishedAt,
    durationSec: Math.round((finishedAt - session.startedAt) / 1000),
    timeLimitSec: session.timeLimitSec,
    score,
    maxScore: session.maxScore,
    passScore: session.passScore,
    passed: score >= session.passScore,
    timedOut,
    mode: session.mode,
    items,
  }
}
