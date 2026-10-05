import { src } from './helpers'
import type { SourceRef } from './types'

// The call ticket form. The checklist comes from entries already in the app (first call, precheck, Wi-Fi checks), each
// with its source. The ticket itself never leaves the browser tab: it holds customer details.

const NOTES: SourceRef = src('notes')
const AUTHOR: SourceRef = { source: 'author', note: 'Wi-Fi procedure and troubleshooting, updated by the author' }
const TSM = (...p: number[]) => src('tsm', ...p)

export interface CheckItem {
  id: string
  label: string
  group: 'Look at the system' | 'Communication' | 'Power and cables'
  sources: SourceRef[]
}

export const CHECKLIST: CheckItem[] = [
  { id: 'alerts', group: 'Look at the system', label: 'Looked at the graph, the alerts and the alert history', sources: [NOTES] },
  { id: 'batteries', group: 'Look at the system', label: 'Checked the battery voltages on every inverter, and that all batteries are working', sources: [NOTES] },
  { id: 'strings', group: 'Look at the system', label: 'Checked the solar strings are all producing', sources: [NOTES] },
  { id: 'firmware', group: 'Look at the system', label: 'Both inverters are on the correct firmware (parallel systems)', sources: [NOTES] },
  { id: 'not-local-only', group: 'Communication', label: 'Not a local only setup (local only is Bluetooth only, no internet)', sources: [AUTHOR] },
  { id: 'band', group: 'Communication', label: 'Wi-Fi network is 2.4 GHz (5 GHz is not supported yet)', sources: [AUTHOR] },
  { id: 'antennas', group: 'Communication', label: 'Antennas are in the correct ports on the communicator', sources: [TSM(60), AUTHOR] },
  { id: 'reset', group: 'Communication', label: 'Pressed the communicator reset button and waited 3 minutes', sources: [AUTHOR] },
  { id: 'comm-cycle', group: 'Communication', label: 'Power cycled the communicator (tried a hotspot if needed)', sources: [AUTHOR] },
  { id: 'comm-12v', group: 'Power and cables', label: 'EMS-C: 12 V is going to the communicator', sources: [AUTHOR, TSM(39)] },
  { id: 'cables', group: 'Power and cables', label: 'Tested the Ethernet cables with a cable tester (replaced any that failed; the OEM black cables often fail)', sources: [TSM(23, 80, 81), AUTHOR] },
  { id: 'power-cycle', group: 'Power and cables', label: 'Power cycled the inverter(s)', sources: [TSM(56)] },
]

export const CHECK_GROUPS: CheckItem['group'][] = ['Look at the system', 'Communication', 'Power and cables']

export const CALLER_TYPES = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'installer', label: 'Installer or technician' },
  { value: 'other', label: 'Other' },
] as const

export const REVISION_CHOICES = [
  { value: 'rev1', label: 'Rev 1' },
  { value: 'rev2', label: 'Rev 2' },
  { value: 'rev3', label: 'Rev 3' },
  { value: 'rev4', label: 'Rev 4' },
  { value: 'gen3', label: 'Sanctuary 3' },
  { value: 'unknown', label: 'Not sure' },
] as const

export const COMMUNICATOR_CHOICES = [
  { value: 'emsc', label: 'EMS-C' },
  { value: 'wcm', label: 'WCM' },
  { value: 'unknown', label: 'Not sure' },
] as const

export const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Not sure' },
] as const

export const PATTERNS = [
  { value: 'consistent', label: 'Happens all the time' },
  { value: 'intermittent', label: 'Comes and goes' },
] as const

/** How the call ended. Where each leads is in the app: escalation is the ESS Support line, RMA is a procedure. */
export const OUTCOMES = [
  { value: 'resolved', label: 'Resolved on the call' },
  { value: 'follow-up', label: 'Follow-up needed (call back)' },
  { value: 'escalated', label: 'Escalated to Lion ESS Support' },
  { value: 'rma', label: 'RMA or replacement needed' },
  { value: 'installer', label: 'Installer or technician visit needed' },
  { value: 'customer-try', label: 'Customer will try the steps and call back' },
] as const

export const PRIVACY_NOTE =
  'This ticket stays in this browser tab. Nothing is sent anywhere, and it is cleared when you close the tab. Copy it into your ticket system when the call is done.'
