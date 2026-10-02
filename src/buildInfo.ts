declare const __APP_VERSION__: string | undefined
declare const __BUILD_TIME__: string | undefined

/** Set at build time by vite.config.ts. Falls back so tests and odd tooling never crash. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
export const BUILD_TIME: string = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : ''

/** "Oct 2, 2026, 1:15 AM PDT" in the viewer's own time zone. Empty when the date is missing or invalid. */
export function formatBuildTime(iso: string, locale?: string, timeZone?: string): string {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone })
}
