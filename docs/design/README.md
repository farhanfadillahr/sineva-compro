# Sineva design system

Single source of truth for how the Sineva public website looks, moves, and speaks. Approved direction: PRD Rev. 3 (2026-10-15). Light theme only, English copy, Sintra-inspired.

## Read this first (agents and humans)

1. **Always** read [brand-positioning.md](brand-positioning.md) and [copywriting.md](copywriting.md) before writing any UI or copy.
2. Then read only the files your task needs, using the table below.
3. Never hardcode colors, font sizes, radii, shadows, easings or durations. Use the tokens.
4. Never write `—` or `–` in public copy. Never invent numbers, testimonials or client logos.
5. If a doc and the code disagree, the doc wins for design decisions; raise it in the ticket.

## Which file for which task

| Task | Read |
|---|---|
| Any UI work | [tokens.md](tokens.md), [components.md](components.md) |
| Building or changing a page | [page-patterns.md](page-patterns.md), [components.md](components.md), [copywriting.md](copywriting.md) |
| Animation, scroll, hover, navbar behaviour, Lottie | [motion.md](motion.md) |
| Sino mascot (3D canvas, poses, states) | [mascot-sino.md](mascot-sino.md) |
| Producing new 3D renders, loops, icons | [3d-asset-requirements.md](3d-asset-requirements.md) |
| Copy, CTAs, microcopy, WhatsApp/email text, metadata | [copywriting.md](copywriting.md) |
| Accessibility and performance checks before merge | [accessibility-performance.md](accessibility-performance.md) |
| Why a pattern exists, Sintra evidence | [research/sintra-reference.md](research/sintra-reference.md) |
| Admin / CMS screens and components | [admin-ui.md](admin-ui.md), then [tokens.md](tokens.md) |
| Roadmap and ticket mapping | [website redesign plan](../superpowers/plans/2026-10-15-website-redesign.md), [admin CMS plan](../superpowers/plans/2026-10-15-admin-cms.md), [Linear alignment](../superpowers/plans/2026-10-15-linear-alignment.md) |

## Files

| File | Contents |
|---|---|
| [brand-positioning.md](brand-positioning.md) | Who Sineva is, two pillars (Product, Services), audience, personality, language policy |
| [copywriting.md](copywriting.md) | Voice, hard rules (no em dash, no unverified claims), CTA lexicon, microcopy, WhatsApp templates, metadata |
| [tokens.md](tokens.md) | Color (primitive + semantic, verified contrast), gradients, typography, spacing, radius, elevation, icons |
| [motion.md](motion.md) | Easing/duration tokens, logo intro, hero entrance, scroll patterns, navbar, micro-interactions, Lottie library, reduced motion |
| [components.md](components.md) | Buttons, navbar, footer, cards, badges, forms, accordion, tabs, comparison table, media frames, feedback |
| [page-patterns.md](page-patterns.md) | Sitemap (EN, i18n-ready), section order per page, reusable section blocks |
| [mascot-sino.md](mascot-sino.md) | Sino asset facts, loading strategy, choreography, per-page usage |
| [3d-asset-requirements.md](3d-asset-requirements.md) | Specs for new clips, poses, scenes, loops, icons, OG/cover kit |
| [accessibility-performance.md](accessibility-performance.md) | WCAG checks and performance budgets |
| [admin-ui.md](admin-ui.md) | Admin (CMS) layout, hierarchical sidebar, data table, pagination, charts, dropzone, calendar, profile settings, key screens |
| [research/sintra-reference.md](research/sintra-reference.md) | Observed Sintra patterns with adopt / adapt / reject |

## Built assets

| Asset | Path | Source |
|---|---|---|
| Logo intro Lottie (stacked) | `public/lottie/sineva-logo-intro.json` | `scripts/lottie/build-logo-intro.mjs` |
| Symbol intro Lottie | `public/lottie/sineva-symbol-intro.json` | same |
| Logo SVG/PNG | `assets/brand/logos/` | traced from source PNG |
| Sino GLB + renders | `../sino-3d-mascot/export/` (separate project) | Blender |

## Open items

| Item | Owner |
|---|---|
| Product final name (working name "Sineva AI Agents") | Founder (PRD Q9) |
| Final service names and offers | Founder (Q10) |
| Product capabilities confirmed | Team `CBT` (Q11) |
| Horizontal logo lockup (symbol + wordmark) for the navbar | Design (export from Figma) |
| Reconcile CPR-26 local spec `baff2e0` (Manrope, `#077A7E`) with these tokens | Farhan + Faishal |
| Sino GLB asset fixes before the realtime hero ships | `sino-3d-mascot` |
