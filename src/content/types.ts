export type TopicId = string

/** Текст питання однією мовою. Порядок answers однаковий в обох мовах. */
export interface QuestionText {
  question: string
  answers: string[]
  explanation: string
}

export interface Question {
  /** Унікальний ідентифікатор, наприклад "signs-001". */
  id: string
  /** Ідентифікатор теми з topics.json. */
  topic: TopicId
  /** Пункт правил, наприклад "KRESZ 26. § (1)". */
  kreszRef: string
  /** Необов'язково: id малюнка з реєстру src/signs (наприклад "stop"). */
  image?: string
  /** Вага питання на іспиті: 1 (типово) або 3 бали. */
  points?: 1 | 3
  hu: QuestionText
  ua: QuestionText
  /** Індекс правильної відповіді в answers (з нуля). */
  correct: number
}

export interface Topic {
  id: TopicId
  icon: string
  hu: string
  ua: string
}

export interface CardText {
  /** Лицьовий бік. Можна лишити порожнім, якщо є image (картка-знак). */
  front: string
  /** Коротка назва (для карток-знаків — назва знака; показується в довіднику знаків). */
  title?: string
  back: string
}

export interface Card {
  id: string
  /** Ідентифікатор колоди з decks.json. */
  deck: string
  image?: string
  kreszRef?: string
  hu: CardText
  ua: CardText
}

export interface Deck {
  id: string
  icon: string
  hu: string
  ua: string
}
