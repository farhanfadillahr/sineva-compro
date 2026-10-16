# Motion & interaction

How Sineva moves: easing and duration tokens, scroll behaviour, hover and press states, the navbar, Lottie animations, and reduced motion. The patterns are adapted from sintra.ai (evidence in [research/sintra-reference.md](research/sintra-reference.md)) and tuned for a light, calm brand.

## 1. Principles

1. **Motion explains, it does not decorate.** Every animation shows where something came from, what changed, or what to do next.
2. **Fast in, soft out.** UI responds within 100 ms. Exits are shorter than entrances.
3. **One hero moment per viewport.** If Sino is animating, nothing else competes. If a scroll scene is playing, cards stay still.
4. **Never block.** No animation delays reading, input, or the LCP element. Content is visible without JavaScript.
5. **Respect the user.** `prefers-reduced-motion: reduce` turns every non-essential animation into an instant state change or a 150 ms opacity fade (§9).

## 2. Tokens

### 2.1 Easing

| Token | Value | Use | Source |
|---|---|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for UI (hover, dropdown, color) | Sintra nav default (`--nava-ease`) |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances, reveals, modals | Sintra `--nava-expo`, popup rise |
| `--ease-bounce` | `cubic-bezier(0.34, 1.35, 0.64, 1)` | Small overshoot: dropdown panel open, chip select, Sino stage pop | Sintra `--nava-bounce` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Things that move and stop on screen (carousels, step switches) | |
| `--ease-in` | `cubic-bezier(0.5, 0, 0.8, 0.4)` | Exits only | Sintra nav exit |
| `--ease-wipe` | `cubic-bezier(0.7, 0, 0.25, 1)` | Mobile menu clip-path wipe | Sintra mobile wipe |
| `linear` | | Marquees, orbit rings, scroll scrub | |

### 2.2 Duration

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 60 ms | Hover-in background snap on menu items (Sintra: 55 ms in, 260 ms out) |
| `--dur-fast` | 160 ms | Color, opacity, icon nudge |
| `--dur-base` | 240 ms | Buttons, inputs, small panels |
| `--dur-med` | 360 ms | Accordions, cards, dropdowns |
| `--dur-slow` | 520 ms | Section reveals, header hide/show (Sintra: 500 ms) |
| `--dur-scene` | 800-1200 ms | Hero entrance sequence |

Stagger between siblings: **40-60 ms**, capped at 6 items (later items start together).

## 3. Page load

### 3.1 First-load splash (Sino jetpack launch)

Product owner decision (2026-10-16), replacing the Lottie logo intro: no logo animation in the splash. Only the 3D jetpack clip. Sino stands in the middle of the screen, then flies up. The page opens from the bottom to the top, following the direction she flies. The page opens only once that animation has finished.

Choreography (about 0.9 s of clip, after the clip is ready):
1. A full-screen overlay in the canvas colour covers the page. Sino plays centred (about 40svh tall, her middle on the middle of the screen): she stands, the jetpack ignites.
2. At the **lift moment** (clip time 460 ms, where her boots stop settling and start climbing) the overlay opens from the bottom to the top: `clip-path` animates from fully covering to fully open, linear, with a curved leading edge that bulges below her and trails her feet. The page is revealed below her while she is still on screen.
3. The wipe ends at clip time 900 ms, where the last pixel of her has left the top of the screen. Then the overlay and the scroll lock are removed and the page is usable. The empty tail of the clip (900 to 1167 ms) is not waited for.

The page is never visible before the lift, and never covered after she has left.

Rules (owner decisions and the safety rules that protect against a stuck screen; do not relax them without re-measuring):
- **On every full page load**, refresh included (owner's decision, 2026-10-16). Never on client-side navigation, because the gate only runs with the document. No storage flag.
- **The page opens only after the animation.** This replaces the old 1.6 s cap and the old "never wait for the network" rule. A visitor on a slow link now waits for the clip (up to 2.5 s, see below) instead of getting the page early. That is the owner's call; the safety timers below are what keep it bounded.
- **Scroll is locked while the overlay is up**: `overflow: hidden` and `scrollbar-gutter: stable` on `<html>` (the gutter keeps a classic scrollbar from shifting the page under the overlay and again when it returns), restored to the previous inline values when the overlay ends, however it ends. Input is blocked: the overlay catches the pointer and swallows clicks until it is gone.
- **Safety timers, all of them hard.** Times are on the navigation-start clock (`performance.now()`), the same clock as the shell's CSS timers:
  - The clip must be playing by **2.5 s**. If not, the download is cancelled and the overlay wipes upward in **400 ms without Sino**. Why: a visitor on a bad connection must not stare at a blank screen for the rest of the 5 s. 2.5 s leaves room for the 0.9 s sequence before the hard stop even for a clip that starts at the deadline (the clip never starts later, so the sequence ends by about 3.4 s on that path).
  - If the clip errors, `play()` is refused, or its clock stops advancing for 600 ms, the overlay wipes at once (a fast wipe of 220 ms). Why: a Sino frozen mid-flight is worse than no Sino, and the page must not wait for a clip that is not moving.
  - An absolute **hard stop at 5 s** removes the overlay and releases the scroll lock, whatever else is happening. Why: this is the last line against a bug in the sequence itself.
  - The **CSS-only shell** (below) stops covering the page by 5 s even if no JavaScript ever takes over: it becomes inert at 4.8 s and is fully faded out at 5 s (it was 1.2 s and 1.8 s). The overlay carries the same CSS stop at 5 s. Why: the shell is the only layer that exists before hydration, and a failed script chunk must not leave the page covered.
  - **Any key, click, wheel or touch skips**: a fast wipe of 220 ms (continuing from where a running wipe is, never jumping back), then done. The event is not consumed, so Tab still lands on the skip link; the click that follows a pointer press is swallowed so it cannot hit half revealed content.
- Gate rules are unchanged: the site toggle off, `prefers-reduced-motion` and `navigator.webdriver` mean no splash. Save-Data also means no splash, enforced by the takeover (the gate script does not read it, see below).
- `LOGO_INTRO_FORCE=1` (test builds only) lifts the webdriver rule, and the clip now plays under webdriver too. Before, the clip refused to render under webdriver even in a forced build; that made headless verification test a different splash than the real one. A forced Lighthouse run therefore measures the splash with the clip.
- The page content, including the hero headline, is server-rendered underneath, so the LCP element exists from first paint. The overlay is a solid canvas-coloured layer. **Verify with Lighthouse** that LCP is not delayed beyond what the owner accepted: by design the page now opens after the animation, so LCP-visible time includes the clip. If that cost is not accepted, the fallback is to shorten the wait (cut the 2.5 s deadline), not to cover less.
- Reduced motion: no overlay, no clip. The gate refuses to mark the document, the takeover refuses again, and CSS hides both layers.
- The hero Sino waits for the splash to end before its first wave (see 3.2): the gate marker `<html data-logo-intro="pending">` stays until the wipe is done, and the mascot runtime polls it.

Implementation note (`src/components/brand/`):
- **Gate** (`intro-gate-script.ts`, rendered by `logo-intro-server.tsx` in `<head>`): a blocking inline script decides before first paint. A client-only decision lets the page paint first and covers it later, a visible flash. It plays when the toggle is on, the visitor does not prefer reduced motion and `navigator.webdriver` is false (or the test-only `LOGO_INTRO_FORCE=1` build flag is set). It sets `<html data-logo-intro="pending">`. Its truth table is tested against `shouldPlayIntro` for every input combination. It is unchanged and byte-stable: one CSP hash.
- **Shell** (`LogoIntroShell`, first in `<body>`): a canvas-coloured full-screen layer in the server HTML, shown by CSS only while the marker is present. Pure CSS makes it inert at 4.8 s and fades it out by 5 s even if JavaScript never runs. While the client overlay is mounted, `<html data-logo-intro-live>` hides the shell at once, because the shell is not clipped and would cover the page the wipe is revealing.
- **Takeover** (`logo-intro.tsx`): mounts right after hydration, sees the marker, starts the clip download (`prepareSplashLaunch`) and mounts the overlay chunk. Save-Data and reduced motion release the page here instead. It also releases the marker at the 5 s hard stop itself, in case the overlay chunk never loads.
- **Overlay** (`logo-intro-overlay.tsx`, `logo-intro.module.css`): plays the clip and runs the wipe. It turns the transitions of the pure state machine into effects.
- **Sequence** (`splash-sequence.ts`, pure): the clip measurements, the owner's timers, the wipe geometry (`wipeClipPath`, `planLiftWipe`, `planRestWipe`) and the state machine (`cover`, `launch`, `wipe`, `done`). Unit tested without a DOM.
- **Clip** (`splash-launch.ts`) and **scroll lock** (`splash-scroll-lock.ts`).

Clip measurements (ffprobe and a per-frame alpha bounding box with ffmpeg `cropdetect` on the alpha plane, 2026-10-16). `sino-launch` is 720 x 960, 24 fps, 28 frames, 1167 ms (`.webm` and `.mov` identical):
- 0 to about 330 ms: she stands; the silhouette spans y 204 to 924 of 960 (about 75% of the frame height, 44% of its width).
- 333 to 458 ms: she settles and the jetpack ignites; her boots rise 4 px, then 12 px, at 2 to 4 px per frame.
- **460 ms: lift.** Boots rise 34 px by 500 ms, 82 px by 542 ms, about 100 px per frame after that.
- 667 ms: the silhouette touches the top of the frame. 875 ms: last visible pixels. 917 ms to 1167 ms: fully transparent.
- **900 ms: she has left.** The wipe therefore runs 460 to 900 ms, 440 ms, linear. Computed from the measured boot positions, the middle of the edge stays 8 to 37svh below her boots for the whole flight (the sides, which the curve raises, come closer), which is the intent: the page opens below her, never over her.
- The wipe is derived from the clip clock (`currentTime`, polled every 16 ms), not from a timer after `playing`: the first frame can be presented late and a buffering hitch would otherwise open the page ahead of Sino. A late poll starts the wipe part way in, so it still ends at 900 ms of clip time.

Geometry. The clip box is `54svh` tall, 3:4, with its top at `18svh`: Sino is about 40svh tall and her middle is on the middle of the screen (the owner found the first 57svh version too big). Because the box top is below the screen top, the video's top fifth fades to transparent (`mask-image`), so she dissolves upward as she leaves the clip instead of being cut along a line. The leading edge is `inset()` with elliptical bottom corners (`round 0 0 50% 50% / 0 0 Rsvh Rsvh`, R = 10svh at the start, shrinking to 0): the middle of the edge leads, below her feet, and the sides trail. The curve starts parked below the bottom of the screen (negative bottom inset) so no wedge of page shows at the start. Only `clip-path` is animated.

Loading approach (code: `splash-launch.ts`, `logo-intro.tsx`):
- The server-rendered shell does **not** carry the `<video>`, and there is no `<link rel="preload" as="video">`. Evaluated and rejected: the splash plays on almost every full load, but a preload link cannot be conditioned on Save-Data (no media feature for it) or on the engine (Safari and every iOS browser need the `.mov`, everyone else the `.webm`; Chrome reports HEVC support but drops its alpha). A link would send 390 KB to every Save-Data visitor, who is exactly the visitor the splash skips, and the wrong file to Safari. The only code that knows the decision is script after the gate, so the takeover starts the download at hydration (a detached `<video preload="auto">`, before the overlay chunk is requested). The cost of that choice is the hydration time between first byte and the start of the download. A new inline script to start it earlier was also rejected: a second CSP hash and a copy of the engine detection in ES5, for a gain that has not been measured.
- The gate script is unchanged and cannot reach `<body>` yet.
- "Ready" is `canplaythrough`, not `canplay`. Past 2.5 s from navigation start the splash goes on without it.
- Known limit, not measured: iOS Safari may not preload media before a gesture; then the clip is not ready by 2.5 s and the visitor gets the 400 ms wipe without Sino, never a stuck screen.
- A Save-Data visitor sees the blank shell from first paint until the takeover mounts and releases the page, because the byte-stable gate cannot read Save-Data. Closing that gap means changing the gate script and its hash.
- `Cache-Control: public, max-age=31536000, immutable` with range requests on `sino-launch.webm` (391,436 bytes) and `.mov` (210,869 bytes): repeat visitors in a new session get the clip from the HTTP cache.
- Measurement marks (DevTools > Performance > Timings, or `performance.getEntriesByType('mark')`): `splash-launch:ready`, `splash-launch:play`, `splash-launch:skipped`, each with `detail.ms` since navigation start. Compare `ready` with the 2.5 s deadline across devices and decide whether to move the deadline.
- Headless check on 2026-10-16 (Chromium headless shell, production build with `LOGO_INTRO_FORCE=1`, localhost): the overlay mounted at about 0.4 to 0.7 s, the lift at about 0.9 to 1.2 s, and the page opened at about 1.3 to 1.6 s. A clip that never answers wipes without Sino and finishes at 2.9 s; a failing clip finishes within 0.3 s; a key press at 0.8 s finishes 0.23 s later; with the script chunks blocked, the shell is inert at 4.8 s and gone at 5 s.

CSP (CPR-53): the gate is an inline script, so a CSP needs its hash or a nonce. The text is byte-stable (its settings are data attributes on the script element), so one hash covers every build. `tests/unit/logo-intro-gate-script.test.tsx` fails if this value goes stale. The exact script (256 bytes):

```js
!function(){try{var s=document.currentScript.dataset;if(s.enabled!=="1"||navigator.webdriver&&s.force!=="1"||window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.dataset.logoIntro="pending"}catch(e){}}()
```

`script-src 'sha256-3/slXI18DknKrY9Rlt2igQvVfP9TqzcOLglT3LO5m3M='` (header form; the test looks for the `sha256-` token).

### 3.2 Hero entrance (every load)

After the intro (or immediately on later visits):

| Order | Element | Animation | Delay |
|---|---|---|---|
| 1 | Eyebrow + headline lines | Fade + rise 16 px, per line (split by line, not by letter) | 0 ms, +60 ms per line |
| 2 | Lead paragraph | Fade + rise 12 px | 180 ms |
| 3 | CTA group | Fade + rise 12 px | 260 ms |
| 4 | Sino stage (glow, orbit ring) | Scale 0.92 to 1 with `--ease-bounce`, fade | 200 ms |
| 5 | Sino | `greet_wave` once per session, then `idle` ([mascot-sino.md](mascot-sino.md)). The hero Sino only waves; the jetpack launch is on the splash (§3.1) | when the canvas is ready, after the splash |

Implementation detail: the server-rendered state is the **final** state. Animations run from a `from` state applied by JS before first paint of the client tree, so users without JS see everything. Never hide content with CSS that only JS can reveal.

## 4. Scroll behaviour

Native scrolling only. **No smooth-scroll hijacking library** (Sintra does not use Lenis either). Anchor links use `scroll-behavior: smooth`, disabled under reduced motion.

### 4.1 Reveal on scroll

Every section below the hero plays one of five presets, chosen by the **role** of the element, so a heading, a card and a picture each move their own way. Nothing is decorative: the motion shows what is arriving and in what order. `Reveal` takes a `variant` prop (default `rise`, which keeps the original behaviour for anything not yet assigned).

| Variant | Role | Motion | Timing | Driver |
|---|---|---|---|---|
| `rise` | Text blocks, forms, share rows, anything without a better role | Fade, rise 24 px | 520 ms `--ease-out-expo`; siblings stagger 50 ms by `index` | IntersectionObserver + CSS |
| `lines` | Section headers (`SectionHeader` inside `Reveal`) | Each title line rises 100% to 0 out of its own mask (`overflow: clip` per line); eyebrow, lead and action follow 120 ms later with a fade and a 12 px rise | 700 ms `--ease-out-expo`, 70 ms per line; parts 600 ms | IntersectionObserver + CSS, line split at runtime |
| `depth` | Cards and grid items | From 40 px down, scale 0.96, rotateX 6 deg (perspective 1000 px, origin bottom) and opacity 0 to rest | 800 ms `--ease-out-expo`, 60 ms stagger by **arrival** (cards that enter together, in document order; a card that enters alone starts at once; capped at six) | IntersectionObserver + CSS |
| `clip` | Pictures, frames and phones that have no motion of their own (article images) | `clip-path: inset(18% 0 0 0 round var(--radius))` to `inset(0)`, wipes up from the bottom edge, while the picture settles from scale 1.06; opacity 0 to 1 in the first 500 ms | 900 ms `--ease-out-expo` | IntersectionObserver + CSS |
| `rise-scale` | The final CTA panel | Scale 0.94 and opacity 0 to rest; corners ease from a 48 px round to the panel's own radius (as a `clip-path` round, so only transform, opacity and clip-path animate) | Scrubbed with scroll while the panel enters (`entry 0%` to `entry 90%` of a view timeline; GSAP: `start: clamp(top 92%)` to `end: clamp(top 50%)`), no clock | CSS `animation-timeline: view()` where supported, GSAP ScrollTrigger `scrub: true` elsewhere |

Shared rules:
- **Server HTML is the final state.** The `from` state is only applied on the client, before first paint, to blocks below the fold (`useReveal`). A block already in view at load, or above it after a scroll restore, is never animated. A reveal plays once.
- **Reduced motion** (section 9): every preset renders the final state. Nothing is split, observed or scrubbed, and the CSS has a matching override in case the preference flips after JS decided.
- **Properties:** transform, opacity and clip-path only. `will-change` is set while a block is hidden or playing and dropped when it settles (`data-reveal="done"`).
- **`lines` split.** The title is measured: each word goes in a span, rendered tops are grouped into lines, and each line becomes `<span data-line aria-hidden>` with an inner span that moves. The heading gets an `aria-label` with its full text, so a screen reader reads it once, as one heading. It re-splits (150 ms debounce, on width change and when web fonts finish loading) while it is still waiting; once the animation settles the original text node is put back, so the heading reflows natively from then on. A title with markup inside (a link, `em`, `br`) is not split and fades and rises as a block.
- **`clip` and poses.** `AnimatedPose` has its own reveal, float and parallax. Inside a `Reveal` (a card, the CTA panel) a pose skips its own rise and rides in with its parent, so there is never a double motion. Use `clip` for pictures that are not poses.
- **`rise-scale` drivers.** Chromium and Safari 26 scrub it natively in CSS, so Home pays no JavaScript for it. Why not GSAP everywhere: GSAP core plus ScrollTrigger is about 26 KB gzip, which on a first visit to Home would sit on top of the Lottie intro (about 45 KB) and pass the 60 KB animation budget of section 10. Browsers without scroll timelines (Firefox, older Safari) load GSAP and ScrollTrigger only when the panel is within one viewport height of the screen, never on page load, and kill them on unmount and route change. Until then the same from state is applied by CSS, and if the chunk never loads the panel plays as a one-shot fade and scale. This is the only GSAP use among the presets.
- **Section progress (optional).** `SectionHeader rule` draws a 1 px hairline under the header with scroll, as a CSS scroll-driven animation (`animation-timeline: view()`, `scaleX` 0 to 1 over the first 35% of the section's travel). It is behind `@supports` and `prefers-reduced-motion: no-preference`; everywhere else the line is simply drawn. Used on the capability bento and the services cards only.
- **Not covered by these presets:** hero sections (own entrance), sticky columns (StickySteps, tables of contents), phone-frame internals and the footer.
- Where each is applied: headers `lines`, every card in a grid (and the mission, contact, featured post and empty-state cards) `depth`, rich-text article images `clip`, the final CTA `rise-scale`; text, forms, tabs, pagination and the FAQ accordion stay `rise`. `tests/unit/scroll-reveal-coverage.test.tsx` checks the roles on every public page.

### 4.2 Sticky step story ("How it works")

Pattern from the Sintra home page: a sticky device mockup on one side, a list of steps on the other. Scroll progress through the section picks the active step.
- Desktop (≥ 1024 px): left column sticky phone mockup, right column 3-4 steps. Active step: title grows (20 to 28 px), body expands (max-height + opacity, `--dur-slow` `--ease-out`), inactive steps dim to 60% opacity. The phone screen crossfades between step screens (450 ms).
- Mapping: GSAP ScrollTrigger with `scrub: true` maps progress to the step index (no pinning, the column is CSS `position: sticky`).
- Mobile: no scroll-jacking. Steps stack vertically, each with its own screen image.
- Steps are also clickable (keyboard and screen readers get a normal tab list).

### 4.3 Scroll-scrubbed scenes

At most **one per page**. A step selector driven by scroll progress (StickySteps, §4.2) does not count as a scene; it only switches content. Scroll-linked motion of the hero mascot ([mascot-sino.md](mascot-sino.md) §5) and the animated stills (§5.1 there) do not count either: they are small, transform-only and never pin the page. Candidates:
- Home "Meet Sino": Sino's helmet turns toward the user and his eyes open as the section scrolls into view (GLB driven by scroll progress, or sprite sequence Q1 from [3d-asset-requirements.md](3d-asset-requirements.md)). Equivalent of Sintra's Lottie helmet section.
- Product capability orbit: capability chips orbit around Sino (Sintra's orbit carousel pattern, 15 s per loop, paused when off-screen).

### 4.4 Marquee

For logo rows or capability tags only. 40-60 px/s linear, duplicated track, edge fade mask 5%, pauses on hover and under reduced motion. Do not use a marquee for customer logos until real customers exist ([copywriting.md](copywriting.md) rule 2).

### 4.5 Sticky CTA bar

Pattern from Sintra pricing: once the hero CTA scrolls out of view, a slim bar slides up from the bottom (yPercent 100 to 0, 400 ms `power2.out`) with the primary CTA and the WhatsApp button. It hides again when the hero is back in view or when the final CTA section is visible. Mobile only on long pages (Home, Services detail, Product).

### 4.6 Parallax

Visuals drift against the scroll at 0.92x, transform only, clamped to ±24 px ([mascot-sino.md](mascot-sino.md) §5.1 has the pose version). Sino poses get it from `AnimatedPose`. Everything else that is a visual (hero images, hero phone mockups, the scene frame) is wrapped in `Parallax` (`src/components/motion/Parallax.tsx`): `mode="top"` for a visual on screen at load (offset follows the page scroll, zero at the top, so nothing jumps), `centre` for one further down. Passive listeners, one rAF per burst, no listener under reduced motion. Not used on sticky columns (StickySteps), on the live Sino canvas hero (the rig has its own scroll motion) or inside clipping frames.

## 5. Navbar

The header has two looks: the regular full-width bar at the top of the page, and a floating pill below it that hides itself when the visitor is idle. The surface and the hide-on-scroll idea come from Sintra's custom header; the floating pill and the idle hide are Sineva's own.

| State | Behaviour |
|---|---|
| At the top (scrollY ≤ 8 px) | Regular full-width header, transparent, sits on the hero aurora gradient. It never hides. |
| Scrolled past the top, scrolling down | Floating nav hidden: `translateY(-100%)` and opacity 0, 240 ms `--ease-out` |
| Scrolling up, anywhere below the top | Floating nav shows at once: a centred pill, 12 px from the top, max-width 1100 px (viewport minus 16 px gutters on mobile), radius `--radius-lg` (20 px), `--surface-nav` + `--blur-nav`, hairline border, `--shadow-md`. Show and hide are translateY plus opacity, 240 ms `--ease-out`. |
| Idle for 2.5 s while floating | Floating nav hides. The timer restarts on every scroll step and on the pointer leaving the nav. |
| Back at the top | Morphs into the regular header: pill surface, inset and width change together, 360 ms `--ease-out-expo`, once per mode change and never per scroll frame |
| Pointer over the nav, dropdown or mobile menu open, keyboard focus inside | Never hides, and the idle timer is paused. Starting any of these shows a hidden nav. A mouse click that focused a link does not count as keyboard focus. |

Modes and events (a pure state machine, `src/components/layout/header-scroll.ts`):

| Mode | Meaning |
|---|---|
| `top` | Regular header |
| `floating-visible` | Pill on screen |
| `floating-hidden` | Pill slid out and faded |

Events: scroll (offset and delta), idle timeout, pointer enter and leave, focus in and out, menu open and close, reach top (≤ 8 px). A downward run needs more than 8 px in total before the pill hides, because wheels and touch scroll in steps of a few pixels. Any upward step shows it.

Implementation rules:
- The `<header>` stays `sticky` and in flow at `--header-height`, so it is the spacer: nothing below it moves (CLS 0). Pages that want the hero behind the transparent header pull up with `-mt-(--header-height)`.
- Only `translate`, `scale` and `opacity` change. The bar keeps the pill's geometry in every mode; at the top its surface is transparent and the logo and actions are offset outwards with a translate, so the regular header looks like the full-width bar. No width, height or `top` animation, on scroll or on mode change.
- The first-load splash ([§3.1](#31-first-load-splash-sino-jetpack-launch)) covers the page and opens it from the bottom up; it does not touch the navbar logo, which has no landing slot.
- Mobile uses the same logic. The burger stays inside the pill, and opening the sheet keeps the pill visible.
- Reduced motion (§9): every change is instant with no morph. The idle hide still applies.

Desktop dropdown (Product, Services, Resources):
- **One shared panel** that morphs its width/height/position between triggers (Sintra pattern): open 200 ms `--ease-bounce` from `scale(0.97) translateY(6px)` and opacity 0; content crossfades 200 ms in / 60 ms out; close 120 ms.
- Opens on hover (with 80 ms intent delay) and on click/Enter. Closes on Escape, outside click, or focus leaving.
- Items: icon (36 px tile) + title + one-line description. Hover background snaps in (60 ms) and fades out (260 ms).
- Sibling dimming: hovering one top-level link dims the others to 60% opacity (250 ms).
- Optional promo card at the bottom of a panel (Sintra "What's new"): eyebrow in Geist Mono, `--color-surface-tint` background, one CTA.
- Chevron rotates 180° on open (300 ms `--ease-out`).

Mobile (< 1024 px):
- Burger button 44 px, rounded 10 px, "pressed key" shadow.
- Full-screen sheet revealed with a clip-path wipe from the top (500 ms `--ease-wipe`, close 250 ms). Rows stagger in (40 ms).
- Sections are accordions. A fixed bottom action bar holds the primary CTA and WhatsApp.
- Body scroll locked while open. Focus trapped. Escape closes.

## 6. Micro-interactions

| Element | Hover | Press | Focus-visible |
|---|---|---|---|
| Primary button (pill) | Background to `--color-action-primary-hover`, lift `translateY(-2px)`, arrow icon nudges `translateX(3px)` | `scale(0.98)` | 2 px ring `--color-focus`, 2 px offset |
| Dark button (nav CTA) | Gradient fill slides up from the bottom (`::before`, 300 ms `cubic-bezier(0.4,0,0.2,1)`) | `scale(0.98)` | same |
| Secondary button | Background to `--ink-50`, border darkens | `scale(0.98)` | same |
| Text link | Underline grows from left (background-size, 240 ms) | | same |
| Card (clickable) | Lift 4 px, shadow `--shadow-sm` to `--shadow-md`, image zooms 1.03 inside its frame (600 ms `--ease-out`) | | Ring on the card |
| Feature card with Sino pose | Sino still nudges up 6 px and tilts 2° (alternating direction on odd/even cards, Sintra's `rotate(±2deg)` pattern) | | |
| Chip / filter | Background tint, selected state pops with `--ease-bounce` | `scale(0.96)` | Ring |
| Accordion (FAQ) | Row background tint | | Ring |
| Accordion open | Height 0 to auto (360 ms `--ease-out`), plus icon rotates to × (45°) | | |
| Input | Border to `--ink-700` | | Border `--teal-700` + 3 px ring `rgba(0,148,155,.2)` |
| Copy-link button | Icon swaps to a check (Lottie `check-pop`), tooltip "Link copied" | | |
| WhatsApp floating button | Subtle breathing scale 1 to 1.04 every 6 s (stops after 3 cycles and on reduced motion), label expands on hover | | |
| Stat number | Counts up once on reveal (odometer reels, 550 ms `power3.out`, 40 ms per digit) | | |

Cursor: default system cursor. No custom cursor (accessibility, and Sintra does not use one either).

## 7. Lottie library

Lottie is used where vector animation beats CSS: brand moments and icon state changes. All files are generated or exported at 60 fps, contain no expressions, no raster images, and no embedded fonts, and stay under 60 KB (intro under 120 KB).

| ID | Lottie | Where | Trigger | Priority |
|---|---|---|---|---|
| L1 | `sineva-logo-intro` | None. Retired from the splash by the owner's decision of 2026-10-16 (§3.1); the file and its build script are kept, nothing loads it | | Retired |
| L2 | `sineva-symbol-intro` | Navbar logo, loader fallback | Load fallback (§3.1), hover replay on the navbar logo (once per 10 s) | P0 (built) |
| L3 | `check-pop` | Form success, copy link, waitlist success | Event | P0 |
| L4 | `send-plane` | Contact form submit button while sending | Event, loops until done | P1 |
| L5 | `typing-dots` | "Sino is thinking" chat mockups on Product page | In view, loop | P1 |
| L6 | `menu-morph` | Burger to close icon | Click | P1 (CSS is an acceptable substitute) |
| L7 | `capability-icons` (5) | Product capability cards (chat, social, sales, finance, ops) | Card hover / in view, play once | P1 |
| L8 | `service-icons` (3) | Services cards (discovery, build, enablement) | Card hover / in view | P1 |
| L9 | `orbit-ring` | Sino stage ring | Loop (slow) | P2 (CSS is the default) |
| L10 | `empty-state` | Blog empty, 404 accent around the Sino still | In view | P2 |

Runtime: `lottie-web` 5.13.0 (MIT), **light build** (`lottie-web/build/player/lottie_light`, SVG renderer only), wrapped in one client component that lazy-loads the player and the JSON, plays when in view, pauses off-screen, and renders the final frame statically under reduced motion. dotLottie (`@lottiefiles/dotlottie-web`) was not chosen because it needs a WASM renderer, which costs more bytes and requires `'wasm-unsafe-eval'` in the CSP.

Style rules for all Lottie files: stroke icons at 1.75 px on a 24 px grid (matches Lucide), colors only from the brand primitives, ease with the curves in §2.1, total duration ≤ 1.2 s for one-shots.

## 8. Implementation stack

| Need | Tool | Why |
|---|---|---|
| Hover, press, color, simple transitions | **CSS only** | No JS cost |
| Reveal on scroll | IntersectionObserver + CSS classes | Tiny, no library |
| Scroll-scrub, sticky steps, odometer, orbit, timelines | **GSAP 3.15.0 + ScrollTrigger** (SplitText if needed), loaded on demand per section | Same tool Sintra uses. All GSAP plugins are free under the GSAP "Standard 'no charge'" license; get a quick license check before launch since it is not an OSI license |
| Lottie | `lottie-web` 5.13.0 light | See §7 |
| 3D mascot | three 0.186.1 | See [mascot-sino.md](mascot-sino.md) |
| Carousels | CSS scroll-snap first; Swiper only if a carousel needs looping | Avoid a 40 KB dependency for simple sliders |

Versions checked with `npm view` on 2026-10-15. Pin exact versions (`.npmrc save-exact`).

## 9. Reduced motion

Under `prefers-reduced-motion: reduce`:
- No logo intro overlay, no Lottie playback (show the final frame), no Sino canvas (poster only), no video loops, no marquee, no parallax, no scroll scrub (sticky steps become a static list), no count-up (show final numbers).
- Keep: opacity fades ≤ 150 ms, focus rings, accordion open/close without height animation.
- Test: run the E2E suite once with `reducedMotion: 'reduce'` in Playwright.

## 10. Performance guardrails

- Animate only `transform` and `opacity` (and `clip-path` for the mobile menu and the splash wipe). Never animate `width`, `height`, `top`, or `box-shadow` on scroll. For accordion height, use GSAP `height: auto` or the CSS `interpolate-size` approach, only on click.
- `will-change` only during an animation, removed after.
- All scroll listeners passive. ScrollTrigger instances killed on route change.
- Animation JS budget: ≤ 60 KB gzip on Home excluding three.js, loaded after hydration.
