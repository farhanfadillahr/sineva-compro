# Components

Specs for the shared UI kit used by the public site. Values reference [tokens.md](tokens.md) and [motion.md](motion.md). Every component:
- uses semantic tokens only (no hex in components),
- has visible `:focus-visible` (2 px `--color-focus` ring, 2 px offset),
- works by keyboard, and has a 44×44 px minimum touch target,
- takes its text from `messages/*.json` or DB content, never hardcoded strings.

The admin (`/admin`) keeps its own simpler kit (tables, forms, dialogs) built on the same tokens. Admin components are out of scope for this file except where noted.

## 1. Buttons

Two shapes, like Sintra: a **pill** for marketing CTAs and a **rounded-square** for compact UI (nav, forms, toolbars).

| Variant | Shape | Background | Text | Border / shadow | Use |
|---|---|---|---|---|---|
| `primary` | pill | `--color-action-primary` | white | `--shadow-button-bevel` | One per section: consultation, waitlist |
| `dark` | rounded-square 10 px | `--color-action-dark` + hover gradient fill sweep | white | `--shadow-button-bevel` | Nav CTA, inverse sections |
| `secondary` | pill | white | `--color-text` | `--shadow-button-bevel-light` | Second CTA next to primary |
| `ghost` | rounded-square | transparent | `--color-text` | none, hover `--ink-50` | Nav "Log in"-style links, toolbars |
| `link` | none | none | `--color-link` | underline grows on hover | Inline "Read article" |
| `whatsapp` | pill | white | `--color-text` + green WhatsApp glyph | light bevel | All WhatsApp CTAs (brand-neutral surface, the icon carries the meaning) |

Sizes:

| Size | Height | Padding x | Font |
|---|---|---|---|
| `sm` | 36 px | 14 px | `--text-label` 14 px |
| `md` (default) | 44 px | 20 px | `--text-label` 15 px |
| `lg` | 52 px | 24 px | 16 px |
| `xl` | 60 px | 28 px | 17 px (hero only) |

Anatomy: `[leading icon] label [trailing arrow]`. Trailing arrow (Lucide `arrow-right`, 16 px) on primary CTAs that navigate, nudges 3 px on hover. Loading state: label stays, spinner or Lottie L4 replaces the trailing icon, `aria-busy="true"`, button disabled.

States: see [motion.md](motion.md) §6. Disabled: 45% opacity, no hover, `aria-disabled`.

Button group: horizontal, gap 12 px, wraps on mobile; on < 400 px the group stacks full width with primary first.

## 2. Navbar

Structure (desktop ≥ 1024 px):

```
[Logo]   Product ▾   Services ▾   Work   Blog   About        [Chat on WhatsApp (ghost)] [Book a consultation (dark)]
```

- Height 72 px, container `--container-max` 1360, padding x 32.
- Logo: stacked logo is too tall for the bar, use **symbol + wordmark horizontal lockup** (needs an export, see [README.md](README.md) open items) at 28 px height. Until it exists: symbol 28 px + "Sineva" set in Plus Jakarta Sans 600 20 px, tracking -0.02em, `--teal-900`.
- Two looks. At the top of the page (scrollY ≤ 8 px) it is the regular full-width bar described above, transparent. Below the top it becomes a floating pill: centred, 12 px from the top, max-width 1100 px (16 px gutters on mobile), radius `--radius-lg`, `--surface-nav` + `--blur-nav`, hairline border, `--shadow-md`, 60 px tall. The pill is hidden while scrolling down, shows on any upward scroll, and hides again after 2.5 s without scrolling, unless the pointer is over it, a dropdown or the mobile menu is open, or keyboard focus is inside. Returning to the top morphs it back into the regular bar. Full rules, timings and the state machine: [motion.md](motion.md) §5.
- The 72 px height above is the slot the header reserves in the page flow (`--header-height`); the floating pill sits inside it, so it never moves page content. The burger stays inside the pill on mobile.
- Dropdowns morph between triggers as before ([motion.md](motion.md) §5, desktop dropdown).
- Dropdown panel: white, radius `--radius-lg`, border `--border-hairline`, shadow `--shadow-md`, padding 8. Item = 36 px icon tile (`--color-surface-tint`, radius 10, teal icon) + title (15 px 600) + description (13 px `--color-text-tertiary`). Item padding 12, radius 12, hover bg `--ink-50`.
- Product panel: one item per capability group + promo card "Join the waitlist".
- Services panel: AI Discovery, AI Build, AI Enablement + "See all services".
- Mobile (< 1024): logo + burger. Sheet menu with accordions, bottom action bar with primary CTA and WhatsApp. The language switcher (CPR-101) shows the other language: the short code (`ID`/`EN`) next to the theme toggle on desktop, the full name ("Bahasa Indonesia"/"English") under the menu links on mobile. It opens the counterpart page; an article or project opens the list of the other language.

## 3. Footer

Light by default (light-only theme), sits on `--color-canvas-alt`.
- Top band: final CTA panel lives in the page, not the footer (see page patterns).
- Columns (4 on desktop, 2 on tablet, accordion on mobile): Product, Services, Company (About, Work, Blog, Contact), Legal (Privacy policy).
- Bottom row: symbol logo, social icons (only accounts that exist), `© 2026 Sineva` in Geist Mono 12 px, legal/address lines hidden while empty (FR-GLB-03).
- Large wordmark watermark ("Sineva" at ~20vw, `--ink-100`, cropped at the bottom edge) as a quiet brand moment, like Sintra's giant footer logo. Decorative, `aria-hidden`.

## 4. Cards

| Card | Spec | Hover |
|---|---|---|
| `card-base` | `--color-surface`, radius `--radius-lg`, `--border-hairline`, `--shadow-sm`, padding 24 (32 ≥ 1024) | Lift + `--shadow-md` if clickable |
| `card-path` (Home two-path cards) | Radius `--radius-xl`, min-height 420, large Sino pose bottom-right, eyebrow + h3 + body + CTA top-left. Product card: `--color-surface-tint` + aurora glow. Services card: `--color-surface-warm` | Sino pose nudges up 6 px, glow intensifies |
| `card-task` (capability, Sintra's "Soshie, schedule..." cards) | Radius `--radius-xl`, tinted surface per capability (teal-50, sun-100, mint tint, ink-50 alternating), title phrased as a request to Sino, body, phone mockup or Sino pose bleeding off the bottom edge, `--shadow-glow` on the featured one | Pose tilt ±2° alternating |
| `card-feature` | 3D icon (64 px) or Lucide in 40 px tile, h4, body-sm | Icon Lottie plays once |
| `card-work` (portfolio) | 16:10 cover in nested radius, "Internal demo project" badge when applicable (FR-PF-03), title, one-line summary, service tags | Cover zoom 1.03 |
| `card-post` (blog) | 16:9 cover, category chip, title (h4, 2-line clamp), date + read time (micro, mono) | Cover zoom, title underline |
| `card-stat` | Big number (`--text-h1`, tabular), label below. **Only real numbers**, see [copywriting.md](copywriting.md) | Count-up on reveal |
| `card-step` | Mono step number in 32 px circle (`--color-surface-tint`), title, body. Used in contact and process lists (Sintra book-a-demo pattern) | none |

## 5. Badges, chips, tags

| Component | Spec |
|---|---|
| `badge` | 24 px tall, radius `--radius-xs`, 12 px 500, tones: `brand` (teal-50 bg, teal-700 text), `warm` (sun-100, ink-950), `neutral` (ink-50, ink-700), `success`, `danger` |
| `badge-soon` | "Coming soon": brand tone + small pulsing dot (2 s, stops under reduced motion) |
| `eyebrow` | Geist Mono 12 px uppercase 0.08em, `--color-text-brand`; optional leading 6 px dot |
| `chip-filter` | 36 px pill, `--ink-50` bg, selected `--teal-50` bg + teal-700 text + check icon. Used for blog categories and work filters (Sintra blog pattern) |
| `meta-chip` | Inline icon + text, 14 px `--color-text-secondary`, separated by a middle dot `·` (e.g. "15 min call · No obligation") |

## 6. Forms

| Element | Spec |
|---|---|
| Label | `--text-label` 15/500, above the field, required marker is the word "(required)" hidden visually only if every field is required (screen readers still get `aria-required`) |
| Input / select / textarea | Height 48 (textarea min 128), radius `--radius-sm`, border 1 px `--color-border-input`, bg white, padding 12 16, 16 px text (prevents iOS zoom). Hover border `--ink-700`. Focus border `--teal-700` + 3 px ring `rgba(0,148,155,.2)` |
| Helper | 13 px `--color-text-tertiary`, linked with `aria-describedby` |
| Error | 13 px `--color-danger` + alert-circle icon, field border `--color-danger`, `aria-invalid`, error summary at top on submit with links to fields |
| Checkbox | 20 px, radius 6, checked `--color-action-primary` with white check, label clickable |
| Select | Native `<select>` styled (no custom listbox in v1) |
| Phone | `inputmode="tel"`, placeholder `+62 812 3456 7890`, normalised server-side (FR-LEAD) |
| Honeypot | Visually hidden, `tabindex="-1"`, `autocomplete="off"` |
| Turnstile | Placed above submit, managed mode, label "Security check" for context |

Form card (contact page): white `card-base` with radius `--radius-xl`, padding 32, `--shadow-md`, on a `--color-canvas-alt` page.

## 7. Accordion (FAQ)

- Row: question 18 px 600, padding 20 0, divider `--color-border-strong` (dashed hairline variant allowed in inverse panels).
- Icon: plus rotating to × (45°).
- Behaviour: multiple can be open; all closed by default; open/close animation in [motion.md](motion.md) §6.
- Markup: `<button aria-expanded aria-controls>` + region. FAQ content also emitted as `FAQPage` JSON-LD where the PRD requires it.
- Layout on Home and Services: two columns on desktop (title + intro + CTA left, list right), Sintra FAQ layout.

## 8. Tabs and segmented control

- Segmented control (e.g. "For online shops / For cafes / For services" on Product): track `--ink-50` radius pill, active segment white + `--shadow-xs`, sliding indicator (240 ms `--ease-out`). ARIA tabs pattern.
- Long lists use chips (§5) instead of tabs.

## 9. Comparison table (optional, Product page)

Sintra highlights its own column. Sineva variant compares **ways of working** (Doing it manually · Generic AI chat · Sineva AI Agents), not named competitors, to avoid unverifiable claims.
- Highlighted column: `--color-action-primary` background, white text, radius 22 px top and bottom, extends 16 px above and below the table, contains the CTA at the bottom, Sino S12 peeking over the top edge.
- Rows: radius 16, alternating `--ink-50`.
- Icons: check (teal) and minus (ink-400). Never a red cross for "others" (tone).
- Mobile: becomes stacked cards per approach.

## 10. Media frames

| Component | Spec |
|---|---|
| `device-phone` | Pre-rendered phone frame ([3d-asset-requirements.md](3d-asset-requirements.md) §4) with an HTML screen inside, `--shadow-lg` |
| `device-laptop` | Same pattern |
| `media-frame` | Radius `--radius-xl`, 1 px hairline, optional `--gradient-card-sheen` overlay |
| `sino-stage` | Glow + orbit ring + contact shadow wrapper for any Sino still or canvas ([mascot-sino.md](mascot-sino.md) §4) |
| `ui-chip` | Floating mini UI cards around mockups ("12 new chats answered", "Draft ready to review"), white, radius 14, `--shadow-md`, gentle float animation (6 s, 6 px). Content must describe real product behaviour |

## 11. Feedback

| Component | Spec |
|---|---|
| Toast | Bottom center, white, radius `--radius-md`, `--shadow-lg`, icon + text + optional action, auto-dismiss 5 s (pauses on hover/focus), `role="status"` |
| Inline alert | Tinted bg by tone, 1 px border, icon, title + body |
| Empty state | Sino S11/S13 still (160 px) + headline + body + one CTA |
| Skeleton | `--ink-50` blocks with shimmer (1.4 s), not under reduced motion |

## 12. Floating WhatsApp button

- Bottom-right, 56 px circle on mobile, pill with label "Chat with us" on desktop (label collapses to icon after first scroll).
- White surface, green glyph, `--shadow-lg`. Sits above the sticky CTA bar when that bar is visible.
- Context-aware message template ([copywriting.md](copywriting.md) §6). Fires `whatsapp_click` with `location=floating`.

## 13. Section primitives

| Primitive | Spec |
|---|---|
| `Section` | Vertical padding `--section-y`, optional `tone`: `canvas`, `alt`, `tint`, `warm`, `inverse`, `aurora` |
| `SectionHeader` | Eyebrow, h2 (max 16 ch per line target), lead, optional CTA. Align `center` (intro sections) or `start` |
| `Container` | `--container-max` + `--gutter` |
| `Split` | 12-col grid, text 5 cols + visual 7 cols (or reversed), stacks on mobile with visual second |
| `BentoGrid` | 6-col desktop grid with 1×1, 2×1, 2×2 tiles, gap 16 |
