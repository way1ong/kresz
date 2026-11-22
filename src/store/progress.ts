import { LEITNER, mistakeCardId, reviewCard, type CardState } from '../features/cards/leitner'
import { createStore, useStore } from './createStore'

export interface QuestionStat {
  seen: number
  correct: number
  lastCorrect: boolean
  lastAt: number
}

export interface ExamRecordItem {
  qid: string
  /** Обрана відповідь (індекс у вихідному порядку answers) або null. */
  answer: number | null
  correct: boolean
  /** Вага питання в балах (1 або 3). */
  points: number
}

export interface ExamRecord {
  id: string
  startedAt: number
  finishedAt: number
  durationSec: number
  timeLimitSec: number
  score: number
  maxScore: number
  passScore: number
  passed: boolean
  timedOut: boolean
  /** Режим іспиту (у старих записах поля немає — це «вільний» режим). */
  mode?: 'program' | 'free'
  items: ExamRecordItem[]
}

export interface Progress {
  version: 1
  /** Статистика відповідей за id питання (практика + іспити). */
  questions: Record<string, QuestionStat>
  /** Стан карток Лейтнера за id картки. */
  cards: Record<string, CardState>
  /** Колода «Мої помилки»: id питань. */
  mistakes: string[]
  exams: ExamRecord[]
}

const MAX_STORED_EXAMS = 50

function emptyProgress(): Progress {
  return { version: 1, questions: {}, cards: {}, mistakes: [], exams: [] }
}

export function reviveProgress(raw: unknown): Progress {
  const base = emptyProgress()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<Progress>
  return {
    version: 1,
    questions: data.questions && typeof data.questions === 'object' ? data.questions : base.questions,
    cards: data.cards && typeof data.cards === 'object' ? data.cards : base.cards,
    mistakes: Array.isArray(data.mistakes) ? data.mistakes.filter((id) => typeof id === 'string') : base.mistakes,
    exams: Array.isArray(data.exams) ? data.exams : base.exams,
  }
}

export const progressStore = createStore<Progress>('kresz.progress.v1', emptyProgress, reviveProgress)

export function useProgress(): Progress {
  return useStore(progressStore)
}

/** Чиста функція: облік однієї відповіді на питання. Помилка додає питання в «Мої помилки». */
export function applyAnswer(progress: Progress, qid: string, correct: boolean, now: number): Progress {
  const prev = progress.questions[qid]
  const questions = {
    ...progress.questions,
    [qid]: {
      seen: (prev?.seen ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
      lastCorrect: correct,
      lastAt: now,
    },
  }
  if (correct) return { ...progress, questions }

  // Помилка: питання потрапляє в колоду помилок, його картка починає з коробки 1.
  const cards = { ...progress.cards }
  delete cards[mistakeCardId(qid)]
  const mistakes = progress.mistakes.includes(qid) ? progress.mistakes : [...progress.mistakes, qid]
  return { ...progress, questions, cards, mistakes }
}

/** Чиста функція: повторення картки. Картка-помилка «випускається» з колоди, дійшовши до потрібної коробки. */
export function applyCardReview(progress: Progress, cardId: string, knew: boolean, now: number): Progress {
  const next = reviewCard(progress.cards[cardId], knew, now)
  const cards = { ...progress.cards, [cardId]: next }
  if (cardId.startsWith('q:') && next.box >= LEITNER.mistakeGraduateBox) {
    delete cards[cardId]
    const qid = cardId.slice(2)
    return { ...progress, cards, mistakes: progress.mistakes.filter((id) => id !== qid) }
  }
  return { ...progress, cards }
}

export function recordAnswer(qid: string, correct: boolean) {
  progressStore.set((prev) => applyAnswer(prev, qid, correct, Date.now()))
}

export function recordCardReview(cardId: string, knew: boolean) {
  progressStore.set((prev) => applyCardReview(prev, cardId, knew, Date.now()))
}

export function saveExam(record: ExamRecord) {
  progressStore.set((prev) => {
    let next: Progress = { ...prev, exams: [...prev.exams, record].slice(-MAX_STORED_EXAMS) }
    for (const item of record.items) {
      // Питання без відповіді теж рахується помилкою.
      next = applyAnswer(next, item.qid, item.correct, record.finishedAt)
    }
    return next
  })
}
