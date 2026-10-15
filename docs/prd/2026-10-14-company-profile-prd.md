# PRD: Sineva Company Profile Website (v1)

| | |
|---|---|
| **Status** | Final, approved by Founder (Rev. 3, 2026-10-15) |
| **Date** | 15 October 2026 (first issued 14 October 2026) |
| **Revision** | Rev. 3 (15 October 2026): AI consulting positioning with two pillars, English-first i18n-ready launch, light theme only, design system, SeaweedFS storage. See [Revision history](#revision-history) |
| **Owner** | Founder of Sineva |
| **Linear** | Team `CPR` (Compro) |
| **Related project** | Sineva AI Agents product (working name), chatbot team `CBT`, developed separately |
| **Design system** | [docs/design/README.md](../design/README.md) |
| **Implementation plans** | [Website redesign](../superpowers/plans/2026-10-15-website-redesign.md), [Linear alignment](../superpowers/plans/2026-10-15-linear-alignment.md) |

### Revision history

| Rev. | Date | Summary |
|---|---|---|
| Rev. 1 | 14 October 2026 | First final version: headless CMS, light and dark mode, Indonesian and English |
| Rev. 2 | 14 October 2026 | Headless CMS removed; the Founder chose a custom admin inside Next.js |
| Rev. 3 | 15 October 2026 | New positioning (AI consulting, two pillars), brand name "Sineva", English default and only launch locale (i18n-ready), light theme only, documented design system, SeaweedFS replaces Cloudflare R2, off-host backups, copy rules. See the changelog below |

### Rev. 3 changelog

1. **Positioning.** Sineva is an AI consulting company with two pillars: **Product** (AI agents for UMKM, many capabilities, working name "Sineva AI Agents", not sold on the website in v1, waitlist only) and **Services** (AI Consulting: proposed AI Discovery, AI Build, AI Enablement). Web Development is no longer a standalone service; it can be delivered as part of AI Build. Updates §1, §2, §3, §4, §7, §9. Source: [brand-positioning.md](../design/brand-positioning.md).
2. **Brand name** is "Sineva" everywhere. The earlier name "Sineva Tech" is retired.
3. **Language.** English is the default and the only enabled locale at launch. The site is i18n-ready (next-intl messages, per-locale DB content, per-locale slugs); Indonesian is added later. next-intl uses `localePrefix: 'as-needed'` (English without prefix, future `/id/...`). §6 sitemap and §10 rewritten; the Definition of Done in §4.3 now asks for final English content.
4. **Theme.** Light theme only in v1; dark mode is deferred (post-launch backlog). FR-GLB-05 replaced, D10 updated, contrast text in §13.2 updated, dark-mode risks removed, new risks added in §17 (3D mascot performance, logo intro vs LCP, GSAP license, copy claims without data).
5. **Design system.** Documented in [docs/design/](../design/README.md) (tokens, motion, components, page patterns, Sino mascot, 3D asset requirements, accessibility and performance budgets). New global elements: FR-GLB-06 logo intro, FR-GLB-07 Sino mascot, FR-GLB-08 sticky CTA bar. FR-GLB-01 navigation changed (Product, Services, Work, Blog, About; no theme toggle).
6. **Pages.** Home rewritten to the composition in [page-patterns.md](../design/page-patterns.md) §2.1 (new FR-HOME-09, 10, 11); Services now covers three services; Portfolio is called "Work" in the UI (entity stays Portfolio, URL `/work`) and is filtered by service; Product page follows page-patterns §2.2; Blog filter is `?category=`; Contact form fields per page-patterns §2.8; WhatsApp contexts are general, each service, product, thank-you.
7. **Copy rules.** New FR-COPY-01 (no em dash or en dash in public copy, enforced by a unit test and admin validation) and FR-COPY-02 (no unverified claims), per [copywriting.md](../design/copywriting.md).
8. **Storage.** Cloudflare R2 replaced by **SeaweedFS** (self-hosted, S3-compatible API) for media. Database backups no longer live only on the VPS: daily backup to a SeaweedFS bucket and an off-host copy, 14-day retention, restore tested before launch. Off-host target is open question Q8. Cloudflare stays for DNS, proxy, CDN, and Turnstile.
9. **Analytics.** New event `path_select`; `lang_switch` applies once a second locale is enabled.
10. **Milestones and open questions.** M1 and M2 rescoped (§16); Q5 answered; Q8 to Q11 added (§19).
11. **Links.** Links to the design system and the two Rev. 3 implementation plans added where relevant.

---

## 1. Summary

Sineva is an **AI consulting company** with two pillars of equal weight on the website:

| Pillar | What | Model | On the website in v1 |
|---|---|---|---|
| **Product** | Ready-to-use AI agents (chatbot) for UMKM (Indonesian micro, small and medium enterprises). One agent has many capabilities: customer chat, social media, sales follow-up, finance and admin, operations. Working name: **Sineva AI Agents** | SaaS | Product page and waitlist. The product is not sold on the website in v1 |
| **Services** | AI Consulting, proposed as **AI Discovery**, **AI Build**, **AI Enablement**. Web development can be delivered as part of AI Build, not as a standalone service | Per-project service | Services pages, consultation form, WhatsApp |

The company website ("Compro") v1 has one main job: **turn visitors into prospects who contact Sineva for a consultation** (decision D3), through WhatsApp or the contact form. Its second job is to collect a waitlist for the AI agents product, which is not launched yet. Every page must also help a visitor answer one question: "do I use the product myself, or do I need help building it?"

The website launches in **English**, the default and only enabled locale, and is built i18n-ready so Indonesian can be added later without structural change. Content, blog, and leads are managed through a **custom admin at `/admin` inside the same Next.js application**, with data in PostgreSQL. No headless CMS is used.

**Implementation status:** this direction replaces the earlier Payload design. The replacement Next.js/custom admin foundation was published on branch CPR-7 in commit `e9cb9b3`. Unit tests, database tests, production HTTP tests, and independent review passed after fixes; local production browser verification passed on 15 October 2026, including login after a developer database restart. PR #1 is ready for review, not merged or deployed. This is an application foundation, not a complete launch-ready Compro. The i18n routing built in CPR-25 uses `localePrefix: 'always'` for `id` and `en`; Rev. 3 changes this to `'as-needed'` with English only (see §10 and the [website redesign plan](../superpowers/plans/2026-10-15-website-redesign.md)).

## 2. Background

- Sineva has no online presence yet. Domain, portfolio, and legal entity do not exist yet.
- Source logos are in `assets/brand/logos/source/` of this repo: `Sineva_Logo.png` (symbol) and `Sineva_Stacked_Wordmark_With_Logo.png` (symbol plus the "Sineva" wordmark). Both are transparent PNGs of 5225×5225 px. The color is a teal gradient. The light end is `#00949B` (value from the traced SVG, which supersedes the ±`#009EA6` sampled from the PNG in Rev. 2) and the dark end is ±`#0A5462` (symbol) and `#083F4C` (wordmark). The logo creator provided no vector files (Founder's answer to Q7). SVG traces and transparent PNGs in the original colors are in [`assets/brand/logos/`](../../assets/brand/logos/README.md) and in [Figma](https://www.figma.com/design/vdG8pTacFcbDnEUb8cjBDM?node-id=7-2). Shape and layout follow the source.
- The brand has a 3D mascot, **Sino** (asset `sino.glb` v004, 13.8 MB raw, must be optimised before web use). Integration rules are in [mascot-sino.md](../design/mascot-sino.md).
- Without a client portfolio, credibility is built from **2-3 internal showcase projects** that visitors can try directly.
- The AI agents product is developed separately by team `CBT` and may not be ready when Compro launches. Compro therefore shows it as "coming soon" with a waitlist, and only mentions capabilities confirmed by `CBT`.
- Media files are stored in self-hosted **SeaweedFS** (S3-compatible API) on the same VPS stack. There is no Cloudflare R2 dependency.
- Work is done by a mixed team: the Founder with Claude, plus team members or freelancers. Every task therefore needs clear acceptance criteria.
- There is no urgent deadline. Quality is preferred over speed.

## 3. Target users

All three segments are treated **equally**. The language must stay simple for a UMKM owner and still look credible to a corporate buyer. The product is aimed mostly at UMKM; the services serve all three segments.

| Segment | Typical need | Most relevant pillar | What they look for on the website |
|---|---|---|---|
| **UMKM and local businesses** | Ready-to-use AI help for daily work, WhatsApp-based customer handling | Product first, then Services | Simple language, real task examples, quick contact via WhatsApp, price clarity |
| **Mid-size companies and corporates** | AI opportunities, internal systems, integrations | Services | Clear working process, proof of competence, company profile, data security |
| **Startups** | Fast AI-powered MVPs, a technical partner | Services (AI Build) | Technical quality, speed, the stack in use |

Internal users:
- **Admin** (Founder): manages all content and lead data.
- **Editor** (writer or content freelancer): manages content only.

## 4. Goals, non-goals, and success metrics

### 4.1 Goals
1. **Explain both pillars clearly** (Product and Services) so visitors know whether to use the product themselves or ask Sineva to build with them.
2. Prospects can understand Sineva's services and contact Sineva in a few clicks. The **primary conversion remains the consultation** (D3: WhatsApp and contact form); the **secondary conversion is the product waitlist**.
3. Sineva looks credible even without a client portfolio.
4. The team can update content and write articles without a developer.
5. Every lead is recorded and none is lost.

### 4.2 Non-goals (v1)
- Selling or providing the AI agents product. Compro only shows the waitlist.
- Showing a price list.
- Running paid ads.

### 4.3 Definition of Done v1
- [ ] All pages in §6 are live in **English** with final content, and the site is i18n-ready (FR-I18N-01 to 06).
- [ ] At least **2 Work (portfolio) items** are published.
- [ ] Contact form, WhatsApp buttons, and waitlist work in production. Notification and auto-reply emails are delivered, with SPF/DKIM passing.
- [ ] All analytics events in §12 are recorded in Umami.
- [ ] Lighthouse mobile ≥ 90 for Performance, Accessibility, Best Practices, and SEO on 5 key pages: Home, Service detail, Work detail, Article, and Contact (with the Sino hero active and the logo intro enabled).
- [ ] No *critical* or *serious* accessibility violations (checked with axe) in the **light theme** (the only theme in v1).
- [ ] The copy lint test (FR-COPY-01) passes and copy was reviewed for unverified claims (FR-COPY-02).
- [ ] The sitemap is submitted to Google Search Console with no indexing errors.
- [ ] Daily database backup runs automatically to a SeaweedFS bucket **and** to an off-host copy, and a restore from the off-host copy was tested at least once.
- [ ] The admin guide (how to manage content and leads) has been handed over.

### 4.4 Post-launch metrics
- **Primary metric: conversion rate**, meaning sessions that trigger `whatsapp_click` or `form_submit` divided by total sessions.
- **Supporting metrics:** leads per month (by segment and service), waitlist signups, the split of `path_select` between Product and Services, and organic traffic.
- Numeric targets are **set after 30 days of baseline data**. There is no traffic data to use as a reference yet.

## 5. Scope

### 5.1 In scope (v1)
- All pages in §6 in English, built i18n-ready.
- Light theme on all public pages (FR-GLB-05).
- Design system, motion, logo intro, and Sino mascot as specified in [docs/design/](../design/README.md).
- Custom Next.js admin for the data model and page settings in §9, with Admin and Editor roles.
- Lead flows: WhatsApp, contact form, waitlist, and mini-CRM (§8).
- Technical SEO (§11), analytics (§12), and quality targets (§13).
- VPS infrastructure, CI/CD, backup, and monitoring (§14).
- Pages that **display** Work (portfolio) showcases.

### 5.2 Out of scope (v1)
| Item | Reason / when |
|---|---|
| Building the showcase demo applications | Separate work. The chatbot demo depends on team `CBT` |
| Selling or onboarding users to the AI agents product | Product is not launched. Waitlist only |
| Standalone Web Development service page | Web development is delivered as part of AI Build (Rev. 3) |
| Indonesian locale at launch | Added later; the site is i18n-ready (FR-I18N-01 to 06) |
| Dark mode | Deferred to the post-launch backlog; tokens are split so it can be added (FR-GLB-05) |
| Pricing page | Services are priced per project |
| Careers page | No hiring yet |
| Per-industry pages and `/products/ai-agents/use-cases/[slug]` landing pages | Post-launch (P2); can be added without structural change |
| Drag-and-drop page builder | Fixed layout in code is enough |
| Headless CMS or separate content backend | Content management is integrated into the Next.js app |
| Scheduled publishing | Not needed yet |
| GA4, ad pixels, cookie banner | Added when advertising starts |
| Chatbot widget on the website | After the product launches |
| Call booking (Cal.com) | Not chosen for v1 |

## 6. Sitemap and URLs

English is the default and only enabled locale at launch. next-intl uses `localePrefix: 'as-needed'`: English URLs have **no prefix**, and a future Indonesian locale lives under `/id/...` with its own slugs.

| Page | URL (en) | Future `id` URL | Notes |
|---|---|---|---|
| Home | `/` | `/id` | |
| Product | `/products/ai-agents` | `/id/produk/ai-agents` | Product name is a working name |
| Services (list) | `/services` | `/id/layanan` | |
| Service detail | `/services/[slug]` | `/id/layanan/[slug]` | Seed: `ai-discovery`, `ai-build`, `ai-enablement` (proposal) |
| Work (list) | `/work` | `/id/karya` | Replaces "Portfolio" in the UI; the data entity stays `Portfolio` |
| Work detail | `/work/[slug]` | `/id/karya/[slug]` | |
| Blog | `/blog` | `/id/blog` | `?category=` filter |
| Article | `/blog/[slug]` | `/id/blog/[slug]` | |
| About | `/about` | `/id/tentang` | |
| Contact | `/contact` | `/id/kontak` | `?service=` prefill |
| Thank you | `/contact/thank-you` | `/id/kontak/terima-kasih` | noindex |
| Privacy policy | `/privacy-policy` | `/id/kebijakan-privasi` | |
| 404 | (any) | (any) | Localised |
| Admin (login and dashboard) | `/admin` | (no locale) | Indonesian UI |

Primary navigation: Product, Services, Work, Blog, About, plus the CTA. Contact is reached through CTAs and the footer. Full page compositions are in [page-patterns.md](../design/page-patterns.md).

## 7. Functional requirements per page

Each requirement has an ID so it can be referenced from Linear tickets. Section order and patterns follow [page-patterns.md](../design/page-patterns.md); copy follows [copywriting.md](../design/copywriting.md).

### 7.1 Global elements
- **FR-GLB-01: Header.** Logo, navigation (**Product, Services, Work, Blog, About**), and the CTA button **Book a free consultation** linking to the Contact page. There is **no theme toggle**. A language switcher slot exists but is **hidden while only one locale is enabled** (FR-I18N-03). At widths ≤ 1024 px the navigation becomes a mobile menu with a bottom action bar (primary CTA and WhatsApp). Scroll behaviour is specified in [motion.md](../design/motion.md) §5.
- **FR-GLB-02: Floating WhatsApp button** on all public pages. The prefilled message follows the originating page (§8.1). It sits above the sticky CTA bar (FR-GLB-08) when that bar is visible.
- **FR-GLB-03: Footer.** Company summary, navigation, list of services, contact (email, WhatsApp, address), legal data, social media, Privacy Policy link, and copyright (`© 2026 Sineva`). Legal data and address are **hidden while their fields are empty in Site Settings**.
- **FR-GLB-04: 404 page** in every enabled locale, with links to Home, Services, and Contact.
- **FR-GLB-05: Light theme only in v1.** Tokens are split into primitive and semantic layers ([tokens.md](../design/tokens.md)) so dark mode can be added later by swapping semantic values only (post-launch backlog). There is no theme toggle and no `prefers-color-scheme` handling in v1. The admin (`/admin`) uses its own custom UI on the same tokens; admin theming is not a v1 requirement.
- **FR-GLB-06: First-visit logo intro** (Lottie, [motion.md](../design/motion.md) §3.1):
  - Plays **once per session**, on the first page load only (sessionStorage flag wrapped in try/catch), never on client-side navigation.
  - Total duration **≤ 1.6 s**, **skippable** by any key press, scroll, or click, and never waits for the network.
  - **Disabled under `prefers-reduced-motion`** (logo stays static). No overlay for bots or without JavaScript.
  - Must **not delay LCP by more than 100 ms**, measured with Lighthouse against a no-intro baseline. If it does, fall back to playing the symbol-only Lottie inside the navbar logo slot.
- **FR-GLB-07: Sino mascot** ([mascot-sino.md](../design/mascot-sino.md)):
  - **Realtime 3D only in the Home hero**, loaded after `load` behind a poster image and only when the gate passes (in viewport, WebGL2, no reduced motion, Save-Data off, enough device memory). Otherwise the poster stays (and a short loop plays if motion is allowed).
  - The canvas is never the LCP element and causes no layout shift.
  - Everywhere else Sino appears as **pre-rendered** assets (stills, loops), at most one large Sino per viewport.
  - The GLB must meet the production budget (≤ 600 KB brotli, ≤ 80k triangles, ≤ 30 draw calls) before it is used; until then the site uses the poster and loop.
- **FR-GLB-08: Sticky CTA bar** on long pages (at least Service detail), mobile only, with the primary CTA of the page.

### 7.2 Home
Composition (top to bottom): Hero, Two paths, Meet Sino, What Sino can do, How we work, Who we help, Selected work, From the blog, FAQ, Final CTA. Details in [page-patterns.md](../design/page-patterns.md) §2.1.

- **FR-HOME-01: Hero.** Eyebrow ("AI consulting and AI agents"), H1 (≤ 10 words), lead, and two CTAs side by side: primary **Book a free consultation** and secondary **Join the waitlist** (leads to the waitlist form on the Product page). Sino stage on the right (FR-GLB-07), hero entrance animation.
- **FR-HOME-02: Who we help.** 3 cards (small businesses, growing companies, startups). Each card describes a typical problem of that segment and how Sineva helps.
- **FR-HOME-03: Services entry point.** Covered by the Services card in FR-HOME-10, which links to the Services page. There is no separate services section on Home in Rev. 3.
- **FR-HOME-04: Selected work.** Up to 3 Work items marked "featured". **This section is hidden** when there are no items.
- **FR-HOME-05: How we work (services).** Sticky 4-step story: Talk, Plan, Build, Support.
- **FR-HOME-06: Product teaser.** The Product card in FR-HOME-10 carries a "Coming soon" badge and the waitlist CTA. The waitlist form itself (§8.3) lives on the Product page.
- **FR-HOME-07: Latest articles.** The 3 latest articles in the page locale. **This section is hidden** when there are no articles.
- **FR-HOME-08: Final CTA.** Inverse panel with a headline, the consultation button, the waitlist button, and the WhatsApp button, with Sino waving (pose S1).
- **FR-HOME-09: FAQ.** Two-column accordion with 5-7 questions covering both product and services. Content is managed in the admin.
- **FR-HOME-10: Two paths.** Two side-by-side cards: **"Use it yourself"** (Product, with "Coming soon" badge and waitlist CTA) and **"Let us build it with you"** (Services, naming AI Discovery, AI Build, and AI Enablement with a CTA to `/services`). Each card has a Sino pose. Selecting a card fires `path_select` (§12).
- **FR-HOME-11: Meet Sino and capabilities.** A short introduction of the AI agent (one scroll-driven scene per page), followed by a bento grid of 4-5 capability cards phrased as requests (for example "Sino, reply to today's customer chats"). **Only capabilities confirmed by team `CBT` may appear** (Q11).

### 7.3 Services
Three services (proposal, final names are Q10): **AI Discovery**, **AI Build**, **AI Enablement**.

- **FR-SVC-01: List page** with a hero (H1, lead, primary CTA, Sino pose), the three services as large cards ("who it is for", CTA to the detail page), the 4-step How we work story, Who we help, Selected work (hidden if none), FAQ, and the final CTA.
- **FR-SVC-02: Detail page** contains: breadcrumb, hero, problems we solve (3-4 cards), what you get (deliverables list), process (4 compact steps), tools we use (text chips, no third-party logos), related work, FAQ, and the final CTA.
- **FR-SVC-03: CTA on the detail page** ("Plan my AI project") links to Contact with the service preselected: `/contact?service={slug}`.
- **FR-SVC-04: FAQ** is also emitted as `FAQPage` structured data.
- A sticky CTA bar appears on mobile (FR-GLB-08).

### 7.4 Work (Portfolio)
"Work" is the UI name and the URL (`/work`); the data entity stays `Portfolio`.

- **FR-PF-01: List page** is a grid with a filter by service (chips: All, AI Discovery, AI Build, AI Enablement) and an empty state.
- **FR-PF-02: Detail page** contains: summary and meta (service, project type, stack), challenge, solution, result, technologies, gallery, demo link (opens in a new tab), related service, and CTA. Results must not contain invented metrics (FR-COPY-02).
- **FR-PF-03: Project type label.** Each item has a *project type* field (Internal showcase / Client project). Internal showcase projects **must show the label "Internal demo project"** so visitors do not mistake them for client work.

### 7.5 Product (Sineva AI Agents, working name)
The page is **waitlist-based "coming soon"** until the product is launched. Composition per [page-patterns.md](../design/page-patterns.md) §2.2.

- **FR-PRD-01: Page content.** Hero with H1, lead, and an inline waitlist form (email and consent) beside a phone mockup with Sino; capabilities (one card per capability); how it works (steps subject to `CBT` confirmation); made for your business (tabs by business type); you stay in control (only confirmed facts); optional ways-of-working comparison; FAQ; and a final CTA with the waitlist plus "Need it customised? Book a consultation". All content is managed from the custom admin.
- **FR-PRD-02: Confirmed capabilities only.** Capability categories (customer chat, social media, sales follow-up, finance and admin, operations) are page structure; their text only states what `CBT` has confirmed (Q11). Finance copy must not read as financial advice, and no messaging channel is claimed before it is confirmed.
- **FR-PRD-03: Product name** is a working name stored in one place (messages and content DB) so the final name (Q9) is a single change.
- Replacing this page with a full product page after launch (and changing the CTA to "Try Sineva AI Agents") is out of scope for v1.

### 7.6 Blog
- **FR-BLOG-01: List page.** A featured latest post, category filter chips through the query parameter (`?category=`), 9 articles per page, and pagination. The canonical of a filtered page points to the main list page.
- **FR-BLOG-02: Article page.** Title, cover, author, publish date, estimated reading time, body, sticky table of contents on desktop, share buttons (WhatsApp, LinkedIn, copy link), and 3 related articles from the same category.
- **FR-BLOG-03: Article body (rich text)** supports headings, lists, links, images, quotes, and code blocks.
- **FR-BLOG-04: An article is shown only in locales where its version exists** (§10).

### 7.7 About
- **FR-ABT-01:** company story, mission and values, and "Meet Sino" (what the mascot stands for).
- **FR-ABT-02:** team section, taken from Team data. It can be hidden through Site Settings in the admin.

### 7.8 Contact
- **FR-CTC-01:** contact form (§8.2) with the three-step explanation ("Tell us your goal", "We reply with next steps", "We plan it together"), WhatsApp button, email, and business hours. The address appears once filled in the admin. The form is prefilled from `?service=`.
- **FR-CTC-02: Thank-you page** has its own URL so it can be measured as a conversion goal destination. It contains a WhatsApp button for prospects who want a faster response, plus links to Blog and Product. It is noindex.

### 7.9 Privacy policy
- **FR-PRV-01:** content is managed from the custom admin and covers what data is collected, the purpose, the retention period (§13.4), the data subject's rights, and a contact for access or deletion requests.

### 7.10 Copy rules (cross-cutting)
- **FR-COPY-01: No em dash (U+2014) or en dash (U+2013)** in any public copy: UI messages, DB content, and metadata (titles, descriptions, OG). Use a period, comma, colon, or parentheses; write number ranges with a plain hyphen (`10-50`). Enforced by **a unit test** that scans `messages/*.json` and seed content strings, and by **admin validation** that rejects saving public content fields containing those characters.
- **FR-COPY-02: No unverified claims.** No customer numbers, testimonials, client logos, ratings, certifications, or results until there is real data. No promised business outcomes and no product features that `CBT` has not confirmed. Rules and the review checklist are in [copywriting.md](../design/copywriting.md).

## 8. Lead flows

### 8.1 WhatsApp
- **FR-LEAD-01:** all WhatsApp buttons open `https://wa.me/<number>?text=<message>`.
- **FR-LEAD-02:** the message template **differs per context**: **general, each service, product, and thank-you page**, and is kept **per locale** (English at launch). Drafts ([copywriting.md](../design/copywriting.md) §6):

| Context | Message (EN) |
|---|---|
| General | `Hi Sineva, I'd like to talk about using AI in my business.` |
| Services | `Hi Sineva, I'm interested in {service name}. Can we talk?` |
| Product | `Hi Sineva, I'd like to know more about Sineva AI Agents.` |
| Thank-you page | `Hi Sineva, I just sent the contact form and would like a faster reply.` |

- **FR-LEAD-03:** the WhatsApp number and message templates are managed in Site Settings in the admin.

### 8.2 Contact form

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | text | Yes | |
| Work email | email | Yes | format validated |
| WhatsApp number | phone | Yes | normalised to the `62…` format |
| Company | text | No | |
| Business type | select | Yes | Small or local business (UMKM) / Company / Startup / Other |
| What do you need help with | select | Yes | AI Discovery / AI Build / AI Enablement / AI Agents product / Not sure yet. Can be prefilled from the URL (`?service=`) |
| Budget range | select | No | < Rp10 million / Rp10-50 million / Rp50-150 million / > Rp150 million / Not sure yet |
| Message | long text | Yes | minimum 20 characters |
| Privacy policy consent | checkbox | Yes | with a link to the Privacy Policy |

**Behaviour after submit:**
- **FR-LEAD-04:** all inputs are validated on the client **and** on the server.
- **FR-LEAD-05:** after validation and anti-spam checks pass, the data is saved to the Leads table together with the locale, the originating page, and the submit time.
- **FR-LEAD-06:** a notification email is sent to the lead inbox configured in Site Settings.
- **FR-LEAD-07:** an automatic reply email is sent to the prospect in their locale.
- **FR-LEAD-08:** the visitor is redirected to the thank-you page.

**Error handling:**
- **FR-LEAD-09:** if sending the email fails, the data is **still saved**. The failure is logged and reported to Sentry, and the visitor still sees the success page.
- **FR-LEAD-10:** if saving fails, the form shows an error message in the page locale. What the visitor already typed is kept, and a WhatsApp button is offered as a fallback.

**Anti-spam:**
- **FR-LEAD-11:** honeypot field. Submissions detected as bots are dropped silently without an error message.
- **FR-LEAD-12:** Cloudflare Turnstile verification on the server.
- **FR-LEAD-13:** rate limit of at most 5 submissions per IP per 10 minutes.

### 8.3 Product waitlist
- **FR-WL-01: Fields:** email (required), business type (optional), and consent (required). Same anti-spam protection as the contact form.
- **FR-WL-02: Duplicate email:** if the email is already registered, the visitor still sees the success message but the data is not duplicated. This prevents people from checking whether an email is registered.
- **FR-WL-03: Export:** the Admin can export the waitlist to CSV.

### 8.4 Mini-CRM
- **FR-CRM-01: Lead status:** *New → Contacted → Proposal → Deal / Not proceeding*. A new lead automatically gets *New*.
- **FR-CRM-02: Internal notes:** a text field per lead.
- **FR-CRM-03: The Leads list in the admin** can be filtered by status, service, business type, and date.

## 9. Custom admin and data model

**Principle: layout lives in code, content lives in PostgreSQL and is edited through the custom admin.** Each page has fixed sections. Text, images, and SEO of each section can be changed from `/admin` without redeploying. Schema, validation, authorization, public queries, and admin forms are owned by the application; there are no CMS collections or globals, SEO plugins, or auto-generated CRUD APIs.

### 9.1 Data entities

| Entity | Main fields | Localised |
|---|---|---|
| **Services** | title, slug, summary, icon, problems we solve, what you get (array), process (array), tools, FAQ (array), SEO. Seed: AI Discovery, AI Build, AI Enablement | Yes |
| **Portfolio** (shown as "Work") | title, slug, project type, summary, challenge, solution, result, technologies, cover, gallery, demo URL, related service, featured, SEO | Yes |
| **Posts** | title, slug, summary, cover, body, category, author, publish date, SEO | Yes |
| **Categories** | name, slug | Yes |
| **Team** | name, role, photo, bio | Yes (bio, role) |
| **Media** | file, alt text (**required**) | Yes (alt) |
| **Leads** | fields in §8.2, status, internal notes, locale, originating page | No |
| **Waitlist** | email, business type, locale | No |
| **Users** | email, name, role (Admin / Editor) | No |
| **Product capabilities** | key, title (phrased as a request to Sino), body, tint, pose, mockup lines, order, featured | Yes |
| **Business types** | key, label, example day text, order | Yes |
| **FAQ items** | question, answer, tags (page/service) shared across pages | Yes |
| **Redirects** | from path, to path, status; auto-created on slug change | No |
| **Email settings** | mode (Resend API / SMTP), SMTP host/port/security/username, encrypted secret, from name/email, reply-to, templates per locale | Templates only |
| **Audit log** | actor, entity, action, changed field names, time | No |

Full CMS scope (editable fields per page, SEO, media, email/SMTP settings, roles, build order): [Admin CMS implementation plan](../superpowers/plans/2026-10-15-admin-cms.md).

**Media note:** uploads are stored in **SeaweedFS** (self-hosted, S3-compatible API) through a media storage adapter. The database keeps the object key and metadata. Files are served through the Cloudflare CDN with a long cache, so object keys must change whenever a file is replaced (unique or content-hashed keys). SeaweedFS S3 compatibility must be verified for the operations the adapter uses (§13.6, §15).

### 9.2 Site settings and page content

| Setting / page | Contents |
|---|---|
| **Site Settings** | WhatsApp number, WhatsApp message templates (per context and locale), lead email inbox, public email, business hours, address, legal data, social media, default SEO and OG image, show/hide the Team section, product working name |
| **Home** | content of every section in FR-HOME-01 to 11 (including FAQ) |
| **Product** | value proposition, capabilities (confirmed by `CBT`), how it works, FAQ |
| **About** | story, mission and values, Meet Sino |
| **Contact** | intro text and thank-you page text |
| **Privacy Policy** | content (rich text) and effective date |

### 9.3 Roles and permissions

| | Content (Services, Portfolio, Posts, Categories, Team, Media, settings/pages) | Leads and Waitlist | Users |
|---|---|---|---|
| **Admin** | read/write | read/update/delete/export | manage |
| **Editor** | read/write (no access to Site Settings secrets, Email settings, Redirects, global SEO, Audit log) | **no access** | none |

- **FR-ADM-01:** Leads and Waitlist have **no public REST CRUD API**. Visitors can only submit data through dedicated server actions that already pass validation and anti-spam; reading, updating, deleting, and exporting require Admin on the server.
- **FR-ADM-02:** Posts and Portfolio have draft/published status and a preview before publishing. Drafts and previews can only be opened by authorised Admin/Editor users, are not indexed, and do not enter the public cache.
- **FR-ADM-03:** after a content change transaction succeeds, the related pages in all enabled locales are refreshed automatically (on-demand revalidation), including the old URL when a slug changes, lists, home, and the sitemap.
- **FR-ADM-04:** admin login is temporarily locked after 5 failed attempts. The counter is stored in the database and updated atomically; a rate limit alone does not replace account lockout. The initial lockout duration is 15 minutes, and the login response does not reveal whether an email is registered.
- **FR-ADM-05:** the custom admin provides login/logout, a role-based dashboard, lists and add/edit forms for content, a content locale selector, field validation (including FR-COPY-01), media upload, SEO fields, draft/publish/preview, lead filters, lead notes/status, and waitlist export. Admin can manage Editor accounts. The v1 admin interface language is Indonesian; public content follows the enabled locales.
- **FR-ADM-06:** public signup is closed. The first admin is created through an explicit operator bootstrap command that uses the authentication library, with no default password and no anonymous bootstrap endpoint. Every admin query, server action, upload, preview, and export checks the session and role on the server; hiding a menu is not a permission check.

**ID mapping Rev. 1 → Rev. 2:** `FR-CMS-01` → `FR-ADM-01`, `FR-CMS-02` → `FR-ADM-02`, `FR-CMS-03` → `FR-ADM-03`, `FR-CMS-04` → `FR-ADM-04`. Old IDs only apply to historical notes; active tickets use the new IDs.

### 9.4 Content storage and publishing

- Entities have stable IDs; translations are stored per `(entity_id, locale)`. Slugs are unique per content type and locale, enforced by database constraints. Switching locale uses the same entity ID rather than guessing the slug.
- Core content must be complete in **every enabled locale** before that locale launches. Articles can be published per locale; there is no cross-locale fallback.
- Posts and Portfolio keep the draft being edited separate from the published snapshot. Saving a draft must not change public content until a publish action succeeds.
- Rich text is stored as a structured document that the application validates and renders. HTML or URLs coming from the editor are not trusted as-is.
- Waitlist emails are normalised and have a unique constraint so concurrent submissions do not create duplicates. Only a known duplicate conflict is treated as success.

## 10. Language and i18n

English is the default and the only enabled locale at launch. The site is **i18n-ready** so Indonesian can be added later with a locale and content only, without structural change. The existing Indonesian draft copy (`docs/content/copy-id.md`) is kept as source material for the later `id` locale; its positioning is outdated.

- **FR-I18N-01:** `en` is the default and the only enabled locale. All UI text goes through next-intl messages, DB content is stored per `(entity_id, locale)`, and slugs are per locale. Cross-locale fallback is **disabled**, so text from one locale never appears on a page of another.
- **FR-I18N-02: Visiting `/`:** `/` serves English directly, with no redirect, while there is a single locale (next-intl `localePrefix: 'as-needed'`: English has no prefix, future locales use `/id/...`). When a second locale is enabled, a saved locale cookie redirects returning visitors to their locale; without a cookie `/` keeps serving English (proposed, to be confirmed in that locale's launch ticket).
- **FR-I18N-03: Language switcher** is **hidden until a second locale is enabled**. Behaviour kept for later: the switcher opens the **counterpart page** in the other locale and stores the choice in a cookie. If no counterpart exists (a single-locale article), the visitor goes to the blog list of the target locale.
- **FR-I18N-04:** core content (settings and content of all pages, Services, Portfolio) must be **complete in every ENABLED locale** before that locale launches. Checked through a QA checklist.
- **FR-I18N-05:** blog articles may exist in only one locale. An article without a version in a locale does not appear in that locale's blog list, sitemap, or `hreflang`.
- **FR-I18N-06:** interface text (button labels, error messages, etc.) is stored in translation files in the repo (`messages/{locale}.json`), separate from page content in the database.

## 11. SEO

- **FR-SEO-01:** meta title, meta description, and OG image can be set per document, with defaults from Site Settings. Title ≤ 60 characters with the pattern `{Page topic} | Sineva`; description ≤ 160 characters ([copywriting.md](../design/copywriting.md) §7).
- **FR-SEO-02:** every page has a canonical and `hreflang`. While only English is enabled, `hreflang` contains `en` and `x-default` (→ `/`); alternates are added for each locale when it is enabled.
- **FR-SEO-03:** `sitemap.xml` covers all enabled locales, along with `robots.txt`. The `/admin` pages and the thank-you page are not indexed.
- **FR-SEO-04: Structured data (JSON-LD):** Organization, Service, BlogPosting, FAQPage, and BreadcrumbList.
- **FR-SEO-05:** public pages are rendered statically and refreshed through on-demand revalidation (FR-ADM-03). Sessions, admin data, and draft previews do not enter the public cache.

## 12. Analytics

The tool is **Umami Cloud (free plan)**. Umami does not use cookies, so the website does not need a cookie banner. If the free plan limit is exceeded, Umami can be self-hosted on the VPS through Coolify.

| Event | Properties | Fired when |
|---|---|---|
| `whatsapp_click` | `location` (floating / hero / cta / contact / thank-you), `context`, `locale` | a WhatsApp button is clicked |
| `cta_click` | `cta`, `page`, `locale` | a primary or secondary CTA button is clicked |
| `form_submit` | `service`, `business_type`, `locale` | the contact form is submitted successfully |
| `waitlist_submit` | `locale` | the waitlist is submitted successfully |
| `path_select` | `path` (product / services), `locale` | a card of the Home two-path section (FR-HOME-10) is selected |
| `lang_switch` | `from`, `to` | the language switcher is clicked (only when a second locale is enabled) |

## 13. Non-functional requirements

### 13.1 Performance
- Lighthouse mobile ≥ 90 in 4 categories for 5 key pages (§4.3).
- Core Web Vitals: LCP < 2.5 s, CLS < 0.1, INP < 200 ms. The LCP element is the headline or the Sino poster, **never** the canvas or the logo intro overlay.
- Images are optimised through `next/image` (modern formats, responsive sizes, lazy loading).
- Budgets for JavaScript, lazy chunks, fonts, Lottie, and the Sino GLB are in [accessibility-performance.md](../design/accessibility-performance.md) §2.

### 13.2 Accessibility
- Meets WCAG 2.1 AA: color contrast, full keyboard navigation, visible focus states, labels on every form field, and required alt text. Checks are listed in [accessibility-performance.md](../design/accessibility-performance.md).
- Brand teal `#00949B` is only **3.68:1** on white, so it may be used for non-text UI, large icons, and large text only. **Text, links, and actions use `#00686D`** (6.56:1 on white; see [tokens.md](../design/tokens.md)). Only token pairs listed as passing in tokens.md may be used.
- `prefers-reduced-motion` is honoured as specified in [motion.md](../design/motion.md) §9 (no logo intro, no Sino canvas, no scroll scrub).
- Mobile-first design. Minimum supported screen width is 360 px.

### 13.3 Security
- HTTPS on all pages, with Cloudflare in front of the server as proxy and CDN.
- Security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy. The CSP must allow the media CDN origin and `'wasm-unsafe-eval'` for the self-hosted Draco decoder ([mascot-sino.md](../design/mascot-sino.md) §2).
- All secrets are stored in environment variables and never committed to the repo.
- Server: SSH login by key only, firewall opening only ports 22, 80, and 443, and automatic security updates. SeaweedFS internal services (master, volume, filer) are never exposed publicly; the S3 gateway is reachable only through the reverse proxy, and writes require credentials.

### 13.4 Privacy (Indonesian PDP Law)
- Explicit consent through a checkbox before data is submitted.
- Personal data can only be viewed by the Admin role.
- **Retention (default, can change after legal review):** Leads data is kept for 24 months from the last interaction. Waitlist data is kept until 12 months after the product launches, or until the owner requests deletion.
- Access or deletion requests are received through the public email and fulfilled manually by the Admin.

### 13.5 Browser compatibility
The last two versions of Chrome, Safari (macOS and iOS), Firefox, Edge, and Chrome Android.

### 13.6 Reliability
- **Database backups must not live only on the VPS.** A daily automated backup goes to **a SeaweedFS bucket and to an off-host copy** (a separate provider, or a second SeaweedFS instance in another location; target is open question Q8). Retention is **14 days**. A restore is tested before launch, from the off-host copy.
- Media files live in SeaweedFS on the VPS, so they share the single-host risk; replicate them to the same off-host target (to be confirmed in Q8).
- **SeaweedFS S3 compatibility must be verified** for every operation the media adapter uses (PutObject, GetObject, DeleteObject, presigned URLs, multipart upload) in the adapter's integration tests (§15).
- Uptime is monitored by an external service, not from the same VPS.

## 14. Technical architecture

### 14.1 Stack
- **Application:** Next.js (App Router) + TypeScript; the public website and the custom admin live in one modular monolith application. No headless CMS.
- **Styling:** Tailwind CSS v4 with the design tokens and component specs in [docs/design/README.md](../design/README.md): Plus Jakarta Sans and Geist Mono through `next/font`, GSAP 3.15 + ScrollTrigger for scroll motion, lottie-web 5.13 (light build) for Lottie animations, and three 0.186 for the Sino mascot (loaded on demand). Light theme only in v1.
- **i18n:** next-intl for routing (`localePrefix: 'as-needed'`) and interface text; content translations are stored per locale in the application database.
- **Database:** PostgreSQL, with Drizzle ORM + node-postgres for data access and reviewed SQL migrations.
- **Authentication:** Better Auth for password/session; Admin/Editor policy, operator bootstrap, and account lockout are implemented and tested by the application. Public signup is closed.
- **Media:** SeaweedFS (self-hosted, S3-compatible API) behind a storage adapter, served through the Cloudflare CDN.
- **Email:** Resend.
- **Anti-spam:** Cloudflare Turnstile.
- **Analytics:** Umami Cloud.
- **Error monitoring:** Sentry (free plan).
- **Repo:** `sineva-compro` (Git), separate from the chatbot repo.

Direct dependency versions are pinned and only raised deliberately. The final versions of replacement libraries are checked against the registry, peer dependencies, and advisories at the start of implementation; Payload's transitive pins are not copied as a new baseline. GSAP is licensed under its "Standard no charge" license, which is not an OSI license, so a license check is required before launch (§17).

Module boundaries, folder structure, security, and transition details are in the [architecture](../architecture/README.md), the [custom admin decision](../architecture/decisions/2026-10-14-custom-admin.md), and the [CPR-7 plan](../superpowers/plans/2026-10-14-cpr-7-foundation.md). The redesign work is planned in the [website redesign plan](../superpowers/plans/2026-10-15-website-redesign.md) and the [Linear alignment plan](../superpowers/plans/2026-10-15-linear-alignment.md).

### 14.2 Infrastructure: VPS + Coolify

```
Visitor ──► Cloudflare (DNS, proxy/CDN, Turnstile)
                │   media requests cached long at the CDN edge
                ▼
          VPS (Coolify)
          ├── Next.js container + custom admin (production)
          ├── Preview container per PR      (staging)
          ├── PostgreSQL production
          ├── PostgreSQL staging
          └── SeaweedFS container (S3 gateway): media + DB backup bucket
                │
                ├──► Off-host backup copy (Q8: separate provider or second SeaweedFS in another location)
                ├──► Resend (email)
                ├──► Umami Cloud (analytics)
                └──► Sentry (errors)
```

- **Minimum VPS specification:** 2 vCPU, 4 GB RAM, 80 GB SSD, Jakarta or Singapore region, Ubuntu LTS. 4 GB RAM is needed because a Next.js build can fail from running out of memory on 2 GB. SeaweedFS holds media and 14 daily database dumps on the same disk, so disk size must be re-checked against the expected media volume.
- **Deploy:** Coolify automatically deploys the `main` branch to production.
- **Preview per PR:** created with Coolify's preview deployment feature; each PR uses an isolated database on the staging PostgreSQL instance and its own media prefix in SeaweedFS. Previews do not use production personal data.
- **Environments:** local (Postgres via Docker Compose) → preview (per PR) → production.

### 14.3 CI (GitHub Actions)
Runs on every PR, in order: lint → typecheck → unit and integration tests (including the copy lint, FR-COPY-01) → build → E2E (Playwright, with a Postgres service) → Lighthouse CI against the production build.

A PR can only be merged to `main` when all stages pass.

## 15. Testing strategy

| Level | Minimum coverage |
|---|---|
| **Unit** | WhatsApp link builder, slug mapping across locales, phone number normalisation, form validation, **dash scan over `messages/*.json` and seed content (FR-COPY-01)**, token contrast table |
| **Integration** | Leads/Waitlist server actions (validation, honeypot, Turnstile, rate limit, failed email ≠ lost data, concurrent waitlist duplicates); session/roles (Editor refused reading Leads/Waitlist and managing Users), public signup refused, account lockout, clean migration, draft separate from public content; admin rejects em/en dash in public fields; **media adapter against SeaweedFS (PutObject, GetObject, DeleteObject, presigned URLs, multipart)** |
| **E2E** | submit contact form → thank-you page; `?service=` prefill; blog `?category=` filter; WhatsApp links per context; waitlist; 404; `/` serves English without redirect; logo intro plays once per session and is skippable; run the suite once with `reducedMotion: 'reduce'`; admin login/logout, edit/publish/preview content, lead filter/status and export by Admin, Editor menu and access. Language switching in E2E is added when a second locale is enabled |
| **Quality** | Lighthouse CI (thresholds in §13.1); axe on the 5 key pages in the light theme; LCP with the logo intro within 100 ms of the no-intro baseline |
| **Manual (pre-launch)** | test on iOS and Android devices, email delivery (SPF/DKIM), backup restore from the off-host copy |

In CI and locally, Turnstile uses Cloudflare's official *test keys*, and email sending is replaced by a mock adapter that records emails without sending them. Real email is only sent from preview and production. The SeaweedFS integration tests run against a SeaweedFS service container in CI.

## 16. Milestones

| Milestone | Scope | Depends on |
|---|---|---|
| **M0: Foundation** | Final PRD, domain, repo, Next.js foundation without a CMS, database/migrations, basic session and custom admin shell, CI, VPS + Coolify (including SeaweedFS), Cloudflare DNS, Resend | domain and VPS provider decisions |
| **M1: Content & Design** | EN copy, design system in [docs/design](../design/README.md), 3D and Lottie assets | brand files, Sino assets |
| **M2: Admin & Pages** | Admin schema and forms, roles/lockout, media, page content/settings, light theme, i18n prefix change (`as-needed`, English only), design system components, all pages, blog, work | M0, M1 |
| **M3: Leads & Integrations** | Contact form, WhatsApp, waitlist, email, anti-spam, mini-CRM, analytics | M2 |
| **M4: Content & QA** | Final content input, SEO and structured data, accessibility, performance (including Sino and logo intro budgets), E2E, device testing | M3, showcases ready |
| **M5: Launch** | Domain live, Search Console, monitoring, backup restore test (off-host copy), admin guide | M4 |

Ticket title format: **`CPR-{number} | [MODULE] Action`**. `CPR-{number}` is assigned automatically by Linear; the title field is only `[MODULE] Action` so the number is not duplicated. Module list: `PRD`, `Infra`, `Admin`, `I18n`, `Layout`, `Home`, `Services`, `Portfolio`, `Product`, `Blog`, `About`, `Contact`, `Lead`, `SEO`, `Analytics`, `Design`, `Content`, `QA`, `Launch`, `Docs`. The Rev. 3 ticket mapping is in the [Linear alignment plan](../superpowers/plans/2026-10-15-linear-alignment.md).

## 17. Dependencies and risks

| Risk / dependency | Impact | Mitigation |
|---|---|---|
| English copywriting becomes a bottleneck | Launch delayed | M1 starts in parallel with M0. Claude drafts EN copy and the Founder reviews. Copy rules in [copywriting.md](../design/copywriting.md) |
| Showcase demos not ready | Work page empty | Can launch with at least 2 items. The chatbot demo can follow without redeploying (content comes from the custom admin) |
| Legal entity not yet established | Footer and Privacy Policy incomplete | Fields hidden while empty. The Privacy Policy uses the name "Sineva" and a contact email until the legal entity is formed |
| VPS operational burden | Downtime or data loss | Automated backups with an off-host copy and a tested restore, external uptime monitor, automatic security updates |
| SeaweedFS is self-hosted: S3 API gaps, operations, single-VPS risk | Upload or serve failures, media loss | Media adapter integration tests for PutObject, GetObject, DeleteObject, presigned URLs, and multipart (§15); media replicated off-host (Q8); internal ports never exposed; CDN long cache reduces load; disk sizing check (§14.2) |
| Backups only on the same VPS | Total data loss if the VPS fails | Daily backup to a SeaweedFS bucket and an off-host copy, 14-day retention, restore tested from the off-host copy before launch (§13.6, Q8) |
| Spam on forms | Full inbox, dirty data | Honeypot + Turnstile + rate limit |
| Replacing the already-built Payload foundation | Evidence for the old foundation does not prove the new architecture | CMS integration replaced through CPR-7 and retested before the PR is ready for review; developer data is not deleted automatically |
| Custom admin development | Forms, permissions, rich text, and publishing need extra work | Use a maintained authentication library; v1 admin scope is explicit in §9; schema + query + UI + tests live in the same owner ticket |
| Next.js/application library version changes | Broken build | Versions pinned, upgrades through separate PRs |
| 3D mascot performance (`sino.glb` is 13.8 MB raw, ±430k triangles, 114 draw calls) | Poor LCP, jank on mid-range phones | Asset fixes and draco compression before use (target ≤ 600 KB brotli, ≤ 80k triangles, ≤ 30 draw calls); poster-first loading with a feature/FPS gate and a loop fallback; canvas never the LCP element; reduced motion shows the poster only ([mascot-sino.md](../design/mascot-sino.md) §1.1, §3) |
| Logo intro overlay hurts LCP | Failed Core Web Vitals, lower conversion | Once per session, ≤ 1.6 s, skippable, page rendered underneath; verify LCP stays within 100 ms of the no-intro baseline, else use the symbol-only Lottie in the navbar logo slot ([motion.md](../design/motion.md) §3.1) |
| GSAP license ("Standard no charge", not OSI) | License issue after launch | License check before launch; keep GSAP behind a thin motion layer so it can be replaced; load on demand |
| Copy claims without data (numbers, testimonials, logos, ratings) | Loss of trust, legal exposure | FR-COPY-02, copy review checklist, `card-stat` only with real numbers |
| Product name, offers, and capabilities not final (Q9, Q10, Q11) | Rework of copy and page structure | Working names kept in one place (messages and content DB); only `CBT`-confirmed capabilities published |
| Changing locale prefix from `always` (CPR-25) to `as-needed` | Routing and test rework | Not launched yet, so no redirects are needed; update routing tests in M2 |
| 3D and Lottie asset production lags | Home hero and Product page fall back to stills | Priorities P0/P1/P2 in [3d-asset-requirements.md](../design/3d-asset-requirements.md); poster fallback works without any new asset |

## 18. Decision log

| # | Decision | Rejected alternative |
|---|---|---|
| D1 (Rev. 2) | Next.js with an integrated custom admin; PostgreSQL data; no headless CMS | Payload/headless CMS (Rev. 1 decision replaced); content only in the repo; separate conventional CMS |
| D2 | VPS + Coolify hosting | Vercel Pro + Neon |
| D3 | Primary call to action: service consultation (WhatsApp + form); secondary: product waitlist | waitlist as the primary call to action; two equal paths |
| D4 (Rev. 3) | English default and only enabled locale at launch, i18n-ready (`localePrefix: 'as-needed'`); Indonesian added later | Indonesian and English at launch (Rev. 1/2) |
| D5 | Credibility through clearly labelled internal showcases | team profile only; launch without a portfolio |
| D6 (Rev. 2) | Custom form → validated server action → application-owned Leads/Waitlist tables | Public CRUD API for personal data; Form Builder plugin |
| D7 | Umami without cookies, no cookie banner | GA4 + cookie banner |
| D8 (Rev. 2) | Layout fixed in code; content in the database and edited through the custom admin | page builder blocks; repo content files as the only editor |
| D9 | Linear: one team per product (`CPR`, `CBT`) | one team with a prefix in the title |
| D10 (Rev. 3) | Light theme only in v1 (Rev. 3); dark mode deferred | light + dark at launch (Rev. 1/2) |
| D11 | Drizzle for data/migrations and Better Auth for authentication; domain policy and admin UI owned by the application | Writing hashing/sessions in-house; building a separate admin service for v1 |
| D12 (Rev. 3) | Sineva is an AI consulting company with two pillars (Product and Services); Web Development is part of AI Build, not standalone; brand name "Sineva" | Services-only company; product-only SaaS; Web Development as a standalone service; keeping the old brand name |
| D13 (Rev. 3) | Media in self-hosted SeaweedFS (S3-compatible); database backups to a SeaweedFS bucket plus an off-host copy | Cloudflare R2; backups only on the same VPS |

## 19. Open questions

| # | Question | Owner | Deadline |
|---|---|---|---|
| Q1 | Domain name to purchase | Founder | before M0 completes |
| Q2 | VPS provider and region | Founder + developer | before M0 completes |
| Q3 | WhatsApp Business number and email inbox for leads | Founder | before M3 |
| Q4 | Topics for 2-3 showcases. Proposal: (a) FAQ and booking chatbot for a fictional clinic, needs `CBT`; (b) WhatsApp order dashboard for an F&B UMKM; (c) this Sineva website itself as a case study | Founder | start of M1 |
| Q6 | Who reviews the Privacy Policy text from a legal standpoint | Founder | before M4 |
| Q8 | Off-host backup target for database backups (and media): separate provider or a second SeaweedFS instance in another location, and how copies are encrypted before leaving the VPS | Founder + developer | before M4 |
| Q9 | Final name of the AI agents product (working name "Sineva AI Agents") | Founder | before M4 |
| Q10 | Final service names and offers (proposal: AI Discovery, AI Build, AI Enablement) | Founder | start of M1 |
| Q11 | Product capabilities confirmed by the `CBT` team (which capabilities and channels may be mentioned) | Founder + `CBT` | before product copy is final (M1) |

**Q5 answered, 15 October 2026:** code-first with the documented design system ([docs/design/](../design/README.md)); Figma is optional for key screens.

**Q7 answered, 14 October 2026:** the Founder confirmed there are no vector files from the logo creator. The logo was traced to SVG and added to Figma, along with a version for dark backgrounds. Both variants have identical paths; only the color differs. Assets and the verification results are in [`assets/brand/logos/`](../../assets/brand/logos/README.md).
