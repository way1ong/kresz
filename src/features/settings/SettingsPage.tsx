import { useRef, useState } from 'react'
import { LangSwitch } from '../../components/LangSwitch'
import { Tx, useT, type TKey } from '../../i18n'
import { examStore } from '../../store/exam'
import { progressStore, reviveProgress } from '../../store/progress'
import { updateSettings, useSettings, type ThemeMode } from '../../store/settings'

const THEMES: { mode: ThemeMode; label: TKey }[] = [
  { mode: 'system', label: 'settings.theme.system' },
  { mode: 'light', label: 'settings.theme.light' },
  { mode: 'dark', label: 'settings.theme.dark' },
]

function exportProgress() {
  const blob = new Blob([JSON.stringify(progressStore.get(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kresz-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const settings = useSettings()
  const t = useT()
  const fileInput = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'ok' | 'error' | null>(null)

  const importProgress = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || !('questions' in parsed)) throw new Error('not a progress file')
      progressStore.set(reviveProgress(parsed))
      setImportStatus('ok')
    } catch {
      setImportStatus('error')
    }
  }

  const resetProgress = () => {
    if (!window.confirm(t('settings.reset.confirm'))) return
    progressStore.reset()
    examStore.set(null)
    setImportStatus(null)
  }
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
          <Tx k="settings.data" />
        </h2>
        <p className="muted small">
          <Tx k="settings.data.hint" />
        </p>
        <button type="button" className="btn" onClick={exportProgress}>
          <Tx k="settings.export" layout="inline" />
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          <Tx k="settings.import" layout="inline" />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            void importProgress(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {importStatus && (
          <p className={importStatus === 'ok' ? 'badge badge-ok' : 'badge badge-bad'} role="status">
            <Tx k={importStatus === 'ok' ? 'settings.import.ok' : 'settings.import.error'} primaryOnly />
          </p>
        )}
        <button type="button" className="btn btn-danger" onClick={resetProgress}>
          <Tx k="settings.reset" layout="inline" />
        </button>
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
