# Accessibility & performance budgets

Quality gates for every page built from this design system. These carry the PRD §13 targets into concrete checks.

## 1. Accessibility (WCAG 2.1 AA)

| Area | Rule | How it is checked |
|---|---|---|
| Contrast | Only token pairs listed as passing in [tokens.md](tokens.md) §1.3. `--teal-500` never carries body text | Unit test over the token table + axe |
| Focus | Every interactive element shows the 2 px `--color-focus` ring on `:focus-visible` | Playwright keyboard pass |
| Keyboard | Navbar dropdowns, mobile menu, accordions, tabs, carousels and dialogs are fully operable; Escape closes overlays; focus returns to the trigger | E2E |
| Motion | `prefers-reduced-motion` honoured as in [motion.md](motion.md) §9 | E2E run with reduced motion |
| Headings | One H1 per page, no skipped levels | axe + unit test on page shells |
| Forms | Visible labels, error summary, `aria-invalid`, `aria-describedby` | Integration + axe |
| Images | Decorative Sino renders `alt=""`, informative ones described ([copywriting.md](copywriting.md) §8) | Review |
| Language | `<html lang="en">` | Integration test |
| Touch | Targets ≥ 44×44 px | Review at 360 px |
| Zoom | Usable at 200% zoom and 360 px width without horizontal scroll | Manual QA (CPR-59) |

## 2. Performance budgets (mobile, Lighthouse default throttling)

| Metric | Budget |
|---|---|
| Lighthouse Performance / A11y / Best practices / SEO | ≥ 90 on Home, Service detail, Work detail, Article, Contact |
| LCP | < 2.5 s (LCP element = headline or Sino poster, never the canvas or the Lottie overlay) |
| CLS | < 0.1 (hero 0) |
| INP | < 200 ms |
| JS (initial, gzip) | ≤ 130 KB on content pages, ≤ 170 KB on Home before lazy chunks |
| Lazy chunks Home | three.js + mascot ≤ 190 KB gzip, GLB ≤ 600 KB brotli, animation libs ≤ 60 KB gzip, all after `load` |
| Fonts | 2 families, variable, subset, `next/font` self-hosted, ≤ 120 KB total |
| Images | AVIF/WebP via `next/image`, hero poster ≤ 120 KB |
| Lottie | ≤ 60 KB each (intro ≤ 120 KB) |

## 3. Release checklist per page

- [ ] Copy checklist passed ([copywriting.md](copywriting.md) §9), no em dash or en dash
- [ ] Only semantic tokens used, no hex in components
- [ ] axe: 0 critical/serious
- [ ] Reduced motion verified
- [ ] Lighthouse mobile ≥ 90 x4
- [ ] Works at 360 px, 768 px, 1024 px, 1440 px
- [ ] All strings from `messages/en.json` or DB
