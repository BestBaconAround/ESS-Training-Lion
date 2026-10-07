import { PARTS, SOCKETS, partById } from '../../content/sims/wireBox'

// Where things sit in the 3D wire box. Units are roughly inches. x is right, y is up, z comes toward the viewer.
// The top band (busbars, WCM, control board, relays) is a cropped photo of the author's Rev 4 training unit
// (`public/images/lab/board-band.webp`), so the sockets and bolts below are placed from pixel positions in that photo.

export type V3 = [number, number, number]

export const BOX = { x0: -8.8, x1: 9.65, y0: -6.5, y1: 5.6, depth: 4.6 }

/** The photo band: 1690 x 458 px of `rev4-board-ports.webp`, starting at pixel (100, 20). */
export const BAND = { px0: 100, py0: 20, w: 1690, h: 458, scale: 15.4 / 1690, x0: -6.9, y1: 5.3 }
export const bandX = (px: number): number => BAND.x0 + (px - BAND.px0) * BAND.scale
export const bandY = (py: number): number => BAND.y1 - (py - BAND.py0) * BAND.scale

const SOCKET_BASE: Record<string, V3> = {
  // Battery busbars: the bolt that holds each lug (the cable lug sits under it).
  bat_p: [bandX(232), bandY(407), 0.75],
  bat_n: [bandX(422), bandY(412), 0.75],
  // Black port blocks: front ports on the face, back ports at the bottom edge where the cables come in.
  parallel_a: [bandX(807), bandY(372), 1.05],
  parallel_b: [bandX(893), bandY(372), 1.05],
  meter: [bandX(977), bandY(372), 1.05],
  bms: [bandX(807), bandY(472), 0.9],
  wifi: [bandX(893), bandY(472), 0.9],
  ct: [bandX(977), bandY(472), 0.9],
  // Green plugs on the control board.
  rsd: [bandX(922), bandY(268), 0.8],
  ags: [bandX(1024), bandY(268), 0.8],
  rss: [bandX(1085), bandY(268), 0.8],
  // EMS-C (bottom left).
  ems_cell: [-7.1, -2.45, 1.55],
  ems_wifi: [-6.2, -2.45, 1.55],
  ems_bat: [-6.65, -3.2, 1.55],
  ems_eth: [-6.65, -3.95, 1.55],
}

/** PV fuse holder i (0 to 7), left to right. */
export const pvX = (i: number): number => bandX(580 + 70.5 * i)
/** AC terminals: three blocks (grid, generator, load) of three terminals (L1, L2, N). */
const BLOCK_PX = [1140, 1355, 1575]
export const acX = (block: number, i: number): number => bandX(BLOCK_PX[block] + i * 55)

export const HOLDER = { top: bandY(485), bottom: bandY(762), w: 0.6 }
export const BLOCK = { top: bandY(525), bottom: bandY(715), w: 1.9 }

export const SOCKET_POS: Record<string, V3> = { ...SOCKET_BASE }
for (let i = 0; i < 4; i++) {
  SOCKET_POS[`pv${i + 1}p`] = [pvX(i), bandY(765), 0.85]
  SOCKET_POS[`pv${i + 1}n`] = [pvX(i + 4), bandY(765), 0.85]
}
;(['grid', 'gen', 'load'] as const).forEach((g, block) => {
  ;(['l1', 'l2', 'n'] as const).forEach((n, i) => {
    SOCKET_POS[`${g}_${n}`] = [acX(block, i), bandY(705), 0.9]
  })
})

/** Back ports take the plug from below. Everything else on the control board takes it from the front. */
export const FROM_BELOW = new Set(['bms', 'wifi', 'ct'])

/** The bolt sits above the wire entry of a terminal, and on the face of a busbar. */
export function boltPos(socketId: string): V3 {
  const p = SOCKET_POS[socketId]
  if (socketId === 'bat_p' || socketId === 'bat_n') return [p[0], p[1], p[2] + 0.3]
  if (/^pv/.test(socketId)) return [p[0], p[1] + 0.28, p[2] + 0.4]
  return [p[0], p[1] + 0.36, p[2] + 0.4]
}

/** Where a cable comes in through the bottom of the box. */
export function exitPos(partId: string): V3 {
  const i = PARTS.findIndex((p) => p.id === partId)
  const first = SOCKET_POS[partById(partId).correct[0]]
  return [first[0] + ((i % 5) - 2) * 0.1, BOX.y0 - 0.1, 1.2 + (i % 3) * 0.25]
}

/** Slots on the bench for cables that are not plugged in (and for removed bolts). */
export const BENCH_Y = -8.8
export function benchSlot(index: number): V3 {
  const col = index % 10
  const row = Math.floor(index / 10)
  return [-7.4 + col * 1.75, BENCH_Y + 0.15, 7.4 + row * 1.4]
}
export const SPARE_SLOT: V3 = [4.2, BENCH_Y + 0.15, 13.6]
export function boltDish(index: number): V3 {
  return [-10.6 + (index % 3) * 0.6, BENCH_Y + 0.12, 12.2 + Math.floor(index / 3) * 0.6]
}

export const socketList = SOCKETS.map((s) => s.id)

export interface CameraPreset {
  id: string
  label: string
  pos: V3
  target: V3
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'front', label: 'Front view', pos: [0.4, 3.0, 38], target: [0.4, -1.0, 3] },
  { id: 'top', label: 'Control board', pos: [1.6, 3.4, 11.5], target: [1.6, 3.0, 0.5] },
  { id: 'busbars', label: 'Battery busbars', pos: [-5.0, 2.6, 8], target: [-5.0, 2.3, 0.5] },
  { id: 'terminals', label: 'PV and AC terminals', pos: [3.4, -0.3, 11.5], target: [3.4, -0.4, 0.5] },
  { id: 'ems', label: 'EMS-C', pos: [-6.5, -3.4, 8.5], target: [-6.5, -3.8, 1] },
  { id: 'below', label: 'Bench', pos: [0.4, -4.5, 25], target: [0.4, -8.4, 9] },
  { id: 'angle', label: 'Side angle', pos: [18, 3.5, 20], target: [0.4, -0.8, 1] },
]
