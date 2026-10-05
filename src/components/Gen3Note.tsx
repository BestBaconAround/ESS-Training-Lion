/** Shown when Sanctuary 3 is the chosen revision: the site was built for Sanctuary 2, so only confirmed Sanctuary 3 content is shown. */
export default function Gen3Note({ rev }: { rev: string }) {
  if (rev !== 'gen3') return null
  return (
    <p className="rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100" role="note">
      <strong>Sanctuary 3 (Gen 3, white).</strong> Only steps confirmed for Sanctuary 3 are shown. Steps written for Sanctuary 2 are hidden. Sanctuary 3 coverage is partial: the
      battery, CT, remote shutdown and checklist parts of the installation guide are in, but not every topic yet.
    </p>
  )
}
