import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { installIntersectionObserver, setVisibility } from './motion-test-utils'

// The runtime is the lazy chunk: it owns the WebGL renderer, the mixer and every listener. Here
// three's WebGLRenderer is replaced by a recording fake (jsdom has no WebGL) and the GLTF loader
// hands back a small rig with the real bone names, so mixer, raycaster, look-at and disposal all
// run for real against three's own math.

const world = vi.hoisted(() => ({
  renderers: [] as Array<{
    domElement: HTMLCanvasElement
    render: ReturnType<typeof vi.fn>
    setPixelRatio: ReturnType<typeof vi.fn>
    setSize: ReturnType<typeof vi.fn>
    dispose: ReturnType<typeof vi.fn>
    forceContextLoss: ReturnType<typeof vi.fn>
    compileAsync: ReturnType<typeof vi.fn>
  }>,
  gltf: null as null | { scene: unknown; animations: unknown[] },
  loadError: null as null | Error,
  dracoPaths: [] as string[],
  dracoDispose: vi.fn(),
  loadedUrls: [] as string[],
}))

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>()
  class FakeRenderer {
    domElement = document.createElement('canvas')
    outputColorSpace = ''
    toneMapping = 0
    toneMappingExposure = 1
    render = vi.fn()
    setPixelRatio = vi.fn()
    setSize = vi.fn()
    setClearColor = vi.fn()
    compileAsync = vi.fn(async () => {})
    dispose = vi.fn()
    forceContextLoss = vi.fn()
    constructor() {
      world.renderers.push(this)
    }
  }
  class FakePMREMGenerator {
    fromScene = () => ({ texture: new actual.Texture(), dispose: vi.fn() })
    dispose = vi.fn()
  }
  return { ...actual, WebGLRenderer: FakeRenderer, PMREMGenerator: FakePMREMGenerator }
})

vi.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
  DRACOLoader: class {
    setDecoderPath(path: string) {
      world.dracoPaths.push(path)
      return this
    }
    setDecoderConfig() {
      return this
    }
    dispose = world.dracoDispose
  },
}))

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    setDRACOLoader() {
      return this
    }
    async loadAsync(url: string) {
      world.loadedUrls.push(url)
      if (world.loadError) throw world.loadError
      return world.gltf
    }
  },
}))

vi.mock('three/examples/jsm/environments/RoomEnvironment.js', async () => {
  const { Scene } = await import('three')
  return { RoomEnvironment: class extends Scene {} }
})

import {
  startSinoRuntime,
  type SinoFallbackReason,
  type SinoRuntime,
} from '@/components/mascot/sino-runtime'

type Rig = ReturnType<typeof buildRig>

/** A stand-in for sino.glb: the real bone names, a box body to hit, and clips that pin the head. */
function buildRig() {
  const scene = new THREE.Group()
  const head = new THREE.Bone()
  head.name = 'DEF-head'
  head.position.set(0, 0.9, 0)
  const eyeL = new THREE.Bone()
  eyeL.name = 'DEF-eyeL'
  const eyeR = new THREE.Bone()
  eyeR.name = 'DEF-eyeR'
  head.add(eyeL, eyeR)
  scene.add(head)

  const map = new THREE.Texture()
  const geometry = new THREE.BoxGeometry(0.4, 1, 0.4)
  const material = new THREE.MeshStandardMaterial({ map })
  const body = new THREE.Mesh(geometry, material)
  body.position.y = 0.6
  body.name = 'GEO-body'
  scene.add(body)

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial())
  face.name = 'GEO-head'
  face.position.set(0, 0.9, 0)
  // Three arrays, same order as the real morph dictionary; only the names matter here.
  face.morphTargetDictionary = { browInnerUp: 0, eyeBlinkLeft: 1, eyeBlinkRight: 2 }
  face.morphTargetInfluences = [0, 0, 0]
  scene.add(face)

  const clip = (name: string, duration: number) =>
    new THREE.AnimationClip(name, duration, [
      // Pins the head to identity every frame, exactly like the real clips lock all bones.
      new THREE.QuaternionKeyframeTrack(
        'DEF-head.quaternion',
        [0, duration],
        [0, 0, 0, 1, 0, 0, 0, 1],
      ),
    ])
  const animations = [
    clip('idle', 4),
    clip('idle_b', 4),
    clip('listening', 2),
    clip('thinking', 2),
    clip('speaking', 1.5),
    clip('greet_wave', 2),
    clip('happy_success', 1.5),
  ]
  return { scene, head, eyeL, eyeR, body, face, map, geometry, material, animations }
}

let frameQueue: Map<number, FrameRequestCallback>
let nextFrameId: number
let clock: number
let rig: Rig
let host: HTMLElement
let runtime: SinoRuntime | null
let callbacks: {
  onFirstFrame: Mock<() => void>
  onFallback: Mock<(reason: SinoFallbackReason) => void>
}
let observers: ReturnType<typeof installIntersectionObserver>
let cancelSpy: ReturnType<typeof vi.fn>

/** Run the queued animation frames once, advancing the fake clock by `stepMs` first. */
function pump(frames = 1, stepMs = 1000 / 60) {
  for (let i = 0; i < frames; i += 1) {
    clock += stepMs
    const due = [...frameQueue.entries()]
    frameQueue.clear()
    for (const [, cb] of due) cb(clock)
  }
}

function pointer(
  type: string,
  x: number,
  y: number,
  pointerType = 'mouse',
  target: EventTarget = window,
) {
  const event = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  target.dispatchEvent(event)
}

async function start() {
  runtime = await startSinoRuntime({
    host,
    onFirstFrame: callbacks.onFirstFrame,
    onFallback: callbacks.onFallback,
  })
  return runtime
}

const renderer = () => world.renderers.at(-1)!
const lastScene = () => renderer().render.mock.calls.at(-1)![0] as THREE.Scene
const rigGroup = () => lastScene().getObjectByName('sino-rig')!

beforeEach(() => {
  world.renderers.length = 0
  world.loadError = null
  world.dracoPaths.length = 0
  world.loadedUrls.length = 0
  world.dracoDispose.mockClear()
  rig = buildRig()
  world.gltf = { scene: rig.scene, animations: rig.animations }

  frameQueue = new Map()
  nextFrameId = 1
  clock = 1_000
  cancelSpy = vi.fn((id: number) => {
    frameQueue.delete(id)
  })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextFrameId++
    frameQueue.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', cancelSpy)
  vi.stubGlobal('devicePixelRatio', 3)
  window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia
  observers = installIntersectionObserver()
  setVisibility('visible')
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
  Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true, writable: true })
  // Most tests start from a session that already saw the greeting, so the hover rules are not
  // masked by the (uninterruptible) greeting wave.
  window.sessionStorage.clear()
  window.sessionStorage.setItem('sineva:once:sino-greet', '1')

  document.body.innerHTML = '<section id="hero"><div id="host"></div></section>'
  host = document.getElementById('host')!
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      // Like a real element, the box moves up as the page scrolls down.
      ({
        top: -window.scrollY,
        left: 0,
        bottom: 500 - window.scrollY,
        right: 500,
        width: 500,
        height: 500,
        x: 0,
        y: -window.scrollY,
      }) as DOMRect,
  )
  callbacks = { onFirstFrame: vi.fn(), onFallback: vi.fn() }
  runtime = null
})

afterEach(() => {
  runtime?.dispose()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('start', () => {
  it('creates one canvas inside the host, hidden until the first frame', async () => {
    await start()
    const canvases = host.querySelectorAll('canvas')
    expect(canvases).toHaveLength(1)
    expect(canvases[0]!.style.opacity).toBe('0')
    expect(canvases[0]!.getAttribute('aria-hidden')).toBe('true')
    expect(canvases[0]!.hasAttribute('tabindex')).toBe(false)
  })

  it('loads the GLB through DRACOLoader pointed at the self-hosted /draco/ folder', async () => {
    await start()
    expect(world.dracoPaths).toEqual(['/draco/'])
    expect(world.loadedUrls).toEqual(['/mascot/sino-v008.glb'])
  })

  it('greets once per session: greet_wave on the first canvas, idle straight away on the next', async () => {
    const played = () =>
      vi
        .mocked(THREE.AnimationAction.prototype.play)
        .mock.instances.map((a) => (a as unknown as { _clip: { name: string } })._clip.name)
    vi.spyOn(THREE.AnimationAction.prototype, 'play')
    window.sessionStorage.clear()
    const first = await start()
    pump(2)
    expect(played()).toEqual(['greet_wave'])
    first.dispose()
    vi.mocked(THREE.AnimationAction.prototype.play).mockClear()
    rig = buildRig()
    world.gltf = { scene: rig.scene, animations: rig.animations }
    runtime = null
    document.body.innerHTML = '<section><div id="host"></div></section>'
    host = document.getElementById('host')!
    runtime = await start()
    pump(2)
    expect(played()).toEqual(['idle'])
  })

  it('waves, not launches, on the first canvas even when the GLB still carries the jet clips', async () => {
    const played = () =>
      vi
        .mocked(THREE.AnimationAction.prototype.play)
        .mock.instances.map((a) => (a as unknown as { _clip: { name: string } })._clip.name)
    vi.spyOn(THREE.AnimationAction.prototype, 'play')
    for (const name of ['jet_launch', 'jet_hover', 'jet_land']) {
      rig.animations.push(
        new THREE.AnimationClip(name, 1, [
          new THREE.QuaternionKeyframeTrack(
            'DEF-head.quaternion',
            [0, 1],
            [0, 0, 0, 1, 0, 0, 0, 1],
          ),
        ]),
      )
    }
    window.sessionStorage.clear()
    await start()
    pump(2)
    expect(played()).toEqual(['greet_wave'])
  })

  it('caps the pixel ratio at 1.5 on a 3x screen', async () => {
    await start()
    expect(renderer().setPixelRatio).toHaveBeenCalledWith(1.5)
  })

  it('compiles the shaders off the main thread before the first frame', async () => {
    await start()
    expect(renderer().compileAsync).toHaveBeenCalledTimes(1)
    const [scene, camera] = renderer().compileAsync.mock.calls[0] as unknown[]
    expect(scene).toBeInstanceOf(THREE.Scene)
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera)
    // Nothing has been drawn yet: compiling is done by the time start() resolves.
    expect(renderer().render).not.toHaveBeenCalled()
  })

  it('reveals the canvas and reports the first frame once, after it has drawn', async () => {
    await start()
    expect(callbacks.onFirstFrame).not.toHaveBeenCalled()
    pump(1)
    expect(renderer().render).toHaveBeenCalled()
    expect(callbacks.onFirstFrame).toHaveBeenCalledTimes(1)
    expect(host.querySelector('canvas')!.style.opacity).toBe('1')
    pump(5)
    expect(callbacks.onFirstFrame).toHaveBeenCalledTimes(1)
  })

  it('frames the model like the poster: 32 degree vertical FOV from the 3/4 hero camera', async () => {
    await start()
    pump(1)
    const camera = renderer().render.mock.calls.at(-1)![1] as THREE.PerspectiveCamera
    expect(camera.fov).toBe(32)
    expect(camera.position.x).toBeCloseTo(1.3202, 4)
    expect(camera.position.y).toBeCloseTo(0.55, 4)
    expect(camera.position.z).toBeCloseTo(1.8854, 4)
    expect(camera.aspect).toBe(1)
  })

  it('rejects before any WebGL context exists when the GLB request fails', async () => {
    world.loadError = new Error('GLB 404')
    await expect(start()).rejects.toThrow('GLB 404')
    expect(host.querySelector('canvas')).toBeNull()
    expect(world.renderers).toHaveLength(0)
    expect(world.dracoDispose).toHaveBeenCalled()
    expect(frameQueue.size).toBe(0)
  })
})

describe('dispose (full cleanup on unmount)', () => {
  it('disposes renderer, geometries, materials and textures, and removes the canvas', async () => {
    const geometryDispose = vi.spyOn(rig.geometry, 'dispose')
    const materialDispose = vi.spyOn(rig.material, 'dispose')
    const textureDispose = vi.spyOn(rig.map, 'dispose')
    const r = await start()
    pump(2)
    r.dispose()
    expect(geometryDispose).toHaveBeenCalled()
    expect(materialDispose).toHaveBeenCalled()
    expect(textureDispose).toHaveBeenCalled()
    expect(renderer().dispose).toHaveBeenCalled()
    expect(renderer().forceContextLoss).toHaveBeenCalled()
    expect(world.dracoDispose).toHaveBeenCalled()
    expect(host.querySelector('canvas')).toBeNull()
  })

  it('leaves no animation frame running', async () => {
    const r = await start()
    pump(3)
    expect(frameQueue.size).toBe(1)
    r.dispose()
    expect(cancelSpy).toHaveBeenCalled()
    expect(frameQueue.size).toBe(0)
    const renders = renderer().render.mock.calls.length
    pump(5)
    expect(renderer().render.mock.calls.length).toBe(renders)
  })

  it('disconnects its observers and removes its window and document listeners', async () => {
    const addWindow = vi.spyOn(window, 'addEventListener')
    const removeWindow = vi.spyOn(window, 'removeEventListener')
    const addDocument = vi.spyOn(document, 'addEventListener')
    const removeDocument = vi.spyOn(document, 'removeEventListener')
    const r = await start()
    expect(observers.liveObserverCount()).toBeGreaterThan(0)
    r.dispose()
    expect(observers.liveObserverCount()).toBe(0)
    const names = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.map((c) => c[0]).sort()
    expect(names(removeWindow)).toEqual(names(addWindow))
    expect(names(removeDocument)).toEqual(names(addDocument))
  })

  it('is idempotent', async () => {
    const r = await start()
    r.dispose()
    r.dispose()
    expect(renderer().dispose).toHaveBeenCalledTimes(1)
  })

  it('does not report a fallback for a normal dispose', async () => {
    const r = await start()
    pump(2)
    r.dispose()
    expect(callbacks.onFallback).not.toHaveBeenCalled()
  })
})

describe('fallback to the poster', () => {
  it('falls back and cleans up when the WebGL context is lost', async () => {
    await start()
    pump(2)
    const canvas = host.querySelector('canvas')!
    const event = new Event('webglcontextlost', { cancelable: true })
    canvas.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(callbacks.onFallback).toHaveBeenCalledWith('context-lost')
    expect(host.querySelector('canvas')).toBeNull()
    expect(renderer().dispose).toHaveBeenCalled()
    expect(frameQueue.size).toBe(0)
  })

  it('drops the pixel ratio to 1 when the first 60 frames average under 45 fps', async () => {
    await start()
    pump(80, 1000 / 40)
    expect(renderer().setPixelRatio).toHaveBeenLastCalledWith(1)
    expect(callbacks.onFallback).not.toHaveBeenCalled()
  })

  it('falls back to the poster when the first 60 frames average under 30 fps', async () => {
    await start()
    pump(80, 1000 / 20)
    expect(callbacks.onFallback).toHaveBeenCalledWith('fps')
    expect(host.querySelector('canvas')).toBeNull()
  })

  it('keeps pixel ratio 1.5 on a healthy 60 fps device', async () => {
    await start()
    pump(80)
    expect(renderer().setPixelRatio).toHaveBeenCalledTimes(1)
    expect(callbacks.onFallback).not.toHaveBeenCalled()
  })
})

describe('pausing', () => {
  it('stops requesting frames while the tab is hidden and resumes when it is visible', async () => {
    await start()
    pump(3)
    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    pump(2)
    const paused = renderer().render.mock.calls.length
    pump(5)
    expect(renderer().render.mock.calls.length).toBe(paused)
    expect(frameQueue.size).toBe(0)
    setVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    pump(2)
    expect(renderer().render.mock.calls.length).toBeGreaterThan(paused)
  })

  it('stops rendering when the hero leaves the viewport and resumes on re-entry', async () => {
    await start()
    pump(3)
    observers.fire(host, { isIntersecting: false, intersectionRatio: 0 })
    pump(2)
    const paused = renderer().render.mock.calls.length
    pump(5)
    expect(renderer().render.mock.calls.length).toBe(paused)
    observers.fire(host, { isIntersecting: true, intersectionRatio: 1 })
    pump(2)
    expect(renderer().render.mock.calls.length).toBeGreaterThan(paused)
  })

  it('resumes with the idle clip after the hero comes back', async () => {
    const play = vi.spyOn(THREE.AnimationAction.prototype, 'play')
    await start()
    pump(3)
    observers.fire(host, { isIntersecting: false, intersectionRatio: 0 })
    play.mockClear()
    observers.fire(host, { isIntersecting: true, intersectionRatio: 1 })
    expect(play).toHaveBeenCalled()
    expect(play.mock.instances.at(-1)).toMatchObject({ _clip: { name: 'idle' } })
  })
})

describe('look-at (applied after mixer.update)', () => {
  it('turns the head toward the pointer even though the clip pins the head every frame', async () => {
    await start()
    pump(2)
    expect(rig.head.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(0.001)
    pointer('pointermove', 480, 250)
    pump(120)
    expect(rig.head.quaternion.angleTo(new THREE.Quaternion())).toBeGreaterThan(0.05)
  })

  it('looks the opposite way for a pointer on the other side', async () => {
    await start()
    pointer('pointermove', 20, 250)
    pump(120)
    const left = rig.head.quaternion.clone()
    pointer('pointermove', 480, 250)
    pump(240)
    const right = rig.head.quaternion.clone()
    expect(left.angleTo(right)).toBeGreaterThan(0.1)
  })

  it('never exceeds 25 degrees of yaw and 15 degrees of pitch', async () => {
    await start()
    pointer('pointermove', 100_000, -100_000)
    pump(400)
    const euler = new THREE.Euler().setFromQuaternion(rig.head.quaternion, 'YXZ')
    expect(Math.abs(euler.y)).toBeLessThanOrEqual((25 * Math.PI) / 180 + 1e-3)
    expect(Math.abs(euler.x)).toBeLessThanOrEqual((15 * Math.PI) / 180 + 1e-3)
  })

  it('moves the eyes by an extra 0.6 of the head angle', async () => {
    await start()
    pointer('pointermove', 480, 250)
    pump(240)
    const head = new THREE.Euler().setFromQuaternion(rig.head.quaternion, 'YXZ')
    const eyes = new THREE.Euler().setFromQuaternion(rig.eyeL.quaternion, 'YXZ')
    expect(Math.abs(eyes.y)).toBeGreaterThan(0)
    expect(Math.abs(eyes.y) / Math.abs(head.y)).toBeCloseTo(0.6, 1)
  })

  it('returns to the front after 4 s without pointer movement', async () => {
    await start()
    pointer('pointermove', 480, 100)
    pump(60)
    expect(rig.head.quaternion.angleTo(new THREE.Quaternion())).toBeGreaterThan(0.05)
    // 5 s of stillness at 60 fps, off the model.
    pump(60 * 9)
    expect(rig.head.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(0.02)
  })

  it('ignores touch pointers: no look-at on touch devices', async () => {
    await start()
    pointer('pointermove', 480, 250, 'touch')
    pump(120)
    expect(rig.head.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(0.001)
  })
})

describe('hover on the model (raycast, not the canvas box)', () => {
  it('shows the pointer cursor only while over a mesh', async () => {
    await start()
    pump(2)
    const canvas = host.querySelector('canvas')!
    pointer('pointermove', 250, 250)
    pump(3)
    expect(canvas.style.cursor).toBe('pointer')
    pointer('pointermove', 4, 4)
    pump(3)
    expect(canvas.style.cursor).toBe('')
  })

  it('plays the reaction clip within 100 ms of entering the model', async () => {
    const play = vi.spyOn(THREE.AnimationAction.prototype, 'play')
    await start()
    pump(3)
    play.mockClear()
    pointer('pointermove', 250, 250)
    pump(1)
    pump(5)
    // 6 frames at 60 fps is 100 ms.
    const names = play.mock.instances.map(
      (a) => (a as unknown as { _clip: { name: string } })._clip.name,
    )
    expect(names).toContain('greet_wave')
  })

  it('raises the brow morph on both face meshes during the reaction', async () => {
    await start()
    pump(3)
    pointer('pointermove', 250, 250)
    pump(20)
    expect(rig.face.morphTargetInfluences![0]).toBeGreaterThan(0.05)
    pump(120)
    expect(rig.face.morphTargetInfluences![0]).toBeLessThan(0.01)
  })

  it('does not react to a pointer that is not over the model', async () => {
    const play = vi.spyOn(THREE.AnimationAction.prototype, 'play')
    await start()
    pump(3)
    play.mockClear()
    pointer('pointermove', 4, 4)
    pump(10)
    expect(play).not.toHaveBeenCalled()
  })

  it('plays happy_success when the model is clicked', async () => {
    const play = vi.spyOn(THREE.AnimationAction.prototype, 'play')
    await start()
    pump(3)
    play.mockClear()
    pointer('pointermove', 250, 250)
    pump(3)
    pointer('click', 250, 250, 'mouse', host.querySelector('canvas')!)
    const names = play.mock.instances.map(
      (a) => (a as unknown as { _clip: { name: string } })._clip.name,
    )
    expect(names).toContain('happy_success')
  })

  it('ignores a click on the canvas box outside the model', async () => {
    const play = vi.spyOn(THREE.AnimationAction.prototype, 'play')
    await start()
    pump(3)
    play.mockClear()
    pointer('click', 4, 4, 'mouse', host.querySelector('canvas')!)
    expect(play).not.toHaveBeenCalled()
  })

  it('greets on a touch tap on the model', async () => {
    const play = vi.spyOn(THREE.AnimationAction.prototype, 'play')
    await start()
    pump(3)
    play.mockClear()
    pointer('click', 250, 250, 'touch', host.querySelector('canvas')!)
    const names = play.mock.instances.map(
      (a) => (a as unknown as { _clip: { name: string } })._clip.name,
    )
    expect(names).toContain('greet_wave')
  })
})

describe('CTA hover', () => {
  it('plays listening while the hero CTA is hovered', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="hero-cta"><a href="/contact" id="cta-link">Book</a></div>',
    )
    const play = vi.spyOn(THREE.AnimationAction.prototype, 'play')
    await start()
    pump(3)
    play.mockClear()
    pointer('pointerover', 10, 10, 'mouse', document.getElementById('cta-link')!)
    const names = play.mock.instances.map(
      (a) => (a as unknown as { _clip: { name: string } })._clip.name,
    )
    expect(names).toContain('listening')
  })
})

describe('scroll-linked rig', () => {
  it('rotates the rig toward 20 degrees as the hero scrolls out, smoothed rather than snapped', async () => {
    await start()
    pump(2)
    expect(rigGroup().rotation.y).toBeCloseTo(0, 6)
    window.scrollY = 500
    window.dispatchEvent(new Event('scroll'))
    pump(1)
    const first = Math.abs(rigGroup().rotation.y)
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan((20 * Math.PI) / 180 / 2)
    pump(300)
    expect(Math.abs(rigGroup().rotation.y)).toBeCloseTo((20 * Math.PI) / 180, 2)
  })

  it('lags the rig 15% behind the scroll (0.85x parallax) by moving it down', async () => {
    await start()
    window.scrollY = 250
    window.dispatchEvent(new Event('scroll'))
    pump(300)
    expect(rigGroup().position.y).toBeLessThan(0)
  })

  it('never pushes the feet below the canvas: the parallax stops at the free space under them', async () => {
    await start()
    pump(2)
    // At full scroll the 0.85x lag wants 75 px on this 500 px canvas, but the box's lowest corner
    // leaves only about 30 px, and anything lower would be cropped flat by the canvas edge.
    window.scrollY = 500
    window.dispatchEvent(new Event('scroll'))
    pump(400)
    const camera = renderer().render.mock.calls.at(-1)![1] as THREE.PerspectiveCamera
    // Real vertices of the (rotated) body, not its bounding box.
    const positions = rig.body.geometry.getAttribute('position')
    let bottomPx = 0
    for (let i = 0; i < positions.count; i += 1) {
      const ndc = new THREE.Vector3()
        .fromBufferAttribute(positions, i)
        .applyMatrix4(rig.body.matrixWorld)
        .project(camera)
      bottomPx = Math.max(bottomPx, ((1 - ndc.y) / 2) * 500)
    }
    expect(bottomPx).toBeLessThanOrEqual(500.5)
    expect(rigGroup().position.y).toBeLessThan(-0.05)
  })

  it('tips the head 8 degrees at full scroll with no pointer', async () => {
    await start()
    window.scrollY = 500
    window.dispatchEvent(new Event('scroll'))
    pump(300)
    expect(rig.head.quaternion.angleTo(new THREE.Quaternion())).toBeCloseTo((8 * Math.PI) / 180, 1)
  })

  it('touches only transforms: the host and canvas styles do not change with scroll', async () => {
    await start()
    pump(2)
    const before = host.outerHTML
    window.scrollY = 400
    window.dispatchEvent(new Event('scroll'))
    pump(60)
    expect(host.outerHTML).toBe(before)
  })

  it('raises the whoa reaction on a fast flick, at most once per 3 s', async () => {
    await start()
    pump(3)
    // 600 px in one 16 ms frame is far above the spike threshold.
    window.scrollY = 600
    window.dispatchEvent(new Event('scroll'))
    pump(1)
    pump(4)
    expect(rig.face.morphTargetInfluences![0]).toBeGreaterThan(0.05)
    pump(60)
    expect(rig.face.morphTargetInfluences![0]).toBeLessThan(0.01)
    // Second flick 1 s later is inside the cooldown.
    window.scrollY = 0
    window.dispatchEvent(new Event('scroll'))
    pump(1)
    pump(4)
    expect(rig.face.morphTargetInfluences![0]).toBeLessThan(0.01)
  })
})
