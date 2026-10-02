import { REVISIONS, REVISION_LABELS } from '../content/labels'
import type { RevisionChoice } from '../troubleshooting/filter'
import { ui } from './ui'

export default function RevisionSelect({ value, onChange }: { value: RevisionChoice; onChange: (v: RevisionChoice) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium">Revision</span>
      <select value={value} onChange={(e) => onChange(e.target.value as RevisionChoice)} className={`${ui.input} w-auto`}>
        <option value="all">All revisions</option>
        {REVISIONS.map((r) => (
          <option key={r} value={r}>
            {REVISION_LABELS[r]}
          </option>
        ))}
      </select>
    </label>
  )
}
