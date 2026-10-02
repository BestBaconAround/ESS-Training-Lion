import { NavLink, Outlet } from 'react-router-dom'
import { APP_VERSION, BUILD_TIME, formatBuildTime } from '../buildInfo'
import { useTheme } from '../theme'

const tab = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
    isActive
      ? 'border-amber-500 text-slate-900 dark:text-slate-100'
      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100'
  }`

function ThemeButton() {
  const { theme, toggle } = useTheme()
  const night = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={night ? 'Switch to day mode' : 'Switch to night mode'}
      title={night ? 'Day mode' : 'Night mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {night ? (
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}

export default function Layout() {
  const updated = formatBuildTime(BUILD_TIME)
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            <NavLink to="/" className="flex items-center gap-2.5 no-underline">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
                <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor">
                  <path d="M18 4 8 18h6l-2 10 10-14h-6z" />
                </svg>
              </span>
              <span className="text-base font-semibold tracking-tight">Lion ESS Training</span>
            </NavLink>
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-xs leading-tight text-slate-500 sm:block dark:text-slate-400" aria-label="App version and last update">
                <div className="font-medium text-slate-700 dark:text-slate-200">Version {APP_VERSION}</div>
                {updated && <div>Updated {updated}</div>}
              </div>
              <ThemeButton />
            </div>
          </div>
          {/* Phones: the version line sits above the tabs instead of beside the logo. */}
          <p aria-hidden className="pb-1 text-xs text-slate-500 sm:hidden dark:text-slate-400">
            Version {APP_VERSION}
            {updated && ` \u00b7 Updated ${updated}`}
          </p>
          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Main">
            <NavLink to="/" end className={tab}>
              Dashboard
            </NavLink>
            <NavLink to="/troubleshooting" className={tab}>
              Troubleshooting
            </NavLink>
            <NavLink to="/reference" className={tab}>
              Reference
            </NavLink>
            <NavLink to="/backup" className={tab}>
              Progress backup
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
