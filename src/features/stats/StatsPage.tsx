import { Link } from '../../app/router'
import { ProgressBar } from '../../components/ui'
import { CARDS, QUESTIONS, TOPICS } from '../../content'
import { Bi, HTML_LANG, primaryLang, Tx, useT } from '../../i18n'
import { formatDateTime, formatDuration } from '../../lib/format'
import { useProgress } from '../../store/progress'
import { useSettings } from '../../store/settings'
import { LEITNER, mistakeCardId } from '../cards/leitner'
import { boxDistribution, overallStats, topicStats } from './compute'

const percent = (value: number) => Math.round(value * 100)

export function StatsPage() {
  const progress = useProgress()
  const settings = useSettings()
  const t = useT()
  const locale = HTML_LANG[primaryLang(settings.lang)]

  const byTopic = topicStats(TOPICS, QUESTIONS, progress)
  const overall = overallStats(byTopic)
  const weak = byTopic.filter((s) => s.weak).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
  const exams = [...progress.exams].reverse()
  const passedCount = exams.filter((exam) => exam.passed).length
  const cardIds = [...CARDS.map((card) => card.id), ...progress.mistakes.map(mistakeCardId)]
  const boxes = boxDistribution(cardIds, progress, LEITNER.boxCount)
  const maxBox = Math.max(1, ...boxes)

  return (
    <>
      <h1>
        <Tx k="stats.title" />
      </h1>

      <div className="stat-grid">
        <div className="card">
          <div className="stat-num">
            {overall.seen}/{overall.total}
          </div>
          <div className="muted small">
            <Tx k="stats.answered" />
          </div>
        </div>
        <div className="card">
          <div className="stat-num">{overall.accuracy === null ? '–' : `${percent(overall.accuracy)}%`}</div>
          <div className="muted small">
            <Tx k="stats.accuracy" />
          </div>
        </div>
      </div>

      <h2>
        <Tx k="stats.weak" />
      </h2>
      {weak.length === 0 ? (
        <p className="muted small">
          <Tx k="stats.weak.none" />
        </p>
      ) : (
        weak.map((s) => (
          <div key={s.topic.id} className="card row">
            <span className="grow">
              <Bi hu={s.topic.hu} ua={s.topic.ua} />
              <span className="badge badge-bad" style={{ marginTop: 6 }}>
                {percent(s.accuracy ?? 0)}%
              </span>
            </span>
            <Link to={`/practice/${s.topic.id}`} className="btn btn-primary" style={{ width: 'auto' }}>
              <Tx k="stats.weak.practice" primaryOnly />
            </Link>
          </div>
        ))
      )}

      <h2>
        <Tx k="stats.byTopic" />
      </h2>
      <section className="card stack">
        {byTopic.map((s) => (
          <Link key={s.topic.id} to={`/practice/${s.topic.id}`} className="stack" style={{ gap: 6 }}>
            <span className="row">
              <span aria-hidden="true">{s.topic.icon}</span>
              <span className="grow">
                <Bi hu={s.topic.hu} ua={s.topic.ua} layout="inline" />
              </span>
            </span>
            <ProgressBar value={s.mastered} max={s.total} tone={s.weak ? 'bad' : 'ok'} />
            <span className="muted small">
              {s.accuracy === null ? (
                <Tx k="stats.topic.noData" vars={{ seen: s.seen, total: s.total }} primaryOnly />
              ) : (
                <Tx
                  k="stats.topic.detail"
                  vars={{ seen: s.seen, total: s.total, accuracy: percent(s.accuracy) }}
                  primaryOnly
                />
              )}
            </span>
          </Link>
        ))}
      </section>

      <h2>
        <Tx k="stats.exams" />
      </h2>
      {exams.length === 0 ? (
        <p className="muted small">
          <Tx k="stats.exams.none" />
        </p>
      ) : (
        <section className="card">
          <p className="muted small" style={{ marginBottom: 6 }}>
            <Tx k="stats.exams.passRate" vars={{ passed: passedCount, total: exams.length }} layout="inline" />
          </p>
          {exams.map((exam) => (
            <Link key={exam.id} to={`/exam/result/${exam.id}`} className="exam-row">
              <span className="grow">
                <span style={{ fontWeight: 700 }}>
                  {exam.score}/{exam.maxScore}
                </span>
                <span className="muted small">
                  {' · '}
                  {formatDateTime(exam.finishedAt, locale)} · {formatDuration(exam.durationSec)}
                </span>
              </span>
              <span className={exam.passed ? 'badge badge-ok' : 'badge badge-bad'}>
                {t(exam.passed ? 'exam.result.passed' : 'exam.result.failed')}
              </span>
              <span className="tile-chevron" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </section>
      )}

      <h2>
        <Tx k="stats.cards" />
      </h2>
      <section className="card stack">
        <div className="boxes">
          {boxes.map((count, box) => (
            <div key={box} className="box">
              <span>{count}</span>
              <span className="bar" style={{ height: `${(count / maxBox) * 70}%`, opacity: box === 0 ? 0.4 : 1 }} />
              <span>{box === 0 ? t('stats.cards.new') : box}</span>
            </div>
          ))}
        </div>
        <p className="muted small">
          <Tx k="stats.mistakes" layout="inline" />: {progress.mistakes.length}
        </p>
      </section>
    </>
  )
}
