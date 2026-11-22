import { useMemo } from 'react'
import { navigate } from '../../app/router'
import { EXAM_CONFIG, EXAM_SOURCE, EXAM_UNVERIFIED } from '../../config/exam'
import { QUESTIONS } from '../../content'
import { translate, Tx, useT } from '../../i18n'
import { examStore } from '../../store/exam'
import { updateSettings, useSettings } from '../../store/settings'
import { planExam, startExam } from './engine'

export function ExamStartPage() {
  const settings = useSettings()
  const t = useT()
  // Попередній план потрібен лише щоб показати фактичні параметри (база може бути меншою за іспит).
  const preview = useMemo(() => planExam(QUESTIONS), [])

  const begin = () => {
    examStore.set(
      startExam(
        planExam(QUESTIONS),
        {
          huOnly: settings.examHuOnly,
          mode: settings.examMode,
          perQuestionSec: EXAM_CONFIG.programMode.perQuestionSeconds,
        },
        Date.now(),
      ),
    )
    navigate('/exam', { replace: true })
  }

  const unverified = (lang: 'hu' | 'ua') => EXAM_UNVERIFIED.map((key) => translate(lang, key)).join('; ')

  return (
    <>
      <h1>
        <Tx k="exam.title" />
      </h1>
      <p className="muted">
        <Tx k="exam.intro" />
      </p>

      <section className="card stack">
        <dl className="kv">
          <dt>
            <Tx k="exam.param.questions" layout="inline" />
          </dt>
          <dd>{EXAM_CONFIG.questionCount}</dd>
          <dt>
            <Tx k="exam.param.time" layout="inline" />
          </dt>
          <dd>{t('exam.minutes', { n: EXAM_CONFIG.durationMinutes })}</dd>
          <dt>
            <Tx k="exam.param.max" layout="inline" />
          </dt>
          <dd>{t('common.points', { n: EXAM_CONFIG.maxPoints })}</dd>
          <dt>
            <Tx k="exam.param.pass" layout="inline" />
          </dt>
          <dd>{t('common.points', { n: EXAM_CONFIG.passPoints })}</dd>
        </dl>
        <p className="muted small">
          <Tx k="exam.source" layout="inline" />: {EXAM_SOURCE.label} ({EXAM_SOURCE.checkedAt})
        </p>
      </section>

      {preview.reduced && (
        <div className="notice">
          <Tx k="exam.reducedNotice" vars={{ available: preview.questions.length }} />
        </div>
      )}
      <div className="notice">
        <Tx k="exam.unverifiedNotice" vars={{ items: unverified('hu') }} mode="hu" />
        {settings.lang !== 'hu' && (
          <span className="bi-sub" style={{ display: 'block', marginTop: 4 }}>
            {translate('ua', 'exam.unverifiedNotice', { items: unverified('ua') })}
          </span>
        )}
      </div>

      <section className="card stack">
        <h2>
          <Tx k="exam.mode.label" />
        </h2>
        <div className="segmented" role="group">
          <button
            type="button"
            aria-pressed={settings.examMode === 'program'}
            onClick={() => updateSettings({ examMode: 'program' })}
          >
            <Tx k="exam.mode.program" primaryOnly />
          </button>
          <button
            type="button"
            aria-pressed={settings.examMode === 'free'}
            onClick={() => updateSettings({ examMode: 'free' })}
          >
            <Tx k="exam.mode.free" primaryOnly />
          </button>
        </div>
        <p className="muted small">
          {settings.examMode === 'program' ? (
            <Tx k="exam.mode.program.desc" vars={{ sec: EXAM_CONFIG.programMode.perQuestionSeconds }} />
          ) : (
            <Tx k="exam.mode.free.desc" vars={{ minutes: EXAM_CONFIG.durationMinutes }} />
          )}
        </p>
      </section>

      <label className="card check">
        <input
          type="checkbox"
          checked={settings.examHuOnly}
          onChange={(event) => updateSettings({ examHuOnly: event.target.checked })}
        />
        <Tx k="exam.huOnly" />
      </label>

      <button type="button" className="btn btn-primary" onClick={begin} disabled={preview.questions.length === 0}>
        <Tx k="exam.start" layout="inline" />
      </button>
      <p className="muted small center">
        <Tx k="exam.poolNote" vars={{ n: QUESTIONS.length }} layout="inline" />
      </p>
    </>
  )
}
