import { useCallback, useState } from 'react'

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'ess-training:theme'

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark'

/** The saved choice, or null. Storage can be blocked, so every access is guarded. */
export function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return isTheme(v) ? v : null
  } catch {
    return null
  }
}

export const systemTheme = (): Theme => (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

/** Day/night switch. Starts from the saved choice, else the device setting. index.html applies it before first paint. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'))
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // The choice still applies for this visit.
    }
    setTheme(next)
  }, [theme])
  return { theme, toggle }
}
