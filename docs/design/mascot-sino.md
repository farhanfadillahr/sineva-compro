# Sino: 3D mascot integration on the website

Sino is Sineva's mascot and also the "face" of the AI agent product. This document defines **where, how, and when** Sino appears on the website, along with the performance budget. Source assets: `../sino-3d-mascot/export/web/` (separate project). New asset requirements: [3d-asset-requirements.md](3d-asset-requirements.md).

## 1. Current asset facts (`sino.glb` v004)

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
| `prefers-reduced-motion` | No canvas, static poster | |

Crossfade between clips: 0.35 s (`AnimationAction.crossFadeTo`).

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
