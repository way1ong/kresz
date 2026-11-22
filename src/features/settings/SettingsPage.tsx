import { LangSwitch } from '../../components/LangSwitch'
import { Tx, type TKey } from '../../i18n'
import { updateSettings, useSettings, type ThemeMode } from '../../store/settings'

const THEMES: { mode: ThemeMode; label: TKey }[] = [
  { mode: 'system', label: 'settings.theme.system' },
  { mode: 'light', label: 'settings.theme.light' },
  { mode: 'dark', label: 'settings.theme.dark' },
]

export function SettingsPage() {
  const settings = useSettings()
  return (
    <>
      <h1>
        <Tx k="settings.title" />
      </h1>

      <section className="card stack">
        <h2>
          <Tx k="settings.language" />
        </h2>
        <LangSwitch />
        <p className="muted small">
          <Tx k="settings.lang.hint" />
        </p>
      </section>

      <section className="card stack">
        <h2>
          <Tx k="settings.theme" />
        </h2>
        <div className="segmented" role="group">
          {THEMES.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              aria-pressed={settings.theme === mode}
              onClick={() => updateSettings({ theme: mode })}
            >
              <Tx k={label} />
            </button>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2>
          <Tx k="settings.about" />
        </h2>
        <p className="small">
          <Tx k="settings.about.text" />
        </p>
        <p className="muted small">
          <Tx k="settings.version" vars={{ v: __APP_VERSION__ }} layout="inline" />
        </p>
      </section>
    </>
  )
}
