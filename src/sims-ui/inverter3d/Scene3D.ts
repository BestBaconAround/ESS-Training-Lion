import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { PARTS, SOCKETS, partById, socketById, type Part } from '../../content/sims/wireBox'
import { fits } from '../../sims/wirebox/engine'
import type { LabState } from '../../sims/inverter3d/engine'
import { BAND, BENCH_Y, BLOCK, BOX, CAMERA_PRESETS, FROM_BELOW, HOLDER, SOCKET_POS, SPARE_SLOT, acX, bandX, bandY, benchSlot, boltDish, boltPos, exitPos, pvX, type V3 } from './layout'

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

/** Wire colors follow the author's photos where they show one (AC: black L1, red L2, white N; battery red and black; black and blue Ethernet). */
function partColor(p: Part): number {
  switch (p.kind) {
    case 'battery': return p.tag.includes('+') ? 0xc8261b : 0x121212
    case 'pv': return p.tag.includes('+') ? 0xb91c1c : 0x151515
    case 'ac': return p.label.endsWith('L1') ? 0x151515 : p.label.endsWith('L2') ? 0xc0201c : 0xe8e8e8
    case 'ethernet': return /emsc|router|addressing/.test(p.id) ? 0x2e86d6 : 0x141414
    case 'antenna': return 0x1b1b1b
    case 'plug': return 0xb91c1c
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

/** Bolt head radius: big hex bolts on the busbars, smaller screws on the terminals. */
const boltR = (id: string, kind: string): number => (kind === 'busbar' ? 0.46 : id.startsWith('pv') ? 0.13 : 0.17)

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
  private labels: THREE.Object3D[] = []
  private tags = true

  constructor(private host: HTMLElement, private cb: SceneCallbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.setClearColor(0x0b1220)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
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

  /** Show or hide the printed labels on the parts and the tags on loose cables. */
  setLabels(on: boolean) {
    this.tags = on
    for (const l of this.labels) l.visible = on
    if (this.lab) this.sync(this.lab)
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

  private box(w: number, h: number, d: number, color: number, pos: V3, opts: { rough?: number; metal?: number; pick?: Pick; opacity?: number; round?: number; shadow?: boolean } = {}): THREE.Mesh {
    const mat = standard(color, opts.rough ?? 0.7, opts.metal ?? 0.1)
    if (opts.opacity !== undefined) {
      mat.transparent = true
      mat.opacity = opts.opacity
    }
    const geo = opts.round ? new RoundedBoxGeometry(w, h, d, 3, opts.round) : new THREE.BoxGeometry(w, h, d)
    const m = new THREE.Mesh(geo, mat)
    m.position.set(...pos)
    if (opts.shadow !== false) {
      m.castShadow = true
      m.receiveShadow = true
    }
    this.scene.add(m)
    if (opts.pick) this.mark(m, opts.pick)
    return m
  }

  /** An invisible box that only exists to be clicked or hovered. */
  private hit(w: number, h: number, d: number, pos: V3, pick: Pick) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }))
    m.position.set(...pos)
    this.scene.add(m)
    this.mark(m, pick)
  }

  private loadTexture(file: string, repeat?: [number, number]): THREE.Texture {
    const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}images/${file}`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(...repeat)
    }
    return t
  }

  private label(text: string, w: number, h: number, pos: V3, fg?: string, bg?: string | null, font?: string): THREE.Mesh {
    const l = labelPlane(text, w, h, fg, bg, font)
    l.position.set(...pos)
    this.scene.add(l)
    this.labels.push(l)
    return l
  }

  private woodTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 1024
    const g = c.getContext('2d')!
    g.fillStyle = '#d8b987'
    g.fillRect(0, 0, 1024, 1024)
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 900; i++) {
      const x = rnd() * 1024
      g.strokeStyle = `rgba(${90 + rnd() * 50},${55 + rnd() * 30},${20 + rnd() * 20},${0.05 + rnd() * 0.12})`
      g.lineWidth = 0.5 + rnd() * 2
      g.beginPath()
      g.moveTo(x, 0)
      g.bezierCurveTo(x + (rnd() - 0.5) * 30, 300, x + (rnd() - 0.5) * 30, 700, x + (rnd() - 0.5) * 20, 1024)
      g.stroke()
    }
    for (let i = 0; i < 6; i++) {
      const x = rnd() * 1024
      const y = rnd() * 1024
      const gr = g.createRadialGradient(x, y, 2, x, y, 40)
      gr.addColorStop(0, 'rgba(110,70,30,0.45)')
      gr.addColorStop(1, 'rgba(110,70,30,0)')
      g.fillStyle = gr
      g.beginPath()
      g.ellipse(x, y, 22, 46, 0, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = 'rgba(70,45,20,0.55)'
    g.lineWidth = 3
    g.strokeRect(0, 0, 1024, 1024)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
    return t
  }

  private concreteTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const g = c.getContext('2d')!
    g.fillStyle = '#8b8f94'
    g.fillRect(0, 0, 512, 512)
    let seed = 11
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 5000; i++) {
      const v1 = 110 + rnd() * 60
      g.fillStyle = `rgba(${v1},${v1},${v1 + 4},${0.15 + rnd() * 0.25})`
      g.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 3, 1 + rnd() * 3)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  }

  private railTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = '#b8bcc2'
    g.fillRect(0, 0, 256, 64)
    g.fillStyle = '#16181b'
    for (let i = 0; i < 4; i++) {
      g.beginPath()
      g.roundRect(14 + i * 64, 22, 38, 20, 10)
      g.fill()
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    t.repeat.set(12, 1)
    return t
  }

  private buildWorld() {
    const s = this.scene
    s.background = new THREE.Color(0x0b1220)
    const pm = new THREE.PMREMGenerator(this.renderer)
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
    s.environmentIntensity = 0.55
    pm.dispose()
    s.add(new THREE.HemisphereLight(0xffffff, 0x5b6573, 0.55))
    const key = new THREE.DirectionalLight(0xfff5e6, 2.1)
    key.position.set(10, 26, 30)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -34
    key.shadow.camera.right = 34
    key.shadow.camera.top = 30
    key.shadow.camera.bottom = -24
    key.shadow.camera.far = 90
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.04
    s.add(key)
    const fill = new THREE.DirectionalLight(0xbcd7ff, 0.5)
    fill.position.set(-20, 6, 18)
    s.add(fill)

    const W = BOX.x1 - BOX.x0
    const H = BOX.y1 - BOX.y0
    const cx = (BOX.x0 + BOX.x1) / 2
    const cy = (BOX.y0 + BOX.y1) / 2

    // Plywood wall, concrete floor, and the bench that loose cables lie on.
    const wallTex = this.woodTexture()
    wallTex.repeat.set(10, 7)
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(130, 90), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0 }))
    wall.position.set(0, 10, -0.5)
    wall.receiveShadow = true
    s.add(wall)
    const floorTex = this.concreteTexture()
    floorTex.repeat.set(16, 12)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 90), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, -16, 30)
    floor.receiveShadow = true
    s.add(floor)
    this.bench = this.box(28, 0.5, 12, 0x5a6472, [0.6, BENCH_Y - 0.25, 11.6], { rough: 0.55, metal: 0.25, round: 0.08 })
    this.bench.userData.bench = true
    for (const x of [-12.2, 13.4]) for (const z of [6.4, 16.8]) this.box(0.5, 7.3, 0.5, 0x2b3139, [x, BENCH_Y - 3.9, z], { rough: 0.5, metal: 0.5 })
    const benchLabel = labelPlane('BENCH', 2.4, 0.6, '#cbd5e1')
    benchLabel.rotation.x = -Math.PI / 2
    benchLabel.position.set(-11.2, BENCH_Y + 0.03, 16.2)
    s.add(benchLabel)

    // Framed wire box cover diagram on the wall, conduit with the rapid shutdown sticker, and a battery box.
    const fx = -15.2
    this.box(7.6, 6.2, 0.3, 0x0e0e10, [fx, 3.0, -0.2], { rough: 0.6, metal: 0.3 })
    this.box(6.9, 5.5, 0.12, 0xf4f4f2, [fx, 3.0, -0.02], { rough: 0.9, metal: 0 })
    const diagram = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 5.06), new THREE.MeshBasicMaterial({ map: this.loadTexture('rev4-wire-box-cover-diagram.webp') }))
    diagram.position.set(fx, 3.0, 0.06)
    s.add(diagram)
    const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 70, 28), standard(0xc4c9d0, 0.28, 0.85))
    conduit.position.set(13.2, 10, 0.9)
    conduit.castShadow = true
    s.add(conduit)
    for (const y of [-2, 12, 26]) this.box(1.5, 0.35, 0.7, 0x9aa1ab, [13.2, y, 0.9], { metal: 0.8, rough: 0.35 })
    const sticker = labelPlane('SOLAR PV SYSTEM EQUIPPED\nWITH RAPID SHUTDOWN', 1.1, 8.6, '#111827', '#facc15', 'bold 34px system-ui, sans-serif')
    sticker.rotation.z = Math.PI / 2
    sticker.position.set(13.2, 6.5, 1.53)
    s.add(sticker)
    const lowerConduit = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 28), standard(0xc4c9d0, 0.28, 0.85))
    lowerConduit.rotation.z = Math.PI / 2
    lowerConduit.position.set(15.4, -9.2, 2.0)
    lowerConduit.castShadow = true
    s.add(lowerConduit)
    this.box(8, 12, 6, 0x151618, [21.4, -10.2, 2.6], { rough: 0.6, metal: 0.35, round: 0.4 })

    // Inverter body above the wiring compartment, with the lion logo, the lights window and screws.
    const bodyMat = { rough: 0.5, metal: 0.4, round: 0.3 }
    this.box(W + 1.0, 15.4, BOX.depth + 0.9, 0x17181b, [cx, BOX.y1 + 8.0, BOX.depth / 2 - 0.1], bodyMat)
    const lion = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.32), new THREE.MeshBasicMaterial({ map: this.loadTexture('lab/lion.png'), transparent: true, opacity: 0.92 }))
    lion.position.set(cx, BOX.y1 + 10.6, BOX.depth + 0.38)
    s.add(lion)
    const lights = this.box(2.1, 0.7, 0.14, 0x040507, [cx, BOX.y1 + 6.2, BOX.depth + 0.4], { round: 0.1, rough: 0.2, metal: 0.6 })
    for (const [dx, col] of [[-0.55, 0x22c55e], [0.55, 0x4b5563]] as const) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), new THREE.MeshBasicMaterial({ color: col }))
      d.position.set(dx, 0, 0.09)
      lights.add(d)
    }
    for (const sx of [-1, 1]) {
      for (const y of [BOX.y1 + 14.2, BOX.y1 + 1.6]) {
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 14), standard(0x0a0a0b, 0.4, 0.7))
        screw.rotation.x = Math.PI / 2
        screw.position.set(cx + sx * (W / 2 - 0.2), y, BOX.depth + 0.38)
        s.add(screw)
      }
    }
    const handle = this.box(0.6, 1.4, 0.7, 0xdc2626, [BOX.x0 - 1.0, BOX.y1 + 6.4, BOX.depth - 0.4], { rough: 0.4, metal: 0.2, round: 0.1 })
    handle.castShadow = true

    // The open wiring compartment: back plate, walls, and the black lower cover where the cables go in.
    this.box(W, H, 0.2, 0x0a0a0b, [cx, cy, -0.1], { rough: 0.8, metal: 0.3 })
    this.box(0.4, H, BOX.depth, 0x17181b, [BOX.x0 - 0.2, cy, BOX.depth / 2], { rough: 0.5, metal: 0.4 })
    this.box(0.4, H, BOX.depth, 0x17181b, [BOX.x1 + 0.2, cy, BOX.depth / 2], { rough: 0.5, metal: 0.4 })
    this.box(W + 0.8, 0.45, BOX.depth, 0x17181b, [cx, BOX.y1 + 0.2, BOX.depth / 2], { rough: 0.5, metal: 0.4 })
    this.box(W + 1.0, 4.2, BOX.depth + 0.9, 0x17181b, [cx, BOX.y0 - 2.15, BOX.depth / 2 - 0.1], bodyMat)
    this.box(W + 1.0, 0.18, 0.12, 0x2a2c31, [cx, BOX.y0 - 4.3, BOX.depth + 0.4], { shadow: false })
    this.box(W + 1.0, 5.8, BOX.depth + 0.9, 0x17181b, [cx, BOX.y0 - 7.3, BOX.depth / 2 - 0.1], bodyMat)
    const lion2 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.8), new THREE.MeshBasicMaterial({ map: this.loadTexture('lab/lion.png'), transparent: true, opacity: 0.9 }))
    lion2.position.set(cx, BOX.y0 - 7.4, BOX.depth + 0.38)
    s.add(lion2)
    // The clear front lip of the compartment.
    this.box(W, 0.35, 0.5, 0x1e2024, [cx, BOX.y0 + 0.2, BOX.depth - 0.2], { rough: 0.45, metal: 0.4 })

    this.buildInside()
  }

  private buildInside() {
    const s = this.scene
    // Top band: busbars, CT, WCM, control board, relays and lugs are a photo of the training unit.
    const bandW = BAND.w * BAND.scale
    const bandH = BAND.h * BAND.scale
    const tex = this.loadTexture('lab/board-band.webp')
    const band = new THREE.Mesh(
      new THREE.PlaneGeometry(bandW, bandH),
      new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.55, roughness: 0.8, metalness: 0 }),
    )
    band.position.set(BAND.x0 + bandW / 2, BAND.y1 - bandH / 2, 0.5)
    band.receiveShadow = true
    s.add(band)
    this.mark(band, { type: 'component', id: 'control', label: 'Control board' })
    const px = (a: number) => bandX(a)
    const py = (a: number) => bandY(a)
    const area = (x0: number, y0: number, x1: number, y1: number, id: string, label: string) =>
      this.hit(px(x1) - px(x0), py(y0) - py(y1), 0.4, [(px(x0) + px(x1)) / 2, (py(y0) + py(y1)) / 2, 0.7], { type: 'component', id, label })
    area(120, 40, 490, 478, 'busbars', 'Battery busbars (BAT+ and BAT-)')
    area(490, 80, 695, 478, 'wcm', 'WCM (not used on this unit)')
    area(770, 340, 850, 480, 'ports-bms', 'Port block: Parallel A / BMS COMM')
    area(852, 340, 935, 480, 'ports-wifi', 'Port block: Parallel B / WiFi Port')
    area(936, 340, 1020, 480, 'ports-ct', 'Port block: Meter Port (not used) / CT1 & CT2')
    this.box(0.7, 1.0, 0.5, 0x1d4ed8, [BOX.x0 + 0.6, 3.0, 0.35], { rough: 0.5, metal: 0.1, round: 0.1 }) // CT clamp at the left edge

    // DIN rails
    const rail = new THREE.MeshStandardMaterial({ map: this.railTexture(), roughness: 0.4, metalness: 0.7 })
    for (const y of [-2.75, -5.15]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.62, 0.3), rail)
      r.position.set(3.2, y, 0.42)
      r.castShadow = true
      r.receiveShadow = true
      s.add(r)
    }

    // PV fuse holders (PV1+ ... PV4+, PV1- ... PV4-).
    const holderH = HOLDER.top - HOLDER.bottom
    for (let i = 0; i < 8; i++) {
      const x = pvX(i)
      const pick: Pick = { type: 'component', id: 'pv-fuses', label: 'PV fuse holders' }
      this.box(HOLDER.w, 0.56, 0.8, 0x2a2d32, [x, HOLDER.top - 0.28, 0.55], { rough: 0.55, pick })
      this.box(HOLDER.w, 0.34, 0.82, 0xe5e7eb, [x, bandY(562), 0.56], { rough: 0.7, pick })
      this.box(HOLDER.w, 1.0, 0.8, 0x0e0f11, [x, bandY(635), 0.56], { rough: 0.45, pick })
      this.box(HOLDER.w, 0.66, 0.8, 0xc9ccd1, [x, bandY(725), 0.55], { rough: 0.55, pick })
      const name = i < 4 ? `PV${i + 1}+` : `PV${i - 3}-`
      this.label(name, 0.54, 0.2, [x, bandY(562), 0.98], '#111827', null, 'bold 40px system-ui, sans-serif')
      const topScrew = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.5, metalness: 0.5 }))
      topScrew.position.set(x, bandY(510), 0.96)
      s.add(topScrew)
    }
    void holderH

    // Grid, generator and load terminal blocks.
    ;(['grid', 'gen', 'load'] as const).forEach((g, block) => {
      const x = (acX(block, 0) + acX(block, 2)) / 2
      const comp = `ac-${g}`
      const title = g === 'grid' ? 'Grid input terminals (L1, L2, N)' : g === 'gen' ? 'Generator terminals (L1, L2, N)' : 'Load output terminals (L1, L2, N)'
      const pick: Pick = { type: 'component', id: comp, label: title }
      this.box(BLOCK.w, BLOCK.top - BLOCK.bottom, 0.8, 0x9ea3aa, [x, (BLOCK.top + BLOCK.bottom) / 2, 0.55], { rough: 0.5, metal: 0.15, pick, round: 0.04 })
      for (let i = 0; i < 3; i++) {
        const tx = acX(block, i)
        this.box(0.34, 0.34, 0.1, 0x16181b, [tx, bandY(572), 0.97], { rough: 0.6, shadow: false })
        const decor = new THREE.Mesh(new THREE.CircleGeometry(0.13, 14), new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 0.4, metalness: 0.7 }))
        decor.position.set(tx, bandY(600), 0.97)
        s.add(decor)
        this.label(['L1', 'L2', 'N'][i], 0.3, 0.17, [tx, bandY(722), 0.97], '#111827', null, 'bold 40px system-ui, sans-serif')
      }
      this.label(g === 'grid' ? 'GRID' : g === 'gen' ? 'GEN' : 'LOAD', 0.9, 0.3, [x, BLOCK.top + 0.22, 0.97], '#111827', '#e5e7eb', 'bold 50px system-ui, sans-serif')
    })

    // EMS-C
    const ems: Pick = { type: 'component', id: 'emsc', label: 'EMS-C' }
    this.box(2.5, 4.7, 1.1, 0x08090a, [-6.9, -4.15, 0.6], { rough: 0.45, metal: 0.35, round: 0.12, pick: ems })
    this.box(0.5, 1.5, 0.05, 0xf3f4f6, [-8.0, -3.2, 1.18], { shadow: false })
    this.label('04001', 0.5, 0.18, [-8.0, -3.2, 1.22], '#111827', null, 'bold 40px system-ui, sans-serif').rotation.z = Math.PI / 2
    for (const [id, text] of [['ems_bat', 'BATTERY'], ['ems_eth', 'ETHERNET'], ['ems_cell', 'CELL'], ['ems_wifi', 'WIFI/BT']] as const) {
      const p = SOCKET_POS[id]
      if (id === 'ems_bat' || id === 'ems_eth') this.box(0.8, 0.42, 0.14, 0x7b8088, [p[0], p[1], 1.14], { metal: 0.6, rough: 0.35, shadow: false })
      else this.box(0.34, 0.34, 0.12, 0xb8860b, [p[0], p[1], 1.14], { metal: 0.9, rough: 0.3, shadow: false })
      this.label(text, 0.8, 0.18, [p[0], p[1] - 0.34, 1.2], '#9ca3af', null, 'bold 34px system-ui, sans-serif')
    }
    ;['STATUS', 'CELLULAR', 'BLUETOOTH', 'POWER'].forEach((t, i) => {
      const y = -5.0 - i * 0.38
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }))
      dot.position.set(-7.75, y, 1.18)
      s.add(dot)
      this.label(t, 0.9, 0.17, [-6.95, y, 1.18], '#cbd5e1', null, 'bold 34px system-ui, sans-serif')
    })

    // Invisible proxies so every socket can be probed.
    for (const sk of SOCKETS) {
      const p = SOCKET_POS[sk.id]
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
      proxy.position.set(p[0], p[1], p[2] + 0.1)
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
      const lug = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.1), standard(0xc9ced4, 0.3, 0.9))
      const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.1, 18), body)
      boot.position.set(0, -0.8, 0.0)
      g.add(lug, boot)
      radius = 0.27
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
      const lifted = lab.fasteners[at] === 'removed'
      if (c.part?.kind === 'battery') {
        c.plug.position.copy(sp).add(new THREE.Vector3(0, 0, 0.12 + (lifted ? 0.3 : 0)))
        c.plug.rotation.set(0, 0, 0)
      } else if (c.part?.kind === 'ethernet' && FROM_BELOW.has(at)) {
        c.plug.position.copy(sp).add(new THREE.Vector3(0, 0.05, 0))
        c.plug.rotation.set(Math.PI / 2, 0, 0)
      } else if (id === 'spare' && FROM_BELOW.has(at)) {
        c.plug.position.copy(sp).add(new THREE.Vector3(0, 0.05, 0))
        c.plug.rotation.set(Math.PI / 2, 0, 0)
      } else if (this.isVerticalPlug(c)) {
        c.plug.position.copy(sp).add(new THREE.Vector3(0, lifted ? -0.35 : -0.15, 0.05))
        c.plug.rotation.set(0, 0, 0)
      } else {
        c.plug.position.copy(sp).add(new THREE.Vector3(0, 0, 0.05))
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
      c.tag.visible = this.tags
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
    return this.isVerticalPlug(c) || (c.at && FROM_BELOW.has(c.at)) ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, 1)
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
      pts.push(new THREE.Vector3(start.x, start.y + 0.2, start.z - 1.3))
      if (isSpare) pts.push(new THREE.Vector3((start.x + end.x) / 2, BENCH_Y + 0.2, (start.z + end.z) / 2 + 0.8))
      else {
        // Out of the front of the lower cover, then across the bench. The part inside the cover is hidden by it.
        pts.push(new THREE.Vector3((start.x * 2 + end.x) / 3, BENCH_Y + 0.5, 5.9))
        pts.push(new THREE.Vector3((start.x + end.x * 2) / 3, BENCH_Y + 0.9, 4.2))
        pts.push(new THREE.Vector3(end.x, end.y - 1.0, end.z + 0.6))
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
      const head = new THREE.Mesh(new THREE.CylinderGeometry(boltR(sk.id, sk.kind), boltR(sk.id, sk.kind), 0.14, 20), standard(0xdfe3e8, 0.28, 0.9))
      head.rotation.x = Math.PI / 2
      const slot1 = new THREE.Mesh(new THREE.BoxGeometry(boltR(sk.id, sk.kind) * 1.5, boltR(sk.id, sk.kind) * 0.22, 0.03), standard(0x111827))
      const slot2 = slot1.clone()
      slot2.rotation.z = Math.PI / 2
      slot1.position.z = slot2.position.z = 0.07
      g.add(head, slot1, slot2)
      const big = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.3, boltR(sk.id, sk.kind)), 8, 8), new THREE.MeshBasicMaterial({ visible: false }))
      g.add(big)
      const home = v(boltPos(sk.id))
      g.position.copy(home)
      this.scene.add(g)
      this.mark(g, { type: 'bolt', id: sk.id, socket: sk.id, label: `${sk.group}: ${sk.label} bolt` })
      const hole = new THREE.Mesh(new THREE.CircleGeometry(boltR(sk.id, sk.kind) * 1.15, 20), new THREE.MeshBasicMaterial({ color: 0x050607 }))
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
