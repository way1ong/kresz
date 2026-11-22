import { useEffect, useState } from 'react'
import { navigate } from '../../app/router'
import { QuestionView } from '../../components/QuestionView'
import { ProgressBar } from '../../components/ui'
import { QUESTION_BY_ID } from '../../content'
import { Tx, useT } from '../../i18n'
import { formatDuration } from '../../lib/format'
import { examStore } from '../../store/exam'
import { saveExam } from '../../store/progress'
import { advanceProgram, questionMsLeft, scoreExam, type ExamSession } from './engine'

const LOW_TOTAL_SEC = 5 * 60
const LOW_QUESTION_SEC = 10

function finishExam(session: ExamSession, timedOut: boolean) {
  // Захист від подвійного завершення (наприклад, таймер і кнопка одночасно).
  if (examStore.get()?.id !== session.id) return
  const record = scoreExam(session, (qid) => QUESTION_BY_ID.get(qid)?.correct, Date.now(), timedOut)
  saveExam(record)
  examStore.set(null)
  navigate(`/exam/result/${record.id}`, { replace: true })
}

/** Режим «як у програмі»: зафіксувати питання (або пропустити його) й перейти далі. */
function stepProgram(session: ExamSession, timedOut: boolean) {
  const result = advanceProgram(session, Date.now(), timedOut)
  if (result.done) finishExam(result.session, false)
  else examStore.set(result.session)
  window.scrollTo(0, 0)
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

/**
 * Іспит у процесі, без підказок.
 * Режим «як у програмі»: хвилина на питання, назад повернутися не можна,
 * пропущене питання повертається в кінці. «Вільний» режим: лише загальний час, вільна навігація.
 */
export function ExamRunner({ session }: { session: ExamSession }) {
  const t = useT()
  const [overview, setOverview] = useState(false)
  const now = useNow(250)
  const program = session.mode === 'program'
  const total = session.items.length
  const item = session.items[session.current]
  const question = QUESTION_BY_ID.get(item.qid)
  const answeredCount = session.items.filter((i) => i.answer !== null).length
  const openCount = session.items.filter((i) => !i.closed).length

  const totalLeft = Math.max(0, Math.ceil((session.endsAt - now) / 1000))
  const questionLeftMs = program ? questionMsLeft(session, now) : null
  const questionLeft = questionLeftMs === null ? null : Math.max(0, Math.ceil(questionLeftMs / 1000))

  useEffect(() => {
    if (totalLeft <= 0) finishExam(session, true)
    else if (questionLeftMs !== null && questionLeftMs <= 0) stepProgram(session, true)
  }, [totalLeft, questionLeftMs, session])

  const goTo = (index: number) => {
    examStore.set((prev) => (prev ? { ...prev, current: Math.min(Math.max(index, 0), total - 1) } : prev))
    setOverview(false)
    window.scrollTo(0, 0)
  }

  const select = (answerIndex: number) => {
    examStore.set((prev) =>
      prev
        ? { ...prev, items: prev.items.map((it, i) => (i === prev.current ? { ...it, answer: answerIndex } : it)) }
        : prev,
    )
  }

  const confirmFinish = () => {
    const unanswered = total - answeredCount
    if (unanswered === 0 || window.confirm(t('exam.finishConfirm', { n: unanswered }))) finishExam(session, false)
  }

  const abandon = () => {
    if (window.confirm(t('exam.abandonConfirm'))) {
      examStore.set(null)
      navigate('/exam', { replace: true })
    }
  }

  const mode = session.huOnly ? 'hu' : undefined
  const isLastFree = session.current === total - 1
  // У режимі «як у програмі» це останнє питання, якщо інших відкритих не лишилося.
  const isLastProgram = openCount <= 1

  const timerValue = questionLeft ?? totalLeft
  const timerLow = program ? timerValue <= LOW_QUESTION_SEC : timerValue <= LOW_TOTAL_SEC

  return (
    <div className="app">
      <header className="exam-bar">
        <span
          className={timerLow ? 'timer low' : 'timer'}
          role="timer"
          aria-label={t(program ? 'exam.questionTime' : 'exam.timeLeft')}
        >
          {formatDuration(timerValue)}
        </span>
        <span className="grow small muted">
          <Tx k="common.questionOf" vars={{ n: session.current + 1, total }} mode={mode} primaryOnly />
          {item.points > 1 && <> · {t('common.points', { n: item.points })}</>}
          {program && (
            <span style={{ display: 'block' }}>
              <Tx k="exam.totalLeft" vars={{ time: formatDuration(totalLeft) }} mode={mode} primaryOnly />
            </span>
          )}
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label={t('exam.overview')}
          aria-pressed={overview}
          onClick={() => setOverview((open) => !open)}
        >
          ▦
        </button>
      </header>

      <main className="main no-nav">
        <ProgressBar value={program ? total - openCount : answeredCount} max={total} />
        {overview ? (
          <section className="stack">
            <h2>
              <Tx k="exam.overview" mode={mode} />
            </h2>
            <p className="muted small">
              <Tx k="exam.answered" vars={{ n: answeredCount, total }} mode={mode} layout="inline" />
              {' · '}
              {program ? (
                <Tx k="exam.openLeft" vars={{ n: openCount }} mode={mode} layout="inline" />
              ) : (
                <Tx k="exam.overviewHint" mode={mode} layout="inline" />
              )}
            </p>
            <div className="qgrid">
              {session.items.map((it, index) => {
                const classes = [
                  it.answer !== null ? 'answered' : '',
                  program && it.closed && it.answer === null ? 'missed' : '',
                  program && !it.closed && it.spentMs > 0 && index !== session.current ? 'skipped' : '',
                  index === session.current ? 'current' : '',
                ]
                return (
                  <button
                    key={it.qid}
                    type="button"
                    className={classes.join(' ').trim()}
                    disabled={program}
                    onClick={() => goTo(index)}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setOverview(false)}>
              <Tx k="exam.backToQuestion" mode={mode} layout="inline" />
            </button>
            <button type="button" className="btn" onClick={confirmFinish}>
              <Tx k="exam.finish" mode={mode} layout="inline" />
            </button>
            <button type="button" className="btn btn-danger" onClick={abandon}>
              <Tx k="exam.abandon" mode={mode} layout="inline" />
            </button>
          </section>
        ) : (
          <>
            {question && (
              <QuestionView
                question={question}
                order={item.order}
                selected={item.answer}
                revealed={false}
                onSelect={select}
                mode={mode}
              />
            )}
            <div className="sticky-actions">
              {program ? (
                <button
                  type="button"
                  className={item.answer !== null ? 'btn btn-primary' : 'btn'}
                  onClick={() => stepProgram(session, false)}
                >
                  {item.answer === null ? (
                    <Tx k="exam.skip" mode={mode} layout="inline" />
                  ) : (
                    <Tx k={isLastProgram ? 'common.finish' : 'common.next'} mode={mode} layout="inline" />
                  )}
                </button>
              ) : (
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => goTo(session.current - 1)}
                    disabled={session.current === 0}
                  >
                    <Tx k="exam.prev" mode={mode} layout="inline" />
                  </button>
                  {isLastFree ? (
                    <button type="button" className="btn btn-primary" onClick={confirmFinish}>
                      <Tx k="common.finish" mode={mode} layout="inline" />
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => goTo(session.current + 1)}>
                      <Tx k="common.next" mode={mode} layout="inline" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
