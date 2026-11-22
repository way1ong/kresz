import type { ExamSession } from '../features/exam/engine'
import { createStore, useStore } from './createStore'

/** Поточний (незавершений) іспит — зберігається, щоб пережити перезавантаження сторінки. */
export const examStore = createStore<ExamSession | null>('kresz.exam.current.v1', () => null)

export function useExamSession(): ExamSession | null {
  return useStore(examStore)
}
