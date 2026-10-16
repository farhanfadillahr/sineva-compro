# Website redesign implementation plan (Rev. 3)

| | |
|---|---|
| Date | 2026-10-15 |
| Owner | Product owner (Faishal) with Founder approval |
| Inputs | [PRD Rev. 3](../../prd/2026-10-14-company-profile-prd.md), [design system](../../design/README.md), [Sintra research](../../design/research/sintra-reference.md) |
| Ticket changes | [Linear alignment](2026-10-15-linear-alignment.md) |

## 1. What changes and why

| Area | Before (PRD Rev. 2) | After (Rev. 3) |
|---|---|---|
| Brand | Sineva Tech | **Sineva** |
| Positioning | Custom dev services (Web Development, AI & Automation) + chatbot teaser | **AI consulting company** with two pillars: Product (AI agents for UMKM) and Services (AI Discovery, AI Build, AI Enablement) |
| Language | `id` default, `id` + `en` at launch | **`en` default and only locale at launch**, i18n-ready, `localePrefix: 'as-needed'` |
| Theme | Light + dark with toggle | **Light only** in v1 |
| Visual direction | Undefined (CPR-18 open) | Sintra-inspired, light: big tight headlines, pill CTAs with bevel, soft aurora gradients, glow cards, Sino mascot ([design docs](../../design/README.md)) |
| Motion | Not specified | Motion system: logo intro Lottie, hero entrance, hide-on-scroll nav with morphing dropdown, sticky step stories, micro-interactions |
| Mascot | None | Sino: realtime 3D in Home hero, pre-rendered everywhere else |
| Copy | ID first | EN, simple, CTA-led, **no em dash or en dash**, no unverified claims |
| Media storage | Cloudflare R2 | **SeaweedFS** (self-hosted, S3-compatible) on the VPS, behind Cloudflare CDN |
| DB backup | R2, 14 days | SeaweedFS bucket **plus an off-host copy** (target: open question Q8), 14 days |

## 2. Gotchas to handle first

1. **Unpushed CPR-26 work.** Farhan has a local spec commit `baff2e0` (Manrope, action teal `#077A7E`, jsdom + Testing Library, `/admin/ui` gallery) that is not on the remote. The new tokens supersede the font and color choices. Coordinate before anyone builds components, or two kits will exist.
2. **CPR-25 routing changes.** The shipped routing uses `localePrefix: 'always'` with `id` as default and Indonesian slugs. Moving to `en`-only with `'as-needed'` changes every public URL and breaks the existing CPR-25 integration tests (58-case locale matrix). Rewrite the tests first (TDD), then the routing.
3. **Mascot asset is not web-ready.** 13.8 MB, ±430k triangles, 114 draw calls, transmission material. Ship the poster/video fallback first; the realtime canvas is gated behind the asset fixes in [mascot-sino.md](../../design/mascot-sino.md) §1.1.
4. **Logo intro vs LCP.** A full-screen overlay can hurt LCP and conversion. The intro is capped at 1.6 s, skippable, once per session, and must be measured (≤ 100 ms LCP regression) before it ships. Fallback: navbar-only symbol animation.
5. **SeaweedFS on the same VPS as the database.** One disk failure loses both media and backups. Backups need an off-host copy (Q8). Also verify S3 compatibility for every operation the media adapter uses (PutObject, GetObject, DeleteObject, HeadObject, presigned GET/PUT, multipart if uploads > 5 MB).
6. **CSP.** Draco/meshopt decoders and the three.js shaders need `'wasm-unsafe-eval'` (decoder) and no `unsafe-eval` otherwise; Lottie light (SVG renderer) works without `eval`. Media host (SeaweedFS behind CDN) must be in `img-src`. Validate in CPR-53.
7. **GSAP license** is the GSAP "Standard 'no charge'" license, not OSI. Fine for a marketing site in principle; record a quick license check.
8. **Copy claims.** Sintra's social proof (40,000+ users, star reviews, press logos) cannot be mirrored without real data. Sections that depend on proof are hidden until data exists.
9. **Product facts.** Product capabilities, name, and channels must be confirmed by team `CBT` before copy goes live (Q9, Q11).

## 3. Technical decisions

| Decision | Choice | Notes |
|---|---|---|
| Tokens | CSS variables in `globals.css`, mapped to Tailwind v4 `@theme`, primitive + semantic layers | [tokens.md](../../design/tokens.md) |
| Fonts | Plus Jakarta Sans (variable) + Geist Mono via `next/font/google` | Self-hosted at build |
| i18n | next-intl, `locales: ['en']`, `defaultLocale: 'en'`, `localePrefix: 'as-needed'`, pathnames registry kept so `id` can be added | Root layout `lang="en"` |
| Animation | CSS first; GSAP 3.15.0 + ScrollTrigger lazy per section; IntersectionObserver reveals | [motion.md](../../design/motion.md) §8 |
| Lottie | `lottie-web` 5.13.0 light build in one lazy client component | JSON in `public/lottie/` |
| 3D | three 0.186.1 vanilla, client-only, `next/dynamic` `ssr:false`, draco decoder self-hosted | [mascot-sino.md](../../design/mascot-sino.md) |
| Media storage | SeaweedFS S3 gateway; app uses the AWS SDK v3 S3 client with a custom endpoint and path-style addressing, behind a `MediaStore` interface so the backend is swappable | Keys in env, never in repo |
| Media delivery | Public read bucket for published media behind Cloudflare CDN (`media.<domain>`), private bucket for drafts and backups | Cache-Control immutable + content-hash names |
| Testing | Vitest unit (add jsdom + Testing Library for components), DB/HTTP suites as today, Playwright E2E (CPR-56) incl. a reduced-motion run | TDD for every feature |

Versions above were checked with `npm view` on 2026-10-15. Re-check at install time and pin exact.

## 4. Phases

Phases are ordered by dependency. Ticket IDs refer to the [Linear alignment](2026-10-15-linear-alignment.md) (existing `CPR-n` or new `NEW-n` until Linear assigns numbers).

### Phase 0: Decisions and docs (this change)
- PRD Rev. 3, design system docs, research, ticket alignment. **Done in docs, pending review.**
- Founder confirms: product name (Q9), service names (Q10), product capabilities with `CBT` (Q11), off-host backup target (Q8).

### Phase 1: Foundations (M2 start)
1. `NEW-i18n-en` (CPR-72): English default, single locale, `'as-needed'` prefix, update pathnames, update/replace CPR-25 tests.
2. `CPR-26` (re-scoped): tokens in CSS + Tailwind, fonts, base components (Button, Link, Input, Select, Textarea, Checkbox, Card variants, Badge, Chip, Eyebrow, Container, Section, Split), light only, Testing Library tests.
3. `NEW-copy-lint` (CPR-73): unit test that fails on `—` / `–` in `messages/*.json`; shared validator reused by admin content forms.
4. `NEW-motion-foundation` (CPR-74): motion tokens, reveal-on-scroll utility, reduced-motion hook, GSAP loader, Lottie player component.
5. `CPR-32` (re-scoped): header with hide-on-scroll and morphing dropdown, mobile wipe menu, footer, floating WhatsApp, sticky CTA bar.

### Phase 2: Infra for content (parallel with Phase 1)

> **Hosting note (2026-10-16, CPR-94).** The phase 1 static site is deployed on Vercel, with the admin switched off (`ADMIN_ENABLED`) and no database; see [`docs/deploy/vercel.md`](../../deploy/vercel.md). The VPS + Coolify items below are for the CMS phase.

1. `CPR-8` VPS + Coolify, now also running SeaweedFS.
2. `NEW-seaweedfs` (CPR-67): SeaweedFS deployment (master, volume, filer, S3 gateway), buckets `media-public`, `media-private`, `backups`, access keys, CDN hostname, health checks.
3. `CPR-23` (re-scoped): media upload to SeaweedFS through `MediaStore`, integration tests against a SeaweedFS container in Compose.
4. `CPR-13` (re-scoped): daily DB backup to SeaweedFS + off-host copy.
5. `CPR-9` (re-scoped): Cloudflare DNS, CDN for media host, Turnstile (no R2).

### Phase 3: Content model and admin (M2)
`CPR-27` services (3 offers, EN), `CPR-28` team/authors, `CPR-29` site settings (EN WhatsApp templates), `CPR-30` work/portfolio, `CPR-31` blog, `CPR-33` cache invalidation. Unchanged architecture, updated copy and fields.

### Phase 4: Pages (M2)
Built from section blocks ([page-patterns.md](../../design/page-patterns.md) §3):
`NEW-section-blocks` (CPR-75), `CPR-36` + `CPR-43` Home, `CPR-39` Product, `CPR-37` Services, `CPR-38` Work, `CPR-40` + `CPR-44` Blog, `CPR-41` About, `CPR-42` Contact, `CPR-35` 404 + Privacy.

### Phase 5: Brand moments (M2-M4, gated by assets)
1. `NEW-logo-intro` (CPR-76): integrate `sineva-logo-intro.json` overlay with FLIP hand-off to the navbar, measured against LCP.
2. `NEW-sino-asset-web` (CPR-69): asset fixes and web export (in `sino-3d-mascot`).
3. `NEW-sino-renders` (CPR-70): pose stills, scenes, loops, device frames, 3D icons ([3d-asset-requirements.md](../../design/3d-asset-requirements.md)).
4. `NEW-sino-hero` (CPR-77): realtime hero mascot with loading gate, state machine, look-at.
5. `NEW-lottie-library` (CPR-71): L3-L10 animations.

### Phase 6: Leads and integrations (M3)
`CPR-45` WhatsApp contexts, `CPR-47` contact form (new service options), `CPR-48` waitlist, `CPR-49` anti-spam, `CPR-50` emails (EN), `CPR-46` mini-CRM, `CPR-51` Umami (+ `path_select`), `NEW-auth-client-ip` (CPR-68) (trusted client IP for Better Auth rate limit behind Cloudflare; found in code review: without it all login attempts share one rate-limit bucket).

### Phase 7: QA and launch (M4-M5)
`CPR-52` SEO (no hreflang until a 2nd locale, canonical, OG via `next/og`), `CPR-53` security headers (CSP incl. media host + wasm), `CPR-54` EN content input, `CPR-55` showcase, `CPR-56` E2E, `CPR-57` sitemap/robots/JSON-LD, `CPR-58` Lighthouse + axe (light), `CPR-59` device QA, `CPR-60`-`CPR-64` launch.

### Phase 1: static launch (no CMS)

Product owner decision (2026-10-16): the first launch has no CMS and no lead backend. This narrows Phase 3 (content model and admin) and Phase 6 (leads) for the launch only; the admin work is kept and becomes the editing layer later.

- **Content** is typed modules in `src/content/static/**`, implementing `PublicContentSource`. `src/lib/content-source.ts` returns that source. Switching to the database source later is a one-line change there.
- **Work** is hidden: the Work link (header, mobile menu, footer) is shown only when `listWork` is not empty, and the Work page and Selected work sections stay off until real projects exist. Same rule for Team.
- **Contact** has no backend. `src/lib/contact-message.ts` builds a prefilled WhatsApp message (with a mailto alternative while a public email is confirmed). No personal data is posted to or stored on a server.
- **Waitlist** becomes "Get notified" through WhatsApp or email until a backend exists.
- **Facts left null** until confirmed: public email, address, legal entity, business hours, and every social account except Instagram.
- **Not in the launch:** stored leads, mini-CRM, notification and auto-reply emails, Turnstile and rate limits on forms (no form endpoint exists to protect).

## 5. Execution with an agent swarm

Implementation runs as a swarm of agents in parallel lanes with strict TDD, fresh-context review, and evidence-based verification. Roles, skills, lane ownership, waves (W1-W7), and the task brief template: [agent swarm playbook](2026-10-15-agent-swarm.md).

## 6. Definition of done for the redesign

- [ ] All v1 pages built from the documented tokens and blocks, light only, English copy passes the copy checklist
- [ ] No `—` or `–` in `messages/*.json` and seeded content (test green)
- [ ] Lighthouse mobile ≥ 90 x4 on the 5 key pages **with** intro and mascot enabled
- [ ] Reduced-motion E2E run green
- [ ] Media served from SeaweedFS via CDN; backup + off-host copy + restore tested
- [ ] Ticket board matches this plan ([Linear alignment](2026-10-15-linear-alignment.md))
