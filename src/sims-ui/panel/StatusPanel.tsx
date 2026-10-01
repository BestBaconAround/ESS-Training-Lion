import type { PanelFamily } from '../../content/sims/panelTypes'
import type { PanelStatus, StatusRow } from '../../sims/panel/state'

function Badge({ value }: { value: boolean | null }) {
  if (value === null) return <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold dark:bg-slate-700">UNKNOWN (TODO)</span>
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-bold ${
        value ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-100'
      }`}
    >
      {value ? 'YES' : 'NO'}
    </span>
  )
}

function Row({ label, row }: { label: string; row: StatusRow<boolean | null> }) {
  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <Badge value={row.value} />
      </div>
      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{row.why}</p>
    </li>
  )
}

export default function StatusPanel({ status, family }: { status: PanelStatus; family: PanelFamily }) {
  const rev4 = family === 'rev4'
  return (
    <section
      aria-label="System status"
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="font-semibold">What the customer would see</h3>
      <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
        <Row label="System fully off" row={status.fullyOff} />
        <Row label="Controller on (DSP and ARM)" row={status.controllerOn} />
        <Row label="Loads powered" row={status.loadsPowered} />
        <Row label="PV accepted" row={status.pvAccepted} />
        <Row label={rev4 ? 'Comms online (EMS-C)' : 'Comms online (WCM)'} row={status.commsOnline} />
        <Row label="Settings and firmware updates" row={status.settingsFirmware} />
      </ul>
    </section>
  )
}
