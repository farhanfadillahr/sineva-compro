# Sino: 3D mascot integration on the website

Sino is Sineva's mascot and also the "face" of the AI agent product. This document defines **where, how, and when** Sino appears on the website, along with the performance budget. Source assets: `../sino-3d-mascot/export/web/` (separate project). New asset requirements: [3d-asset-requirements.md](3d-asset-requirements.md).

## Current delivery (v006, 2026-10-16)

The website loads `/mascot/sino-v006.glb`: 1,174,076 bytes raw, 367,332 bytes Brotli, 56,233 triangles and 22 primitives. Ten clips retain the seven original names and add `jet_launch`, `jet_hover`, `jet_land`. Arm animation in the original clips was corrected to avoid torso intersections, and the redundant cornea shell was removed to clear closed eyelids. Nozzles retract at rest. Corrected stills and hero poster use `/mascot/poses/v006/` and `/mascot/poster/v006/` to avoid old immutable caches.

The first hero sequence runs after the logo intro. It hops inside the stage, lands, waves, and idles. Pointer reactions queue during flight; a click or key skips to landing. Reduced motion, Save-Data and webdriver keep the poster. Five loop videos and three one-shots ship with VP9 and HEVC alpha. CTA one-shots warm on focus/hover and skip if not ready, without delaying navigation. See [production notes](sino-v006-production.md) for source files, audits, budgets and pending device checks.

## 1. Historical asset facts (`sino.glb` v004)

Inspected with `gltf-transform inspect` and a three.js 0.170 parse on 15 October 2026.

| Item | Value | Notes |
|---|---|---|
| Size | 13.8 MB raw, 4.1 MB brotli | **Too large for web** |
| Geometry | ±430k triangles, 111 meshes, 114 primitives (±114 draw calls) | Budget in `IMPLEMENTATION_PLAN.md` §11/§16: 32k tris, 3 draw calls, ≤ 4 MB |
| Rig | 1 skin, 47 joints. Head `DEF-head`, eyes `DEF-eye.L` / `DEF-eye.R` (in three: `DEF-eyeL` / `DEF-eyeR`) | Cursor look-at uses `DEF-head` + eyes |
| Morph targets | 7: `browDownLeft/Right`, `browOuterUpLeft/Right`, `browInnerUp`, `eyeBlinkLeft/Right` | **No** `jawOpen`, `mouth*`, `eyeLook*`. The asset README says ARKit morphs are on the head, but in fact they are on the brow/eyelid meshes |
| Clips | `idle`, `idle_b` (4 s loop), `listening`, `thinking` (2 s loop), `speaking` (1.5 s loop, mouth does not move), `greet_wave` (2 s), `happy_success` (1.5 s) | No error/confused clip |
| Materials | 20, clearcoat + specular, some sheen. The cornea uses `KHR_materials_transmission` | Transmission forces an extra render pass |

Compression test results (source file unchanged):

| Variant | Raw | Brotli | Notes |
|---|---|---|---|
| `optimize --compress draco --palette false` | 1.33 MB | 0.85 MB | 1 skin, original materials intact. **Current choice** |
| `optimize --compress meshopt` | 1.96 MB | 0.95 MB | Skin duplicated into 110 skeletons in three, heavy on the CPU |

Gotcha: the default `optimize` runs `palette`, which replaces the 20 materials. Always use `--palette false`.

### 1.1 Mandatory asset fixes before production use

Done in the `sino-3d-mascot` project (needs a re-export):
1. Cornea: replace transmission with alpha 0.2 (the fallback already mentioned in the asset README).
2. Merge meshes per material to cut draw calls (target ≤ 30).
3. Reduce triangles to **≤ 80k** (hard launch limit), target 32k per the asset plan.
4. Limit clearcoat/sheen to the visible parts (helmet only).
5. Export draco + `--palette false`. Target **≤ 600 KB brotli**.
6. Remove the second scene containing a stray `Cube`.

Until the fixes are done, the website uses **poster + video loop** (see §3, fallback mode), not the GLB.

## 2. Architecture decisions

| Question | Decision | Reason |
|---|---|---|
| Where is realtime 3D used? | **Only the Home hero** (and optionally the Product hero) | The only place where cursor interaction adds value. Sintra also uses video/stills everywhere else |
| Other sections? | Pre-baked renders (AVIF stills, alpha video) | Lightweight, maximal render quality |
| Library | **three 0.186 vanilla** in a single client component (`'use client'`), loaded with `next/dynamic` and `ssr: false` | ±169 KB min+gzip vs ±270 KB for react-three-fiber + drei. Only one scene, a small state machine, no need for declarative |
| Why not `<model-viewer>` | Cannot override bones after the mixer (cursor look-at impossible), and it pins a different three version | |
| Decoder | Draco decoder self-hosted (`/public/draco/`), not the gstatic CDN | CSP (CPR-53) and privacy. CSP needs `'wasm-unsafe-eval'` for the wasm decoder |

Version checked via `npm view` on 15 October 2026: three 0.186.1. Pin exactly per `.npmrc`.

## 3. Loading strategy (mandatory, for LCP)

```
1. SSR: <img> Sino poster (next/image, priority, fixed size)   ← LCP candidate, CLS 0
2. window load + requestIdleCallback
3. Gate: in viewport? WebGL2 available? prefers-reduced-motion not active?
         Save-Data off? device memory ≥ 4 (if available)?
   ├─ all pass → fetch GLB, create canvas behind the poster
   │              → after the first frame renders, crossfade poster → canvas (300 ms)
   └─ any fails → keep the poster; if motion is allowed, play loop V1 (alpha video)
4. FPS probe over the first 60 frames: average < 45 fps → drop DPR to 1; < 30 fps → fall back to the poster
```

Rules:
- The canvas **never** becomes the LCP element and does not shift layout. Its box is reserved with `aspect-ratio`.
- `devicePixelRatio` is capped at 1.5. Rendering stops when the tab is hidden or the hero leaves the viewport (IntersectionObserver).
- No realtime shadow map. The contact shadow is a radial-blur PNG under the feet.
- The GLB is not preloaded before first paint. `immutable` cache header, file name contains a hash.

## 4. Stage on the light UI

Sino is pale teal with a bluish-white helmet, so she **sinks into a plain white background**. Every appearance of Sino uses a stage:

- **Glow:** `radial-gradient` from `--color-teal-100` (70% opacity) to transparent, diameter ±1.2× Sino's height, behind the body.
- **Orbit ring:** two thin arcs (1.5 px stroke, `--color-teal-300`) that mimic the logo's curve, rotating very slowly (60 s per revolution). Still under reduced motion.
- **Contact shadow:** blurred ellipse `rgba(8, 63, 76, 0.18)`.
- Render and realtime lighting: key light upper-left, teal rim light `#80D2D2` so the silhouette separates from the background.

## 5. Choreography (state machine)

| Trigger | Clip / behavior | Rule |
|---|---|---|
| Canvas first shown | `greet_wave` → `idle` | **Once per session** (sessionStorage wrapped in try/catch). Later visits go straight to `idle` |
| Idle | `idle` and `idle_b` alternate randomly every 2-3 cycles | Natural blink is already in the clip |
| Cursor moves (desktop) | Look-at: head yaw ±25°, pitch ±15°; eyes follow at a 0.6 ratio | Applied **after** `mixer.update` because clips lock all bones every frame. Damping (lerp 0.08/frame) to avoid stiffness |
| Cursor still for 4 s | Head slowly returns to the front | |
| Hover on hero primary CTA | `listening` | Returns to idle when hover ends |
| Focus on waitlist/form field (if Sino is visible) | `listening` | |
| Form submit, waiting | `thinking` | |
| Submit success | `happy_success` → `idle` | |
| Scroll out of hero | Pause rendering | |
| Touch/tap Sino (mobile) | `greet_wave` (5 s cooldown) | Small easter egg, no look-at on mobile |
| **Pointer enters the 3D mascot** (desktop, raycast hit on the model, not just the canvas box) | Short reaction: `wave_small` if available, else `greet_wave` at 1.25x speed, plus a quick happy brow raise (`browInnerUp` 0 → 0.6 → 0) and a 6° head tilt toward the cursor | Cooldown 4 s. Cursor changes to `pointer` only over the model. While the pointer stays on the model, Sino keeps eye contact (look-at weight 1.0); on leave, he returns to `idle` with a 0.35 s crossfade |
| **Pointer hovers the model for 1.5 s** | `listening` loop | Stops when the pointer leaves |
| **Click / Enter on the model** (desktop) | `happy_success` | Same 5 s cooldown as tap. The canvas wrapper is a decorative button only if it has an accessible name; otherwise it stays `aria-hidden` and click is mouse-only |
| **Page scroll while the hero is visible** | Scroll-linked motion of the whole rig: body rotates up to 20° toward the content below, the canvas moves up with a 0.85x parallax, and the head tips down slightly (pitch 8°) as if following the scroll | Driven by scroll progress through the hero (0 to 1), smoothed with a lerp, transform of the rig root only (no layout). Look-at still blends on top |
| **Scroll velocity spike** (fast flick) | Small "whoa" reaction: brows up + a 0.3 s body sway | Max once per 3 s |
| **Hero leaves the viewport** | Pause rendering | Resume on re-entry with `idle` |
| `prefers-reduced-motion` | No canvas, static poster | |

Crossfade between clips: 0.35 s (`AnimationAction.crossFadeTo`).

### 5.1 Animated stills (all pages)

Pre-rendered Sino poses (`/mascot/poses/*`) are not static either. Every pose image uses the same small motion vocabulary, CSS and IntersectionObserver only (no GSAP, no canvas), so it stays cheap:

| Trigger | Behaviour |
|---|---|
| Scroll into view | Rises 24 px and fades in (Reveal), then settles with a 1° overshoot tilt (`--ease-bounce`) |
| While in view | Gentle idle float: translateY 0 → -6 px → 0 over 6 s, alternating phase per image so neighbours do not move in sync |
| Scroll progress through its section | Parallax: the pose moves at 0.92x scroll speed relative to its card (transform only, clamped to ±24 px) |
| Hover on the card or the pose (desktop) | Lifts 6 px and tilts ±2° (alternating per card, Sintra pattern); the stage glow intensifies |
| Focus-visible on the card | Same as hover |
| `prefers-reduced-motion` | Static, no float, no parallax |

Implementation lives in one shared `AnimatedPose` wrapper (used by TwoPaths, TaskCardGrid, FinalCta, page heroes with stills, 404 and thank-you).

#### SinoLoop (animated loops)

Where a pose has a rendered loop (`L-wave`, `L-phone`, `L-build`, `L-thumbs`, `L-confused`, see [3d-asset-requirements.md](3d-asset-requirements.md) section 3.4), `SinoLoop` plays it. It is an `AnimatedPose` whose picture is a `<video>` (the pose's `media` slot), so reveal, float, parallax and hover lift are the pose's own and are not copied. The asset manifest is `src/components/motion/sino-loops.ts`: `id -> { webm, mov, poster, width, height, ready }`.

| Rule | Behaviour |
|---|---|
| First paint | The poster. The server HTML and the first hydration render are the poster `<Image>`; the `<video>` (muted, `playsInline`, `loop`, `preload="none"`, `aria-hidden`, no controls) replaces it on the client. The box is reserved with width, height and aspect-ratio, so CLS is 0 |
| Source | Chosen in JS by `pickLoopSource`: WebKit (Safari, every iOS browser) gets the HEVC alpha `.mov`; every other browser gets the VP9 alpha `.webm`. Never by `canPlayType` alone: Chrome can report HEVC support and still drop the alpha, which paints a black box. WebKit without HEVC gets the poster, not the WebM (its WebM alpha is unreliable) |
| Playing | Only while intersecting (IntersectionObserver) and the tab is visible. Pauses when it leaves the screen and on `visibilitychange` hidden; resumes on return only if still in view. `play()` rejections are caught and the poster stays |
| Reduced motion, Save-Data | `prefers-reduced-motion: reduce` or `navigator.connection.saveData`: the poster image only, no `<video>` element, no download of the video |
| Accessibility | Decorative: empty poster alt, no controls, never focusable |
| Not ready | While `ready` is `false` (files not delivered), the usage draws its still pose exactly as before. Flip `ready` in the same change that adds the three files; a test fails if a ready loop has a file missing |

Placements: `L-wave` on Home "Meet Sino" and the final CTA, `L-phone` and `L-build` on the two TwoPaths cards, `L-thumbs` on the contact thank-you page, `L-confused` on the 404 page. The "one large Sino per viewport" limit of section 6 applies to loops too.

## 6. Where Sino appears per page

| Page | Form | Asset |
|---|---|---|
| Home hero | Realtime GLB + stage | `sino.glb` (after §1.1), poster C1/S1 |
| Home "Meet Sino" | Scroll-scrub (GLB or sequence Q1) | Q1 |
| Product | Pose stills per capability + phone mockup | S2-S6, C4 |
| Services | Pose stills per service | S7-S9 |
| About | Team scene | C3, S13 |
| Contact / thank-you | Thumbs up | S10 |
| 404 / empty state | Confused | S11 |
| Blog | Cover kit, author fallback | B2, S14 |
| Cards / tables | Sino peeking from the edge | S12 |

Limit: **at most one "large" Sino per viewport.** More than that feels crowded and reduces focus on the CTA.

## 7. Accessibility

- Decorative canvas: `aria-hidden="true"`, no keyboard focus.
- The tap easter egg carries no important information.
- No automatic motion that flashes more than 3 times per second.
- Video loops have no audio and no controls (decorative, ≤ 6 s). Paused under reduced motion.

## 8. Acceptance (broken down into implementation tickets)

- [ ] Lighthouse mobile Home ≥ 90 Performance **with** Sino active (test on the Moto G Power profile / default Lighthouse throttling)
- [ ] Home LCP is the poster or the headline, not the canvas
- [ ] Hero CLS = 0
- [ ] GLB ≤ 600 KB brotli, ≤ 80k tris, ≤ 30 draw calls
- [ ] Smooth look-at with no jitter at 60 fps on a MacBook Air M1 and ≥ 45 fps on a mid-range Android
- [ ] Reduced motion: no canvas, no video
- [ ] Unit tests for the state machine (trigger → clip) and the loading gate (feature detection mocked)
- [ ] Hovering the 3D model (raycast hit) plays the reaction within 100 ms, respects the 4 s cooldown, and keeps eye contact while the pointer stays on the model
- [ ] Scrolling through the hero drives the rig rotation, parallax and head pitch smoothly (no jank at 60 fps on desktop), transform only, with zero CLS
- [ ] Every pose still uses `AnimatedPose`: reveal, idle float, scroll parallax, hover lift and tilt; static under reduced motion

## 9. Implementation notes (Home hero canvas)

Code lives in `src/components/mascot/`. Pure logic has no three.js import, so it is unit tested in node (`tests/unit/mascot-*.test.ts(x)`).

| File | Role |
|---|---|
| `sino-state-machine.ts` | Triggers to commands (§5): cooldowns, dwell timer, once-per-session greeting, pause on hero out. Emits `play`, `effect`, `render` commands |
| `sino-gate.ts` | Loading gate (§3): `window.load` plus idle slot, then the pure `evaluateSinoGate` over plain data |
| `sino-math.ts` | Frame-rate independent lerp, look-at limits, scroll mapping, FPS probe |
| `sino-runtime.ts` | The lazy chunk: three.js, GLTF and Draco loaders, mixer, raycast, scroll rig, disposal |
| `sino-hero.tsx` | Client component in the canvas slot. Runs the gate, then `import('./sino-runtime')`; the poster crossfade is driven from here |

Decisions and gotchas:

- **Chunk boundary.** The runtime is a plain dynamic `import()` inside an effect, not `next/dynamic`, because it is a module that needs a host element, not a React component. A failed gate downloads no 3D code.
- **Look-at, scroll overlay and brows are applied after `mixer.update`** and undone at the start of the next frame, so an overlay on a property no clip keys cannot compound. The look-at rotation is converted from the rig's frame into each bone's parent space, so the Blender bone axes are never assumed.
- **Hover reaction.** `wave_small` does not exist in the GLB, so the reaction is `greet_wave` at 1.25x (`SINO_TIMING.reactionTimeScale`); if a `wave_small` clip appears it is used automatically. A reaction wave that is already playing when the pointer leaves finishes (at most 1.6 s); a `listening` loop started by the dwell stops at once.
- **Parallax is clamped to the free space under the feet.** The 0.85x lag pushes the rig down inside the canvas, and the canvas edge crops it flat. The push stops at the measured margin (about 3 percent of the canvas height with the current stage), so the effect is small until the canvas slot gets headroom below the stage (for example a taller slot with the same poster aspect).
- **Poster crossfade** reaches the poster `img` through `[data-slot="sino-stage"]`, because `HeroSplit` owns that element. It animates opacity only.
- **CSP.** In three 0.186.1 `DRACOLoader` creates its workers from a blob URL (`URL.createObjectURL`, then `new Worker`), so `worker-src blob:` is needed besides `'wasm-unsafe-eval'` (verified in `examples/jsm/loaders/DRACOLoader.js`). The loader's default decoder URLs make the bundler emit unused copies of the decoder as static assets; they are never requested because `setDecoderPath('/draco/')` replaces them.
- **GLB cache.** `/mascot/sino.glb` has no hash in its name yet, so it cannot be served `immutable` safely.
- **Not implemented here:** loop V1 video for devices that fail the gate (the asset is CPR-70), and the submit states (`thinking`, `happy_success` on form success): only form field focus drives `listening`.
