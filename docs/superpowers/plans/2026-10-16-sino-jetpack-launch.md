# Sino jetpack launch animation: implementation plan

| | |
|---|---|
| Date | 2026-10-16 |
| Status | Planned, not started. To be implemented later by the product owner or a lane |
| Owner | Product owner (Faishal) |
| Ticket | CPR-99 |
| Inputs | [mascot-sino.md](../../design/mascot-sino.md), [motion.md](../../design/motion.md), [3d-asset-requirements.md](../../design/3d-asset-requirements.md), CPR-77 (realtime hero), CPR-96 (Sino loops) |

## 1. Goal

Sino turns on a jetpack and flies. The product owner wants this moment somewhere on the website. Candidate moments:

1. When a visitor opens the website for the first time.
2. When a visitor clicks a primary action, for example "Chat on WhatsApp" or "Book a free consultation".

The animation must feel playful and on brand. It must never slow down the page, block a click, or delay navigation. Conversion and Core Web Vitals win over the animation every time.

## 2. Current facts (checked on 2026-10-16)

- **Model:** Sino v005 (`../sino-3d-mascot/blender/sino_master_v005_web.blend`) wears a **backpack** with a swirl emblem (`GEO-backpack`, bone `DEF-backpack`). There is **no jetpack, nozzle or flame** yet.
- **GLB:** `public/mascot/sino.glb` (v005, draco) has 7 clips: `idle`, `idle_b`, `greet_wave`, `listening`, `thinking`, `speaking`, `happy_success`. It is about 347 KB brotli against a 600 KB budget, so about 250 KB of headroom remains.
- **Realtime runtime:** three 0.186.1 runs only in the Home hero (`src/components/mascot/`). It has a pure state machine (`sino-state-machine.ts`), a loading gate (`sino-gate.ts`) and a lazy runtime chunk (`sino-runtime.ts`). The first canvas show plays `greet_wave` once per session.
- **First visit:** the logo intro is already in place (`src/components/brand/`). It runs once per session, is hard capped at 1.6 s and is skipped under reduced motion. A second full-screen first-visit animation would stack on top of it (see decision D2).
- **Everywhere else:** Sino appears as pre-rendered stills (`AnimatedPose`) and, after CPR-96, alpha video loops (`SinoLoop`).

## 3. The animation (one vocabulary, three cuts)

The motion is made of five beats. Each delivery reuses the same beats:

| Beat | Duration | What happens |
|---|---|---|
| 1. Deploy | 0.25 s | Two small nozzles slide and scale out from under the backpack (scale 0 to 1, slight overshoot). A soft "click" squash on the body |
| 2. Anticipation | 0.3 s | Knees bend, arms go back, head looks up. Nozzles glow (emission ramps up) |
| 3. Ignition | 0.2 s | Flame cones pop out, with a puff of small smoke or dust rings at the feet. Small camera shake in realtime only (2 px, 0.15 s) |
| 4. Lift off and fly | 0.6 to 1.2 s | Sino rises with ease-in, body tilts 10° toward the travel direction, legs trail, one arm points forward (the "superhero" pose). Flames flicker |
| 5a. Exit | 0.3 s | Sino leaves the frame upward or toward a target, leaving a short fading trail |
| 5b. Land (when Sino returns) | 0.6 s | Sino descends with the thrust flaring, knees absorb the landing, flames off, the nozzles retract, then `greet_wave` or `happy_success` plays |

Cuts:

- **Cut A, "Take off and return" (Home hero, realtime):** beats 1 to 4, a small arc inside the stage, then 5b. Total 2.4 s or less. Sino starts and ends on the stage, so the first frame matches the poster and there is no visual jump at the poster to canvas crossfade.
- **Cut B, "Launch away" (CTA click, any page, overlay):** beats 1 to 5a, Sino flying out of the viewport toward the top right. Total 1.2 s or less.
- **Cut C, "Fly by" (optional, route transition or thank-you):** Sino crosses the screen diagonally in 0.9 s with the jetpack on. It can carry a small envelope prop on the thank-you page ("your message is on its way").

## 4. Decisions to make before starting

| ID | Question | Options | Recommendation |
|---|---|---|---|
| D1 | Flame look | (a) Orange fire. (b) Teal or cyan plasma ("ion thruster") in brand colors. (c) Teal core with a warm orange tip | **(b) or (c).** Pure orange clashes with the teal palette. Plasma also reads better on the white UI with a darker teal core. Check contrast on white and `#EAF6F6` |
| D2 | First visit | (a) Replace the logo intro with Cut A. (b) Keep the logo intro, then play Cut A in the hero after it. (c) Cut A only, no logo intro | **(b).** The logo intro is a full-screen overlay; Cut A lives inside the hero canvas, so the two do not stack. Cut A replaces the current first-visit `greet_wave` |
| D3 | Which clicks launch Sino | (a) Primary CTAs only (Book a free consultation, Chat on WhatsApp, Join the waitlist). (b) Every nav link | **(a).** A rocket on every nav click becomes noise fast and feels slow even when it is not |
| D4 | Frequency | Once per session, a cooldown, or every click | **Once per session per CTA type, at most 2 launches per session in total.** Surprise works the first time; repetition hurts |
| D5 | Mobile | Same as desktop, overlay only, or off | **Overlay video only** (Cut B). There is no realtime canvas on phones that fail the gate. Off when Save-Data is on |
| D6 | Sound | None or optional | **None.** Autoplay audio is blocked anyway and is not appropriate for a business site |

## 5. Asset work (separate project `sino-3d-mascot`, Blender 5.2, headless)

Known gotchas (see the Blender notes in the mascot project):

- Render headless with `-b file --python script.py`.
- Set `use_compositing=False`.
- NLA tracks are muted in the master and must be unmuted for export.
- Driven shape keys need baking.
- glTF drops shape keys on meshes with applied modifiers.

### A1. Jetpack geometry

- Add two nozzles to the backpack: `GEO-jet_nozzle_L` and `GEO-jet_nozzle_R`. They are short, slightly flared cylinders in the same "buckle" metal material, with a teal inner ring. Parent them to `DEF-backpack`.
- The nozzles are **hidden by default** with scale 0, so every existing pose render, poster and the idle look stay unchanged. Only the jet clips scale them to 1.
- Optional: a thin vent stripe on the backpack panel that lights up (emission keyed) during ignition.
- Keep the triangle count addition under 1.5k. Budgets: 80k tris and 30 draw calls in total (mascot-sino.md §8).

### A2. Flame and exhaust look

The realtime look and the rendered look are different, by design:

- **Rendered (Cut B and C videos):** emissive cone meshes with a noise-driven gradient (Cycles), a short trail made from a curve with an emissive gradient, and smoke puffs as alpha-faded spheres. Alpha matters here: the glow must survive premultiplied alpha on white, so check frames composited over `#FFFFFF` and `#EAF6F6` for no dark or grey halo.
- **Realtime (Cut A):** do NOT bake flames into the GLB as geometry animation. Build them in three.js (§6, W1), so the GLB grows by the nozzles and the clips only.
- **Photosensitivity:** the flicker must stay under 3 flashes per second and cover a small area (WCAG 2.3.1).

### A3. Clips (GLB v006)

| Clip | Length | Notes |
|---|---|---|
| `jet_launch` | 1.3 s | Beats 1 to 4, ends airborne at the top of the arc. Root motion on the rig root (Y up about 1.2 body heights) |
| `jet_hover` | 1.0 s loop | Airborne idle: small bob, legs dangle, flames on. Seamless |
| `jet_land` | 0.8 s | Beat 5b, from airborne back to the `idle` rest pose. Nozzles retract at the end |

Requirements:

- Keep root motion separate from the body animation, or bake it to the root bone. The runtime needs to know the root offset to keep Sino inside the stage (§6).
- Animate the nozzle scale and emission strength as plain node or material properties. Use nothing that needs a custom exporter.
- Add an empty `FX-jet_L` and `FX-jet_R` at each nozzle opening, exported as nodes, so the runtime can attach flames at the right place. glTF keeps empties as nodes.
- Export with `scripts/web_opt/export_web_v005.py` copied to v006. Re-run `inspect_v005.py` and compare against the targets: GLB 600 KB brotli or less, all 7 existing clips unchanged.
- Re-check that the 12 still poses and the poster still match, since the nozzles are hidden at rest.

### A4. Pre-rendered videos (Cut B and C)

| ID | Content | Size | Length |
|---|---|---|---|
| `L-launch` | Cut B, three quarter view from below, Sino launching up and out of frame | 720 x 960 | 1.2 s |
| `L-flyby` | Cut C, side view, Sino flying left to right across frame | 1280 x 540 | 0.9 s |
| `L-flyby-mail` | Cut C with an envelope prop (thank-you page) | 1280 x 540 | 0.9 s |

Formats and budget are the same as the CPR-96 loops:

- VP9 alpha `.webm` and HEVC alpha `.mov`, plus a poster.
- 600 KB or less each. These are one-shots, not loops, so first frame and last frame do not need to match. The last frame must be empty (Sino out of frame).
- Reuse `scripts/loops/` from CPR-96 for encoding and the fringe check.

## 6. Website work (`sineva-compro`)

### W1. Realtime Cut A in the Home hero

Files: `sino-state-machine.ts`, `sino-runtime.ts`, `sino-math.ts` and their tests.

State machine:

- New trigger `firstShow` with an asset capability check. When the GLB has `jet_launch`, play the sequence `jet_launch` > `jet_hover` (0.4 s) > `jet_land` > `greet_wave` > `idle`, once per session, using the existing sessionStorage flag.
- When it does not, keep today's `greet_wave`. The runtime must keep working with the v005 GLB.
- **Interruptions:** a hover, tap or scroll during the sequence is queued, not dropped. Look-at is disabled while airborne; the head follows the flight instead. Scrolling the hero out of view mid-flight snaps to `idle` on return.
- Make the sequence skippable: any click or key on the canvas lands Sino immediately with `jet_land` at 2x speed.

Runtime:

- **Flames:** two additive cone meshes per nozzle with a small `ShaderMaterial` (scrolling noise, a color ramp from D1, opacity from a uniform). Attach them to `FX-jet_L` and `FX-jet_R`.
- **Smoke:** a 24-quad `InstancedMesh` pool with soft sprites, spawned on ignition and landing. Fade over 0.8 s. No per-frame allocation.
- **Light:** one `PointLight` with flicker (teal or orange per D1), intensity keyed to the thrust value. Alternatively, fake the light with emissive bloom on the body to keep the light count unchanged. Measure both.
- **Thrust value:** read the nozzle emission channel from the clip, so the effects stay synced to the animation with no separate timeline.
- **Framing gotcha:** the canvas box crops Sino at the top. Pick one:
  - (1) Keep the arc inside the stage, a hop of about 0.6 body heights. This is the simplest, recommended option.
  - (2) Enlarge the canvas upward with a transparent area that overlaps the header, `pointer-events: none`. This needs CLS 0 checks and a header z-index review.
  - (3) Fade Sino out at the top edge and drop him back in.
- **Budget:** the extra JS is 4 KB gzip or less (shader plus pool). Check that the FPS probe still passes on the mid-tier device list.

Fallbacks:

- Under reduced motion, a failed gate or Save-Data, nothing changes: the poster stays and no jet effect plays.

### W2. Launch overlay (Cut B and C, all pages)

New `src/components/mascot/sino-launch/`:

- **`launch-bus.ts`:** a tiny pure module. `requestLaunch({ kind, originRect })` and `subscribe()`. It holds the session caps from D4 and the eligibility rules (reduced motion, Save-Data, `navigator.webdriver`, hidden tab). Unit tested.
- **`SinoLaunchOverlay`:** a client component rendered once in the public layout, so it survives client-side navigation. It is a fixed full-viewport layer, `pointer-events: none`, `aria-hidden`, z-index above the content and below the cookie banner and dialogs. It plays the `L-launch` video starting at the click origin and moves it along a CSS transform path toward the top right. It removes itself on `ended`, and unconditionally after 1.5 s.
- **Warm up, never wait:**
  - The video is not loaded at page load.
  - The first `pointerenter` or `focus` on an eligible CTA starts the fetch (`preload="auto"` on a hidden element).
  - If the video is not ready at click time, **skip the launch**. Never show it late, and never hold the click.
- **Navigation rules (the most important part):**
  - Never call `preventDefault`. Never delay `router.push`. Never wrap the link in a timeout.
  - **WhatsApp** (`target="_blank"`, external): the overlay plays on the page the visitor leaves behind. It is free, because the new tab takes focus.
  - **Internal link** (Book a free consultation to `/contact`): navigation starts at once. The overlay keeps playing across the transition, because it lives in the layout. If the next page paints first, that is fine.
  - **Full page load** (a modifier click or middle click opens a new tab): do not launch. Check `event.button`, `metaKey`, `ctrlKey`, `shiftKey` and `altKey`.
- **Wiring:** an opt-in prop on the shared `Action` and `Button` components, for example `launch="booking" | "whatsapp" | "waitlist"`. Set it only on the primary CTAs from D3: header CTA, hero primary CTA, final CTA, floating WhatsApp, sticky CTA bar, waitlist submit.

### W3. Thank-you landing (Cut C)

On `/contact/thank-you`, after a send, play `L-flyby-mail` once, then show the CPR-96 `L-thumbs` loop. Do not repeat it on refresh: use a session flag keyed to the submission time.

### W4. Analytics (after CPR-51)

Track an event `sino_launch` with `{ kind, page }`. Use it to check whether CTA click-through changes. If it drops, turn the CTA trigger off; it is a single flag in `launch-bus.ts`.

## 7. Guardrails (acceptance for every part)

- **Click latency:** no added delay. In Playwright, measure click to navigation start with the overlay on and off; the difference must be 16 ms or less.
- **LCP and CLS:** Lighthouse mobile on Home stays within 2 points of the baseline, LCP does not move, and CLS is 0. The overlay and the canvas never shift layout.
- **Reduced motion, Save-Data and bots:** nothing plays. Test all three.
- **Accessibility:** the overlay is decorative, `aria-hidden` and never focusable. It does not steal focus or scroll, and stays under 3 flashes per second.
- **Memory:** the overlay `<video>` is removed after it plays, and its `src` is released. The realtime smoke pool is disposed with the runtime.
- **Budgets:** GLB 600 KB brotli or less, each video 600 KB or less, extra JS 6 KB gzip or less in total, excluding the videos.

## 8. Tests (TDD order)

1. `launch-bus` unit tests:
   - the caps (once per type, 2 per session);
   - eligibility (reduced motion, Save-Data, webdriver, hidden tab, modifier clicks);
   - "not ready means skip".
2. State machine tests:
   - the `firstShow` jet sequence when the clips exist;
   - the fallback to `greet_wave` when they do not;
   - interruption queueing;
   - the skip on click.
3. `SinoLaunchOverlay` component tests:
   - mounts only on request;
   - unmounts on `ended` and after the 1.5 s timeout;
   - never renders under reduced motion.
4. CTA wiring tests: the link `href` and `target` are unchanged, and `defaultPrevented` stays false.
5. Playwright:
   - click latency;
   - an overlay is present after a click on a primary CTA;
   - no overlay on a second click of the same type;
   - no overlay with `reducedMotion: 'reduce'`.
6. Asset tests: extend the budget test with the v006 GLB clip list (all 7 old clips plus the 3 new ones) and the video sizes.

## 9. Ticket breakdown (estimates, not commitments)

| # | Work | Area | Estimate |
|---|---|---|---|
| 1 | D1 to D6 decisions, plus a 3-frame style frame for the flame look | Design | 0.5 day |
| 2 | A1 jetpack nozzles plus A2 flame look dev | Blender | 1 day |
| 3 | A3 clips and GLB v006 export with checks | Blender | 1.5 days |
| 4 | A4 three videos with encode and fringe checks | Blender, ffmpeg | 1 day |
| 5 | W1 realtime Cut A (state machine, flames, smoke, framing) | Web | 2 days |
| 6 | W2 launch bus, overlay and CTA wiring | Web | 1.5 days |
| 7 | W3 thank-you fly-by | Web | 0.5 day |
| 8 | QA: Playwright, Lighthouse, Safari and Android check | QA | 0.5 day |

Order: 1, then 2 and 3, then 4 and 5 in parallel, then 6, 7 and 8. Items 5 and 6 can start before the assets with placeholders: a cube with flames for W1, and any alpha webm for W2.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The launch feels slow or annoying on CTA clicks | Lower conversion | The D4 caps, no navigation delay, analytics check (W4), and a single kill switch flag |
| Flames look cheap in realtime | Off brand | Style frame first (item 1). If the realtime flames do not hold up, use a short alpha video of the flame layered over the canvas instead |
| GLB grows past budget | Slower hero | The nozzles are small and the flames are not in the GLB. Re-check with `inspect` |
| Sino cropped at the top of the canvas | Looks broken | Framing option (1), a hop inside the stage |
| Safari alpha video differences | Black box or fringe | Same source picking as CPR-96 (`pickLoopSource`); the poster or a skip on unsupported browsers |
| Stacking with the logo intro on the first visit | Too much motion at once | D2 option (b): the intro first, Cut A inside the hero only after it ends |
