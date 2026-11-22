import { useState } from 'react'
import { Link } from '../../app/router'
import { Explanation, QuestionView } from '../../components/QuestionView'
import { ProgressBar } from '../../components/ui'
import { PRACTICE_CONFIG } from '../../config/practice'
import { QUESTION_BY_ID, QUESTIONS, questionsByTopic, TOPIC_BY_ID } from '../../content'
import { Bi, Tx } from '../../i18n'
import { shuffledIndices } from '../../lib/random'
import { progressStore, recordAnswer } from '../../store/progress'
import { buildPracticeQueue } from './session'

interface Round {
  queue: string[]
  index: number
  /** Порядок відповідей для поточного питання. */
  order: number[]
  selected: number | null
  wrongIds: string[]
}

function startRound(ids: string[]): Round {
  const first = QUESTION_BY_ID.get(ids[0])
  return { queue: ids, index: 0, order: shuffledIndices(first?.hu.answers.length ?? 0), selected: null, wrongIds: [] }
}

export function PracticeSessionPage({ topicId }: { topicId: string }) {
  const topic = TOPIC_BY_ID.get(topicId)
  const pool = topicId === 'all' ? QUESTIONS : questionsByTopic(topicId)
  const newQueue = () => buildPracticeQueue(pool, progressStore.get(), PRACTICE_CONFIG.roundSize)
  const [round, setRound] = useState<Round>(() => startRound(newQueue()))

  const title = topic ? <Bi hu={topic.hu} ua={topic.ua} /> : <Tx k="practice.allTopics" />

  if (pool.length === 0) {
    return (
      <>
        <h1>{title}</h1>
        <div className="card stack center">
          <Tx k="practice.empty" />
          <Link to="/practice" className="btn">
            <Tx k="practice.toTopics" layout="inline" />
          </Link>
        </div>
      </>
    )
  }

  const total = round.queue.length
  const finished = round.index >= total

  if (finished) {
    const correct = total - round.wrongIds.length
    return (
      <>
        <h1>{title}</h1>
        <div className="card stack center">
          <h2>
            <Tx k="practice.done.title" />
          </h2>
          <div className="stat-num">
            {correct}/{total}
          </div>
          <ProgressBar value={correct} max={total} tone="ok" />
          <p className="muted">
            <Tx k="practice.done.score" vars={{ correct, total }} />
          </p>
        </div>
        {round.wrongIds.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => setRound(startRound(round.wrongIds))}>
            <Tx k="practice.repeatWrong" vars={{ n: round.wrongIds.length }} layout="inline" />
          </button>
        )}
        <button
          type="button"
          className={round.wrongIds.length > 0 ? 'btn' : 'btn btn-primary'}
          onClick={() => setRound(startRound(newQueue()))}
        >
          <Tx k="practice.again" layout="inline" />
        </button>
        <Link to="/practice" className="btn">
          <Tx k="practice.toTopics" layout="inline" />
        </Link>
      </>
    )
  }

  const question = QUESTION_BY_ID.get(round.queue[round.index])!
  const answered = round.selected !== null
  const isCorrect = round.selected === question.correct

  const select = (answerIndex: number) => {
    if (answered) return
    const correct = answerIndex === question.correct
    recordAnswer(question.id, correct)
    setRound((prev) => ({
      ...prev,
      selected: answerIndex,
      wrongIds: correct ? prev.wrongIds : [...prev.wrongIds, question.id],
    }))
  }

  const next = () => {
    setRound((prev) => {
      const index = prev.index + 1
      const upcoming = QUESTION_BY_ID.get(prev.queue[index])
      return { ...prev, index, selected: null, order: shuffledIndices(upcoming?.hu.answers.length ?? 0) }
    })
    window.scrollTo(0, 0)
  }

  const questionTopic = TOPIC_BY_ID.get(question.topic)

  return (
    <>
      <div className="q-head">
        <Link to="/practice" className="icon-btn" aria-label="‹">
          ‹
        </Link>
        <span className="grow">
          <Tx k="common.questionOf" vars={{ n: round.index + 1, total }} layout="inline" />
        </span>
        {questionTopic && (
          <span className="badge badge-muted">
            {questionTopic.icon} <Bi hu={questionTopic.hu} ua={questionTopic.ua} primaryOnly layout="inline" />
          </span>
        )}
      </div>
      <ProgressBar value={round.index + (answered ? 1 : 0)} max={total} />
      <QuestionView question={question} order={round.order} selected={round.selected} revealed={answered} onSelect={select} />
      {answered && (
        <>
          <Explanation question={question} correct={isCorrect} />
          {!isCorrect && (
            <p className="muted small center">
              <Tx k="practice.addedToMistakes" layout="inline" />
            </p>
          )}
          <div className="sticky-actions">
            <button type="button" className="btn btn-primary" onClick={next} autoFocus>
              <Tx k={round.index + 1 >= total ? 'common.finish' : 'common.next'} layout="inline" />
            </button>
          </div>
        </>
      )}
    </>
  )
}
