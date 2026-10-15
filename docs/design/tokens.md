# Design tokens

Source of truth for color, typography, spacing, radius, elevation, and gradients. Implementation: CSS custom properties in `src/app/globals.css`, mapped to Tailwind v4 via `@theme`. **Components must not use hex colors directly**, only semantic tokens (§1.3).

Theme: **light only in v1** (PRD Rev. 3 decision D10). Tokens are still split into *primitive* and *semantic*, so dark mode can be added later by only swapping the semantic values.

All contrast ratios in this document are computed with the WCAG 2.1 formula (relative luminance) as of 15 October 2026. Checker script: QA ticket in the [implementation plan](../superpowers/plans/2026-10-15-website-redesign.md).

## 1. Colors

### 1.1 Origin of the brand color

Taken from the logo SVG gradient (`assets/brand/logos/svg/`):
- Light end: **`#00949B`**
- Dark end of the symbol: `#0A5462`, wordmark: **`#083F4C`**

PRD Rev. 2 mentions ±`#009EA6`. The SVG value is more accurate and is the reference.

`#00949B` on white is only **3.68:1**: allowed for non-text UI elements, large icons, and text ≥ 24 px (or 18.66 px bold). It **must not** be used for body text, links, or white button labels on top of it.

### 1.2 Primitive

| Token | Hex | Notes |
|---|---|---|
| `--teal-50` | `#EAF6F6` | Soft tint background |
| `--teal-100` | `#D3EEEE` | Sino stage glow, badge bg |
| `--teal-200` | `#A6DEDF` | |
| `--teal-300` | `#6CC6C9` | Decorative lines, orbit ring |
| `--teal-400` | `#2FB0B5` | |
| `--teal-500` | `#00949B` | **Brand.** Non-text UI, icons, focus ring |
| `--teal-600` | `#007A80` | Teal text on white 5.13:1 |
| `--teal-700` | `#00686D` | **Primary action.** Primary button, links. 6.56:1 with white |
| `--teal-800` | `#005257` | Primary button hover |
| `--teal-900` | `#083F4C` | Brand deep (wordmark) |
| `--ink-950` | `#0B2A31` | Main text + "dark" button (replaces Sintra's pure black, teal-tinted) |
| `--ink-700` | `#3F5359` | Secondary text |
| `--ink-500` | `#5B6F75` | Tertiary text, captions |
| `--ink-400` | `#7C9197` | Input border (3.30:1 on white, passes 3:1 non-text) |
| `--ink-200` | `#D5E0E2` | Decorative border / divider |
| `--ink-100` | `#E7EEEF` | Soft card border |
| `--ink-50` | `#F5F8F8` | Alternating section canvas |
| `--white` | `#FFFFFF` | Main canvas |
| `--aqua-400` | `#2FE0D8` | Glow accent (from the mascot: antenna orb). **Decorative only** |
| `--mint-200` | `#9FF5EC` | Gradient highlight accent |
| `--sun-100` | `#FFF4E5` | Warm accent (secondary card background), balances the teal |
| `--sun-500` | `#FFB547` | Decorative warm accent (stars, sparkle) |
| `--red-700` | `#B42318` | Error |
| `--red-50` | `#FEF3F2` | Error bg |
| `--green-700` | `#067647` | Success |
| `--green-50` | `#ECFDF3` | Success bg |
| `--amber-700` | `#B54708` | Warning |

### 1.3 Semantic (used by components)

| Token | Value | Verified contrast |
|---|---|---|
| `--color-canvas` | `--white` | |
| `--color-canvas-alt` | `--ink-50` | |
| `--color-surface` | `--white` | |
| `--color-surface-tint` | `--teal-50` | |
| `--color-surface-warm` | `--sun-100` | |
| `--color-surface-inverse` | `--ink-950` | At most one dark section per page (closing CTA / footer), a remnant of Sintra's dark DNA |
| `--color-text` | `--ink-950` | 15.11:1 on white |
| `--color-text-secondary` | `--ink-700` | 8.10:1 on white |
| `--color-text-tertiary` | `--ink-500` | 5.28:1 white, 4.95:1 `--ink-50`, 4.78:1 `--teal-50` |
| `--color-text-inverse` | `--white` | 15.11:1 on `--ink-950` |
| `--color-text-brand` | `--teal-700` | 6.56:1 white, 6.14:1 `--ink-50`, 5.94:1 `--teal-50` |
| `--color-link` | `--teal-700` | same |
| `--color-action-primary` | `--teal-700` | White text 6.56:1 |
| `--color-action-primary-hover` | `--teal-800` | White text 8.96:1 |
| `--color-action-dark` | `--ink-950` | White text 15.11:1 |
| `--color-border` | `--ink-100` | Decorative (not a control boundary) |
| `--color-border-strong` | `--ink-200` | Divider |
| `--color-border-input` | `--ink-400` | 3.30:1 white, 3.09:1 `--ink-50` |
| `--color-focus` | `--teal-500` | Ring 3.68:1 on white (passes 3:1 non-text) |
| `--color-danger` | `--red-700` | 6.57:1 white, 6.05:1 on `--red-50` |
| `--color-success` | `--green-700` | 5.69:1 white, 5.40:1 on `--green-50` |

### 1.4 Gradients

Sintra uses saturated purple/blue gradients on a black background. Sineva's light version: **a soft "aurora" gradient on white** + one strong brand gradient for key moments.

| Token | Value | Used for |
|---|---|---|
| `--gradient-brand` | `linear-gradient(135deg, #00949B 0%, #00686D 55%, #083F4C 100%)` | Large feature cards, "New" badge, special buttons (rarely) |
| `--gradient-aurora` | `radial-gradient(60% 50% at 20% 0%, rgba(47,224,216,.18), transparent 70%), radial-gradient(50% 45% at 85% 10%, rgba(0,148,155,.14), transparent 70%), radial-gradient(40% 40% at 50% 100%, rgba(255,181,71,.10), transparent 70%)` | Hero background, closing CTA background |
| `--gradient-glow-teal` | `radial-gradient(closest-side, rgba(0,148,155,.22), transparent)` | Glow behind the active card and Sino |
| `--gradient-text` | `linear-gradient(90deg, #00686D, #00949B 60%, #2FB0B5)` | Highlight 1-3 words in a headline (`background-clip: text`). Only for text ≥ 40 px; the light end color still ≥ 3:1 on white |
| `--gradient-card-sheen` | `linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,0) 40%)` | Thin sheen on top of a card |
| `--gradient-cover-teal` | `linear-gradient(160deg, #6CC6C9, #00949B 60%, #00686D)` | Blog/OG cover background |
| `--gradient-cover-sun` | `linear-gradient(160deg, #FFE1B0, #FFB547)` | Cover variation |
| `--gradient-cover-mint` | `linear-gradient(160deg, #EAF6F6, #9FF5EC)` | Cover variation |

Rule: at most **one** saturated gradient (`--gradient-brand`) per viewport. Aurora is allowed as a section background.

## 2. Typography

### 2.1 Fonts

| Role | Font | Reason |
|---|---|---|
| Display + body | **Plus Jakarta Sans** (variable, 400-800) | Geometric sans with a friendly character, a similar feel to GT Walsheim used by Sintra (GT Walsheim is commercially licensed). Designed for a Jakarta identity, fits the Indonesian brand story. Full glyphs for EN and ID |
| Label / eyebrow / technical numbers | **Geist Mono** (400-600) | Sintra uses mono for eyebrows ("WHAT'S NEW") and copyright. Gives a "tech" feel without feeling cold |

Loaded via `next/font/google` (self-hosted at build time, no requests to Google at runtime). Both are available in the font data of the installed `next` 16.4.0. `display: swap`, subsets `latin` + `latin-ext`.

> **Conflict to resolve:** Farhan's CPR-26 spec (local commit `baff2e0`, not yet pushed) uses Manrope and the action teal `#077A7E`. This document supersedes that decision. `#077A7E` vs `--teal-700 #00686D`: both pass AA. Pick one when CPR-26 resumes (recommendation: these tokens, because the contrast is higher and they derive from a consistent scale).

### 2.2 Scale (fluid, mobile 360 px → desktop 1440 px)

| Token | Size | Line-height | Tracking | Weight | Used for |
|---|---|---|---|---|---|
| `--text-display` | `clamp(2.75rem, 1.9rem + 3.8vw, 4.5rem)` (44→72) | 1.0 | -0.035em | 600 | Hero H1 |
| `--text-h1` | `clamp(2.25rem, 1.7rem + 2.4vw, 3.75rem)` (36→60) | 1.05 | -0.03em | 600 | H1 of inner pages |
| `--text-h2` | `clamp(1.875rem, 1.5rem + 1.6vw, 3rem)` (30→48) | 1.1 | -0.025em | 600 | Section title |
| `--text-h3` | `clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)` (22→28) | 1.2 | -0.015em | 600 | Large card title |
| `--text-h4` | `1.25rem` (20) | 1.3 | -0.01em | 600 | Card title |
| `--text-lead` | `clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)` (18→20) | 1.6 | 0 | 400 | Hero/section subtitle |
| `--text-body` | `1.0625rem` (17) | 1.65 | 0 | 400 | Body (Sintra: 17-18 px) |
| `--text-body-sm` | `0.9375rem` (15) | 1.55 | 0 | 400 | Card text, captions |
| `--text-label` | `0.9375rem` (15) | 1.2 | 0 | 500 | Buttons, nav, form labels |
| `--text-eyebrow` | `0.75rem` (12), Geist Mono | 1.2 | 0.08em, UPPERCASE | 500 | Section eyebrow |
| `--text-micro` | `0.8125rem` (13) | 1.4 | 0 | 400 | Legal, article meta |

Sintra patterns kept: **large headlines, medium-semibold weight (not bold), negative tracking of ±3%, tight line-height.** Body stays large (17 px) and airy.

Rules:
- Body line length 60-72 characters (`max-width: 65ch`).
- Blog articles: body 18 px, line-height 1.7.
- Statistic numbers use `font-variant-numeric: tabular-nums`.

## 3. Spacing & layout

4 px base.

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--space-1` | 4 px | | `--space-8` | 32 px |
| `--space-2` | 8 px | | `--space-10` | 40 px |
| `--space-3` | 12 px | | `--space-12` | 48 px |
| `--space-4` | 16 px | | `--space-16` | 64 px |
| `--space-5` | 20 px | | `--space-20` | 80 px |
| `--space-6` | 24 px | | `--space-24` | 96 px |
| | | | `--space-32` | 128 px |

| Layout token | Value |
|---|---|
| `--container-max` | 1240 px (content), 1360 px (hero/full-bleed card) |
| `--container-text` | 720 px (articles, centered titles) |
| `--gutter` | 16 px (< 640), 24 px (640-1023), 32 px (≥ 1024) |
| `--section-y` | `clamp(4rem, 3rem + 5vw, 8rem)` (64→128) |
| Grid | 12 columns desktop, 6 tablet, 4 mobile, gap 24 px |
| Breakpoint | `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1440`. Minimum supported 360 px |

Rhythm from Sintra: very airy sections (large vertical padding), centered content for section intros, then asymmetric content (text left, visual right) below.

## 4. Radius

| Token | Value | Used for |
|---|---|---|
| `--radius-xs` | 6 px | Small badges, tags |
| `--radius-sm` | 10 px | Nav buttons, inputs (Sintra: 9-11 px) |
| `--radius-md` | 14 px | Dropdowns, toasts, menu items |
| `--radius-lg` | 20 px | Cards |
| `--radius-xl` | 28 px | Large feature cards, media frames |
| `--radius-2xl` | 36 px | Full-bleed hero / closing CTA panels |
| `--radius-pill` | 999 px | Primary CTA buttons, filter chips |

Nested radius rule: inner radius = outer radius − padding (example: a 20 px card with 8 px padding → the image inside gets 12 px).

## 5. Elevation

A light UI needs more noticeable shadows than Sintra (which relies on black contrast). Shadows are ink-teal tinted, not pure black.

| Token | Value | Used for |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(11,42,49,.06)` | Inputs, chips |
| `--shadow-sm` | `0 1px 2px rgba(11,42,49,.05), 0 2px 8px rgba(11,42,49,.06)` | Default card |
| `--shadow-md` | `0 4px 12px rgba(11,42,49,.06), 0 12px 32px rgba(11,42,49,.08)` | Card hover, dropdown |
| `--shadow-lg` | `0 12px 24px rgba(11,42,49,.08), 0 32px 64px rgba(11,42,49,.12)` | Modal, phone mockup |
| `--shadow-glow` | `0 0 0 1px rgba(0,148,155,.12), 0 12px 40px rgba(0,148,155,.22)` | "Featured" card, visual focus |
| `--shadow-button-bevel` | `inset 0 1px 0 rgba(255,255,255,.22), inset 0 -1.5px 0 rgba(0,0,0,.18), 0 1px 2px rgba(11,42,49,.18)` | Primary/dark button. Adapted from Sintra's button bevel (`inset 0 1.5px 0 #fff, inset 0 -1.5px 0 ...`) which makes the button feel "pressable" |
| `--shadow-button-bevel-light` | `inset 0 1.5px 0 #fff, inset 0 -1.5px 0 #E3EAEC, 0 0 0 1px rgba(11,42,49,.08), 0 1px 2px rgba(11,42,49,.06)` | White secondary button |

## 6. Surface effects

| Token | Value | Used for |
|---|---|---|
| `--blur-nav` | `saturate(180%) blur(14px)` | Navbar when scrolled |
| `--surface-nav` | `rgba(255,255,255,.78)` | Navbar background when scrolled |
| `--noise` | SVG noise 3% opacity | Optional on the aurora gradient to prevent banding |
| `--border-hairline` | `1px solid rgba(11,42,49,.08)` | Card edge line on a white canvas |

## 7. Icons

- Set: **Lucide** (stroke, 1.75 px at 24 px), consistent with the geometric feel.
- Sizes: 16 (inline), 20 (buttons), 24 (cards), 32/40 (features with a container).
- Important feature icons use 3D icons (I1-I8, [3d-asset-requirements.md](3d-asset-requirements.md)).
- Icon color: `--color-text-secondary` by default, `--teal-500` for accents (non-text, 3:1 is enough).

## 8. Implementation example (reference, not final code)

```css
@theme {
  --color-canvas: var(--white);
  --color-text: var(--ink-950);
  --color-action-primary: var(--teal-700);
  --font-sans: var(--font-plus-jakarta-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --radius-card: 20px;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Motion tokens (`--ease-*`, `--duration-*`) are in [motion.md](motion.md).
