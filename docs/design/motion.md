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
| `--dur-scene` | 800-1200 ms | Hero entrance sequence, Lottie intro |

Stagger between siblings: **40-60 ms**, capped at 6 items (later items start together).

## 3. Page load

### 3.1 First-visit logo intro (Lottie)

Requested by the product owner. Built as Lottie from the traced logo SVG (`scripts/lottie/build-logo-intro.mjs`, output `public/lottie/sineva-logo-intro.json` and `sineva-symbol-intro.json`).

Choreography (≤ 1.6 s total):
1. 0-0.55 s: the crescent arcs of the symbol sweep in around the centre (rotate from -40°, scale 0.85 to 1, fade in), staggered clockwise.
2. 0.25-0.75 s: the "S" pops in with a slight overshoot.
3. 0.6-1.0 s: a soft light sweep crosses the symbol.
4. 0.7-1.3 s: the "Sineva" wordmark letters rise in one by one.
5. Hand-off (code, not Lottie): the overlay fades out (200 ms) while the logo shrinks and flies to the navbar logo position (FLIP, 500 ms `--ease-out-expo`), then the hero entrance (§3.2) starts.

Rules (these protect conversion and Core Web Vitals; do not relax them without re-measuring):
- **Once per session**, only on the first page load (sessionStorage flag, wrapped in try/catch). Never on client-side navigation.
- **Hard cap 1.6 s** from first paint to page usable. The overlay never waits for network (no "loading" semantics). The page underneath renders and hydrates normally.
- The overlay is `pointer-events: none` after 1.2 s. Any key press, scroll, or click skips it immediately.
- The page content, including the hero headline, is server-rendered underneath, so the LCP element exists from first paint. The overlay is a solid canvas-colored layer with the Lottie at the centre. **Verify with Lighthouse** that LCP is not delayed by more than 100 ms versus no intro. If it is, switch to the fallback: play the symbol-only Lottie inside the navbar logo slot instead of a full-screen overlay.
- `prefers-reduced-motion`: no overlay, logo is static.
- Lottie player loaded with `next/dynamic` only on the first visit.
- Bots and Lighthouse-like agents get no overlay (`navigator.webdriver` or no JS: nothing renders).

Implementation note (three parts, `src/components/brand/`):
- **Gate** (`intro-gate-script.ts`, rendered by `logo-intro-server.tsx` in `<head>`): a blocking inline script decides before first paint. A client-only decision lets the page paint at about 44 ms and covers it at about 388 ms, a visible flash. It plays when the toggle is on, the session flag is unset, the visitor does not prefer reduced motion and `navigator.webdriver` is false (or the test-only `LOGO_INTRO_FORCE=1` build flag is set). It then claims the session flag and sets `<html data-logo-intro="pending">`. Its truth table is tested against `shouldPlayIntro` for every input combination.
- **Shell** (`LogoIntroShell`, first in `<body>`): a canvas-coloured full-screen layer in the server HTML, shown by CSS only while the marker is present. Pure CSS makes it inert after 1.2 s and fades it out by 1.8 s even if JavaScript never runs.
- **Takeover** (`logo-intro.tsx`, `logo-intro-overlay.tsx`): the client plays the Lottie on top of the shell, runs the FLIP at 1.1 s and removes the marker, which fades the shell. The marker is also removed on skip input, reduced motion, a Lottie that fails or is not ready within 500 ms, and a mount later than 800 ms. Its clock is `performance.now()`, the same clock as the shell's CSS timers.

CSP (CPR-53): the gate is an inline script, so a CSP needs its hash or a nonce. The text is byte-stable (its settings are data attributes on the script element), so one hash covers every build. `tests/unit/logo-intro-gate-script.test.tsx` fails if this value goes stale. The exact script (338 bytes):

```js
!function(){try{var s=document.currentScript.dataset,k="sineva:once:logo-intro",t=sessionStorage;if(s.enabled!=="1"||t.getItem(k)!==null||navigator.webdriver&&s.force!=="1"||window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;t.setItem(k,"1");document.documentElement.dataset.logoIntro="pending"}catch(e){}}()
```

`script-src 'sha256-Q+sYKFt+3ar9/MWCokEfS+mDbusO2z9vGjpMphGvrmQ='` (header form; the test looks for the `sha256-` token).

### 3.2 Hero entrance (every load)

After the intro (or immediately on later visits):

| Order | Element | Animation | Delay |
|---|---|---|---|
| 1 | Eyebrow + headline lines | Fade + rise 16 px, per line (split by line, not by letter) | 0 ms, +60 ms per line |
| 2 | Lead paragraph | Fade + rise 12 px | 180 ms |
| 3 | CTA group | Fade + rise 12 px | 260 ms |
| 4 | Sino stage (glow, orbit ring) | Scale 0.92 to 1 with `--ease-bounce`, fade | 200 ms |
| 5 | Sino | `greet_wave` once per session, then `idle` ([mascot-sino.md](mascot-sino.md)) | when the canvas is ready |

Implementation detail: the server-rendered state is the **final** state. Animations run from a `from` state applied by JS before first paint of the client tree, so users without JS see everything. Never hide content with CSS that only JS can reveal.

## 4. Scroll behaviour

Native scrolling only. **No smooth-scroll hijacking library** (Sintra does not use Lenis either). Anchor links use `scroll-behavior: smooth`, disabled under reduced motion.

### 4.1 Reveal on scroll

- Section headings and cards fade + rise 24 px when 15% of the element enters the viewport. Play once.
- Card grids stagger 50 ms per card.
- Implemented with IntersectionObserver plus CSS classes (no animation library needed). Elements already in view at load are not animated twice.

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
- The page-load logo intro lands on the navbar logo at the top ([§3.1](#31-first-visit-logo-intro-lottie)), which is the `top` mode. The landing slot (`data-logo-intro-target`) is the same element in every mode.
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
| L1 | `sineva-logo-intro` | First-visit overlay | Load, once per session | P0 (built) |
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

- Animate only `transform` and `opacity` (and `clip-path` for the mobile menu). Never animate `width`, `height`, `top`, or `box-shadow` on scroll. For accordion height, use GSAP `height: auto` or the CSS `interpolate-size` approach, only on click.
- `will-change` only during an animation, removed after.
- All scroll listeners passive. ScrollTrigger instances killed on route change.
- Animation JS budget: ≤ 60 KB gzip on Home excluding three.js, loaded after hydration.
