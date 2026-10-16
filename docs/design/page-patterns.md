# Information architecture & page patterns

Sitemap, page-by-page section order, and the reusable section blocks. Content rules are in [copywriting.md](copywriting.md); components in [components.md](components.md).

## 1. Sitemap (v1, English)

Locale strategy: `en` is the default and only enabled locale at launch. next-intl `localePrefix: 'as-needed'`, so English URLs have **no prefix** and a future Indonesian locale lives under `/id/...` with its own slugs. This replaces the `'always'` prefix built in CPR-25 (change tracked in the [implementation plan](../superpowers/plans/2026-10-15-website-redesign.md)).

| Page | URL (en) | Future `id` URL | Notes |
|---|---|---|---|
| Home | `/` | `/id` | |
| Product | `/products/ai-agents` | `/id/produk/ai-agents` | Product name is a working name |
| Services (list) | `/services` | `/id/layanan` | |
| Service detail | `/services/[slug]` | `/id/layanan/[slug]` | Seed: `ai-discovery`, `ai-build`, `ai-enablement` (proposal) |
| Work (list) | `/work` | `/id/karya` | Replaces "Portfolio" naming in the UI; data entity stays `Portfolio` |
| Work detail | `/work/[slug]` | `/id/karya/[slug]` | |
| Blog | `/blog` | `/id/blog` | `?category=` filter |
| Article | `/blog/[slug]` | `/id/blog/[slug]` | |
| About | `/about` | `/id/tentang` | |
| Contact | `/contact` | `/id/kontak` | `?service=` prefill |
| Thank you | `/contact/thank-you` | `/id/kontak/terima-kasih` | noindex |
| Privacy policy | `/privacy-policy` | `/id/kebijakan-privasi` | |
| 404 | (any) | (any) | Localised |
| Admin | `/admin` | (no locale) | Unchanged, Indonesian UI |

Post-launch (P2): `/products/ai-agents/use-cases/[slug]` SEO landing pages per business type, the Sintra "solutions" pattern.

Primary navigation: Product, Services, Work, Blog, About + CTA. Contact is reached through CTAs and the footer.

## 2. Page compositions

Legend: **[A]** aurora gradient bg, **[T]** tint, **[W]** warm, **[I]** inverse (dark), **[C]** canvas, **[ALT]** canvas-alt. Each row is one `Section`.

### 2.1 Home `/`

| # | Section | Pattern | Content | Motion |
|---|---|---|---|---|
| 1 | Hero [A] | `Split` 6/6: text left, Sino stage right | No eyebrow (product owner decision 2026-10-16: hero sections carry no eyebrow label), H1 (≤ 10 words), lead, CTAs: **Book a free consultation** + **Join the waitlist** | Hero entrance, Sino greet + cursor look-at |
| 2 | Two paths [C] | Two `card-path` side by side | "Use it yourself" (Product) / "Let us build it with you" (Services), each with Sino pose and CTA | Reveal, pose hover |
| 3 | Meet Sino [T] | Centered header + scroll scene | Short intro of the AI agent and what it can do | Scroll scrub (one per page) |
| 4 | What Sino can do [C] | `BentoGrid` of `card-task` | 4-5 capabilities phrased as requests: "Sino, reply to today's customer chats" | Staggered reveal, typing-dots Lottie in mockups |
| 5 | How we work (services) [ALT] | Sticky step story | Talk, Plan, Build, Support (4 steps; replaces the old Konsultasi/Proposal/Pengerjaan/Pendampingan) | Sticky steps |
| 6 | Who we help [C] | 3 cards | Small businesses, growing companies, startups | Reveal |
| 7 | Selected work [C] | 3 `card-work` | Featured items, **hidden if none** | Reveal |
| 8 | From the blog [ALT] | 3 `card-post` | Latest, **hidden if none** | Reveal |
| 9 | FAQ [C] | Two-column accordion | 5-7 questions across product and services | |
| 10 | Final CTA [I + A] | Full-bleed rounded panel `--radius-2xl` | Headline, both CTAs + WhatsApp, Sino S1 waving | Pose float |

### 2.2 Product `/products/ai-agents`

| # | Section | Pattern |
|---|---|---|
| 1 | Hero [A]: H1 + lead + waitlist inline form (email + consent) left; phone mockup with chat UI + Sino right, `ui-chip`s floating | `Split` |
| 2 | Capabilities [C]: one `card-task` per capability, each with pose S2-S6 | `BentoGrid` |
| 3 | How it works [ALT]: Connect your channels, Teach Sino your business, Let Sino handle the busywork, Review and approve (copy subject to `CBT` confirmation) | Sticky steps |
| 4 | Made for your business [C]: segmented control by business type (online shop, cafe and restaurant, local services) with an example day | Tabs |
| 5 | You stay in control [T]: privacy, approvals, human hand-off (only confirmed facts) | 3 `card-feature` |
| 6 | Ways of working comparison [C] (optional) | Comparison table |
| 7 | FAQ [C] | Accordion |
| 8 | Final CTA [I + A]: waitlist + "Need it customised? Book a consultation" | Panel |

### 2.3 Services `/services`

| # | Section |
|---|---|
| 1 | Hero [A]: H1, lead, primary CTA, Sino S7 |
| 2 | Three services [C]: AI Discovery, AI Build, AI Enablement as large cards with pose S7-S9, "who it's for", CTA to detail |
| 3 | How we work [ALT]: same 4-step sticky story as Home |
| 4 | Who we help [C] |
| 5 | Selected work [C] (hidden if none) |
| 6 | FAQ [C] |
| 7 | Final CTA [I + A] |

### 2.4 Service detail `/services/[slug]`

Breadcrumb, hero (H1, lead, CTA "Plan my AI project" → `/contact?service={slug}`, pose), "Problems we solve" (3-4 cards), "What you get" (deliverables list with check icons), process (4 steps, compact), tools we use (logo-free text chips), related work, FAQ (+ `FAQPage` JSON-LD), final CTA. Sticky CTA bar on mobile.

### 2.5 Work `/work` and `/work/[slug]`

- List: H1 + intro, `chip-filter` by service, grid of `card-work`, "Internal demo project" badge rule (FR-PF-03), empty state.
- Detail: hero with cover in `media-frame`, summary + meta (service, type, stack), challenge, solution, result (no invented metrics), gallery, demo link, related service, CTA.

### 2.6 Blog `/blog` and `/blog/[slug]`

- List (Sintra light blog pattern): featured latest post as a wide split card (cover left, category + title + excerpt + date right), `chip-filter` row for categories, grid of `card-post` (3 columns, 9 per page), pagination.
- Article: breadcrumb, H1 left + cover right on desktop, author + dates + read time, **sticky table of contents** in a left column (desktop ≥ 1024), body 720 px max, share buttons (WhatsApp, LinkedIn, copy link with L3 Lottie), 3 related posts, final CTA.

### 2.7 About `/about`

Hero with scene C3, story, mission and values (cards), meet Sino (what the mascot stands for), team (toggle in Site Settings), final CTA.

### 2.8 Contact `/contact` (Sintra book-a-demo pattern, light)

- Page bg [ALT]. Centered meta chips ("Free consultation · No obligation"), H1, lead.
- Two columns: left = 3 `card-step` items (Tell us your goal, We reply with next steps, We plan it together) + WhatsApp alternative + email; right = form card.
- Form fields (EN): Name, Work email, WhatsApp number, Company (optional), Business type, What do you need help with (AI Discovery / AI Build / AI Enablement / AI Agents product / Not sure yet), Budget range (optional), Message (min 20 chars), Privacy consent. Prefilled by `?service=`.

### 2.9 Thank you, Privacy, 404

- Thank you: Sino S10 + L3 check, what happens next, WhatsApp CTA for a faster reply, links to Blog and Product. noindex.
- Privacy: text page, 720 px column, sticky TOC on desktop, last updated date.
- 404: Sino S11, "Sino can't find this page.", links to Home, Services, Contact.

## 3. Reusable section blocks

Build these once as server components with typed props; pages compose them.

| Block | Used on |
|---|---|
| `HeroSplit` (text + visual, variants: sino-canvas, sino-still, mockup, scene) | Home, Product, Services, About, Service detail |
| `TwoPaths` | Home |
| `TaskCardGrid` | Home, Product |
| `StickySteps` | Home, Product, Services |
| `AudienceCards` | Home, Services |
| `WorkGrid` / `PostGrid` | Home, Services, Work, Blog |
| `FaqSection` (with JSON-LD option) | Home, Product, Services, Service detail |
| `FinalCta` (inverse + aurora + Sino) | All marketing pages |
| `StickyCtaBar` | Long pages, mobile |

## 4. Layout rules

- Alternate section tones so adjacent sections never share the same non-white tone.
- Only one `[I]` inverse section per page (the final CTA).
- Intro sections are centered (max 720 px); content sections are asymmetric splits.
- Max one Sino "hero size" appearance per viewport ([mascot-sino.md](mascot-sino.md) §6).
- Images and mockups never carry text that needs translation.
