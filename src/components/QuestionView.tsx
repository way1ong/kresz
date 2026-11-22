import { useState } from 'react'
import type { Question } from '../content/types'
import { Bi, Tx } from '../i18n'
import { isScene } from '../signs/scenes'
import { SignImage } from '../signs/SignImage'
import { useSettings, type LangMode } from '../store/settings'

const LETTERS = 'ABCDEFGH'

interface QuestionViewProps {
  question: Question
  /** Порядок показу відповідей: елементи — індекси у вихідному масиві answers. */
  order: number[]
  /** Обрана відповідь (вихідний індекс) або null. */
  selected: number | null
  /** true — показати правильну/неправильну відповідь (після відповіді або в розборі). */
  revealed: boolean
  onSelect?: (answerIndex: number) => void
  mode?: LangMode
}

export function QuestionView({ question, order, selected, revealed, onSelect, mode: forcedMode }: QuestionViewProps) {
  const settings = useSettings()
  // «Переклад за дотиком»: у режимі HU+UA питання показується лише угорською,
  // доки користувач не відкриє переклад або не відповість.
  const [peekedId, setPeekedId] = useState<string | null>(null)
  const canPeek = forcedMode === undefined && settings.lang === 'both' && settings.peekTranslation && !revealed
  const peeked = peekedId === question.id
  const mode: LangMode | undefined = canPeek && !peeked ? 'hu' : forcedMode

  return (
    <div className="stack">
      <div className="q-text">
        <Bi hu={question.hu.question} ua={question.ua.question} mode={mode} />
      </div>
      {canPeek && (
        <button
          type="button"
          className="peek-btn"
          aria-pressed={peeked}
          onClick={() => setPeekedId(peeked ? null : question.id)}
        >
          <Tx k={peeked ? 'question.hideTranslation' : 'question.showTranslation'} layout="inline" mode="both" />
        </button>
      )}
      {question.image && (
        <div className={isScene(question.image) ? 'q-image scene' : 'q-image'}>
          <SignImage id={question.image} />
        </div>
      )}
      <div className="answers">
        {order.map((answerIndex, position) => {
          const isSelected = selected === answerIndex
          const isCorrect = question.correct === answerIndex
          let cls = 'answer'
          if (revealed) {
            if (isCorrect) cls += ' correct'
            else if (isSelected) cls += ' wrong'
            else cls += ' dim'
          } else if (isSelected) {
            cls += ' selected'
          }
          return (
            <button
              key={answerIndex}
              type="button"
              className={cls}
              disabled={revealed || !onSelect}
              aria-pressed={isSelected}
              onClick={() => onSelect?.(answerIndex)}
            >
              <span className="answer-letter" aria-hidden="true">
                {revealed && isCorrect ? '✓' : revealed && isSelected ? '✕' : LETTERS[position]}
              </span>
              <Bi hu={question.hu.answers[answerIndex]} ua={question.ua.answers[answerIndex]} mode={mode} className="grow" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Пояснення до питання з посиланням на пункт KRESZ. */
export function Explanation({ question, correct, mode }: { question: Question; correct?: boolean; mode?: LangMode }) {
  const tone = correct === undefined ? '' : correct ? ' ok' : ' bad'
  return (
    <div className={`explain${tone}`}>
      <div className="explain-title">
        {correct === undefined ? (
          <Tx k="common.explanation" layout="inline" mode={mode} />
        ) : (
          <Tx k={correct ? 'common.correct' : 'common.wrong'} layout="inline" mode={mode} />
        )}
      </div>
      <Bi hu={question.hu.explanation} ua={question.ua.explanation} mode={mode} />
      <div className="kresz-ref">
        <Tx k="common.kreszRef" layout="inline" mode={mode} />: {question.kreszRef}
      </div>
    </div>
  )
}
