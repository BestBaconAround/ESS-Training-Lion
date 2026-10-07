import { Link } from 'react-router-dom'
import { PageHeader, ui } from '../components/ui'
import Inverter3DLab from '../sims-ui/inverter3d/Inverter3DLab'

/** 3D inverter lab: a Rev 4 wire box that was installed wrong. Move cables, turn bolts, test with the meter, fix it. */
export default function Inverter3DPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inverter lab (3D)"
        lead="A Rev 4 inverter with the wiring compartment open. Find what was installed wrong and fix it, or switch to the creative sandbox to build, break and test anything with no tasks. Rotate around it, move cables, turn bolts, and use the meter and cable tester."
      />
      <p className={`text-sm ${ui.muted}`}>
        The wiring rules are the same as the <Link className={ui.link} to="/wire-box">2D wire box simulator</Link>. Related steps: <Link className={ui.link} to="/procedures">Procedures</Link>.
      </p>
      <Inverter3DLab />
    </div>
  )
}
