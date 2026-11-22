import { useEffect } from 'react'
import { HomePage } from '../features/home/HomePage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { HTML_LANG, primaryLang, Tx } from '../i18n'
import { applyTheme, useSettings } from '../store/settings'
import { Layout } from './Layout'
import { Link, useRoute } from './router'

export function App() {
  const route = useRoute()
  const settings = useSettings()

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
  return <Layout section={section}>{renderPage(section, rest)}</Layout>
}

function renderPage(section: string, rest: string[]) {
  if (rest.length === 0) {
    if (section === '') return <HomePage />
    if (section === 'settings') return <SettingsPage />
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
