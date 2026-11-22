import { useEffect } from 'react'
import { PwaToast } from '../components/PwaToast'
import { CardDecksPage } from '../features/cards/CardDecksPage'
import { CardReviewPage } from '../features/cards/CardReviewPage'
import { ExamResultPage } from '../features/exam/ExamResultPage'
import { ExamRunner } from '../features/exam/ExamRunner'
import { ExamStartPage } from '../features/exam/ExamStartPage'
import { HomePage } from '../features/home/HomePage'
import { PracticeSessionPage } from '../features/practice/PracticeSessionPage'
import { PracticeTopicsPage } from '../features/practice/PracticeTopicsPage'
import { StatsPage } from '../features/stats/StatsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { SignGalleryPage } from '../signs/SignGalleryPage'
import { HTML_LANG, primaryLang, Tx } from '../i18n'
import { useExamSession } from '../store/exam'
import { applyTheme, useSettings } from '../store/settings'
import { Layout } from './Layout'
import { Link, useRoute } from './router'

export function App() {
  const route = useRoute()
  const settings = useSettings()
  const examSession = useExamSession()

  useEffect(() => {
    applyTheme(settings.theme)
    if (settings.theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[primaryLang(settings.lang)]
  }, [settings.lang])

  const [section = '', ...rest] = route

  // Під час іспиту — окремий екран без меню, щоб нічого не відволікало.
  if (section === 'exam' && rest.length === 0 && examSession) {
    return <ExamRunner session={examSession} />
  }
  return (
    <>
      <Layout section={section}>{renderPage(section, rest)}</Layout>
      <PwaToast />
    </>
  )
}

function renderPage(section: string, rest: string[]) {
  if (rest.length === 0) {
    if (section === '') return <HomePage />
    if (section === 'settings') return <SettingsPage />
    if (section === 'stats') return <StatsPage />
    if (section === 'signs') return <SignGalleryPage />
  }
  if (section === 'practice') {
    if (rest.length === 0) return <PracticeTopicsPage />
    // key: нова тема — новий раунд
    if (rest.length === 1) return <PracticeSessionPage key={rest[0]} topicId={rest[0]} />
  }
  if (section === 'exam') {
    if (rest.length === 0) return <ExamStartPage />
    if (rest.length === 2 && rest[0] === 'result') return <ExamResultPage key={rest[1]} examId={rest[1]} />
  }
  if (section === 'cards') {
    if (rest.length === 0) return <CardDecksPage />
    if (rest.length === 1) return <CardReviewPage key={rest[0]} deckId={rest[0]} />
  }
  return <NotFound />
}

function NotFound() {
  return (
    <div className="card stack center">
      <Tx k="common.notFound" />
      <Link to="/" className="btn btn-primary">
        <Tx k="common.toHome" layout="inline" />
      </Link>
    </div>
  )
}
