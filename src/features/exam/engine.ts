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
}

export interface ExamItem {
  qid: string
  /** Порядок показу відповідей (індекси вихідного масиву answers). */
  order: number[]
  /** Обрана відповідь (вихідний індекс) або null. */
  answer: number | null
  points: number
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
  const one = shuffle(pool.filter((q) => pointsOf(q) !== 3), rng)

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

export function startExam(plan: ExamPlan, huOnly: boolean, now: number, rng: Rng = Math.random): ExamSession {
  return {
    id: `exam-${now}`,
    startedAt: now,
    endsAt: now + plan.timeLimitSec * 1000,
    timeLimitSec: plan.timeLimitSec,
    maxScore: plan.maxScore,
    passScore: plan.passScore,
    reduced: plan.reduced,
    huOnly,
    current: 0,
    items: plan.questions.map((q) => ({
      qid: q.id,
      order: shuffledIndices(q.hu.answers.length, rng),
      answer: null,
      points: pointsOf(q),
    })),
  }
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
    items,
  }
}
