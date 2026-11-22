import { createStore, useStore } from './createStore'

/** hu — лише угорська, ua — лише українська, both — угорська основна + українська під нею. */
export type LangMode = 'hu' | 'ua' | 'both'
export type ThemeMode = 'system' | 'light' | 'dark'
export type ExamMode = 'program' | 'free'

export interface Settings {
  lang: LangMode
  theme: ThemeMode
  /** Іспит показувати лише угорською (як на справжньому іспиті). */
  examHuOnly: boolean
  /** program — як у програмі іспиту (хвилина на питання, без повернення); free — лише загальний час. */
  examMode: ExamMode
  /** У режимі HU+UA ховати український переклад питання, доки користувач сам його не відкриє. */
  peekTranslation: boolean
  /** Коли востаннє збережено (або завантажено) файл із прогресом. */
  lastBackupAt: number | null
  /** До якого моменту відкладено нагадування про резервну копію. */
  backupSnoozedUntil: number
}

const DEFAULTS: Settings = {
  lang: 'both',
  theme: 'system',
  examHuOnly: false,
  examMode: 'program',
  peekTranslation: false,
  lastBackupAt: null,
  backupSnoozedUntil: 0,
}

export const settingsStore = createStore<Settings>(
  'kresz.settings.v1',
  () => DEFAULTS,
  (raw) => ({ ...DEFAULTS, ...(raw as Partial<Settings>) }),
)

export function useSettings(): Settings {
  return useStore(settingsStore)
}

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set((prev) => ({ ...prev, ...patch }))
}

const THEME_COLORS = { light: '#f4f6fa', dark: '#10141c' }

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light)
}
