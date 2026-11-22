import decksJson from './decks.json'
import { generateSignQuestions, generateTermQuestions } from './generators'
import topicsJson from './topics.json'
import type { Card, Deck, Question, Topic } from './types'

/**
 * Питання: по файлу на тему в src/content/questions/*.json.
 * Картки: по файлу на колоду в src/content/cards/*.json.
 * Нові файли підхоплюються автоматично; усе потрапляє в бандл і працює офлайн.
 */
const questionModules = import.meta.glob<Question[]>('./questions/*.json', { eager: true, import: 'default' })
const cardModules = import.meta.glob<Card[]>('./cards/*.json', { eager: true, import: 'default' })

export const TOPICS: Topic[] = topicsJson
export const DECKS: Deck[] = decksJson

export const CARDS: Card[] = Object.keys(cardModules)
  .sort()
  .flatMap((path) => cardModules[path])

/** Питання, написані у файлах тем. */
const WRITTEN_QUESTIONS: Question[] = Object.keys(questionModules)
  .sort()
  .flatMap((path) => questionModules[path])

/** Усі питання: написані вручну + згенеровані з карток знаків і термінів. */
export const QUESTIONS: Question[] = [
  ...WRITTEN_QUESTIONS,
  ...generateSignQuestions(CARDS.filter((card) => card.deck === 'signs')),
  ...generateTermQuestions(CARDS.filter((card) => card.deck === 'terms')),
]

export const QUESTION_BY_ID: ReadonlyMap<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]))
export const TOPIC_BY_ID: ReadonlyMap<string, Topic> = new Map(TOPICS.map((t) => [t.id, t]))

export function questionsByTopic(topicId: string): Question[] {
  return QUESTIONS.filter((q) => q.topic === topicId)
}

export function cardsByDeck(deckId: string): Card[] {
  return CARDS.filter((c) => c.deck === deckId)
}
