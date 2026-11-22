import { useCallback, useEffect, useState } from 'react'
import { navigate } from '../../app/router'
import { QuestionView } from '../../components/QuestionView'
import { ProgressBar } from '../../components/ui'
import { QUESTION_BY_ID } from '../../content'
import { Tx, useT } from '../../i18n'
import { formatDuration } from '../../lib/format'
import { examStore } from '../../store/exam'
import { saveExam } from '../../store/progress'
import { scoreExam, type ExamSession } from './engine'

const LOW_TIME_SEC = 5 * 60

function finishExam(session: ExamSession, timedOut: boolean) {
  // Захист від подвійного завершення (наприклад, таймер і кнопка одночасно).
  if (examStore.get()?.id !== session.id) return
  const record = scoreExam(session, (qid) => QUESTION_BY_ID.get(qid)?.correct, Date.now(), timedOut)
  saveExam(record)
  examStore.set(null)
  navigate(`/exam/result/${record.id}`, { replace: true })
}

function useSecondsLeft(endsAt: number): number {
  const compute = useCallback(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)), [endsAt])
  const [left, setLeft] = useState(compute)
  useEffect(() => {
    const timer = window.setInterval(() => setLeft(compute()), 500)
    return () => window.clearInterval(timer)
  }, [compute])
  return left
}

/** Іспит у процесі: таймер, питання без підказок, вільна навігація між питаннями. */
export function ExamRunner({ session }: { session: ExamSession }) {
  const t = useT()
  const [overview, setOverview] = useState(false)
  const secondsLeft = useSecondsLeft(session.endsAt)
  const total = session.items.length
  const item = session.items[session.current]
  const question = QUESTION_BY_ID.get(item.qid)
  const answeredCount = session.items.filter((i) => i.answer !== null).length
  const isLast = session.current === total - 1

  useEffect(() => {
    if (secondsLeft <= 0) finishExam(session, true)
  }, [secondsLeft, session])

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

  return (
    <div className="app">
      <header className="exam-bar">
        <span className={secondsLeft <= LOW_TIME_SEC ? 'timer low' : 'timer'} role="timer" aria-label={t('exam.timeLeft')}>
          {formatDuration(secondsLeft)}
        </span>
        <span className="grow small muted">
          <Tx k="common.questionOf" vars={{ n: session.current + 1, total }} mode={mode} primaryOnly />
          {item.points > 1 && <> · {t('common.points', { n: item.points })}</>}
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
        <ProgressBar value={answeredCount} max={total} />
        {overview ? (
          <section className="stack">
            <h2>
              <Tx k="exam.overview" mode={mode} />
            </h2>
            <p className="muted small">
              <Tx k="exam.answered" vars={{ n: answeredCount, total }} mode={mode} layout="inline" />
              {' · '}
              <Tx k="exam.overviewHint" mode={mode} layout="inline" />
            </p>
            <div className="qgrid">
              {session.items.map((it, index) => (
                <button
                  key={it.qid}
                  type="button"
                  className={[it.answer !== null ? 'answered' : '', index === session.current ? 'current' : '']
                    .join(' ')
                    .trim()}
                  onClick={() => goTo(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={confirmFinish}>
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
              <div className="btn-row">
                <button type="button" className="btn" onClick={() => goTo(session.current - 1)} disabled={session.current === 0}>
                  <Tx k="exam.prev" mode={mode} layout="inline" />
                </button>
                {isLast ? (
                  <button type="button" className="btn btn-primary" onClick={confirmFinish}>
                    <Tx k="common.finish" mode={mode} layout="inline" />
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => goTo(session.current + 1)}>
                    <Tx k="common.next" mode={mode} layout="inline" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
