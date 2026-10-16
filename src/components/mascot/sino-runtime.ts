import {
  AnimationAction,
  AnimationMixer,
  Box3,
  Color,
  DirectionalLight,
  Euler,
  Group,
  LoopOnce,
  LoopRepeat,
  Mesh,
  Object3D,
  PMREMGenerator,
  PerspectiveCamera,
  Plane,
  Quaternion,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createJetEffects } from './sino-jet-effects'
import { SINO_LOOK } from './sino-look'
import { claimSessionOnce } from '@/lib/motion/session'
import { observeVisibility } from '@/lib/motion/in-view'
import {
  LOOK_LERP,
  createFpsProbe,
  dampFactor,
  degToRad,
  headFollowAngles,
  heroScrollProgress,
  isScrollSpike,
  parallaxOffsetPx,
  reactionEnvelope,
  swayAngle,
  SCROLL_LIMITS,
} from './sino-math'
import {
  createSinoMachine,
  type SinoClip,
  type SinoCommand,
  type SinoMachine,
} from './sino-state-machine'

// The realtime Sino. This whole module (and three.js with it) is the lazy chunk: sino-hero.tsx
// imports it with a dynamic import() only after the loading gate passed, so nothing here may be
// imported from code that ships in the first bundle. See docs/design/mascot-sino.md sections 2-5.

export type SinoFallbackReason = 'fps' | 'context-lost'

export type SinoRuntimeOptions = {
  /** Element the canvas is created in. It must be positioned and have the poster's size. */
  host: HTMLElement
  /** Called once, after the first frame has been drawn into the (still transparent) canvas. */
  onFirstFrame: () => void
  /** The runtime has already torn itself down; the poster must take over again. */
  onFallback: (reason: SinoFallbackReason) => void
  glbUrl?: string
  dracoPath?: string
  /** Elements whose hover makes Sino listen (the hero CTAs). */
  ctaSelector?: string
}

export type SinoRuntime = { dispose: () => void }

const DEFAULT_GLB = '/mascot/sino-v006.glb'
const DEFAULT_DRACO = '/draco/'
// Both hero CTAs: components.md renders them inside the element HeroSplit gives the id `hero-cta`.
const DEFAULT_CTA = '#hero-cta a, #hero-cta button'
const FORM_FIELD = 'input, textarea, select'

// Camera of the poster render (sino-3d-mascot export/renders/web_assets/raw/framing.json,
// "sino-hero", three_js block). The canvas reuses it so the realtime model lands on the poster
// and the 300 ms crossfade is a swap, not a jump.
const HERO_CAMERA = {
  position: [1.3202, 0.55, 1.8854],
  target: [0, 0.55, 0],
  verticalFovDeg: 32,
} as const

const MAX_DPR = 1.5
const MAX_DT_S = 0.1
const REMEASURE_MS = 500
const CAST_MOVED_MS = 30
const CAST_IDLE_MS = 100
const REACTION_S = 0.8
const REACTION_BROW = 0.6
const REACTION_TILT_RAD = degToRad(6)
const WHOA_BROW = 0.5
const WHOA_S = 0.6
const SCROLL_LERP = 0.1
const WEIGHT_LERP = 0.08
const FADE_MS = 300

type Measure = {
  docTop: number
  docLeft: number
  width: number
  height: number
  heroDocTop: number
  heroHeight: number
}

type BrowMorph = { influences: number[]; index: number }

/** Ends the current task so the browser can handle input and paint before the next heavy step. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

const isTouch = (event: Event) => (event as PointerEvent).pointerType === 'touch'

export async function startSinoRuntime(options: SinoRuntimeOptions): Promise<SinoRuntime> {
  const {
    host,
    onFirstFrame,
    onFallback,
    glbUrl = DEFAULT_GLB,
    dracoPath = DEFAULT_DRACO,
    ctaSelector = DEFAULT_CTA,
  } = options

  // 1. Fetch and decode first. A failed or slow GLB then costs no WebGL context, and the
  // caller's catch keeps the poster without anything to clean up beyond the decoder workers.
  const draco = new DRACOLoader().setDecoderPath(dracoPath)
  const loader = new GLTFLoader().setDRACOLoader(draco)
  let gltf: Awaited<ReturnType<GLTFLoader['loadAsync']>>
  try {
    gltf = await loader.loadAsync(glbUrl)
  } catch (error) {
    draco.dispose()
    throw error
  }
  // The decoder workers are only needed while decoding; a later dispose() would otherwise leave
  // four idle workers alive for the life of the page.
  draco.dispose()

  const model = gltf.scene
  const win = window

  // Parsing the glTF was one long task; give input and paint a turn before the GPU setup starts.
  await yieldToMain()

  // 2. Renderer. Alpha so the stage glow shows through; premultiplied alpha is the default and
  // matches the poster's transparent edges.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setClearColor(new Color(0x000000), 0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = SINO_LOOK.toneMapping
  renderer.toneMappingExposure = SINO_LOOK.exposure
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    // Hidden until the first frame is drawn; the opacity transition is the 300 ms crossfade.
    opacity: '0',
    transition: `opacity ${FADE_MS}ms var(--ease-out)`,
  })
  host.appendChild(canvas)

  // 3. Scene. No shadow map (mascot-sino.md section 3): the contact shadow is CSS under the feet.
  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envTarget = pmrem.fromScene(room, 0.04)
  room.dispose?.()
  scene.environment = envTarget.texture
  scene.environmentIntensity = SINO_LOOK.environmentIntensity

  const key = new DirectionalLight(SINO_LOOK.key.color, SINO_LOOK.key.intensity)
  key.position.set(...SINO_LOOK.key.position)
  // Teal rim light so the pale silhouette separates from the white page (mascot-sino.md section 4).
  const rim = new DirectionalLight(SINO_LOOK.rim.color, SINO_LOOK.rim.intensity)
  rim.position.set(...SINO_LOOK.rim.position)
  scene.add(key, rim)

  const rig = new Group()
  rig.name = 'sino-rig'
  rig.add(model)
  scene.add(rig)
  const jetEffects = createJetEffects(model, scene)
  const rootBone = model.getObjectByName('DEF-root')
  const rootPosition = new Vector3()
  let rootOverlayApplied = false

  const camera = new PerspectiveCamera(HERO_CAMERA.verticalFovDeg, 1, 0.1, 20)
  camera.position.set(...HERO_CAMERA.position)
  const cameraTarget = new Vector3(...HERO_CAMERA.target)
  camera.lookAt(cameraTarget)
  // Raycasting reads camera.matrixWorld, which three only refreshes inside render(); the first
  // pointer event can arrive before the first frame.
  camera.updateMatrixWorld()
  const cameraDistance = camera.position.distanceTo(cameraTarget)

  // 4. Rig parts. Bone names are the three.js form of the Blender names (`.` is stripped).
  const head = model.getObjectByName('DEF-head') ?? null
  const eyes = ['DEF-eyeL', 'DEF-eyeR']
    .map((name) => model.getObjectByName(name))
    .filter((bone): bone is Object3D => bone != null)
  // Both face meshes carry the brow morphs (GEO-head and GEO-web_face_detail); drive every one.
  const brows: { inner: BrowMorph[]; outer: BrowMorph[] } = { inner: [], outer: [] }
  const meshes: Mesh[] = []
  model.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    meshes.push(mesh)
    const dictionary = mesh.morphTargetDictionary
    const influences = mesh.morphTargetInfluences
    if (!dictionary || !influences) return
    if (dictionary.browInnerUp !== undefined) {
      brows.inner.push({ influences, index: dictionary.browInnerUp })
    }
    for (const side of ['browOuterUpLeft', 'browOuterUpRight']) {
      if (dictionary[side] !== undefined) brows.outer.push({ influences, index: dictionary[side] })
    }
  })

  // 5. Animation.
  const mixer = new AnimationMixer(model)
  const actions = new Map<string, AnimationAction>()
  for (const clip of gltf.animations) actions.set(clip.name, mixer.clipAction(clip))
  let current: AnimationAction | null = null

  // Frame-level state shared by the machine's command handler and the loop.
  let frameSeconds = 0
  let running = true
  let disposed = false
  let firstFrameDone = false
  let firstShown = false
  let rafId: number | null = null
  const effectStart = { reaction: -Infinity, whoa: -Infinity }

  function playCommand(command: Extract<SinoCommand, { type: 'play' }>) {
    const next = actions.get(command.clip) ?? actions.get('idle')
    if (!next) return
    next.reset()
    next.enabled = true
    next.setLoop(command.loop ? LoopRepeat : LoopOnce, Infinity)
    // A one-shot holds its last pose while it fades out instead of snapping to the bind pose.
    next.clampWhenFinished = !command.loop
    next.setEffectiveTimeScale(command.timeScale)
    next.setEffectiveWeight(1)
    next.play()
    if (current && current !== next) current.crossFadeTo(next, command.fadeS, false)
    current = next
  }

  const machine: SinoMachine = createSinoMachine({
    send(command) {
      if (command.type === 'play') playCommand(command)
      else if (command.type === 'effect') effectStart[command.effect] = frameSeconds
      else setRunning(command.active)
    },
    claimGreeting: () => claimSessionOnce('sino-greet'),
    hasClip: (name) => actions.has(name),
  })

  mixer.addEventListener('finished', (event) => {
    machine.dispatch({ type: 'clipFinished', clip: event.action.getClip().name as SinoClip })
  })
  mixer.addEventListener('loop', (event) => {
    const name = event.action.getClip().name
    if (name === 'idle' || name === 'idle_b') machine.dispatch({ type: 'idleCycle' })
  })

  // 6. Geometry of the host and the hero, in document coordinates so a scroll does not need a new
  // layout read. Re-measured on resize and every REMEASURE_MS to absorb layout shifts above.
  const heroEl = host.closest('section') ?? host
  let measure: Measure = {
    docTop: 0,
    docLeft: 0,
    width: 0,
    height: 0,
    heroDocTop: 0,
    heroHeight: 0,
  }
  let appliedPixelRatio = Math.min(win.devicePixelRatio || 1, MAX_DPR)
  let lastMeasureAt = -Infinity

  function measureNow(now: number) {
    lastMeasureAt = now
    const rect = host.getBoundingClientRect()
    const heroRect = heroEl.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))
    const sizeChanged = width !== measure.width || height !== measure.height
    measure = {
      docTop: rect.top + win.scrollY,
      docLeft: rect.left + win.scrollX,
      width,
      height,
      heroDocTop: heroRect.top + win.scrollY,
      heroHeight: heroRect.height,
    }
    if (sizeChanged) {
      applySize()
      measureFeetMargin()
    }
  }

  // Free space between the lowest point of the model and the canvas edge, in CSS px. The parallax
  // pushes the rig down, and the canvas edge crops it flat; the push stops at this margin. A taller
  // canvas slot (headroom under the stage) therefore buys more parallax with no code change.
  // Measured at the rest pose and at both extremes of the scroll rotation, because turning the
  // model swings its near boot lower on screen; the smallest margin wins.
  let feetMarginPx = 0
  const bounds = new Box3()
  const corner = new Vector3()
  function measureFeetMargin() {
    rig.position.y = 0
    camera.updateMatrixWorld()
    let margin = Infinity
    for (const yaw of [-SCROLL_LIMITS.rotationRad, 0, SCROLL_LIMITS.rotationRad]) {
      rig.rotation.set(0, yaw, 0)
      rig.updateMatrixWorld(true)
      bounds.setFromObject(model)
      let lowest = 0
      for (const x of [bounds.min.x, bounds.max.x]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          corner.set(x, bounds.min.y, z).project(camera)
          lowest = Math.max(lowest, ((1 - corner.y) / 2) * measure.height)
        }
      }
      margin = Math.min(margin, measure.height - lowest)
    }
    rig.rotation.set(0, 0, 0)
    feetMarginPx = Math.max(0, margin)
  }

  function applySize() {
    renderer.setPixelRatio(appliedPixelRatio)
    renderer.setSize(measure.width, measure.height, false)
    const aspect = measure.width / measure.height
    camera.aspect = aspect
    // The framing is tuned for a square stage. In a narrower box keep the horizontal field of
    // view instead, otherwise the model would be cropped at the sides.
    const vertical = HERO_CAMERA.verticalFovDeg
    camera.fov =
      aspect >= 1
        ? vertical
        : (2 * Math.atan(Math.tan(degToRad(vertical) / 2) / aspect) * 180) / Math.PI
    camera.updateProjectionMatrix()
  }

  // 7. Pointer. Touch is ignored for look-at and hover: no cursor exists, and a finger drag is a
  // scroll. A tap is handled separately on `click`.
  const pointer = { x: 0, y: 0, known: false, dirty: false }
  let hovering = false
  let lastCastAt = -Infinity
  const raycaster = new Raycaster()
  const ndc = new Vector2()

  function castAt(clientX: number, clientY: number): boolean {
    const x = clientX - (measure.docLeft - win.scrollX)
    const y = clientY - (measure.docTop - win.scrollY)
    if (x < 0 || y < 0 || x > measure.width || y > measure.height) return false
    ndc.set((x / measure.width) * 2 - 1, -((y / measure.height) * 2 - 1))
    raycaster.setFromCamera(ndc, camera)
    return raycaster.intersectObjects(meshes, false).length > 0
  }

  const onPointerMove = (event: Event) => {
    if (isTouch(event)) return
    const { clientX, clientY } = event as PointerEvent
    pointer.x = clientX
    pointer.y = clientY
    pointer.known = true
    pointer.dirty = true
    machine.dispatch({ type: 'pointerMove' })
  }
  const onPointerGone = () => {
    pointer.known = false
    pointer.dirty = false
    setHover(false)
  }

  function setHover(next: boolean) {
    if (next === hovering) return
    hovering = next
    canvas.style.cursor = next ? 'pointer' : ''
    machine.dispatch({ type: next ? 'pointerEnterModel' : 'pointerLeaveModel' })
  }

  const onClick = (event: MouseEvent) => {
    if (!machine.view(performance.now()).airborne && !castAt(event.clientX, event.clientY)) return
    machine.dispatch({ type: isTouch(event) ? 'tap' : 'clickModel' })
  }

  const inCta = (target: EventTarget | null) =>
    target instanceof Element && target.closest(ctaSelector) !== null
  const onOver = (event: Event) => {
    if (!isTouch(event) && inCta(event.target)) machine.dispatch({ type: 'ctaHover', active: true })
  }
  const onOut = (event: Event) => {
    const related = (event as PointerEvent).relatedTarget
    if (inCta(event.target) && !inCta(related))
      machine.dispatch({ type: 'ctaHover', active: false })
  }
  const inField = (target: EventTarget | null) =>
    target instanceof Element && target.closest(FORM_FIELD) !== null
  const onFocusIn = (event: Event) => {
    if (inField(event.target)) machine.dispatch({ type: 'formFocus', active: true })
  }
  const onFocusOut = (event: Event) => {
    if (inField(event.target)) machine.dispatch({ type: 'formFocus', active: false })
  }

  // 8. Pause rules: a hidden tab and a hero out of the viewport both stop the loop, and both go
  // through the machine so Sino resumes on idle instead of mid-gesture.
  let tabVisible = document.visibilityState !== 'hidden'
  let heroVisible = true
  function syncPause() {
    const shouldRun = tabVisible && heroVisible
    machine.dispatch({ type: shouldRun ? 'heroIn' : 'heroOut' })
  }
  const onVisibility = () => {
    tabVisible = document.visibilityState !== 'hidden'
    syncPause()
  }
  const stopObservingVisibility = observeVisibility(host, (visible) => {
    heroVisible = visible
    syncPause()
  })

  function setRunning(next: boolean) {
    if (next === running || disposed) return
    running = next
    if (!running) {
      if (rafId !== null) win.cancelAnimationFrame(rafId)
      rafId = null
      return
    }
    // Do not count the time spent paused as one huge frame.
    lastFrameMs = -1
    fps.rebase()
    rafId = win.requestAnimationFrame(tick)
  }

  // 9. Resize.
  let resizeObserver: ResizeObserver | null = null
  const onResize = () => measureNow(performance.now())

  // 10. The loop.
  const fps = createFpsProbe()
  let lastFrameMs = -1
  let lastScrollY = win.scrollY
  let smoothRotation = 0
  let smoothPitch = 0
  let smoothParallaxPx = 0
  let lookWeight = 0
  let lookYaw = 0
  let lookPitch = 0

  const headWorld = new Vector3()
  const target = new Vector3()
  const forward = new Vector3()
  const planePoint = new Vector3()
  const plane = new Plane()
  const qRig = new Quaternion()
  const qParent = new Quaternion()
  const qConj = new Quaternion()
  const qDelta = new Quaternion()
  const euler = new Euler(0, 0, 0, 'YXZ')

  /**
   * Rotate `bone` by a rotation given in the rig's own frame (yaw about the rig's up, pitch about
   * its right). The bones' local axes are whatever the Blender rig exported, so the delta is
   * converted into the parent's space instead of guessed per axis:
   *   world delta = R * d * R^-1, local delta = P^-1 * world delta * P, bone = local delta * bone
   * where R is the rig's world rotation and P the bone parent's.
   *
   * It is a pre-multiplication on the pose the mixer just wrote; the caller saves the bone first
   * and `restoreOverlay` undoes it next frame, so it never compounds.
   */
  function rotateInRigFrame(bone: Object3D, yaw: number, pitchDown: number, roll: number) {
    if (!bone.parent) return
    euler.set(pitchDown, yaw, roll, 'YXZ')
    qDelta.setFromEuler(euler)
    rig.getWorldQuaternion(qRig)
    bone.parent.getWorldQuaternion(qParent)
    qConj.copy(qParent).invert().multiply(qRig)
    qDelta.premultiply(qConj).multiply(qConj.invert())
    bone.quaternion.premultiply(qDelta)
  }

  function lookAngles(): { yaw: number; pitch: number } | null {
    if (!pointer.known || !head) return null
    const px = pointer.x - (measure.docLeft - win.scrollX)
    const py = pointer.y - (measure.docTop - win.scrollY)
    ndc.set((px / measure.width) * 2 - 1, -((py / measure.height) * 2 - 1))
    raycaster.setFromCamera(ndc, camera)
    head.getWorldPosition(headWorld)
    // Aim at the pointer's ray, on a plane in front of the head (toward the viewer), so a pointer
    // over the head means "look at me" and not "look straight ahead".
    camera.getWorldDirection(forward)
    planePoint.copy(headWorld).addScaledVector(forward, -1)
    plane.setFromNormalAndCoplanarPoint(forward, planePoint)
    if (!raycaster.ray.intersectPlane(plane, target)) return null
    target.sub(headWorld)
    rig.getWorldQuaternion(qRig)
    target.applyQuaternion(qRig.invert())
    return {
      yaw: Math.atan2(target.x, target.z),
      pitch: Math.atan2(target.y, Math.hypot(target.x, target.z)),
    }
  }

  // What the mixer left in the bones and morphs before this frame's overlay, put back at the start
  // of the next frame. Without it an overlay on a property no clip keys would compound every frame
  // (a brow that never comes down, a head that keeps turning).
  const savedBones: Array<{ bone: Object3D; quaternion: Quaternion }> = []
  const savedMorphs: Array<{ influences: number[]; index: number; value: number }> = []

  function restoreOverlay() {
    for (const { bone, quaternion } of savedBones) bone.quaternion.copy(quaternion)
    for (const { influences, index, value } of savedMorphs) influences[index] = value
    savedBones.length = 0
    savedMorphs.length = 0
  }

  function saveBone(bone: Object3D) {
    savedBones.push({ bone, quaternion: bone.quaternion.clone() })
  }

  function applyBrows(inner: number, outer: number) {
    const raise = (list: BrowMorph[], amount: number) => {
      for (const { influences, index } of list) {
        const value = influences[index] ?? 0
        savedMorphs.push({ influences, index, value })
        // max, not set: a clip may already raise the brow and the overlay must not flatten it.
        influences[index] = Math.max(value, amount)
      }
    }
    raise(brows.inner, inner)
    raise(brows.outer, outer)
  }

  function tick(timestamp: number) {
    rafId = null
    if (disposed || !running) return
    rafId = win.requestAnimationFrame(tick)

    const dt = lastFrameMs < 0 ? 0 : Math.min((timestamp - lastFrameMs) / 1000, MAX_DT_S)
    lastFrameMs = timestamp
    frameSeconds += dt

    // Reads first, writes after: the layout reads happen before this frame touches the DOM.
    if (timestamp - lastMeasureAt > REMEASURE_MS) measureNow(timestamp)

    if (!firstShown && document.documentElement.dataset.logoIntro !== 'pending') {
      firstShown = true
      machine.dispatch({ type: 'firstShown' })
    }

    // Scroll: progress and velocity come from scrollY polled here, not from scroll events, so the
    // loop has one source of truth and no listener to leak.
    const scrollY = win.scrollY
    if (dt > 0 && isScrollSpike((scrollY - lastScrollY) / dt)) {
      machine.dispatch({ type: 'scrollVelocitySpike' })
    }
    lastScrollY = scrollY
    machine.dispatch({
      type: 'scrollProgress',
      progress: heroScrollProgress(scrollY, measure.heroDocTop, measure.heroHeight),
    })
    const view = machine.view(timestamp)

    // Hover: a raycast over the skinned meshes is the costly part, so it runs at most every
    // CAST_MOVED_MS while the pointer moves (inside the 100 ms reaction budget) and every
    // CAST_IDLE_MS otherwise, because a wave can move the model under a pointer that is still.
    if (pointer.known && timestamp - lastCastAt >= (pointer.dirty ? CAST_MOVED_MS : CAST_IDLE_MS)) {
      lastCastAt = timestamp
      pointer.dirty = false
      setHover(castAt(pointer.x, pointer.y))
    }

    restoreOverlay()
    if (rootOverlayApplied && rootBone) rootBone.position.copy(rootPosition)
    mixer.update(dt)
    rootOverlayApplied = Boolean(view.airborne && rootBone)
    if (rootOverlayApplied && rootBone) {
      rootPosition.copy(rootBone.position)
      // Keep the authored arc inside the fixed stage without shifting the canvas box.
      rootBone.position.multiplyScalar(0.45)
    }
    jetEffects?.update(frameSeconds)

    // Everything below must come after mixer.update: the clips key every bone every frame, so a
    // rotation applied before the mixer would be overwritten before it is ever drawn.
    const k = dampFactor(SCROLL_LERP, dt)
    smoothRotation += (view.scroll.rotationRad - smoothRotation) * k
    smoothPitch += (view.scroll.headPitchRad - smoothPitch) * k
    const scrolledPx = Math.max(0, scrollY - measure.heroDocTop)
    const parallaxTarget = Math.min(parallaxOffsetPx(scrolledPx), feetMarginPx)
    smoothParallaxPx += (parallaxTarget - smoothParallaxPx) * k
    const worldPerPx =
      (2 * Math.tan(degToRad(camera.fov) / 2) * cameraDistance) / Math.max(measure.height, 1)
    const swayT = frameSeconds - effectStart.whoa
    rig.rotation.set(0, -smoothRotation, swayAngle(swayT))
    rig.position.y = -smoothParallaxPx * worldPerPx
    rig.updateMatrixWorld(true)

    lookWeight += (view.lookWeightTarget - lookWeight) * dampFactor(WEIGHT_LERP, dt)
    const wanted = lookAngles()
    if (wanted) {
      // Ease the wanted angle too; the weight alone would not smooth a pointer that jumps.
      const lk = dampFactor(LOOK_LERP, dt)
      lookYaw += (wanted.yaw - lookYaw) * lk
      lookPitch += (wanted.pitch - lookPitch) * lk
    }
    const { head: headAngle, eyes: eyeAngle } = headFollowAngles(
      { yaw: lookYaw, pitch: lookPitch },
      lookWeight,
    )

    const reaction = reactionEnvelope(frameSeconds - effectStart.reaction, REACTION_S)
    const whoa = reactionEnvelope(frameSeconds - effectStart.whoa, WHOA_S)
    // Tilt toward the side the pointer is on.
    const tilt = -Math.sign(headAngle.yaw) * REACTION_TILT_RAD * reaction

    if (head) saveBone(head)
    for (const eye of eyes) saveBone(eye)
    if (head) {
      // Look pitch is up-positive; a rotation about the right axis is down-positive.
      rotateInRigFrame(head, headAngle.yaw, -headAngle.pitch + smoothPitch, tilt)
      head.updateMatrixWorld(true)
    }
    for (const eye of eyes) rotateInRigFrame(eye, eyeAngle.yaw, -eyeAngle.pitch, 0)
    applyBrows(Math.max(reaction * REACTION_BROW, whoa * WHOA_BROW), whoa * WHOA_BROW)

    renderer.render(scene, camera)

    if (!firstFrameDone) {
      firstFrameDone = true
      canvas.style.opacity = '1'
      onFirstFrame()
    }

    const verdict = fps.frame(timestamp)
    if (verdict?.action === 'dpr1' && appliedPixelRatio > 1) {
      appliedPixelRatio = 1
      applySize()
    } else if (verdict?.action === 'fallback') {
      fallBack('fps')
    }
  }

  // 11. Teardown. Order matters: stop producing frames before freeing what they draw with.
  const listeners: Array<() => void> = []
  function listen(
    target: EventTarget,
    type: string,
    handler: (event: never) => void,
    options?: AddEventListenerOptions,
  ) {
    target.addEventListener(type, handler as EventListener, options)
    listeners.push(() => target.removeEventListener(type, handler as EventListener, options))
  }

  function dispose() {
    if (disposed) return
    disposed = true
    if (rafId !== null) win.cancelAnimationFrame(rafId)
    rafId = null
    stopObservingVisibility()
    resizeObserver?.disconnect()
    for (const remove of listeners) remove()
    listeners.length = 0
    machine.dispose()
    jetEffects?.dispose()
    mixer.stopAllAction()
    mixer.uncacheRoot(model)
    model.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return
      mesh.geometry.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) {
        // Every texture slot (map, normalMap, clearcoat maps ...) is a property holding a Texture.
        for (const value of Object.values(material)) {
          if (value && (value as Texture).isTexture) (value as Texture).dispose()
        }
        material.dispose()
      }
    })
    envTarget.dispose()
    pmrem.dispose()
    renderer.dispose()
    // dispose() frees three's objects but keeps the context alive until the GC runs; forcing the
    // loss returns the GPU memory now and keeps the page under the browser's context limit.
    renderer.forceContextLoss()
    canvas.remove()
  }

  function fallBack(reason: SinoFallbackReason) {
    if (disposed) return
    dispose()
    onFallback(reason)
  }

  // Wire up. All listeners are passive or non-scrolling and registered through `listen` so the
  // exact set is removed again.
  listen(canvas, 'webglcontextlost', (event: Event) => {
    // preventDefault tells the browser we handle it; we fall back instead of restoring because a
    // lost context on a hero is a sign of a struggling GPU.
    event.preventDefault()
    fallBack('context-lost')
  })
  listen(canvas, 'click', onClick)
  listen(win, 'keydown', () => machine.dispatch({ type: 'skipFlight' }))
  listen(win, 'pointermove', onPointerMove, { passive: true })
  listen(document.documentElement, 'pointerleave', onPointerGone)
  listen(document, 'visibilitychange', onVisibility)
  listen(document, 'pointerover', onOver)
  listen(document, 'pointerout', onOut)
  listen(document, 'focusin', onFocusIn)
  listen(document, 'focusout', onFocusOut)
  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(host)
    resizeObserver.observe(heroEl)
  } else {
    listen(win, 'resize', onResize, { passive: true })
  }

  measureNow(performance.now())

  // Linking the shaders synchronously blocks the main thread for hundreds of ms on a slow device
  // (a long task that lands in Total Blocking Time). compileAsync uses the browser's parallel
  // shader compile, so the first frame draws with programs that are already linked.
  try {
    await yieldToMain()
    await renderer.compileAsync(scene, camera)
  } catch (error) {
    dispose()
    throw error
  }
  // A lost context during the compile has already torn everything down and told the caller.
  if (!disposed) rafId = win.requestAnimationFrame(tick)

  return { dispose }
}
