import type { ReactNode } from 'react'

/** Shared look. Keep screens built from these so the whole site stays consistent. */
export const ui = {
  card: 'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
  input:
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:placeholder:text-slate-500',
  primary:
    'inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300',
  ghost:
    'inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
  link: 'text-sky-700 underline hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300',
  muted: 'text-slate-500 dark:text-slate-400',
}

export function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4l6 6-6 6" />
    </svg>
  )
}

/**
 * A collapsible section with a visible arrow. Uncontrolled by default; pass `open` and `onToggle` to control it.
 * Built on <details>, so it works with the keyboard and screen readers and without any script.
 */
export function Disclosure({
  title,
  right,
  children,
  defaultOpen = false,
  open,
  onToggle,
  className = '',
  id,
}: {
  title: ReactNode
  right?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onToggle?: (open: boolean) => void
  className?: string
  id?: string
}) {
  const controlled = open !== undefined
  return (
    <details
      id={id}
      className={`group ${ui.card} ${className}`}
      {...(controlled ? { open } : { open: defaultOpen })}
      onToggle={(e) => onToggle?.((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer items-center gap-3 rounded-xl p-4 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <Chevron />
        <span className="min-w-0 flex-1">{title}</span>
        {right}
      </summary>
      <div className="border-t border-slate-100 p-4 dark:border-slate-800">{children}</div>
    </details>
  )
}

export function PageHeader({ title, lead, right }: { title: string; lead?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h1>{title}</h1>
        {lead && <p className={`mt-1 text-sm ${ui.muted}`}>{lead}</p>}
      </div>
      {right}
    </div>
  )
}
