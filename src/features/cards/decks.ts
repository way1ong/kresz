import { cardsByDeck, QUESTION_BY_ID } from '../../content'
import type { Progress } from '../../store/progress'
import { isDue, mistakeCardId } from './leitner'

export const MISTAKES_DECK = 'mistakes'

/** Картка в уніфікованому вигляді: звичайна (з JSON) або зроблена з питання (колода помилок). */
export interface ReviewItem {
  cardId: string
  image?: string
  kreszRef?: string
  front: { hu: string; ua: string }
  back: { hu: string; ua: string }
  /** Додаткове пояснення під відповіддю (для карток-питань). */
  note?: { hu: string; ua: string }
}

export function deckItems(deckId: string, progress: Progress): ReviewItem[] {
  if (deckId === MISTAKES_DECK) {
    return progress.mistakes.flatMap((qid) => {
      const q = QUESTION_BY_ID.get(qid)
      // Питання могли видалити з контенту — такі записи просто пропускаємо.
      if (!q) return []
      return [
        {
          cardId: mistakeCardId(qid),
          image: q.image,
          kreszRef: q.kreszRef,
          front: { hu: q.hu.question, ua: q.ua.question },
          back: { hu: q.hu.answers[q.correct], ua: q.ua.answers[q.correct] },
          note: { hu: q.hu.explanation, ua: q.ua.explanation },
        },
      ]
    })
  }
  return cardsByDeck(deckId).map((card) => ({
    cardId: card.id,
    image: card.image,
    kreszRef: card.kreszRef,
    front: { hu: card.hu.front, ua: card.ua.front },
    back: { hu: card.hu.back, ua: card.ua.back },
  }))
}

export function dueItems(items: ReviewItem[], progress: Progress, now: number): ReviewItem[] {
  return items.filter((item) => isDue(progress.cards[item.cardId], now))
}
