import { useState } from 'react'
import { Link } from '../../app/router'
import { Explanation, QuestionView } from '../../components/QuestionView'
import { QUESTION_BY_ID } from '../../content'
import { Tx, useT } from '../../i18n'
import { formatDuration } from '../../lib/format'
import { useProgress } from '../../store/progress'

export function ExamResultPage({ examId }: { examId: string }) {
  const progress = useProgress()
  const t = useT()
  const [onlyWrong, setOnlyWrong] = useState(true)
  const record = progress.exams.find((exam) => exam.id === examId)

  if (!record) {
    return (
      <div className="card stack center">
        <Tx k="exam.result.notFound" />
        <Link to="/exam" className="btn btn-primary">
          <Tx k="exam.newExam" layout="inline" />
        </Link>
      </div>
    )
  }

  const wrongCount = record.items.filter((item) => !item.correct).length
  const shown = record.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !onlyWrong || !item.correct)

  return (
    <>
      <section className={`card result-hero ${record.passed ? 'passed' : 'failed'}`}>
        <div className="verdict">
          <Tx k={record.passed ? 'exam.result.passed' : 'exam.result.failed'} />
        </div>
        <div className="score">
          <Tx k="exam.result.score" vars={{ score: record.score, max: record.maxScore }} layout="inline" primaryOnly />
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          <Tx k="exam.result.needed" vars={{ pass: record.passScore }} />
        </p>
        <p style={{ marginTop: 8 }}>
          <span className="badge badge-muted">
            <Tx k={record.mode === 'program' ? 'exam.mode.program' : 'exam.mode.free'} primaryOnly />
          </span>
        </p>
        <p className="muted small" style={{ marginTop: 8 }}>
          {record.timedOut && (
            <>
              <Tx k="exam.result.timeUp" layout="inline" />{' '}
            </>
          )}
          <Tx
            k="exam.result.time"
            vars={{ time: `${formatDuration(record.durationSec)} / ${formatDuration(record.timeLimitSec)}` }}
            layout="inline"
            primaryOnly
          />
        </p>
      </section>

      <Link to="/exam" className="btn btn-primary">
        <Tx k="exam.newExam" layout="inline" />
      </Link>

      <h2>
        <Tx k="exam.result.review" />
      </h2>
      <div className="segmented" role="group">
        <button type="button" aria-pressed={onlyWrong} onClick={() => setOnlyWrong(true)}>
          {t('exam.result.onlyWrong')} ({wrongCount})
        </button>
        <button type="button" aria-pressed={!onlyWrong} onClick={() => setOnlyWrong(false)}>
          {t('exam.result.showAll')} ({record.items.length})
        </button>
      </div>

      {shown.length === 0 && (
        <div className="card center">
          <Tx k="exam.result.noMistakes" />
        </div>
      )}

      {shown.map(({ item, index }) => {
        const question = QUESTION_BY_ID.get(item.qid)
        if (!question) return null
        return (
          <section key={item.qid} className="card stack">
            <div className="q-head">
              <span className="grow">
                <Tx k="common.questionOf" vars={{ n: index + 1, total: record.items.length }} layout="inline" primaryOnly />
                {' · '}
                {t('common.points', { n: item.points })}
              </span>
              <span className={item.correct ? 'badge badge-ok' : 'badge badge-bad'}>
                {item.answer === null ? (
                  <Tx k="exam.result.noAnswer" primaryOnly />
                ) : (
                  <Tx k={item.correct ? 'common.correct' : 'common.wrong'} primaryOnly />
                )}
              </span>
            </div>
            <QuestionView
              question={question}
              order={question.hu.answers.map((_, i) => i)}
              selected={item.answer}
              revealed
            />
            <Explanation question={question} />
          </section>
        )
      })}
    </>
  )
}
