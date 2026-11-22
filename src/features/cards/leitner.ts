/**
 * Система Лейтнера: 5 коробок. Картка, яку знаєш, переходить у наступну коробку
 * й повертається через довший інтервал; яку не знаєш — падає в коробку 1.
 */
export const LEITNER = {
  boxCount: 5,
  /** Через скільки днів картка з коробки N (індекс N-1) з'являється знову. */
  intervalsDays: [0, 1, 3, 7, 14],
  /** Питання зникає з колоди «Мої помилки», коли його картка доходить до цієї коробки. */
  mistakeGraduateBox: 4,
} as const

export interface CardState {
  box: number
  /** Час (мс), починаючи з якого картку треба показати знову. */
  due: number
  reviews: number
  lapses: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Новий стан картки після відповіді «знав / не знав». Нова картка вважається в коробці 1. */
export function reviewCard(prev: CardState | undefined, knew: boolean, now: number): CardState {
  const currentBox = prev?.box ?? 1
  const box = knew ? Math.min(currentBox + 1, LEITNER.boxCount) : 1
  const days = LEITNER.intervalsDays[box - 1]
  return {
    box,
    // Інтервали рахуємо від початку доби, щоб картка була доступна зранку потрібного дня.
    due: days === 0 ? now : startOfDay(now) + days * DAY_MS,
    reviews: (prev?.reviews ?? 0) + 1,
    lapses: (prev?.lapses ?? 0) + (knew ? 0 : 1),
  }
}

/** Нові картки (без стану) завжди «на сьогодні». */
export function isDue(state: CardState | undefined, now: number): boolean {
  return !state || state.due <= now
}

/** Ідентифікатор картки колоди «Мої помилки» для питання. */
export function mistakeCardId(questionId: string): string {
  return `q:${questionId}`
}
