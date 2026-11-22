import { PRACTICE_CONFIG } from '../../config/practice'
import type { Question, Topic } from '../../content/types'
import type { ExamRecord, Progress } from '../../store/progress'

export interface TopicStats {
  topic: Topic
  total: number
  /** Скільки питань теми вже траплялося. */
  seen: number
  /** Скільки питань, на які остання відповідь була правильною. */
  mastered: number
  answers: number
  correctAnswers: number
  /** Частка правильних відповідей (0..1) або null, якщо відповідей ще не було. */
  accuracy: number | null
  weak: boolean
}

export function topicStats(topics: Topic[], questions: Question[], progress: Progress): TopicStats[] {
  return topics.map((topic) => {
    const own = questions.filter((q) => q.topic === topic.id)
    let seen = 0
    let mastered = 0
    let answers = 0
    let correctAnswers = 0
    for (const q of own) {
      const stat = progress.questions[q.id]
      if (!stat) continue
      seen += 1
      if (stat.lastCorrect) mastered += 1
      answers += stat.seen
      correctAnswers += stat.correct
    }
    const accuracy = answers > 0 ? correctAnswers / answers : null
    return {
      topic,
      total: own.length,
      seen,
      mastered,
      answers,
      correctAnswers,
      accuracy,
      weak:
        accuracy !== null && answers >= PRACTICE_CONFIG.weakMinAnswers && accuracy < PRACTICE_CONFIG.weakAccuracy,
    }
  })
}

export function overallStats(stats: TopicStats[]) {
  const sum = (pick: (s: TopicStats) => number) => stats.reduce((acc, s) => acc + pick(s), 0)
  const answers = sum((s) => s.answers)
  return {
    total: sum((s) => s.total),
    seen: sum((s) => s.seen),
    answers,
    accuracy: answers > 0 ? sum((s) => s.correctAnswers) / answers : null,
  }
}

/** Розподіл карток за коробками Лейтнера: індекс 0 — нові (ще без стану), далі коробки 1..N. */
export function boxDistribution(cardIds: string[], progress: Progress, boxCount: number): number[] {
  const counts = Array.from({ length: boxCount + 1 }, () => 0)
  for (const id of cardIds) {
    const box = progress.cards[id]?.box
    counts[box && box >= 1 && box <= boxCount ? box : 0] += 1
  }
  return counts
}

export type ReadinessLevel = 'none' | 'low' | 'almost' | 'ready'

export interface Readiness {
  level: ReadinessLevel
  /** Скільки останніх іспитів враховано. */
  considered: number
  passed: number
  /** Середній результат у відсотках від максимуму. */
  averagePercent: number | null
}

const READINESS_WINDOW = 5
const READINESS_MIN_EXAMS = 3

/**
 * Груба оцінка готовності за останніми пробними іспитами:
 * менше трьох іспитів — оцінки немає; усі останні складено — «готовий»;
 * складено щонайменше половину — «майже»; інакше — «ще ні».
 */
export function readiness(exams: ExamRecord[]): Readiness {
  const recent = exams.slice(-READINESS_WINDOW)
  const passed = recent.filter((exam) => exam.passed).length
  const averagePercent =
    recent.length > 0
      ? Math.round((recent.reduce((sum, exam) => sum + exam.score / exam.maxScore, 0) / recent.length) * 100)
      : null
  let level: ReadinessLevel = 'low'
  if (recent.length < READINESS_MIN_EXAMS) level = 'none'
  else if (passed === recent.length) level = 'ready'
  else if (passed * 2 >= recent.length) level = 'almost'
  return { level, considered: recent.length, passed, averagePercent }
}

/** Питання для режиму «слабкі місця»: остання відповідь хибна або питання є в колоді помилок. */
export function weakQuestionIds(questions: Question[], progress: Progress): string[] {
  const mistakes = new Set(progress.mistakes)
  return questions
    .filter((q) => mistakes.has(q.id) || progress.questions[q.id]?.lastCorrect === false)
    .map((q) => q.id)
}
