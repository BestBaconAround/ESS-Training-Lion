import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PARTS, SOCKETS, partById, socketById, type Part } from '../../content/sims/wireBox'
import { fits } from '../../sims/wirebox/engine'
import type { LabState } from '../../sims/inverter3d/engine'
import { BENCH_Y, BOX, CAMERA_PRESETS, SOCKET_POS, SPARE_SLOT, benchSlot, boltDish, boltPos, exitPos, type V3 } from './layout'

export type Tool = 'inspect' | 'hand' | 'tighten' | 'loosen' | 'meter' | 'tester'

export interface SceneCallbacks {
  /** `id` is a part id, or 'spare'. `socketId` is null when the cable was dropped on the bench. */
  onDrop(id: string, socketId: string | null): void
  onBolt(socketId: string, tool: 'tighten' | 'loosen'): void
  onProbe(socketId: string): void
  onTest(id: string): void
  onInspect(componentId: string): void
  onHover(label: string | null, x: number, y: number): void
}

/** Sim colors only (the documents do not give wire colors). */
function partColor(p: Part): number {
  switch (p.kind) {
    case 'battery': return p.tag.includes('+') ? 0xb91c1c : 0x1f2937
    case 'pv': return p.tag.includes('+') ? 0xc2410c : 0x334155
    case 'ac': return p.label.endsWith('L1') ? 0xa16207 : p.label.endsWith('L2') ? 0x1d4ed8 : p.label.endsWith('N') ? 0xe5e7eb : 0x4b5563
    case 'ethernet': return 0x0369a1
    case 'antenna': return 0x7e22ce
    case 'plug': return 0x047857
  }
}

const SPARE_COLOR = 0xe2e8f0

interface Pick {
  type: 'plug' | 'bolt' | 'socket' | 'component'
  id: string
  /** Socket the object belongs to (plugs, bolts and socket proxies). */
  socket?: string
  label: string
}

interface CableView {
  id: string
  part: Part | null
  group: THREE.Group
  plug: THREE.Group
  tube: THREE.Mesh | null
  color: number
  radius: number
  at: string | null
  tag: THREE.Sprite
}

interface BoltView {
  socketId: string
  group: THREE.Group
  target: THREE.Vector3
  rot: number
  hole: THREE.Mesh
}

const v = (p: V3) => new THREE.Vector3(p[0], p[1], p[2])

function canvasTexture(text: string, w: number, h: number, fg = '#f8fafc', bg: string | null = null, font = 'bold 48px system-ui, sans-serif'): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  if (bg) {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
  }
  g.fillStyle = fg
  g.font = font
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const lines = text.split('\n')
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (h / (lines.length + 0.4))))
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function labelPlane(text: string, width: number, height: number, fg?: string, bg?: string | null, font?: string): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: canvasTexture(text, 256, Math.max(32, Math.round((256 * height) / width)), fg, bg ?? null, font), transparent: true }),
  )
  return m
}

function makeSprite(text: string, scale = 1): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(text, 512, 96, '#f8fafc', 'rgba(15,23,42,0.82)', 'bold 42px system-ui, sans-serif'), depthTest: false, transparent: true }))
  s.scale.set(3.2 * scale, 0.6 * scale, 1)
  s.renderOrder = 10
  return s
}

const standard = (color: number, rough = 0.6, metal = 0.1) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })

export class InverterScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private raycaster = new THREE.Raycaster()
  private pickables: THREE.Object3D[] = []
  private cables = new Map<string, CableView>()
  private bolts = new Map<string, BoltView>()
  private rings = new Map<string, THREE.Mesh>()
  private probeMarkers: THREE.Mesh[] = []
  private tool: Tool = 'inspect'
  private lab: LabState | null = null
  private drag: { id: string; offset: THREE.Vector3; plane: THREE.Plane; moved: boolean } | null = null
  private down: { x: number; y: number; pick: Pick | null } | null = null
  private hoverObj: Pick | null = null
  private frame = 0
  private ro: ResizeObserver
  private disposed = false
  private bench!: THREE.Mesh
  private flyTo_: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null
  private last = performance.now()
  private framed = false

  constructor(private host: HTMLElement, private cb: SceneCallbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.setClearColor(0x0f172a)
    host.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.touchAction = 'none'
    this.renderer.domElement.style.display = 'block'
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200)
    const front = CAMERA_PRESETS[0]
    this.camera.position.copy(v(front.pos))

    // Our listeners go on first so a cable drag can switch the orbit controls off before they see the press.
    const el = this.renderer.domElement
    // Browser tests find screen positions through this hook. It is only set when a test turns it on.
    if ((window as unknown as { __ESS_TEST__?: boolean }).__ESS_TEST__) (window as unknown as { __invScene?: InverterScene }).__invScene = this
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', this.onUp)
    el.addEventListener('pointerleave', this.onLeave)
    this.controls = new OrbitControls(this.camera, el)
    this.controls.target.copy(v(front.target))
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.12
    this.controls.minDistance = 4
    this.controls.maxDistance = 48
    this.controls.maxPolarAngle = Math.PI * 0.62
    this.controls.minPolarAngle = Math.PI * 0.2
    this.controls.minAzimuthAngle = -Math.PI * 0.45
    this.controls.maxAzimuthAngle = Math.PI * 0.45
    this.controls.screenSpacePanning = true
    this.controls.update()

    this.buildWorld()
    this.buildCables()
    this.buildBolts()
    this.buildRings()
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(host)
    this.resize()
    this.loop()
  }

  // ------------------------------------------------------------------ public

  setTool(t: Tool) {
    this.tool = t
    this.renderer.domElement.style.cursor = t === 'hand' ? 'grab' : 'crosshair'
    this.setHover(null)
  }

  flyTo(presetId: string, instant = false) {
    const p = CAMERA_PRESETS.find((x) => x.id === presetId)
    if (!p) return
    // A narrow screen sees less sideways, so stand further back.
    const k = Math.min(Math.max(1, 1.5 / this.camera.aspect), 2.4)
    const target = v(p.target)
    const pos = target.clone().add(v(p.pos).sub(target).multiplyScalar(k))
    if (instant) {
      this.camera.position.copy(pos)
      this.controls.target.copy(target)
      this.controls.update()
    } else this.flyTo_ = { pos, target }
  }

  /** Bring the cables and bolts in line with the lab state. */
  sync(lab: LabState) {
    this.lab = lab
    for (const [id, c] of this.cables) this.layoutCable(c, lab, id)
    for (const [socketId, b] of this.bolts) {
      const state = lab.fasteners[socketId]
      const home = v(boltPos(socketId))
      const removedIndex = [...this.bolts.keys()].filter((k) => lab.fasteners[k] === 'removed').indexOf(socketId)
      if (state === 'tight') {
        b.target.copy(home)
        b.rot = 0
      } else if (state === 'loose') {
        b.target.copy(home).add(new THREE.Vector3(0, 0, 0.1))
        b.rot = 0.28
      } else {
        b.target.copy(v(boltDish(Math.max(removedIndex, 0))))
        b.rot = Math.PI / 2
      }
      b.hole.visible = state === 'removed'
    }
  }

  /** Screen position (page pixels) of a socket, for tests and hints. */
  screenOf(socketId: string): { x: number; y: number } {
    const r = this.renderer.domElement.getBoundingClientRect()
    const p = v(SOCKET_POS[socketId]).add(new THREE.Vector3(0, 0, 0.2)).project(this.camera)
    return { x: ((p.x + 1) / 2) * r.width + r.left, y: ((-p.y + 1) / 2) * r.height + r.top }
  }

  /** Screen position of a cable plug. */
  screenOfPlug(id: string): { x: number; y: number } {
    const r = this.renderer.domElement.getBoundingClientRect()
    const p = this.cables.get(id)!.plug.position.clone().project(this.camera)
    return { x: ((p.x + 1) / 2) * r.width + r.left, y: ((-p.y + 1) / 2) * r.height + r.top }
  }

  /** Screen position of a bolt. */
  screenOfBolt(socketId: string): { x: number; y: number } {
    const r = this.renderer.domElement.getBoundingClientRect()
    const p = this.bolts.get(socketId)!.group.position.clone().project(this.camera)
    return { x: ((p.x + 1) / 2) * r.width + r.left, y: ((-p.y + 1) / 2) * r.height + r.top }
  }

  setProbes(a: string | null, b: string | null) {
    this.probeMarkers[0].visible = !!a
    this.probeMarkers[1].visible = !!b
    if (a) this.probeMarkers[0].position.copy(v(SOCKET_POS[a])).add(new THREE.Vector3(0, 0, 0.7))
    if (b) this.probeMarkers[1].position.copy(v(SOCKET_POS[b])).add(new THREE.Vector3(0, 0, 0.7))
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.ro.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onDown)
    el.removeEventListener('pointermove', this.onMove)
    el.removeEventListener('pointerup', this.onUp)
    el.removeEventListener('pointercancel', this.onUp)
    el.removeEventListener('pointerleave', this.onLeave)
    this.controls.dispose()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose?.()
      const mat = m.material as THREE.Material | THREE.Material[] | undefined
      for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) {
        ;(x as THREE.MeshBasicMaterial).map?.dispose()
        x.dispose()
      }
    })
    this.renderer.dispose()
    el.remove()
  }

  // ------------------------------------------------------------------ world

  private mark(o: THREE.Object3D, pick: Pick) {
    o.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.userData.pick = pick
        this.pickables.push(c)
      }
    })
  }

  private box(w: number, h: number, d: number, color: number, pos: V3, opts: { rough?: number; metal?: number; pick?: Pick; opacity?: number } = {}): THREE.Mesh {
    const mat = standard(color, opts.rough ?? 0.7, opts.metal ?? 0.1)
    if (opts.opacity !== undefined) {
      mat.transparent = true
      mat.opacity = opts.opacity
    }
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(...pos)
    this.scene.add(m)
    if (opts.pick) this.mark(m, opts.pick)
    return m
  }

  private buildWorld() {
    const s = this.scene
    s.background = new THREE.Color(0x0f172a)
    s.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.15))
    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(6, 14, 22)
    s.add(key)
    const fill = new THREE.DirectionalLight(0x93c5fd, 0.5)
    fill.position.set(-14, 4, 10)
    s.add(fill)

    // Wall behind, a floor, and the bench the loose cables lie on.
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), standard(0xc9a77c, 0.9, 0))
    wall.position.set(0, 0, -0.4)
    s.add(wall)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), standard(0x6b7280, 0.95, 0))
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, -16, 20)
    s.add(floor)
    this.bench = this.box(26, 0.4, 11, 0x475569, [1.2, BENCH_Y - 0.2, 10.4], { rough: 0.8 })
    this.bench.userData.bench = true
    const benchLabel = labelPlane('Bench', 2, 0.5, '#cbd5e1')
    benchLabel.rotation.x = -Math.PI / 2
    benchLabel.position.set(-9.8, BENCH_Y + 0.02, 14.6)
    s.add(benchLabel)
    this.box(26, 0.2, 0.4, 0x1e293b, [1.2, BENCH_Y - 0.5, 15.8])

    // Inverter body above, enclosure shell, back plate.
    const W = BOX.x1 - BOX.x0
    const H = BOX.y1 - BOX.y0
    const cx = (BOX.x0 + BOX.x1) / 2
    const cy = (BOX.y0 + BOX.y1) / 2
    this.box(W + 0.6, 11, BOX.depth + 0.8, 0x1c1c1f, [cx, BOX.y1 + 5.6, BOX.depth / 2 - 0.1], { rough: 0.85 })
    const lion = labelPlane('LION', 3.2, 1.0, '#e5e7eb', null, 'bold 90px system-ui, sans-serif')
    lion.position.set(cx, BOX.y1 + 7.4, BOX.depth + 0.32)
    s.add(lion)
    const led = this.box(1.2, 0.35, 0.1, 0x020617, [cx, BOX.y1 + 4.2, BOX.depth + 0.32])
    led.add(new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0x22c55e })))
    ;(led.children[0] as THREE.Mesh).position.set(-0.3, 0, 0.06)
    this.box(W, H, 0.2, 0x111113, [cx, cy, -0.1], { rough: 0.95 })
    this.box(0.3, H, BOX.depth, 0x1c1c1f, [BOX.x0 - 0.15, cy, BOX.depth / 2])
    this.box(0.3, H, BOX.depth, 0x1c1c1f, [BOX.x1 + 0.15, cy, BOX.depth / 2])
    this.box(W + 0.6, 0.3, BOX.depth, 0x1c1c1f, [cx, BOX.y1 + 0.15, BOX.depth / 2])
    this.box(W + 0.6, 0.35, 0.5, 0x1c1c1f, [cx, BOX.y0 - 0.15, BOX.depth - 0.25])
    // A piece of conduit on the right.
    const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 40, 20), standard(0xb6bcc4, 0.35, 0.8))
    conduit.position.set(BOX.x1 + 3.6, 6, 1.2)
    s.add(conduit)

    this.buildInside()
  }

  private buildInside() {
    const s = this.scene
    // DIN rails
    this.box(11.4, 0.35, 0.3, 0x9ca3af, [2.6, -2.2, 0.35], { metal: 0.8, rough: 0.4 })
    this.box(11.4, 0.35, 0.3, 0x9ca3af, [2.6, -3.9, 0.35], { metal: 0.8, rough: 0.4 })

    // Battery busbars with the clear cover, CT, red and black cables are drawn with the cable parts.
    for (const id of ['bat_p', 'bat_n'] as const) {
      const p = SOCKET_POS[id]
      this.box(1.15, 1.7, 0.5, 0xb87333, [p[0], p[1] + 0.1, 0.5], { metal: 0.9, rough: 0.35, pick: { type: 'component', id: 'busbars', label: 'Battery busbars (BAT+ and BAT-)' } })
    }
    this.box(2.9, 2.0, 0.12, 0xbfdbfe, [-5.35, 3.4, 1.25], { opacity: 0.22, metal: 0, rough: 0.1, pick: { type: 'component', id: 'busbars', label: 'Battery busbars (BAT+ and BAT-)' } })
    for (const [text, x] of [['BAT+', -6.0], ['BAT-', -4.7]] as const) {
      const l = labelPlane(text, 0.9, 0.3, '#f8fafc', '#111827', 'bold 44px system-ui, sans-serif')
      l.position.set(x, 4.45, 1.32)
      s.add(l)
    }
    this.box(0.9, 1.0, 0.7, 0x2563eb, [-7.0, 3.1, 0.6]) // CT clamp

    // WCM (unused on the training unit) and the control board.
    this.box(1.6, 2.5, 0.12, 0x15803d, [-2.8, 3.0, 0.45], { pick: { type: 'component', id: 'wcm', label: 'WCM (not used on this unit)' } })
    this.box(9.6, 2.9, 0.12, 0x15803d, [3.4, 3.0, 0.45], { rough: 0.5, pick: { type: 'component', id: 'control', label: 'Control board' } })
    const green = [0x22c55e]
    for (let i = 0; i < 9; i++) this.box(0.45, 0.4, 0.45, green[0], [-1.2 + i * 0.55, 4.0, 0.8], { pick: { type: 'component', id: 'control', label: 'Control board' } })
    for (let i = 0; i < 4; i++) {
      this.box(0.55, 0.9, 0.4, 0xdc2626, [4.0 + i * 1.2, 4.9, 0.6], { metal: 0.3 }) // red AC lugs on the board
      this.box(0.3, 0.3, 0.1, 0xe5e7eb, [4.0 + i * 1.2, 4.4, 0.85], { metal: 0.9 })
    }
    this.box(1.7, 1.6, 1.3, 0x111827, [5.0, 2.6, 1.0], { pick: { type: 'component', id: 'control', label: 'Load relay (line 1, left)' } })
    this.box(1.7, 1.6, 1.3, 0x111827, [7.0, 2.6, 1.0], { pick: { type: 'component', id: 'control', label: 'Load relay (line 2, right)' } })
    const rsdL = labelPlane('REMOTE\nSHUTDOWN', 1.2, 0.5, '#e5e7eb', null, 'bold 30px system-ui, sans-serif')
    rsdL.position.set(-0.4, 4.6, 1.3)
    s.add(rsdL)
    const agsL = labelPlane('GEN AGS', 1.1, 0.3, '#e5e7eb')
    agsL.position.set(0.8, 4.55, 1.3)
    s.add(agsL)
    const rssL = labelPlane('RSS', 1.1, 0.3, '#e5e7eb')
    rssL.position.set(2.0, 4.55, 1.3)
    s.add(rssL)

    // The three black port blocks: FRONT (upper) and BACK (lower) RJ45 ports.
    const bricks: [string, string, number, string][] = [
      ['ports-bms', 'PARALLEL A\nBMS COMM', -0.6, 'Port block: Parallel A / BMS COMM'],
      ['ports-wifi', 'PARALLEL B\nWIFI PORT', 0.6, 'Port block: Parallel B / WiFi Port'],
      ['ports-ct', 'NOT USED\nCT1 & CT2', 1.8, 'Port block: Meter Port (not used) / CT1 & CT2'],
    ]
    for (const [cid, text, x, label] of bricks) {
      this.box(1.0, 2.15, 0.8, 0x050505, [x, 1.35, 1.0], { rough: 0.5, pick: { type: 'component', id: cid, label } })
      const t = labelPlane(text, 0.9, 0.62, '#f8fafc', null, 'bold 40px system-ui, sans-serif')
      t.position.set(x, 1.33, 1.41)
      s.add(t)
      for (const y of [1.7, 0.95]) this.box(0.62, 0.3, 0.1, 0x6b7280, [x, y, 1.45], { rough: 0.4, metal: 0.5 })
    }

    // EMS-C
    this.box(2.1, 4.6, 1.1, 0x0b0b0d, [-6.6, -2.2, 0.9], { rough: 0.5, pick: { type: 'component', id: 'emsc', label: 'EMS-C' } })
    for (const [id, text] of [['ems_bat', 'BATTERY'], ['ems_eth', 'ETHERNET'], ['ems_cell', 'CELLULAR'], ['ems_wifi', 'WIFI/BT']] as const) {
      const p = SOCKET_POS[id]
      this.box(0.75, 0.38, 0.1, 0x6b7280, [p[0], p[1], 1.5], { metal: 0.5, rough: 0.4 })
      const t = labelPlane(text, 0.75, 0.2, '#9ca3af', null, 'bold 34px system-ui, sans-serif')
      t.position.set(p[0] + 0.0, p[1] - 0.3, 1.46)
      s.add(t)
    }
    ;['STATUS', 'CELL', 'BT', 'POWER'].forEach((t, i) => {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }))
      dot.position.set(-7.4 + i * 0.5, -4.2, 1.46)
      s.add(dot)
      const l = labelPlane(t, 0.5, 0.16, '#9ca3af', null, 'bold 30px system-ui, sans-serif')
      l.position.set(-7.4 + i * 0.5, -4.0, 1.46)
      s.add(l)
    })

    // PV fuse holders (PV1+ ... PV4+, PV1- ... PV4-).
    for (let i = 0; i < 8; i++) {
      const x = -3.0 + i * 0.62
      this.box(0.55, 1.5, 0.75, 0xd1d5db, [x, -0.05, 0.8], { rough: 0.5, pick: { type: 'component', id: 'pv-fuses', label: 'PV fuse holders' } })
      this.box(0.5, 0.5, 0.3, 0x111827, [x, 0.25, 1.2], { pick: { type: 'component', id: 'pv-fuses', label: 'PV fuse holders' } })
      const name = i < 4 ? `PV${i + 1}+` : `PV${i - 3}-`
      const l = labelPlane(name, 0.56, 0.2, '#111827', '#f3f4f6', 'bold 36px system-ui, sans-serif')
      l.position.set(x, 0.85, 1.2)
      s.add(l)
    }
    // Grid, generator and load terminal blocks.
    ;(['grid', 'gen', 'load'] as const).forEach((g, block) => {
      const x = 2.2 + block * 2.1 + 0.65
      const comp = `ac-${g}`
      const title = g === 'grid' ? 'Grid input terminals (L1, L2, N)' : g === 'gen' ? 'Generator terminals (L1, L2, N)' : 'Load output terminals (L1, L2, N)'
      this.box(2.0, 1.6, 0.8, 0x6b7280, [x, -0.1, 0.8], { rough: 0.55, pick: { type: 'component', id: comp, label: title } })
      this.box(1.9, 0.14, 0.82, 0x374151, [x, 0.9, 0.82])
      const l = labelPlane(g === 'grid' ? 'GRID' : g === 'gen' ? 'GEN' : 'LOAD', 1.1, 0.34, '#111827', '#fbbf24', 'bold 52px system-ui, sans-serif')
      l.position.set(x, 1.2, 1.2)
      s.add(l)
      ;['L1', 'L2', 'N'].forEach((n, i) => {
        const t = labelPlane(n, 0.4, 0.2, '#f9fafb', '#111827', 'bold 36px system-ui, sans-serif')
        t.position.set(2.2 + block * 2.1 + i * 0.65, -0.95, 1.25)
        s.add(t)
      })
    })

    // Invisible proxies so every socket can be probed.
    for (const sk of SOCKETS) {
      const p = SOCKET_POS[sk.id]
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
      proxy.position.set(p[0], p[1], p[2] + (sk.kind === 'rj45' || sk.kind === 'antenna' ? 0.1 : 0.2))
      s.add(proxy)
      this.mark(proxy, { type: 'socket', id: sk.id, socket: sk.id, label: sk.label })
    }
  }

  // ------------------------------------------------------------------ cables

  private buildCables() {
    for (const part of PARTS) this.cables.set(part.id, this.makeCable(part.id, part, partColor(part)))
    this.cables.set('spare', this.makeCable('spare', null, SPARE_COLOR))
  }

  private plugGeometry(part: Part | null, color: number): { group: THREE.Group; radius: number } {
    const g = new THREE.Group()
    const kind = part?.kind ?? 'ethernet'
    const body = standard(color, 0.5, 0.2)
    let radius = 0.05
    if (kind === 'ethernet') {
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.6), standard(0x0a0a0a, 0.4, 0.2))
      shell.position.z = 0.1
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.45), body)
      boot.position.z = 0.55
      g.add(shell, boot)
    } else if (kind === 'antenna') {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), standard(0xd4a017, 0.3, 0.9))
      c.rotation.x = Math.PI / 2
      c.position.z = 0.2
      g.add(c)
      radius = 0.05
    } else if (kind === 'plug') {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.5), standard(0x16a34a, 0.5))
      block.position.z = 0.2
      g.add(block)
      radius = 0.05
    } else if (kind === 'battery') {
      // A flat lug under the busbar bolt, and the heavy cable leaves it downward.
      const lug = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.1), standard(0xd1d5db, 0.3, 0.9))
      const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16), body)
      boot.position.set(0, -0.55, 0.0)
      g.add(lug, boot)
      radius = 0.19
    } else {
      // PV and AC wires end in a ferrule that goes up into the terminal.
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 10), standard(0xd4d4d8, 0.3, 0.9))
      f.position.y = 0.0
      const sheath = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 10), body)
      sheath.position.y = -0.45
      g.add(f, sheath)
      radius = 0.085
    }
    return { group: g, radius }
  }

  private makeCable(id: string, part: Part | null, color: number): CableView {
    const group = new THREE.Group()
    const { group: plug, radius } = this.plugGeometry(part, color)
    const label = part ? part.tag : 'Spare Ethernet cable'
    // Bigger invisible pick area on each plug.
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
    plug.add(hit)
    group.add(plug)
    this.scene.add(group)
    const tag = makeSprite(label, 0.4)
    tag.visible = false
    this.scene.add(tag)
    this.mark(plug, { type: 'plug', id, label })
    return { id, part, group, plug, tube: null, color, radius, at: null, tag }
  }

  private isVerticalPlug(c: CableView): boolean {
    return !!c.part && (c.part.kind === 'pv' || c.part.kind === 'ac' || c.part.kind === 'battery')
  }

  /** Place the plug and rebuild the cable from the box exit (or the bench) to wherever the plug is. */
  private layoutCable(c: CableView, lab: LabState, id: string) {
    let at: string | null
    if (id === 'spare') at = lab.spare
    else at = lab.wires[id] ?? null
    c.at = at
    if (at) {
      const sp = v(SOCKET_POS[at])
      const sk = socketById(at)
      const lifted = lab.fasteners[at] === 'removed'
      if (c.part?.kind === 'battery') {
        c.plug.position.copy(sp).add(new THREE.Vector3(0, -0.2, 0.2 + (lifted ? 0.3 : 0)))
        c.plug.rotation.set(0, 0, 0)
      } else if (this.isVerticalPlug(c)) {
        c.plug.position.copy(sp).add(new THREE.Vector3(0, lifted ? -0.35 : -0.15, 0.05))
        c.plug.rotation.set(0, 0, 0)
      } else {
        const lift = sk.kind === 'busbar' ? 0.2 : 0
        c.plug.position.copy(sp).add(new THREE.Vector3(0, 0, 0.05 + lift))
        c.plug.rotation.set(0, 0, 0)
      }
      this.rebuildTube(c, c.plug.position, this.attachDir(c))
      c.tag.visible = false
    } else {
      const index = id === 'spare' ? -1 : PARTS.findIndex((p) => p.id === id)
      const slot = id === 'spare' ? v(SPARE_SLOT) : v(benchSlot(this.benchIndex(lab, id, index)))
      c.plug.position.copy(slot)
      c.plug.rotation.set(Math.PI / 2, 0, 0)
      this.rebuildTube(c, slot, new THREE.Vector3(0, 0, 1), true)
      c.tag.visible = true
      c.tag.position.copy(slot).add(new THREE.Vector3(0, 0.9, 0.6))
    }
  }

  /** Keep each unplugged cable in its own bench slot, in the order the parts are listed. */
  private benchIndex(lab: LabState, id: string, index: number): number {
    const free = PARTS.filter((p) => !lab.wires[p.id]).map((p) => p.id)
    const i = free.indexOf(id)
    return i >= 0 ? i : Math.max(index, 0)
  }

  private attachDir(c: CableView): THREE.Vector3 {
    return this.isVerticalPlug(c) ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, 1)
  }

  /** The cable goes from where the plug is to the exit in the bottom of the box (or, for the spare, to its far end on the bench). */
  private rebuildTube(c: CableView, plugPos: THREE.Vector3, dir: THREE.Vector3, onBench = false) {
    if (c.tube) {
      this.scene.remove(c.tube)
      c.tube.geometry.dispose()
      c.tube = null
    }
    const isSpare = c.id === 'spare'
    const start = plugPos.clone().add(dir.clone().multiplyScalar(onBench ? 0.7 : 0.35))
    let end: THREE.Vector3
    if (isSpare) end = v(SPARE_SLOT).add(new THREE.Vector3(-3.4, 0.05, 1.2))
    else end = v(exitPos(c.id))
    const pts: THREE.Vector3[] = [start]
    if (onBench) {
      pts.push(new THREE.Vector3(start.x, start.y + 0.15, start.z - 1.0))
      if (isSpare) pts.push(new THREE.Vector3((start.x + end.x) / 2, BENCH_Y + 0.2, (start.z + end.z) / 2 + 0.8))
      else {
        pts.push(new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2 + 0.5, (start.z + end.z) / 2 + 0.5))
        pts.push(new THREE.Vector3(end.x, end.y - 1.2, end.z + 0.6))
      }
      pts.push(end)
    } else if (isSpare) {
      pts.push(start.clone().add(new THREE.Vector3(0, -0.8, 0.9)))
      pts.push(new THREE.Vector3(start.x, start.y - 3.2, 3.2))
      pts.push(new THREE.Vector3((start.x + end.x) / 2, BENCH_Y + 2.2, 6.0))
      pts.push(new THREE.Vector3(end.x - 0.8, BENCH_Y + 0.3, end.z - 0.6))
      pts.push(end)
    } else {
      const out = dir.z > 0 ? 0.8 : 0.0
      pts.push(start.clone().add(new THREE.Vector3(0, -0.5, out)))
      const front = 1.9 + 0.12 * (PARTS.findIndex((p) => p.id === c.id) % 6)
      pts.push(new THREE.Vector3((start.x * 2 + end.x) / 3, start.y - 1.6, front))
      pts.push(new THREE.Vector3(end.x, (start.y + end.y) / 2 - 1, front))
      pts.push(end.clone().add(new THREE.Vector3(0, 0.3, 0)))
      pts.push(end)
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4)
    const geo = new THREE.TubeGeometry(curve, 48, c.radius, 8, false)
    const mesh = new THREE.Mesh(geo, standard(c.color, 0.55, 0.05))
    this.scene.add(mesh)
    c.tube = mesh
    this.mark(mesh, { type: 'plug', id: c.id, label: c.part ? c.part.tag : 'Spare Ethernet cable' })
    // Pickables list may hold the old tube: drop stale entries.
    this.pickables = this.pickables.filter((o) => o.parent !== null || o === mesh)
  }

  // ------------------------------------------------------------------ bolts

  private buildBolts() {
    for (const sk of SOCKETS) {
      if (sk.kind !== 'terminal' && sk.kind !== 'busbar') continue
      const g = new THREE.Group()
      const head = new THREE.Mesh(new THREE.CylinderGeometry(sk.kind === 'busbar' ? 0.28 : 0.2, sk.kind === 'busbar' ? 0.28 : 0.2, 0.14, 16), standard(0xf1f5f9, 0.3, 0.9))
      head.rotation.x = Math.PI / 2
      const slot1 = new THREE.Mesh(new THREE.BoxGeometry(sk.kind === 'busbar' ? 0.44 : 0.28, 0.045, 0.03), standard(0x111827))
      const slot2 = slot1.clone()
      slot2.rotation.z = Math.PI / 2
      slot1.position.z = slot2.position.z = 0.07
      g.add(head, slot1, slot2)
      const big = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
      g.add(big)
      const home = v(boltPos(sk.id))
      g.position.copy(home)
      this.scene.add(g)
      this.mark(g, { type: 'bolt', id: sk.id, socket: sk.id, label: `${sk.group}: ${sk.label} bolt` })
      const hole = new THREE.Mesh(new THREE.CircleGeometry(sk.kind === 'busbar' ? 0.22 : 0.14, 16), new THREE.MeshBasicMaterial({ color: 0x020617 }))
      hole.position.copy(home).add(new THREE.Vector3(0, 0, 0.02))
      hole.visible = false
      this.scene.add(hole)
      this.bolts.set(sk.id, { socketId: sk.id, group: g, target: home.clone(), rot: 0, hole })
    }
  }

  // ------------------------------------------------------------------ sockets that glow while dragging

  private buildRings() {
    for (const sk of SOCKETS) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.4, 24), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9, depthTest: false, side: THREE.DoubleSide }))
      const p = SOCKET_POS[sk.id]
      ring.position.set(p[0], p[1], p[2] + 0.75)
      ring.visible = false
      ring.renderOrder = 9
      this.scene.add(ring)
      this.rings.set(sk.id, ring)
    }
    for (const col of [0xef4444, 0x111827]) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 12), new THREE.MeshBasicMaterial({ color: col, depthTest: false }))
      m.rotation.x = Math.PI / 2
      m.visible = false
      m.renderOrder = 11
      this.scene.add(m)
      this.probeMarkers.push(m)
    }
  }

  // ------------------------------------------------------------------ interaction

  private ndc(e: PointerEvent): THREE.Vector2 {
    const r = this.renderer.domElement.getBoundingClientRect()
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }

  private matches(p: Pick): boolean {
    switch (this.tool) {
      case 'hand': return p.type === 'plug'
      case 'tighten':
      case 'loosen': return p.type === 'bolt'
      case 'meter': return p.type === 'socket' || p.type === 'bolt' || (p.type === 'plug' && !!this.cableSocket(p.id))
      case 'tester': return p.type === 'plug' && this.isEthernet(p.id)
      case 'inspect': return p.type === 'component' || p.type === 'plug'
    }
  }

  private cableSocket(id: string): string | null {
    const c = this.cables.get(id)
    return c?.at ?? null
  }

  private isEthernet(id: string): boolean {
    return id === 'spare' || partById(id).kind === 'ethernet'
  }

  private pickAt(e: PointerEvent): Pick | null {
    this.raycaster.setFromCamera(this.ndc(e), this.camera)
    const hits = this.raycaster.intersectObjects(this.pickables, false)
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object
      let pick: Pick | undefined
      while (o && !pick) {
        pick = o.userData.pick as Pick | undefined
        o = o.parent
      }
      if (pick && this.matches(pick)) return pick
    }
    return null
  }

  private setHover(p: Pick | null, e?: PointerEvent) {
    if (this.hoverObj?.type === p?.type && this.hoverObj?.id === p?.id) {
      if (p && e) this.cb.onHover(this.describe(p), e.clientX, e.clientY)
      return
    }
    this.hoverObj = p
    this.renderer.domElement.style.cursor = p ? (this.tool === 'hand' ? 'grab' : 'pointer') : this.tool === 'hand' ? 'grab' : 'crosshair'
    this.cb.onHover(p && e ? this.describe(p) : null, e?.clientX ?? 0, e?.clientY ?? 0)
  }

  private describe(p: Pick): string {
    if (p.type === 'bolt') {
      const st = this.lab?.fasteners[p.id]
      return `${p.label}: ${st ?? ''}`
    }
    if (p.type === 'plug' && p.id !== 'spare') {
      const c = this.cables.get(p.id)
      return `${p.label}${c?.at ? ` (on ${socketById(c.at).label})` : ' (on the bench)'}`
    }
    return p.label
  }

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const pick = this.pickAt(e)
    this.down = { x: e.clientX, y: e.clientY, pick }
    if (this.tool === 'hand' && pick?.type === 'plug') {
      const c = this.cables.get(pick.id)!
      this.controls.enabled = false
      this.renderer.domElement.setPointerCapture(e.pointerId)
      const dir = this.camera.getWorldDirection(new THREE.Vector3())
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(dir, c.plug.position)
      const hit = this.rayPoint(e, plane) ?? c.plug.position.clone()
      this.drag = { id: pick.id, offset: c.plug.position.clone().sub(hit), plane, moved: false }
      this.renderer.domElement.style.cursor = 'grabbing'
      this.cb.onHover(null, 0, 0)
    }
  }

  private rayPoint(e: PointerEvent, plane: THREE.Plane): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.ndc(e), this.camera)
    const out = new THREE.Vector3()
    return this.raycaster.ray.intersectPlane(plane, out)
  }

  private onMove = (e: PointerEvent) => {
    if (this.drag) {
      const c = this.cables.get(this.drag.id)!
      const dx = e.clientX - (this.down?.x ?? e.clientX)
      const dy = e.clientY - (this.down?.y ?? e.clientY)
      if (!this.drag.moved && Math.hypot(dx, dy) < 5) return
      this.drag.moved = true
      const p = this.rayPoint(e, this.drag.plane)
      if (!p) return
      p.add(this.drag.offset)
      c.plug.position.copy(p)
      c.plug.rotation.set(this.isVerticalPlug(c) ? 0 : 0, 0, 0)
      this.rebuildTube(c, p, this.attachDir(c), false)
      this.showTargets(c, e)
      return
    }
    if (e.buttons === 0) this.setHover(this.pickAt(e), e)
  }

  /** While a cable is in hand, ring every socket it fits and brighten the closest one. */
  private showTargets(c: CableView, e: PointerEvent) {
    const best = this.nearestSocket(c, e)
    for (const sk of SOCKETS) {
      const ring = this.rings.get(sk.id)!
      const ok = c.id === 'spare' ? sk.kind === 'rj45' : fits(partById(c.id), sk)
      ring.visible = ok
      const mat = ring.material as THREE.MeshBasicMaterial
      mat.color.setHex(best === sk.id ? 0x4ade80 : 0x38bdf8)
      ring.scale.setScalar(best === sk.id ? 1.4 : 1)
    }
  }

  private nearestSocket(c: CableView, e: PointerEvent): string | null {
    const r = this.renderer.domElement.getBoundingClientRect()
    let best: string | null = null
    let bestD = 56
    for (const sk of SOCKETS) {
      const ok = c.id === 'spare' ? sk.kind === 'rj45' : fits(partById(c.id), sk)
      if (!ok) continue
      const p = v(SOCKET_POS[sk.id]).project(this.camera)
      const sx = ((p.x + 1) / 2) * r.width + r.left
      const sy = ((-p.y + 1) / 2) * r.height + r.top
      const d = Math.hypot(sx - e.clientX, sy - e.clientY)
      if (d < bestD) {
        bestD = d
        best = sk.id
      }
    }
    return best
  }

  private onUp = (e: PointerEvent) => {
    const down = this.down
    this.down = null
    if (this.drag) {
      const d = this.drag
      this.drag = null
      this.controls.enabled = true
      try {
        this.renderer.domElement.releasePointerCapture(e.pointerId)
      } catch {
        /* the pointer was already released */
      }
      for (const ring of this.rings.values()) ring.visible = false
      const c = this.cables.get(d.id)!
      if (d.moved) {
        const target = this.nearestSocket(c, e)
        this.raycaster.setFromCamera(this.ndc(e), this.camera)
        const onBench = this.raycaster.intersectObject(this.bench, false).length > 0
        if (target) this.cb.onDrop(d.id, target)
        else if (onBench) this.cb.onDrop(d.id, null)
        else if (this.lab) this.sync(this.lab)
      } else if (this.lab) this.sync(this.lab)
      this.renderer.domElement.style.cursor = 'grab'
      return
    }
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return
    const p = down.pick
    if (!p) return
    switch (this.tool) {
      case 'tighten':
      case 'loosen':
        if (p.type === 'bolt') this.cb.onBolt(p.id, this.tool)
        break
      case 'meter': {
        const socket = p.type === 'plug' ? this.cableSocket(p.id) : (p.socket ?? null)
        if (socket) this.cb.onProbe(socket)
        break
      }
      case 'tester':
        if (p.type === 'plug') this.cb.onTest(p.id)
        break
      case 'inspect':
        if (p.type === 'component') this.cb.onInspect(p.id)
        else if (p.type === 'plug') this.cb.onInspect(`cable:${p.id}`)
        break
      default:
        break
    }
  }

  private onLeave = () => {
    if (!this.drag) this.setHover(null)
  }

  // ------------------------------------------------------------------ loop

  private resize() {
    const w = Math.max(this.host.clientWidth, 200)
    const h = Math.max(this.host.clientHeight, 200)
    this.renderer.setSize(w, h, false)
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (!this.framed) {
      this.framed = true
      this.flyTo('front', true)
    }
  }

  private loop = () => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.loop)
    const now = performance.now()
    const dt = Math.min((now - this.last) / 1000, 0.05)
    this.last = now
    if (this.flyTo_) {
      const k = 1 - Math.pow(0.0005, dt)
      this.camera.position.lerp(this.flyTo_.pos, k)
      this.controls.target.lerp(this.flyTo_.target, k)
      if (this.camera.position.distanceTo(this.flyTo_.pos) < 0.05 && this.controls.target.distanceTo(this.flyTo_.target) < 0.05) this.flyTo_ = null
    }
    for (const b of this.bolts.values()) {
      b.group.position.lerp(b.target, 1 - Math.pow(0.001, dt))
      b.group.rotation.z += (b.rot - b.group.rotation.z) * 0.2
      b.group.rotation.x += ((b.rot > 1 ? Math.PI / 2 : 0) - b.group.rotation.x) * 0.2
    }
    const t = performance.now() / 300
    for (const r of this.rings.values()) if (r.visible) r.rotation.z = t
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}
