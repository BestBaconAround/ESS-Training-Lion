import { Link } from 'react-router-dom'
import { PageHeader, ui } from '../components/ui'
import WireBoxSim from '../sims-ui/wirebox/WireBoxSim'

/** Wire box simulator: drag cables onto the Rev 4 terminals and ports, and find and fix wrong wiring. */
export default function WireBoxPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Wire box simulator"
        lead="Rev 4 inverter wire box. See every cable, drag it to the right terminal or port, and find the wire that is wrong."
      />
      <p className={`text-sm ${ui.muted}`}>
        Port and terminal names are from the diagram inside the wire box cover. Every wrong-wiring result cites the Technical Service Manual or the EMS-C manual.
        Related steps: <Link className={ui.link} to="/procedures">Procedures</Link> (fix port wiring, fix CTs, communication map).
      </p>
      <WireBoxSim />
    </div>
  )
}
