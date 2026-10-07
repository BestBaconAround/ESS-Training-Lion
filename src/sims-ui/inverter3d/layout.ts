import { PARTS, SOCKETS, partById } from '../../content/sims/wireBox'

// Where things sit in the 3D wire box. Units are roughly inches. x is right, y is up, z comes toward the viewer.
// The layout follows the author's photos of the Rev 4 training unit (battery busbars top left, WCM and control board
// along the top, PV fuse holders and the grid, generator and load terminal blocks in the middle, cables out the bottom).

export type V3 = [number, number, number]

export const BOX = { x0: -7.6, x1: 8.6, y0: -5.4, y1: 5.6, depth: 4.6 }

const pvX = (i: number) => -3.0 + i * 0.62
const acX = (block: number, i: number) => 2.2 + block * 2.1 + i * 0.65

export const SOCKET_POS: Record<string, V3> = {
  bat_p: [-6.0, 3.3, 1.0],
  bat_n: [-4.7, 3.3, 1.0],
  ems_bat: [-6.6, -0.9, 1.6],
  ems_eth: [-6.6, -1.7, 1.6],
  ems_cell: [-6.6, -2.5, 1.6],
  ems_wifi: [-6.6, -3.3, 1.6],
  parallel_a: [-0.6, 1.7, 1.55],
  bms: [-0.6, 0.95, 1.55],
  parallel_b: [0.6, 1.7, 1.55],
  wifi: [0.6, 0.95, 1.55],
  meter: [1.8, 1.7, 1.55],
  ct: [1.8, 0.95, 1.55],
  rsd: [-0.4, 4.05, 1.0],
  ags: [0.8, 4.05, 1.0],
  rss: [2.0, 4.05, 1.0],
}
for (let i = 0; i < 4; i++) {
  SOCKET_POS[`pv${i + 1}p`] = [pvX(i), -0.75, 1.05]
  SOCKET_POS[`pv${i + 1}n`] = [pvX(i + 4), -0.75, 1.05]
}
;(['grid', 'gen', 'load'] as const).forEach((g, block) => {
  ;(['l1', 'l2', 'n'] as const).forEach((n, i) => {
    SOCKET_POS[`${g}_${n}`] = [acX(block, i), -0.75, 1.05]
  })
})

/** The bolt sits above the wire entry of a terminal, and on the face of a busbar. */
export function boltPos(socketId: string): V3 {
  const p = SOCKET_POS[socketId]
  return socketId === 'bat_p' || socketId === 'bat_n' ? [p[0], p[1] - 0.2, p[2] + 0.35] : [p[0], p[1] + 0.62, p[2] + 0.05]
}

/** Where a cable comes in through the bottom of the box. */
export function exitPos(partId: string): V3 {
  const i = PARTS.findIndex((p) => p.id === partId)
  const first = SOCKET_POS[partById(partId).correct[0]]
  return [first[0] + ((i % 5) - 2) * 0.1, BOX.y0 - 0.1, 1.2 + (i % 3) * 0.25]
}

/** Slots on the bench for cables that are not plugged in (and for removed bolts). */
export const BENCH_Y = -7.6
export function benchSlot(index: number): V3 {
  const col = index % 10
  const row = Math.floor(index / 10)
  return [-6.4 + col * 1.6, BENCH_Y + 0.15, 6.6 + row * 1.4]
}
export const SPARE_SLOT: V3 = [9.8, BENCH_Y + 0.15, 9.4]
export function boltDish(index: number): V3 {
  return [-9.4 + (index % 3) * 0.6, BENCH_Y + 0.12, 11.4 + Math.floor(index / 3) * 0.6]
}

export const socketList = SOCKETS.map((s) => s.id)

export interface CameraPreset {
  id: string
  label: string
  pos: V3
  target: V3
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'front', label: 'Front view', pos: [0.5, 3.5, 33], target: [0.5, -2.6, 3] },
  { id: 'top', label: 'Control board', pos: [1.0, 3.5, 11], target: [1.0, 2.6, 1] },
  { id: 'busbars', label: 'Battery busbars', pos: [-5.5, 2.2, 9], target: [-5.0, 1.5, 1] },
  { id: 'terminals', label: 'PV and AC terminals', pos: [2.6, -0.5, 12], target: [2.6, -1.0, 1] },
  { id: 'below', label: 'Bench', pos: [0.5, -3, 24], target: [0.5, -7.2, 8] },
  { id: 'angle', label: 'Side angle', pos: [14, 3, 17], target: [0.5, 0, 1] },
]
