import { updateSettings, useSettings, type LangMode } from '../store/settings'
import { useT } from '../i18n'

const MODES: { mode: LangMode; label: string }[] = [
  { mode: 'hu', label: 'HU' },
  { mode: 'ua', label: 'UA' },
  { mode: 'both', label: 'HU+UA' },
]

/** Перемикач мови: HU / UA / HU+UA. */
export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang } = useSettings()
  const t = useT()
  return (
    <div className={compact ? 'segmented compact' : 'segmented'} role="group" aria-label={t('settings.language')}>
      {MODES.map(({ mode, label }) => (
        <button key={mode} type="button" aria-pressed={lang === mode} onClick={() => updateSettings({ lang: mode })}>
          {label}
        </button>
      ))}
    </div>
  )
}
