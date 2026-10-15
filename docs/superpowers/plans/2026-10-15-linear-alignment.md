# Linear alignment: team CPR, project "Company Profile v1" (Rev. 3)

| | |
|---|---|
| Date | 2026-10-15 |
| Status | **Proposal. Nothing has been changed in Linear.** Waiting for product owner approval |
| Owner | Product owner (Faishal) |
| Inputs | [Implementation plan](2026-10-15-website-redesign.md), [Admin CMS plan](2026-10-15-admin-cms.md), [Agent swarm playbook](2026-10-15-agent-swarm.md), [design system](../../design/README.md), [Sintra research](../../design/research/sintra-reference.md), [PRD Rev. 3](../../prd/2026-10-14-company-profile-prd.md), Linear digest of CPR-5 to CPR-65 (read 2026-10-15) |
| Language | Everything below is English. Linear descriptions are English from now on. The old Indonesian text stays in Linear history and is summarised under **References** of each rewritten ticket |

How to use this file: every `### ` section below holds the fields to set in Linear plus a fenced `markdown` block. The content of that block is the full description to paste into the ticket. Fields outside the block (Action, Milestone, Assignee, Priority, Blocked by, Blocks) are set with the Linear fields, not in the description.

## 1. Summary

### 1.1 Counts per action

| Action | Count | Tickets |
|---|---|---|
| KEEP (no description change) | 7 | CPR-1 to CPR-4 (onboarding, out of scope), CPR-33, CPR-46, CPR-49 (relations change only, optional heads-up comment) |
| KEEP status Done + Rev. 3 comment | 5 | CPR-5, CPR-7, CPR-15, CPR-24, CPR-25 |
| KEEP + minor note appended | 9 | CPR-6, CPR-10, CPR-28, CPR-31, CPR-55, CPR-57, CPR-60, CPR-63, CPR-64 |
| UPDATE (rewrite description, maybe title, milestone, assignee) | 41 | CPR-8 to CPR-14 except CPR-10 (6), CPR-16, 17, 18, 21, 22 (5), CPR-23, 26, 27, 29, 30, 32, 34 to 44 (17), CPR-45, 47, 48, 50, 51 (5), CPR-52, 53, 54, 56, 58, 59 (6), CPR-61, 62 (2) |
| CANCEL (status Canceled + comment) | 3 | CPR-19, CPR-20, CPR-65 |
| NEW (create) | 25 | 14 from this alignment: NEW-prd-rev3, NEW-seaweedfs, NEW-auth-client-ip, NEW-sino-asset-web, NEW-sino-renders, NEW-lottie-library, NEW-i18n-en, NEW-copy-lint, NEW-motion-foundation, NEW-section-blocks, NEW-logo-intro, NEW-sino-hero, NEW-lead-intake-action, NEW-waitlist-form-ui. 9 from `2026-10-15-admin-cms.md`: NEW-cms-shell, NEW-cms-contract, NEW-cms-pages, NEW-cms-product, NEW-cms-faq, NEW-cms-seo, NEW-cms-email, NEW-cms-audit, NEW-cms-preview. 2 gap closures: NEW-cms-dashboard, NEW-cms-profile |

Check: 7 + 5 + 9 + 41 + 3 = 65 existing tickets (CPR-1 to CPR-65). The 41 UPDATE tickets are 6 (CPR-8, 9, 11, 12, 13, 14) + 5 + 17 + 5 + 6 + 2.

### 1.2 Table

Legend for the Assignee column: a plain name means the product owner's rule (or the existing assignee) decides it. **(proposed)** means the rule does not cover the ticket and the name needs confirmation. "Blocked by" shows the resulting set after all changes. `NEW-*` keys become real `CPR-n` IDs once created. Milestones are referred to by code: M0 Foundations, M1 Content and Design, M2 Admin and Pages, M3 Lead and Integrations, M4 Content and QA, M5 Launch.

| Ticket | Action | New title | Milestone | Assignee | Blocked by | Why | Linear |
|---|---|---|---|---|---|---|---|
| CPR-1 to 4 | KEEP | (no change) | n/a | keep | keep | Onboarding, out of scope | |
| CPR-5 | KEEP + comment | (no change) | M0 | Farhan (keep) | none | Done; superseded by PRD Rev. 3 | |
| CPR-6 | KEEP + note | [Infra] Choose and buy domain | M0 | Farhan (keep) | none | Domain naming follows brand Sineva | |
| CPR-7 | KEEP + comment | (no change) | M0 | Farhan (keep) | none | Done; i18n and Tailwind setup change later | |
| CPR-8 | UPDATE | [Infra] Provision VPS and install Coolify | M0 | Farhan (proposed) | none | VPS also hosts SeaweedFS, re-check disk | |
| CPR-9 | UPDATE | [Infra] Setup Cloudflare: DNS, CDN, Turnstile | M0 | Farhan (proposed) | CPR-6 | R2 removed, media CDN host added | |
| CPR-10 | KEEP + note | [Infra] Setup CI GitHub Actions | M0 (deferred) | Farhan (proposed) | CPR-7 | Stays deferred; rebase on CPR-25 and NEW-i18n-en tests | |
| CPR-11 | UPDATE | [Infra] Deploy production and per-PR preview via Coolify | M0 | Farhan (proposed) | CPR-9, CPR-7, CPR-8, NEW-seaweedfs | Preview media prefix moves from R2 to SeaweedFS | |
| CPR-12 | UPDATE | [Infra] Setup Resend and verify email domain | M0 | Farhan (proposed) | CPR-9 | Brand Sineva, English templates | |
| CPR-13 | UPDATE | [Infra] Daily database backup to SeaweedFS + off-host copy | M0 | Farhan (proposed) | CPR-11, NEW-seaweedfs | Backup target changes, off-host copy added | |
| CPR-14 | UPDATE | [Infra] Setup Sentry and uptime monitor | M0 | Farhan (proposed) | CPR-11 | Monitor `/` instead of `/id` | |
| CPR-15 | KEEP + comment | (no change) | M1 | Farhan (keep) | none | Done; outline superseded for EN by page-patterns.md | |
| CPR-16 | UPDATE | [Content] Decide portfolio showcase topics | M1 | Farhan (keep) | none | AI-focused showcase topics | |
| CPR-17 | UPDATE | [Content] Draft privacy policy (English) | M1 | Farhan (proposed) | none | EN only, hosting providers as processors | |
| CPR-18 | UPDATE | [Design] Design system from brand identity | M1 | Faishal | none | Scope now docs/design, pending Founder approval | |
| CPR-19 | CANCEL | n/a | M1 | n/a | n/a | EN first; Indonesian draft kept for a future `id` locale | |
| CPR-20 | CANCEL | n/a | M1 | n/a | n/a | Superseded by page-patterns.md and admin-ui.md | |
| CPR-21 | UPDATE | [Content] English copywriting (primary) | M1 | Faishal (proposed) | NEW-prd-rev3 | Written from scratch for the new IA | |
| CPR-22 | UPDATE | [Design] Hi-fi key screens for approval (optional Figma) | M1 | Faishal | CPR-18 | Reduced to Home, Product, Contact, light only | |
| CPR-23 | UPDATE | [Admin] Manage media and upload to SeaweedFS | M2 | Farhan | CPR-24, CPR-7, NEW-seaweedfs, NEW-cms-shell | Storage backend behind `MediaStore`, CMS plan media rules | |
| CPR-24 | KEEP + comment | (no change) | M2 | Farhan (keep) | none | Done; see NEW-auth-client-ip | |
| CPR-25 | KEEP + comment | (no change) | M2 | Farhan (keep) | none | Done; routing replaced by NEW-i18n-en | |
| CPR-26 | UPDATE | [Layout] Base components from the design system | M2 | Faishal (reassign from Farhan, needs confirmation) | CPR-18, CPR-7 | Re-scoped to tokens.md and components.md; admin kit moved | |
| CPR-27 | UPDATE | [Admin] Manage services content | M2 | Farhan | CPR-24, CPR-23, NEW-cms-contract | Three services, English seed, CMS plan fields | |
| CPR-28 | KEEP + note | [Admin] Manage team and authors | M2 | Farhan | CPR-23, CPR-24, NEW-cms-contract | Locale-ready English, two extra fields | |
| CPR-29 | UPDATE | [Admin] Manage site settings | M2 | Farhan | CPR-23, CPR-24, NEW-cms-contract | Site settings only; page content moved to NEW-cms-pages | |
| CPR-30 | UPDATE | [Admin] Manage work (portfolio) with draft, publish and preview | M2 | Farhan | CPR-27, NEW-cms-contract | UI naming "Work", route `/work` | |
| CPR-31 | KEEP + note | [Admin] Manage blog, categories and rich text editor | M2 | Farhan | CPR-23, CPR-28, NEW-cms-contract | Category param `?category=`, editor UI from shell | |
| CPR-32 | UPDATE | [Layout] Header, mobile menu and footer | M2 | Faishal | CPR-26, NEW-motion-foundation, NEW-i18n-en, NEW-cms-contract | Navbar per components.md and motion.md | |
| CPR-33 | KEEP | [Admin] Refresh cache after content changes | M2 | Farhan | CPR-27, CPR-31, CPR-29, CPR-30, NEW-cms-contract | Uses cache tag file from NEW-cms-contract | |
| CPR-34 | UPDATE | [I18n] Language switcher to the equivalent page | none (post-launch) | Faishal | CPR-32, NEW-i18n-en | Deferred until a second locale exists | |
| CPR-35 | UPDATE | [Layout] 404 and Privacy Policy pages | M2 | Faishal | CPR-32, NEW-cms-contract | Per page-patterns.md 2.9 | |
| CPR-36 | UPDATE | [Home] Static Home sections | M2 | Faishal | CPR-32, NEW-section-blocks, NEW-cms-contract | Per page-patterns.md 2.1 | |
| CPR-37 | UPDATE | [Services] Services list and detail pages | M2 | Faishal | CPR-32, NEW-section-blocks, NEW-cms-contract | Three services, per 2.3 and 2.4 | |
| CPR-38 | UPDATE | [Portfolio] Work list and detail pages | M2 | Faishal | CPR-32, NEW-section-blocks, NEW-cms-contract | Per 2.5 | |
| CPR-39 | UPDATE | [Product] AI Agents product page | M2 | Faishal | CPR-32, NEW-section-blocks, NEW-cms-contract | Per 2.2, product name is a working name | |
| CPR-40 | UPDATE | [Blog] Blog list page | M2 | Faishal | CPR-32, NEW-cms-contract | Per 2.6 | |
| CPR-41 | UPDATE | [About] About page | M2 | Faishal | CPR-32, NEW-section-blocks, NEW-cms-contract | Per 2.7 | |
| CPR-42 | UPDATE | [Contact] Contact and thank-you pages | M2 | Faishal | CPR-32, NEW-cms-contract | Book-a-demo pattern, per 2.8 | |
| CPR-43 | UPDATE | [Home] Dynamic Home sections (work and articles) | M2 | Faishal | CPR-36, NEW-cms-contract | Per 2.1 sections 7 and 8 | |
| CPR-44 | UPDATE | [Blog] Article page | M2 | Faishal | CPR-40 | Sticky TOC, share with Lottie L3 | |
| CPR-45 | UPDATE | [Lead] Contextual WhatsApp buttons | M3 | Faishal | CPR-32, NEW-cms-contract | Contexts per service and product, English | |
| CPR-46 | KEEP | [Lead] Manage leads and mini-CRM | M3 | Farhan | CPR-24, NEW-cms-shell | Admin side unchanged; service filter keys change | |
| CPR-47 | UPDATE | [Lead] Contact form (UI and client validation) | M3 | Faishal | CPR-42, NEW-lead-intake-action | Split: UI here, server action in NEW-lead-intake-action | |
| CPR-48 | UPDATE | [Lead] Waitlist storage, admin list and CSV export | M3 | Farhan | NEW-cms-shell | Server and export per CMS plan; UI moved to NEW-waitlist-form-ui | |
| CPR-49 | KEEP | [Lead] Anti-spam: honeypot, Turnstile, rate limit | M3 | Farhan (proposed) | CPR-47, NEW-waitlist-form-ui, CPR-48, CPR-9, NEW-lead-intake-action | Relations only; client IP heads-up | |
| CPR-50 | UPDATE | [Lead] Notification and auto-reply emails | M3 | Farhan | CPR-12, NEW-lead-intake-action, NEW-cms-email | English templates from NEW-cms-email | |
| CPR-51 | UPDATE | [Analytics] Umami integration and event tracking | M3 | Faishal (proposed) | NEW-waitlist-form-ui, CPR-45, CPR-47, NEW-section-blocks | Adds `path_select`; `lang_switch` only with 2nd locale | |
| CPR-52 | UPDATE | [SEO] Meta, OG and canonical | M4 | Faishal | NEW-cms-seo, NEW-i18n-en | No hreflang until 2nd locale; reads NEW-cms-seo data | |
| CPR-53 | UPDATE | [Infra] Security headers | M4 | Farhan (proposed) | CPR-11, NEW-seaweedfs | CSP for media host and draco wasm | |
| CPR-54 | UPDATE | [Content] Final English content entry | M4 | Faishal (proposed) | CPR-21, CPR-27, CPR-17, CPR-29, CPR-28, NEW-copy-lint, NEW-cms-pages, NEW-cms-product, NEW-cms-faq | EN only, more entities from the CMS plan | |
| CPR-55 | KEEP + note | [Content] Enter portfolio showcase items | M4 | Farhan (proposed) | CPR-16, CPR-30 | English only, AI-focused items | |
| CPR-56 | UPDATE | [QA] Playwright E2E for critical flows | M4 | Faishal (proposed) | CPR-47, NEW-waitlist-form-ui, CPR-48, CPR-10, CPR-32, NEW-logo-intro | Theme test removed, reduced-motion and intro runs added | |
| CPR-57 | KEEP + note | [SEO] Sitemap, robots and structured data | M4 | Faishal | CPR-52 | Single-locale sitemap, FAQ from library | |
| CPR-58 | UPDATE | [QA] Lighthouse CI and accessibility audit | M4 | Faishal (proposed) | CPR-10, CPR-54, NEW-logo-intro, NEW-sino-hero, NEW-sino-renders | Light only, with mascot and intro enabled | |
| CPR-59 | UPDATE | [QA] Device testing and content completeness check | M4 | Faishal (proposed) | CPR-54, NEW-logo-intro, NEW-sino-hero | EN, light, reduced motion, low-end Android | |
| CPR-60 | KEEP + note | [Launch] Production go-live | M5 | Farhan (proposed) | CPR-57, CPR-55, CPR-59, CPR-58, CPR-53, CPR-56, NEW-auth-client-ip | New blocker NEW-auth-client-ip | |
| CPR-61 | UPDATE | [Launch] Backup restore test | M5 | Farhan (proposed) | CPR-13 | Restore from SeaweedFS and from off-host copy | |
| CPR-62 | UPDATE | [Docs] Admin guide for content and leads | M5 | Farhan | CPR-46, CPR-33, CPR-48 | Guide language stays Indonesian (admin UI language) | |
| CPR-63 | KEEP + note | [Launch] Register Search Console and submit sitemap | M5 | Farhan (proposed) | CPR-60 | Single-locale sitemap | |
| CPR-64 | KEEP + note | [Launch] Definition of Done v1 sign-off | M5 | Farhan (keep) | CPR-63, CPR-61, CPR-62, CPR-60 | Checklist now from PRD Rev. 3 | |
| CPR-65 | CANCEL | n/a | M2 | n/a | n/a | Light only in v1; dark mode is post-launch backlog | |
| NEW-prd-rev3 | NEW | [PRD] Rev. 3: AI consulting positioning, English, light theme, SeaweedFS | M0 | Faishal (proposed) | none | Records every Rev. 3 decision; In Review until merged | CPR-66 |
| NEW-seaweedfs | NEW | [Infra] Deploy SeaweedFS object storage (S3 gateway, buckets, keys, CDN) | M0 | Farhan (proposed) | CPR-8, CPR-9 | Media storage replaces Cloudflare R2 | CPR-67 |
| NEW-auth-client-ip | NEW | [Infra] Trusted client IP for auth rate limit behind Cloudflare | M3 | Farhan (proposed) | CPR-9, CPR-11 | Login rate limit shares one bucket without it | CPR-68 |
| NEW-sino-asset-web | NEW | [Design] Sino GLB web optimisation (asset fixes + draco export) | M1 | Faishal | none | Asset is 13.8 MB, not web-ready | CPR-69 |
| NEW-sino-renders | NEW | [Design] Sino renders: poses, scenes, loops, device frames, 3D icons | M1 | Faishal | none | Pages need pre-rendered Sino assets | CPR-70 |
| NEW-lottie-library | NEW | [Design] Lottie library L3 to L10 | M2 | Faishal | NEW-motion-foundation | Icon and state animations | CPR-71 |
| NEW-i18n-en | NEW | [I18n] English default, single locale, as-needed prefix | M2 | Faishal | NEW-prd-rev3 | Replaces CPR-25 routing | CPR-72 |
| NEW-copy-lint | NEW | [QA] Copy lint: block em dash/en dash in messages and content | M2 | Faishal | none | Enforces the no-dash copy rule | CPR-73 |
| NEW-motion-foundation | NEW | [Layout] Motion foundation: tokens, reveal, reduced motion, GSAP + Lottie loaders | M2 | Faishal | CPR-26 | Shared base for all animation | CPR-74 |
| NEW-section-blocks | NEW | [Layout] Shared section blocks (HeroSplit, TwoPaths, TaskCardGrid, StickySteps, FaqSection, FinalCta, StickyCtaBar) | M2 | Faishal | CPR-26, NEW-motion-foundation | Pages compose the same blocks | CPR-75 |
| NEW-logo-intro | NEW | [Layout] First-visit logo intro (Lottie overlay + FLIP to navbar) | M2 | Faishal | NEW-motion-foundation, CPR-32 | Brand moment with an LCP guard | CPR-76 |
| NEW-sino-hero | NEW | [Home] Sino realtime hero mascot (three.js, loading gate, state machine, look-at) | M2 (M4 if asset is late) | Faishal | NEW-sino-asset-web, NEW-motion-foundation, CPR-36 | Only realtime 3D on the site | CPR-77 |
| NEW-lead-intake-action | NEW | [Lead] Contact intake server action, shared schema and persistence | M3 | Farhan | CPR-46 | Server half of the contact form split | CPR-78 |
| NEW-waitlist-form-ui | NEW | [Lead] Waitlist form (UI) | M3 | Faishal | CPR-39, CPR-48 | Frontend half of the waitlist | CPR-79 |
| NEW-cms-shell | NEW | [Admin] Admin UI kit and layout on the shared design system | M2 | Farhan | CPR-26 | CMS plan; base for all admin screens | CPR-80 |
| NEW-cms-contract | NEW | [Admin] Public query contract, DTO fixtures and cache tags | M2 | Farhan | none | CMS plan; lets landing and CMS work in parallel | CPR-81 |
| NEW-cms-pages | NEW | [Admin] Page content editor (Home, Product, Services overview, About, Contact, Thank you, 404, Blog/Work index) | M2 | Farhan | NEW-cms-shell, NEW-cms-contract, CPR-23 | CMS plan; page text editable without deploy | CPR-82 |
| NEW-cms-product | NEW | [Admin] Product capabilities, business types and product status | M2 | Farhan | NEW-cms-shell | CMS plan; data for Home and Product | CPR-83 |
| NEW-cms-faq | NEW | [Admin] Shared FAQ library with tags and JSON-LD output | M2 | Farhan | NEW-cms-shell | CMS plan; one FAQ source for all pages | CPR-84 |
| NEW-cms-seo | NEW | [Admin] SEO fields, global SEO settings, snippet/OG preview, redirects | M2 | Farhan | NEW-cms-contract | CMS plan; SEO data and slug redirects | CPR-85 |
| NEW-cms-email | NEW | [Admin] Email settings (Resend API / SMTP), encrypted secrets, templates, test send | M3 | Farhan | CPR-12 | CMS plan; email configuration in the admin | CPR-86 |
| NEW-cms-audit | NEW | [Admin] Audit log | M3 | Farhan | NEW-cms-shell | CMS plan; who changed what | CPR-87 |
| NEW-cms-preview | NEW | [Admin] Preview links for pages and services | M2 | Farhan | NEW-cms-pages | CMS plan; preview unsaved page state | CPR-88 |
| NEW-cms-dashboard | NEW | [Admin] Dashboard: KPI cards, gradient charts, activity feed | M3 | Farhan | NEW-cms-shell, NEW-cms-audit, CPR-46 | Gap closed: admin-ui.md 4.3-4.4 | CPR-89 |
| NEW-cms-profile | NEW | [Admin] My profile: profile, password, active sessions, preferences | M2 | Farhan | NEW-cms-shell | Gap closed: admin-ui.md 4.9 | CPR-90 |

## 2. Execution notes

1. **Nothing is executed until the product owner approves this file.** No Linear write tool has been called while producing it.
2. **Linear MCP has no delete.** "Remove" means status Canceled plus a comment that links the replacement ticket. Relations that point at a canceled ticket are removed.
3. **Titles** keep the PRD format `[MODULE] Action` without the `CPR-n` number (Linear adds the number). Several digest titles still carry a `CPR-n | ` prefix (CPR-10, 15, 16, 19, 24, 25, 26); strip it when updating. Titles of open tickets are proposed in English to match the English descriptions. If the team prefers to keep Indonesian titles on KEEP tickets, only the title column changes.
4. **Descriptions are replaced wholesale** on UPDATE tickets. The old text stays in Linear history and is summarised under **References** of each new description, so nothing is lost.
5. **PRD references.** PRD Rev. 3 may still be mid-rewrite. Section numbers below follow the Rev. 2 numbering (for example "PRD section 8.2, contact form"). Rev. 3 keeps the structure. If it renumbers, match by topic and by FR ID. Open questions Q8 (off-host backup target), Q9 (product name), Q10 (service names), Q11 (product capabilities) are Rev. 3 additions.
6. **Order of operations**
   1. Create the NEW tickets first (title, description, milestone, assignee, no relations) to obtain real `CPR-n` IDs. Replace every `NEW-*` key in this file with the ID.
   2. Update existing tickets (title, description, milestone, assignee).
   3. Set relations (blocks, blockedBy, relatedTo) per ticket, using the "Blocked by" and "Blocks" fields below. Confirm the exact relation field names in the `save_issue` schema at execution time.
   4. Add comments to the Done tickets.
   5. Cancel CPR-19, CPR-20, CPR-65 with their comments, then remove their relations.
   6. Clear the milestone of CPR-34.
   7. Re-list the project and compare against the summary table.
7. **Assignees** (Linear user IDs): Faishal `189c29ed-a908-4dc2-a14c-b43b4bd661b7`, Farhan Fadillah Rafi `60a6e9db-032f-489c-bf47-02c74c4debdd`. Rules applied: public landing page and frontend scope go to Faishal; CMS, admin, lead server side and mini-CRM go to Farhan, including all nine new CMS tickets from `2026-10-15-admin-cms.md`. Tickets that the rules do not cover are marked "(proposed)" and need confirmation. Existing assignees on Done tickets, CPR-6, CPR-16 and CPR-64 are kept.
8. **Split tickets.** CPR-47 (contact form) is split into the existing ticket (form UI, Faishal) and NEW-lead-intake-action (server action, Farhan). The waitlist is split the other way because the CMS plan fixes CPR-48 as the server and export ticket (Farhan): CPR-48 stays the server ticket and the form UI is the new NEW-waitlist-form-ui (Faishal). CPR-45 (WhatsApp) stays whole under Faishal because the admin-editable number and templates live in CPR-29. See section 6.
9. **Implementation rules for every code ticket.** Branches are `faishal/<ticket>` for landing work and `farhan/<ticket>` for CMS work, one ticket per PR (`docs/superpowers/plans/2026-10-15-agent-swarm.md`). TDD is mandatory: write the failing test first, watch it fail, then implement. Read the relevant guide in `node_modules/next/dist/docs/` before touching Next.js APIs (this repo runs a Next.js version with breaking changes, see `AGENTS.md`). Never write an em dash or en dash in public copy. Never invent claims, numbers, logos or testimonials.
10. **Open decisions for the product owner**
    - CI is deferred (CPR-10). CPR-56 and CPR-58 are written with "run in CI" criteria and stay blocked by CPR-10. If CI stays deferred through M4, run the suites locally and record the output as evidence instead.
    - CPR-26 is proposed to move from Farhan to Faishal. Farhan has an unpushed local spec commit `baff2e0`. Coordinate the handoff before anyone builds components, or two kits will exist.
    - Q8 off-host backup target, Q9 product name, Q10 service names, Q11 product capabilities (Founder and team CBT).
    - The open decisions and gaps in section 6.2 (business type lists, service FAQ source, admin screens that have no ticket, waitlist email).

## 3. Create first: NEW tickets

Create these before touching anything else. All are in team CPR, project "Company Profile v1", unless noted. The nine `NEW-cms-*` tickets come from `docs/superpowers/plans/2026-10-15-admin-cms.md` section 5 and are all assigned to Farhan Fadillah Rafi.


### NEW-prd-rev3 · [PRD] Rev. 3: AI consulting positioning, English, light theme, SeaweedFS

- **Action:** NEW. Create with status **In Review**; move to Done when the PRD PR is merged
- **Milestone:** M0
- **Assignee:** Faishal (proposed, needs confirmation; product owner owns the PRD)
- **Priority:** High
- **Blocked by:** none
- **Blocks:** CPR-21, NEW-i18n-en
- **Labels:** none

```markdown
**Context**
PRD Rev. 2 (14 Oct 2026) describes a custom-development company with Web Development and AI & Automation services, Indonesian and English at launch, light and dark themes, and Cloudflare R2 for media. On 15 Oct 2026 the product owner and Founder changed direction: Sineva is an AI consulting company with two pillars (Product: AI agents for UMKM with a waitlist; Services: AI Discovery, AI Build, AI Enablement), English only at launch, light theme only, a Sintra-inspired design system, the Sino mascot, and SeaweedFS instead of R2. This ticket records all of that in the PRD so the tickets, design docs and code share one source of truth.

Related docs: `docs/superpowers/plans/2026-10-15-website-redesign.md` (sections 1 to 3), `docs/design/brand-positioning.md`, `docs/design/page-patterns.md` section 1, `docs/superpowers/plans/2026-10-15-linear-alignment.md`.

**Scope**
- Rewrite PRD header, summary, background and target users for the new positioning. Brand is "Sineva" everywhere.
- Sitemap (section 6): English URLs without prefix, future `id` URLs listed as "future" (table in `docs/design/page-patterns.md` section 1). Product page `/products/ai-agents`, Work replaces Portfolio in the UI.
- Functional requirements: update FR-GLB-01 (header: new nav, no language or theme switch), replace FR-GLB-05 (light only, dark mode moves to a post-launch backlog item), FR-HOME-*, FR-SVC-* (three services), FR-PF-* (UI name "Work"; keep the "Internal demo project" label rule FR-PF-03), FR-PRD-01 (AI Agents product page), FR-CTC-01 and contact form fields (section 8.2: new service options, EN labels), FR-LEAD-02 (WhatsApp contexts), FR-I18N-* (English default, `localePrefix: 'as-needed'`, i18n-ready, `id` later), FR-SEO-02 (no hreflang until a second locale), analytics table (add `path_select`; `lang_switch` only when a second locale is enabled).
- Non-functional and architecture: media storage section (SeaweedFS S3-compatible, self-hosted on the VPS, Cloudflare CDN in front), infra diagram (section 14.2), backup (section 13.6: SeaweedFS bucket plus off-host copy), CSP implications (media host, draco wasm), performance budgets with mascot and intro (reference `docs/design/accessibility-performance.md`), design system reference.
- Definition of done (section 4.3): English only, axe in light mode only, backup restore from SeaweedFS and from the off-host copy.
- Risks: SeaweedFS on the same VPS as the database, logo intro versus LCP, Sino asset weight, GSAP license, no unverified claims (Sintra social proof not mirrored), privacy policy naming.
- Decision log: add the Rev. 3 decisions (positioning, two pillars, English-only launch, light only, SeaweedFS, design system, Sino) and mark D4 and D10 as superseded.
- Open questions: add Q8 (off-host backup target), Q9 (product name), Q10 (service names), Q11 (product capabilities confirmed by team CBT). Each with owner and deadline.
- Header status: "Rev. 3, pending Founder approval" until merged.

**Out of scope**
- Implementing anything. Writing the Indonesian locale. Pricing, careers, per-industry pages (unchanged non-goals).

**Acceptance criteria**
- [ ] PRD Rev. 3 merged to `main` through a reviewed PR; Founder approval recorded in the PR or in a comment here
- [ ] No remaining use of the old two-word brand name (Sineva followed by Tech), except in a "history" note that says it was replaced
- [ ] No statement that two locales ship at launch, that a theme toggle exists, or that media lives in R2, outside Rev. 2 history notes (check with `grep -n` on the PRD and attach the empty result)
- [ ] Existing FR IDs are kept; a short mapping table lists every FR that changed meaning or was removed
- [ ] Q8 to Q11 are listed with owner and deadline
- [ ] All Linear tickets in `docs/superpowers/plans/2026-10-15-linear-alignment.md` link to the sections they reference
- [ ] TDD is not applicable (docs only); the grep checks above are the verification

**Gotchas**
- Do not renumber sections without updating the "PRD section" references in the tickets (they follow Rev. 2 numbering today).
- The PRD currently says "Status: Final, approved by Founder". Rev. 3 must not claim approval before it is given.
- Keep the Rev. 2 custom-admin decision (D1, D6, D8, D11) untouched; it is not part of this change.

**References**
- `docs/prd/2026-10-14-company-profile-prd.md` (current Rev. 2)
- `docs/superpowers/plans/2026-10-15-website-redesign.md`, `docs/design/README.md`
- Replaces the intent of CPR-5 (PRD review and finalisation, Done): CPR-5 stays Done as history.
```

### NEW-seaweedfs · [Infra] Deploy SeaweedFS object storage (S3 gateway, buckets, keys, CDN)

- **Action:** NEW
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation)
- **Priority:** High
- **Blocked by:** CPR-8, CPR-9
- **Blocks:** CPR-11, CPR-13, CPR-23, CPR-53
- **Labels:** none

```markdown
**Context**
Rev. 3 replaces Cloudflare R2 with SeaweedFS, self-hosted on the same VPS as the app and PostgreSQL, behind the Cloudflare CDN. The app talks to it through the AWS SDK v3 S3 client (custom endpoint, path-style) behind a `MediaStore` interface (see CPR-23). See `docs/superpowers/plans/2026-10-15-website-redesign.md` section 2 (gotcha 5) and section 3 (media storage and delivery). PRD Rev. 3: media storage and backup sections.

**Scope**
- Deploy SeaweedFS on the VPS through Coolify: master, volume server, filer and S3 gateway, persistent volumes, restart policy, pinned image version.
- Buckets: `media-public` (published media, anonymous read through the CDN host only), `media-private` (drafts, preview, per-PR prefixes), `backups` (database backups, see CPR-13).
- Access keys with least privilege: app identity (read/write on media buckets), backup identity (write on `backups`), no shared root key in the app. All keys are Coolify secrets, never in the repo.
- Network exposure: the S3 API and the SeaweedFS admin/master ports are reachable only on the internal Docker network. Public reads of `media-public` go through `media.<domain>` (Cloudflare proxy, cache rules, `Cache-Control: public, max-age=31536000, immutable` with content-hash object names).
- Local and CI: the pinned image and a Compose service definition that CPR-23 reuses for integration tests.
- S3 compatibility matrix: verify with a script every operation the media adapter will use (PutObject, GetObject, DeleteObject, HeadObject, ListObjectsV2, presigned GET and PUT, multipart upload for objects above 5 MB) and record pass/fail in `docs/runbooks/seaweedfs.md`.
- Health checks and monitoring: uptime check on the media host (external, same monitor as CPR-14), disk usage alert on the VPS volume.
- Runbook: deploy, key rotation, adding disk, where data lives, how to restore a volume.

**Out of scope**
- The upload UI and `MediaStore` code (CPR-23). Database backup job (CPR-13). Off-host copy target decision (Q8, owned by the Founder).

**Acceptance criteria**
- [ ] All SeaweedFS components are healthy after a VPS reboot
- [ ] The S3 compatibility script passes for every operation listed above, and the output is stored in the runbook
- [ ] Anonymous GET of an object in `media-public` through `media.<domain>` returns 200 with the cache headers above; anonymous GET of an object in `media-private` returns 403 or 404
- [ ] The S3 API port is not reachable from the internet (verified from outside the VPS; only 22, 80 and 443 are open)
- [ ] Separate app and backup keys exist; no key appears in the repo (secret scan clean)
- [ ] Disk usage alert and media host uptime check are active and tested
- [ ] `docs/runbooks/seaweedfs.md` exists and includes key rotation and disk growth steps
- [ ] The Compose service used for local/CI tests is committed with a pinned image tag

**Gotchas**
- Same VPS as the database: one disk failure loses media and database backups. The backup ticket (CPR-13) must keep an off-host copy (Q8). Do not mark backups "done" on SeaweedFS alone.
- SeaweedFS exposes an S3-compatible API, not a full S3 implementation. Verify bucket policy, ACL, CORS and presigned URL behaviour instead of assuming it matches AWS. (Recalled from memory, not verified: bucket policies and ACLs are limited. Check the SeaweedFS docs for the pinned version.)
- Use path-style addressing with a custom endpoint in the SDK (`forcePathStyle`). Virtual-host style needs wildcard DNS and will fail.
- Single-node setups have no replication by default. Record that explicitly in the runbook (recalled, not verified).
- Do not let the CDN host serve `media-private`. Check the bucket-to-host mapping with a negative test.
- Check the SeaweedFS license before first production use and record it (recalled to be permissive, not verified).
- Re-check VPS disk size (CPR-8) before choosing volume size limits.

**References**
- PRD Rev. 3 media storage, backup (section 13.6) and infra (section 14.2)
- Previous R2 setup lived in CPR-9 (buckets `sineva-compro-media` and `sineva-compro-backup`, S3 credentials as secrets, public media subdomain); those criteria are carried over here
- `docs/superpowers/plans/2026-10-15-website-redesign.md` phase 2
```

### NEW-auth-client-ip · [Infra] Trusted client IP for auth rate limit behind Cloudflare

- **Action:** NEW
- **Milestone:** M3
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation)
- **Priority:** High
- **Blocked by:** CPR-9, CPR-11
- **Blocks:** CPR-60
- **Labels:** none

```markdown
**Context**
Found in code review. `src/lib/auth/options.ts` configures `advanced: { cookiePrefix, disableOriginCheck, disableCSRFCheck }` and a custom rate limit rule for `/sign-in/email` (5 requests per 60 s), but sets no `advanced.ipAddress`. In better-auth 1.7.7 (`node_modules/better-auth/dist/api/rate-limiter/index.mjs`) the rate limiter keys requests by client IP. When no trusted IP is resolved it logs a warning and falls back to a single shared per-path bucket, key `no-trusted-ip`. The warning itself tells you to set `advanced.ipAddress.ipAddressHeaders` or `advanced.ipAddress.trustedProxies`.

Impact once deployed behind Cloudflare and the Coolify proxy: all visitors share one bucket per path. Five sign-in attempts per minute from anyone locks the login endpoint for everyone, including the real Admin. The per-account lockout from CPR-24 is separate and is not affected. Related: the form rate limit in CPR-49 needs the same trusted IP.

**Scope**
- Configure better-auth `advanced.ipAddress` so the client IP is read from `CF-Connecting-IP` (Cloudflare) only when the request really came through Cloudflare.
- Restrict origin access to Cloudflare so the header cannot be spoofed: firewall allowlist of Cloudflare IP ranges on 80 and 443, or Cloudflare Authenticated Origin Pulls. Do not hardcode the ranges; fetch the current list from Cloudflare when generating the firewall rule and document the refresh process.
- A small shared helper `getClientIp(headers)` (used by auth config and by CPR-49) with documented behaviour when no trusted IP exists (dev, preview without Cloudflare).
- Document the configuration in `docs/architecture/` or the runbook.

**Out of scope**
- Changing the rate limit numbers or the account lockout policy (CPR-24). Anti-spam for public forms (CPR-49), which only reuses the helper.

**Acceptance criteria**
- [ ] TDD: failing tests first. Unit tests for `getClientIp` with header fixtures: trusted `CF-Connecting-IP` is used; a spoofed `X-Forwarded-For` is ignored; missing headers give the documented fallback
- [ ] Integration test against the auth handler: two requests with different `CF-Connecting-IP` values get separate rate limit buckets; two with the same value share one; the 6th sign-in attempt within 60 s from one IP is rejected while a different IP still succeeds
- [ ] The better-auth warning "falling back to a single shared per-path bucket" no longer appears in production logs after a login test
- [ ] Verified on the real deployment: a direct request to the origin IP that skips Cloudflare is rejected or its forged `CF-Connecting-IP` is not trusted
- [ ] Runbook documents how the Cloudflare IP list is refreshed

**Gotchas**
- Trusting `CF-Connecting-IP` without locking the origin to Cloudflare turns the rate limit into a bypass: an attacker sets the header to a new value per request.
- The firewall rule interacts with CPR-8 ("only 22, 80, 443"): external uptime monitors and the Coolify dashboard subdomain also pass through whatever you allow on 80 and 443. Check both after the change.
- Local development and per-PR previews may not sit behind Cloudflare. The fallback must be explicit and tested, not an accidental shared bucket.
- Cloudflare may add `CF-Connecting-IPv6` or pseudo-IPv4 behaviour depending on zone settings; check the zone configuration before choosing the header list.

**References**
- Evidence: `src/lib/auth/options.ts` (no `advanced.ipAddress`), `node_modules/better-auth/dist/api/rate-limiter/index.mjs` (`NO_TRUSTED_IP_KEY = "no-trusted-ip"`, warning text)
- CPR-24 (lockout, Done), CPR-49 (form rate limit), CPR-9 (Cloudflare proxy), CPR-11 (deployment)
- PRD FR-ADM-04, FR-LEAD-13
```

### NEW-sino-asset-web · [Design] Sino GLB web optimisation (asset fixes + draco export)

- **Action:** NEW
- **Milestone:** M1
- **Project:** `sino-3d-mascot` (separate Linear project; if it does not exist in Linear, create the ticket in this project and ask the product owner where it should live)
- **Assignee:** Faishal
- **Priority:** High
- **Blocked by:** none
- **Blocks:** NEW-sino-hero
- **Labels:** none

```markdown
**Context**
`sino.glb` v004 is 13.8 MB raw (4.1 MB brotli), about 430k triangles, 111 meshes and 114 primitives (about 114 draw calls), with a transmission material on the cornea. It cannot ship on the website. The realtime hero mascot (NEW-sino-hero) is gated on this ticket. Until it is done the site uses the poster and video fallback. Spec: `docs/design/mascot-sino.md` section 1 (asset facts) and section 1.1 (mandatory fixes). Work happens in the `sino-3d-mascot` project (Blender); the result is copied to `public/mascot/sino.glb` of this repo.

**Scope** (the six fixes in `docs/design/mascot-sino.md` section 1.1)
1. Cornea: replace `KHR_materials_transmission` with alpha 0.2.
2. Merge meshes per material to cut draw calls (target 30 or fewer).
3. Reduce triangles to 80k or fewer (hard launch limit); target 32k as in the asset plan.
4. Limit clearcoat and sheen to the visible parts (helmet only).
5. Export with draco compression and `--palette false`. Target 600 KB or less brotli.
6. Remove the second scene that contains a stray `Cube`.
- Re-export through `scripts/export_web.py` and run `gltf-transform optimize --compress draco --palette false`.
- A budget check script (for example `scripts/mascot/check-glb-budget.mjs`) that parses the GLB and fails when a budget is exceeded. Write it first.
- Copy the result to `public/mascot/` with a content-hash file name.

**Out of scope**
- New animation clips (see NEW-sino-renders, A2 and later). The three.js integration (NEW-sino-hero). Pose renders.

**Acceptance criteria**
- [ ] TDD: the budget check script exists and fails on the current v004 file (red), then passes on the new export (green)
- [ ] Size 600 KB or less brotli; 80k triangles or fewer; 30 draw calls or fewer; exactly one scene, no `Cube`
- [ ] Cornea uses alpha (about 0.2), no transmission extension in the file
- [ ] Clearcoat and sheen present only on the helmet materials
- [ ] One skin, bone names `DEF-head`, `DEF-eye.L`, `DEF-eye.R` and the 7 morph targets and 7 clips (`idle`, `idle_b`, `listening`, `thinking`, `speaking`, `greet_wave`, `happy_success`) are unchanged
- [ ] Loads in three 0.186.1 with a self-hosted draco decoder and plays all clips without errors
- [ ] Side-by-side render comparison against the v004 renders is attached and approved by the product owner (look unchanged apart from the cornea)

**Gotchas**
- `gltf-transform optimize` runs `palette` by default and replaces the 20 materials. Always pass `--palette false`.
- Meshopt duplicates the skin into 110 skeletons in three.js and is heavy on the CPU. Draco is the current choice. Note: `docs/design/3d-asset-requirements.md` (sections 3.1 and 6) still says "meshopt"; that is inconsistent with `docs/design/mascot-sino.md`. Flag it, do not edit silently.
- The asset README claims ARKit morph targets on the head, but they are on the brow and eyelid meshes. There is no `jawOpen`, `mouth*` or `eyeLook*`. Do not promise lip sync.
- Three exposes the eye bones as `DEF-eyeL` and `DEF-eyeR` (Blender names `DEF-eye.L` and `DEF-eye.R`).

**References**
- `docs/design/mascot-sino.md` sections 1, 1.1 and 8 (acceptance); `docs/design/3d-asset-requirements.md`
- `../sino-3d-mascot/IMPLEMENTATION_PLAN.md` sections 11 and 16 (original budgets)
```

### NEW-sino-renders · [Design] Sino renders: poses, scenes, loops, device frames, 3D icons

- **Action:** NEW
- **Milestone:** M1
- **Project:** `sino-3d-mascot` (same note as above)
- **Assignee:** Faishal
- **Priority:** High
- **Blocked by:** none
- **Blocks:** CPR-58
- **Related to:** CPR-35, CPR-36, CPR-37, CPR-39, CPR-41, CPR-42, NEW-sino-asset-web
- **Labels:** none

```markdown
**Context**
Almost all Sintra visuals are pre-baked renders, with a single realtime canvas. Sineva follows the same split: one realtime GLB in the Home hero, everything else pre-rendered. Every page in `docs/design/page-patterns.md` expects Sino stills or scenes. This ticket produces them. Full spec: `docs/design/3d-asset-requirements.md` (standards in section 2, list in section 3, acceptance in section 5, delivery in section 6). Source: the `sino-3d-mascot` Blender project; outputs are delivered to `public/mascot/` of this repo.

**Scope**
Standards for every asset (section 2): bright studio light (key upper-left, soft fill, thin teal rim `#80D2D2`), transparent background unless labelled scene, AgX view transform with one shared look, 2048 px master, AVIF primary plus WebP fallback, stills 120 KB or less (AVIF 1200 px), loops 900 KB or less, OG 300 KB or less, naming `sino-{category}-{action}-{variant}.{ext}`, no text, logos or recognisable faces in renders.

**P0 (needed for v1 launch)**
- Clip: A2 `point_right` / `point_left` (one-shot, hold at end, 1.2 s). Requires a GLB re-export after NEW-sino-asset-web.
- Pose stills: S1 wave, S2 holding phone, S3 typing on laptop, S4 megaphone or phone with heart bubble, S5 coin stack and clipboard, S6 handing over paper, S7 magnifying glass (AI Discovery), S8 stacking building blocks (AI Build), S9 pointing at small whiteboard (AI Enablement), S10 thumbs up (thank-you), S11 scratching helmet, confused (404, empty state), S14 front headshot (check whether `sino_avatar_2048` is already enough). Each at 2048 px master plus 1:1 and 4:5 crops.
- Scenes: C1 small cafe counter (16:9 and 4:5; hero poster and default OG base), C4 hand holding a phone with chat UI (4:5; screen replaced in HTML).
- Loop: V1 idle breathing and blink, transparent, 3/4 view (alpha WebM plus HEVC alpha, with still poster).
- 3D icons (512 px, transparent, AVIF 25 KB or less): I1 chat bubble, I3 coin or wallet, I4 megaphone, I6 puzzle or plug, I8 lightbulb.
- Default OG image B1 (1200x630, Sino S1 on the right, left area empty for the `next/og` title).
- Device frame: phone 3/4 view, rendered without a screen (the screen area is an HTML component).

**P1 (enriches, may follow launch)**
- Clips A1 `look_around`, A3 `nod_yes`, A5 `wave_small`. Stills S12 peeking from edge, S13 sitting with mug. Scenes C2 packing table, C3 meeting table, C5 laptop workspace. Loop V2 (scene C1 with motion). Sequence Q1 (helmet turn, or drive the GLB from scroll, decide after the hero GLB test). Icons I2, I5, I7. Blog cover kit B2. Phone frame front and right 3/4, laptop frame 3/4.

**P2 (after launch)**
- Clip A4 `celebrate_jump`. Loop V3 typing on laptop.

**Out of scope**
- GLB optimisation (NEW-sino-asset-web). Website integration of the assets (page tickets). Any text inside renders.

**Acceptance criteria**
- [ ] Every P0 asset is delivered under `public/mascot/{poster,poses,scenes,loops,icons,og}` following the naming rule, with the PNG or EXR masters stored in `sino-3d-mascot/export/`
- [ ] Per-asset checklist (section 5) passes: look matches v004 renders in one preview grid; clean on `--color-canvas` (white) and `--color-surface-tint` backgrounds with no dark fringe on alpha edges; file size within budget; no text, third-party logos or recognisable faces
- [ ] A2 keeps bone and morph names identical to v004 and does not lock the head bone rotation by more than 10 degrees (so the cursor look-at stays natural)
- [ ] Loops are seamless (first frame equals last), 24 fps, 2 to 6 s
- [ ] Brand and IP review done: Sino must not look like a Sintra character (risk R1 in `sino-3d-mascot/IMPLEMENTATION_PLAN.md`)
- [ ] A size report table (asset, bytes, dimensions) is attached to the ticket
- [ ] No automated test applies (asset production); the budget table and the preview grid are the evidence. Where a size budget can be scripted, add the check script before producing the assets

**Gotchas**
- Scene rules: warm neutral palette, teal only from Sino and one or two props, an Indonesian or Southeast Asian small-business setting, no real logos or brands.
- Product screens shown on devices may only depict features confirmed by team CBT (Q11).
- Pages can ship with placeholders for P1 assets, but M4 (Lighthouse with final images) expects all P0 assets.
- `docs/design/3d-asset-requirements.md` says to apply meshopt compression to clip exports; the current decision is draco (see NEW-sino-asset-web). Resolve before exporting A2.

**References**
- `docs/design/3d-asset-requirements.md`, `docs/design/mascot-sino.md` section 6 (where Sino appears per page), `docs/design/research/sintra-reference.md` section 8
```

### NEW-lottie-library · [Design] Lottie library L3 to L10

- **Action:** NEW
- **Milestone:** M2 (authoring can start in M1; the P0 file L3 is needed before the forms in M3)
- **Assignee:** Faishal
- **Priority:** Low
- **Blocked by:** NEW-motion-foundation
- **Blocks:** none
- **Related to:** CPR-37, CPR-39, CPR-44, CPR-47
- **Labels:** none

```markdown
**Context**
Lottie is used where vector animation beats CSS: brand moments and icon state changes. L1 (`sineva-logo-intro`) and L2 (`sineva-symbol-intro`) are already built (`public/lottie/`, generator `scripts/lottie/build-logo-intro.mjs`). This ticket produces L3 to L10 from `docs/design/motion.md` section 7. The player component comes from NEW-motion-foundation.

**Scope**
| ID | File | Where | Trigger | Priority |
|---|---|---|---|---|
| L3 | `check-pop` | Form success, copy link, waitlist success | Event | P0 |
| L4 | `send-plane` | Contact form submit button while sending | Event, loops until done | P1 |
| L5 | `typing-dots` | Chat mockups on the Product page | In view, loop | P1 |
| L6 | `menu-morph` | Burger to close icon | Click | P1 (a CSS version is an acceptable substitute) |
| L7 | `capability-icons` (5: chat, social, sales, finance, ops) | Product capability cards | Hover or in view, play once | P1 |
| L8 | `service-icons` (3: discovery, build, enablement) | Services cards | Hover or in view | P1 |
| L9 | `orbit-ring` | Sino stage ring | Slow loop | P2 (CSS is the default) |
| L10 | `empty-state` | Blog empty, 404 accent | In view | P2 |

- Generate with a reproducible script in `scripts/lottie/` in the same style as `build-logo-intro.mjs`, so files can be regenerated.
- Style rules for all files: 60 fps, no expressions, no raster images, no embedded fonts; under 60 KB each; one-shots 1.2 s or shorter; stroke icons 1.75 px on a 24 px grid (matches Lucide); colours only from the brand primitives in `docs/design/tokens.md`; easing from `docs/design/motion.md` section 2.1.
- A lint test over `public/lottie/*.json` (see acceptance).

**Out of scope**
- The player component and loaders (NEW-motion-foundation). Placing animations on pages (page tickets). L1 and L2 changes.

**Acceptance criteria**
- [ ] TDD: a Vitest lint test over `public/lottie/*.json` is written first and fails for a deliberately bad fixture (over 60 KB, frame rate not 60, expressions, image layers, embedded fonts); it then passes for all committed files (the intro files use the 120 KB limit)
- [ ] L3 (P0) delivered first and verified in the player under normal and reduced-motion modes (final frame shown)
- [ ] P1 files L4 to L8 delivered; P2 files L9 and L10 are optional and can move to a later ticket
- [ ] Every file respects the style rules; the generator script and its output are both committed
- [ ] Each animation is checked on a white and on a `--teal-50` background

**Gotchas**
- `lottie-web` is used in its light build (SVG renderer). Effects the light build does not support must be avoided; test every file in the actual player, not only in an editor preview.
- dotLottie was rejected because it needs a WASM renderer and `'wasm-unsafe-eval'` in the CSP.
- Under `prefers-reduced-motion`, animations show their final frame, so design the last frame to read as the complete state.

**References**
- `docs/design/motion.md` sections 7 and 9
- `scripts/lottie/build-logo-intro.mjs`, `public/lottie/`
```

### NEW-i18n-en · [I18n] English default, single locale, as-needed prefix

- **Action:** NEW
- **Milestone:** M2
- **Assignee:** Faishal
- **Priority:** High
- **Blocked by:** NEW-prd-rev3
- **Blocks:** CPR-32, CPR-34, CPR-52
- **Related to:** CPR-25 (Done), CPR-10, CPR-56
- **Labels:** none

```markdown
**Context**
CPR-25 shipped routing with `localePrefix: 'always'`, `id` as default locale, Indonesian slugs (`/id/layanan`) and a cookie plus Accept-Language redirect from `/`. Rev. 3 makes English the default and only locale at launch, with `localePrefix: 'as-needed'`, so English URLs have no prefix (`/services`) and a future Indonesian locale lives under `/id/...` with its own slugs. The registry must stay i18n-ready. Sitemap and URL table: `docs/design/page-patterns.md` section 1. PRD Rev. 3: i18n section (FR-I18N-*) and sitemap (section 6).

**Scope**
- next-intl routing: `locales: ['en']`, `defaultLocale: 'en'`, `localePrefix: 'as-needed'`. Root layout `<html lang="en">`.
- Pathnames registry rewritten to the English URL table (Home `/`, `/products/ai-agents`, `/services`, `/services/[slug]`, `/work`, `/work/[slug]`, `/blog`, `/blog/[slug]`, `/about`, `/contact`, `/contact/thank-you`, `/privacy-policy`). Dynamic detail routes stay registered and return 404 until published data exists (as in CPR-25).
- Registry designed so adding `id` is a data change: the future `id` URLs from the table are documented next to the registry but not enabled.
- Remove cookie and Accept-Language locale detection and the redirect from `/` (single locale: `/` serves English directly).
- Slug resolver contract keeps its `locale` parameter (entity id, locale, published status, no cross-locale fallback); only `en` resolves.
- UI strings: `messages/en.json` is the only bundle in use. Decide what happens to `messages/id.json` (recommendation: move it out of the build to `docs/content/` as source for the future `id` locale; deleting it silently would lose the text).
- Update every internal link and the existing tests to the new URLs.

**Out of scope**
- The language switcher (CPR-34, deferred). hreflang (CPR-52). Any Indonesian content.

**Acceptance criteria**
- [ ] TDD order: first rewrite the CPR-25 test suites to the new expectations and watch them fail (red): the 58-case locale matrix and the HTTP suite. Then change the routing until they pass (green). The PR shows both steps
- [ ] `/` returns 200 with English content and no redirect, regardless of `Accept-Language` or a locale cookie
- [ ] `/services`, `/work`, `/blog`, `/about`, `/contact`, `/contact/thank-you`, `/privacy-policy` and `/products/ai-agents` resolve (shell or content); old Indonesian paths such as `/layanan` and `/id/...` return 404
- [ ] A request to the explicitly prefixed default (`/en/services`) redirects to `/services` (verify next-intl's actual behaviour and assert it)
- [ ] `<html lang="en">` on every page, asserted by an integration test
- [ ] Unit test: the pathnames table equals the URL table in `docs/design/page-patterns.md` section 1
- [ ] Unit test with a fixture config of two locales (`en`, `id`) proves a second locale is a data-only addition and does not change English URLs
- [ ] Unknown URLs return HTTP 404 with the English 404 page
- [ ] Unit, DB and HTTP suites are green; lint, typecheck and build pass

**Gotchas**
- Nothing is deployed yet (CPR-7 and CPR-25 notes: "not deployed"), so no legacy redirects from the `/id/...` URLs are needed. Re-check this before shipping.
- CPR-25 recorded that the initial shell returned 404 without `lang` in Next.js 16.4 (the DOM was correct after hydration). Re-test that behaviour after the change.
- This repo runs a Next.js version with breaking changes. Read the routing and proxy/middleware guides in `node_modules/next/dist/docs/` before editing.
- `as-needed` has edge cases: the default locale prefix, trailing slashes and `localeDetection`. Test them instead of trusting the docs.
- CPR-10 (deferred CI) has a draft PR whose tests assume the old routing. Rebase it on this change.

**References**
- `docs/superpowers/plans/2026-10-15-cpr-25-i18n-routing.md`, `docs/superpowers/plans/2026-10-15-website-redesign.md` section 2 (gotcha 2) and section 3
- CPR-25 acceptance (URL mapping, `/` redirect, no fallback, slug-mapping unit tests); the first two are replaced here, the last two still apply
- PRD Rev. 3 FR-I18N-01 to FR-I18N-06 (rewritten)
```

### NEW-copy-lint · [QA] Copy lint: block em dash/en dash in messages and content

- **Action:** NEW
- **Milestone:** M2
- **Assignee:** Faishal
- **Priority:** Medium
- **Blocked by:** none
- **Blocks:** CPR-54
- **Related to:** CPR-21, CPR-27, CPR-29, CPR-30, CPR-31, NEW-i18n-en
- **Labels:** none

```markdown
**Context**
Hard copy rule in `docs/design/copywriting.md` section 1: no em dash (U+2014) and no en dash (U+2013) in public copy. Number ranges use "10 to 50" or a plain hyphen "10-50". The rule is enforced by a unit test over `messages/*.json` and seed content, and by the admin when it saves public content fields. Related checklist: `docs/design/accessibility-performance.md` section 3.

**Scope**
- A shared validator, for example `validatePublicCopy(text)` in `src/lib/content/copy-rules.ts`, built as a list of rules so more rules can be added later. Shipping rule: forbidden characters U+2014 and U+2013.
- A Vitest test that walks every string in `messages/*.json` (nested objects, arrays) and in seed content (wherever the services, settings and page seeds live) and fails with the key path and the offending character.
- A helper that walks structured rich text documents (text nodes) so the admin forms can reuse the same validator (integration into CPR-27, 29, 30, 31 belongs to those tickets).
- HTML entity forms (`&mdash;`, `&ndash;`) are checked as well.

**Out of scope**
- Wiring the validator into admin forms (the admin tickets own that). Style rules that cannot be checked mechanically (sentence case, headline length).

**Acceptance criteria**
- [ ] TDD: tests written first with failing fixtures (a string with an em dash, an en dash, a nested key, an array item, an entity form); all fail before the validator exists
- [ ] The test fails with a clear message (file, key path, character) when a dash is added to `messages/en.json`, and passes on the current repo content
- [ ] The validator is exported with a typed result (`ok` plus list of violations) so admin code can call it
- [ ] Plain hyphens and ranges like "10-50" are not flagged
- [ ] Runs in the normal unit suite (no extra command)

**Gotchas**
- ICU message strings contain braces and plural syntax; scan the raw string, do not parse it.
- Look-alike characters (U+2012 figure dash, U+2015 horizontal bar) are not in the written rule. Decide in review whether to block them too (recommendation: yes, the intent is the same). Do not block U+2212 (minus) because it can appear in legitimate content.
- The brand rule "never write the two-word old brand name" is a natural second rule in the same list. Propose it in review; do not add it silently.
- Seed content is added by CPR-27 and CPR-29; the test must pick up new seed files without edits (glob, not a fixed list).

**References**
- `docs/design/copywriting.md` sections 1 and 9; PRD Rev. 3 content rules
```

### NEW-motion-foundation · [Layout] Motion foundation: tokens, reveal, reduced motion, GSAP + Lottie loaders

- **Action:** NEW
- **Milestone:** M2
- **Assignee:** Faishal
- **Priority:** High
- **Blocked by:** CPR-26
- **Blocks:** CPR-32, NEW-logo-intro, NEW-lottie-library, NEW-section-blocks, NEW-sino-hero
- **Labels:** none

```markdown
**Context**
The Rev. 3 motion system is specified in `docs/design/motion.md`. Every animated piece (navbar, section blocks, logo intro, Sino hero, Lottie) needs the same base: tokens, a reveal-on-scroll utility, one reduced-motion rule, and lazy loaders for GSAP and Lottie. Build it once so animation code does not diverge.

**Scope**
- Motion tokens as CSS custom properties mapped into Tailwind `@theme` (CPR-26 may already add them because its components need hover transitions; if so, this ticket only verifies and tests them, it does not redefine them): easing (`--ease-out`, `--ease-out-expo`, `--ease-bounce`, `--ease-in-out`, `--ease-in`, `--ease-wipe`) and duration (`--dur-instant` 60 ms, `--dur-fast` 160, `--dur-base` 240, `--dur-med` 360, `--dur-slow` 520, `--dur-scene` 800 to 1200) exactly as in `docs/design/motion.md` section 2.
- Reveal on scroll (section 4.1): IntersectionObserver plus CSS classes, 15% threshold, play once, stagger 50 ms per card capped at 6, elements already in view at load are not animated twice. A `Reveal` component and a `useReveal` hook.
- Reduced motion (section 9): a `useReducedMotion` hook plus a CSS rule set; a single place that decides what is allowed (opacity fades of 150 ms or less stay, everything else becomes an instant state change).
- GSAP loader: dynamic import per section, `ScrollTrigger` registered lazily, all instances killed on route change, passive scroll listeners (section 10). GSAP 3.15.0 (checked 2026-10-15; re-check and pin exact at install).
- Lottie player component: `lottie-web` 5.13.0 light build (`lottie-web/build/player/lottie_light`, SVG renderer), lazy-loads player and JSON, plays when in view, pauses off-screen, renders the final frame under reduced motion.
- Hero entrance helper (section 3.2): server-rendered state is the final state; the `from` state is applied by JS before the first paint of the client tree.
- A short GSAP license check recorded in `docs/` (the "Standard no charge" license is not OSI).

**Out of scope**
- Navbar behaviour (CPR-32). Logo intro (NEW-logo-intro). Sino canvas (NEW-sino-hero). The Lottie files themselves (NEW-lottie-library, except L1 and L2 which already exist).

**Acceptance criteria**
- [ ] TDD: failing tests first for each item below
- [ ] Unit test confirms every token above exists with the documented value (read from the CSS source)
- [ ] Reveal test (jsdom, IntersectionObserver mocked): class applied once on entering view, not re-applied on re-entry; elements in view at mount are not animated; stagger delay capped at 6 items
- [ ] Reduced-motion test (matchMedia mocked): `Reveal` renders the final state with no transform animation; Lottie player shows its final frame; GSAP loader is not imported
- [ ] Lottie component imports only the light build (bundle check or import assertion); loads lazily, not in the initial bundle
- [ ] With JavaScript disabled the server-rendered HTML contains all section content and nothing is hidden by CSS that only JS can reveal
- [ ] Animation JS on Home is 60 KB gzip or less excluding three.js, loaded after hydration (measure and record)
- [ ] Only `transform` and `opacity` (and `clip-path` where specified) are animated; no scroll-time animation of width, height, top or box-shadow
- [ ] GSAP and lottie-web versions are pinned exactly; license note committed

**Gotchas**
- jsdom has no IntersectionObserver and no matchMedia: provide shared test mocks (Testing Library setup comes from CPR-26).
- "No flash" versus "visible without JS": applying the `from` state after first paint causes a flash; hiding with CSS until JS runs breaks no-JS users. Choose an approach that satisfies both (for example apply the `from` state only for elements below the fold, set before paint through a layout effect) and test it.
- `ScrollTrigger` instances leak across client-side navigations if not killed.
- Do not add a smooth-scroll hijacking library (decision in `docs/design/motion.md` section 4). Anchor links use `scroll-behavior: smooth`, disabled under reduced motion.

**References**
- `docs/design/motion.md` sections 1 to 4, 7 to 10; `docs/design/tokens.md`
- `docs/design/accessibility-performance.md` section 2 (animation libs budget)
```

### NEW-section-blocks · [Layout] Shared section blocks (HeroSplit, TwoPaths, TaskCardGrid, StickySteps, FaqSection, FinalCta, StickyCtaBar)

- **Action:** NEW
- **Milestone:** M2
- **Assignee:** Faishal
- **Priority:** High
- **Blocked by:** CPR-26, NEW-motion-foundation
- **Blocks:** CPR-36, CPR-37, CPR-38, CPR-39, CPR-41, CPR-51
- **Labels:** none

```markdown
**Context**
Pages are composed from a small set of reusable section blocks (`docs/design/page-patterns.md` section 3). Building them once, as typed server components, keeps pages consistent and cheap to change. Cards and primitives they use come from CPR-26 (`docs/design/components.md`); motion comes from NEW-motion-foundation.

**Scope**
| Block | Spec | Used on |
|---|---|---|
| `HeroSplit` | Text left, visual right (`Split`). Variants: `sino-canvas` (slot for NEW-sino-hero), `sino-still`, `mockup`, `scene`. Hero entrance per `docs/design/motion.md` section 3.2 | Home, Product, Services, About, Service detail |
| `TwoPaths` | Two `card-path` cards ("Use it yourself" Product, "Let us build it with you" Services), each with CTA; emits the `path_select` event hook | Home |
| `TaskCardGrid` | `BentoGrid` of `card-task` (capability phrased as a request to Sino), staggered reveal | Home, Product |
| `StickySteps` | Sticky device mockup column plus steps; GSAP ScrollTrigger scrub maps progress to the active step; mobile stacks steps; steps are a keyboard-operable tab list | Home, Product, Services |
| `FaqSection` | Accordion (`aria-expanded`, `aria-controls`), two-column layout, optional `FAQPage` JSON-LD output | Home, Product, Services, Service detail |
| `FinalCta` | Inverse tone plus aurora, rounded `--radius-2xl` panel, two CTAs plus WhatsApp, Sino still | All marketing pages |
| `StickyCtaBar` | Slides up after the hero CTA leaves the viewport, hides near the final CTA; mobile only on long pages | Home, Service detail, Product |

- Each block is a server component with typed props; client-only behaviour lives in small child components.
- `AudienceCards`, `WorkGrid` and `PostGrid` stay in their page tickets (CPR-36, 38, 43, 40).
- Section tone helper enforces the layout rules: adjacent sections never share the same non-white tone; at most one `inverse` section per page.

**Out of scope**
- Page content and copy (page tickets). The Sino canvas itself (NEW-sino-hero). The navbar and footer (CPR-32).

**Acceptance criteria**
- [ ] TDD: Testing Library tests written first for each block (render with props, headings and links present, variants)
- [ ] `FaqSection`: keyboard open and close, `aria-expanded` and `aria-controls` correct, multiple items can be open, JSON-LD only when the option is on and valid JSON
- [ ] `StickySteps`: active step follows a simulated scroll progress; the step list is operable with keyboard; mobile layout renders steps stacked without ScrollTrigger
- [ ] `StickyCtaBar`: not rendered on desktop, shows after the hero CTA leaves view and hides near the final CTA (IntersectionObserver mocked)
- [ ] `FinalCta`: unit test that two `inverse` tones on one page are rejected by the tone helper
- [ ] No hex colours in the blocks (semantic tokens only); all strings come from props (page tickets pass `messages/en.json` or DB text)
- [ ] Reduced motion: blocks render without scrub, stagger or sticky behaviour changes (static list)
- [ ] Touch targets 44 px or larger, visible focus ring; axe reports no critical or serious issues for each block in a test page
- [ ] `StickyCtaBar` is not rendered when the site setting "enable sticky CTA bar" is off

**Gotchas**
- `docs/design/motion.md` section 4.3 allows at most one scroll-scrubbed scene per page, but Home has both a `StickySteps` section (which uses ScrollTrigger scrub to pick the active step) and a "Meet Sino" scroll scene. The docs do not say whether `StickySteps` counts toward the limit. Ask the product owner before building the second scrubbed element.
- No more than one hero-size Sino per viewport (`docs/design/mascot-sino.md` section 6).
- Images and mockups never carry text that needs translation; build mockup screens as HTML.
- Section and card copy must not contain unverified claims (`docs/design/copywriting.md` rule 2).

**References**
- `docs/design/page-patterns.md` sections 2 and 3; `docs/design/components.md` sections 4, 7, 8, 12, 13; `docs/design/motion.md` sections 4.2, 4.5
```

### NEW-logo-intro · [Layout] First-visit logo intro (Lottie overlay + FLIP to navbar)

- **Action:** NEW
- **Milestone:** M2
- **Assignee:** Faishal
- **Priority:** Medium
- **Blocked by:** NEW-motion-foundation, CPR-32
- **Blocks:** CPR-56, CPR-58, CPR-59
- **Labels:** none

```markdown
**Context**
The product owner asked for a first-visit logo intro. The Lottie files are already built (`public/lottie/sineva-logo-intro.json`, `sineva-symbol-intro.json`, generator `scripts/lottie/build-logo-intro.mjs`). A full-screen overlay can hurt LCP and conversion, so it ships with hard rules and a measurement gate. Spec: `docs/design/motion.md` section 3.1 and `docs/superpowers/plans/2026-10-15-website-redesign.md` section 2 (gotcha 4).

**Scope**
- Overlay client component, loaded with `next/dynamic` only on the first visit, using the Lottie player from NEW-motion-foundation.
- Choreography at most 1.6 s from first paint (mark in the Lottie, then code hand-off): overlay fades out in 200 ms while the logo shrinks and flies to the navbar logo position (FLIP, 500 ms `--ease-out-expo`); then the hero entrance starts.
- Rules: once per session (sessionStorage flag in try/catch), first page load only, never on client-side navigation; `pointer-events: none` after 1.2 s; any key press, scroll or click skips it; never waits for the network; no overlay for `prefers-reduced-motion`, bots (`navigator.webdriver`) or without JavaScript.
- Pure gate function `shouldPlayIntro({ visited, reducedMotion, webdriver })` kept separate from the component.
- The page underneath renders and hydrates normally; the overlay is a solid canvas-coloured layer with the Lottie in the centre.
- Fallback implementation (switch only if the measurement fails): play the symbol-only Lottie (L2) inside the navbar logo slot instead of a full-screen overlay.

**Out of scope**
- Navbar layout (CPR-32). Sino hero entrance (NEW-sino-hero). Replay-on-hover of the navbar logo (can follow as a small item).

**Acceptance criteria**
- [ ] TDD: unit tests for `shouldPlayIntro` and for the skip rules written first (visited flag set, reduced motion, webdriver, key press, scroll, click)
- [ ] Playwright: overlay appears on the first load, is absent on the second navigation and after reload in the same session, absent with `reducedMotion: 'reduce'`, and never blocks keyboard focus (first Tab reaches the navbar)
- [ ] **LCP measurement:** Lighthouse mobile on the production build, 5 runs each with and without the intro (median), report attached. LCP regression is 100 ms or less. If it is more, switch to the fallback above and re-measure
- [ ] CLS stays 0 for the overlay and the hand-off; the LCP element is the headline or Sino poster, never the overlay or the Lottie
- [ ] Hard cap: the page is usable within 1.6 s from first paint, verified with a trace
- [ ] Overlay is `aria-hidden`, does not trap focus and does not swallow the key press that skips it
- [ ] Server-rendered HTML contains the full hero content under the overlay
- [ ] The intro respects the site setting "enable logo intro" (CPR-29): when it is off no overlay renders

**Gotchas**
- Read sessionStorage only after mount; reading it during render causes a hydration mismatch.
- An opaque overlay covering the LCP candidate may interact with LCP attribution in ways that must be measured, not assumed.
- FLIP needs the navbar logo position, so it depends on CPR-32 exposing a stable logo slot. If the navbar hides on scroll (motion.md section 5), the hand-off must run before any scroll is possible.
- Browser extensions, Lighthouse and uptime bots must never see the overlay (webdriver check plus no-JS path).
- Because automation is excluded (`navigator.webdriver`), the LCP measurement and the Playwright intro scenarios (CPR-56, CPR-58) cannot see the intro unless there is a test-only override. Add a flag that forces the intro, enabled only in test and measurement builds, never in production. Verify whether the Lighthouse run actually reports `navigator.webdriver` as true before deciding it is needed.

**References**
- `docs/design/motion.md` sections 3.1 and 9; `docs/design/accessibility-performance.md` section 2 (LCP)
- Built assets listed in `docs/design/README.md` (Built assets)
```

### NEW-sino-hero · [Home] Sino realtime hero mascot (three.js, loading gate, state machine, look-at)

- **Action:** NEW
- **Milestone:** M2 (move to M4 if NEW-sino-asset-web is late; the poster fallback ships with CPR-36 regardless)
- **Assignee:** Faishal
- **Priority:** Medium
- **Blocked by:** NEW-sino-asset-web, NEW-motion-foundation, CPR-36
- **Blocks:** CPR-58, CPR-59
- **Labels:** none

```markdown
**Context**
Sino is the only realtime 3D element on the site, in the Home hero. Everything else is pre-rendered. The canvas must never hurt LCP, CLS or low-end devices, so it loads behind a gate and falls back to the poster. Spec: `docs/design/mascot-sino.md` sections 2 to 5, 7 and 8. The optimised GLB comes from NEW-sino-asset-web; the poster and loop V1 come from NEW-sino-renders.

**Scope**
- `SinoHero` client component (`'use client'`, `next/dynamic` with `ssr: false`), three 0.186.1 vanilla (checked 2026-10-15; pin exact), draco decoder self-hosted under `/public/draco/`.
- Loading strategy (mascot-sino.md section 3): SSR `<img>` poster with `next/image` priority and a reserved `aspect-ratio` (LCP candidate, CLS 0). After `window.load` plus `requestIdleCallback`, run the gate: in viewport, WebGL2 available, no reduced motion, Save-Data off, device memory 4 GB or more (when reported). Pass: fetch the GLB, create the canvas behind the poster, crossfade after the first frame (300 ms). Fail: keep the poster and, if motion is allowed, play loop V1.
- FPS probe over the first 60 frames: average under 45 fps drops DPR to 1; under 30 fps falls back to the poster. DPR capped at 1.5. Rendering stops when the tab is hidden or the hero leaves the viewport.
- Stage on the light UI (section 4): glow, orbit ring, contact shadow; no realtime shadow map.
- State machine (section 5), pure TypeScript separate from three.js: `greet_wave` then `idle` once per session (sessionStorage in try/catch); `idle` and `idle_b` alternate; `listening` on hover of the primary CTA and on focus of a form field; `thinking` on submit; `happy_success` on success; tap on mobile triggers `greet_wave` with a 5 s cooldown. Crossfade 0.35 s between clips.
- Cursor look-at on desktop: head yaw up to 25 degrees, pitch up to 15 degrees, eyes follow at 0.6 ratio, lerp 0.08 per frame, applied **after** `mixer.update`; returns to front after 4 s of stillness. No look-at on touch devices.
- Decorative: `aria-hidden="true"`, no keyboard focus. Full cleanup on unmount (cancel RAF, dispose geometry, materials, textures and renderer, disconnect observers).

**Out of scope**
- The "Meet Sino" scroll scene (Q1 or GLB scrub), Sino on the Product hero, new clips A1 to A5, any sound.

**Acceptance criteria**
- [ ] TDD: failing unit tests first for the state machine (trigger to clip, once-per-session greeting, cooldown) and for the loading gate (feature detection mocked: WebGL2, reduced motion, Save-Data, device memory, viewport)
- [ ] Component test: the SSR output contains the poster `<img>` with fixed dimensions and no canvas; under reduced motion no canvas is created and no GLB request is made
- [ ] Unmount test: renderer, geometries, materials and textures are disposed and no animation frame is left running
- [ ] Lighthouse mobile on Home is 90 or higher in all four categories **with Sino active** (default throttling); LCP is the poster or the headline, never the canvas; hero CLS is 0
- [ ] GLB 600 KB or less brotli, 80k triangles or fewer, 30 draw calls or fewer (inherited from NEW-sino-asset-web); lazy chunk (three.js plus mascot) 190 KB gzip or less, loaded after `load`
- [ ] Look-at is smooth with no jitter at 60 fps on a MacBook Air M1 and at 45 fps or more on a mid-range Android (record device and numbers)
- [ ] No canvas and no video under `prefers-reduced-motion`
- [ ] The poster remains in place if the GLB request fails or WebGL context is lost (test with a forced failure)
- [ ] The canvas respects the site setting "enable realtime Sino" (CPR-29): when it is off only the poster renders

**Gotchas**
- Clips lock all bones every frame, which is why look-at is applied after `mixer.update`. Applying it before makes it a no-op.
- Eye bones are `DEF-eyeL` and `DEF-eyeR` in three.js (`DEF-eye.L`, `DEF-eye.R` in Blender). There are no `jawOpen`, `mouth*` or `eyeLook*` morphs and no error or confused clip: do not map an error state to a clip and do not promise lip sync.
- CSP (CPR-53): the draco wasm decoder needs `'wasm-unsafe-eval'`; do not add `unsafe-eval`. Draco loaders may also create workers from blob URLs, which would need `worker-src blob:` (recalled from memory, not verified: check against the pinned three.js version).
- Not preloading the GLB before first paint is intentional. Serve it with an immutable cache header and a hashed file name.
- The product owner must confirm the Product hero does not also run a canvas (at most one large Sino per viewport).

**References**
- `docs/design/mascot-sino.md` (entire file), `docs/design/motion.md` section 3.2, `docs/design/page-patterns.md` section 2.1
- `docs/design/accessibility-performance.md` section 2
```

### NEW-lead-intake-action · [Lead] Contact intake server action, shared schema and persistence

- **Action:** NEW (server half of the CPR-47 split)
- **Milestone:** M3
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** CPR-46
- **Blocks:** CPR-47, CPR-49, CPR-50
- **Labels:** none

```markdown
**Context**
CPR-47 used to hold the whole contact flow. It is split: CPR-47 is now the form UI and client validation (frontend, Faishal); this ticket is the server side (validated server action, persistence, redirect). Both import one shared schema module so client and server rules never drift. Fields and options: `docs/design/page-patterns.md` section 2.8. PRD Rev. 3 section 8.2 (contact form) and FR-LEAD-04, 05, 08, 10.

**Scope**
- Shared schema module (for example `src/lib/leads/contact-schema.ts`) used by the client form and the server action. Fields: name, work email, WhatsApp number, company (optional), business type (Small business / Company / Startup / Other), interest (AI Discovery / AI Build / AI Enablement / AI Agents product / Not sure yet), budget range (optional; options to confirm with copy, for example under IDR 10M, 10M to 50M, 50M to 150M, over 150M, not sure yet), message (minimum 20 characters), privacy consent.
- WhatsApp normalisation to the `62...` format.
- Server action `submitContact`: validate on the server with the same schema, run the anti-spam hook (plugged in by CPR-49), insert into Leads with locale (`en`), source page and timestamp, status defaulting to "new" (set by the server, never by input), trigger the email step (CPR-50) without blocking, then redirect to `/contact/thank-you`.
- Failure contract: on a validation or storage error the action returns field errors in English and the submitted values, so the UI keeps the inputs and shows the WhatsApp fallback (FR-LEAD-10). Email failure never fails the lead (FR-LEAD-09).
- Interest is stored as a validated string key checked against a code-side list, not as a database enum (service names are still under review, Q10).

**Out of scope**
- The form UI, prefill from `?service=`, styling (CPR-47). Honeypot, Turnstile and rate limiting (CPR-49). Emails (CPR-50). Lead admin screens (CPR-46).

**Acceptance criteria**
- [ ] TDD: failing unit tests first for number normalisation and for each validation rule (required fields, email format, message under 20 characters, consent missing, unknown interest key)
- [ ] Integration tests against the test database: a valid submission is stored with status "new", locale and source page, and the action redirects to the thank-you page
- [ ] Invalid input is rejected on the server even if the client validation is bypassed
- [ ] A simulated storage failure returns an error result with the submitted values and nothing is stored
- [ ] Public input cannot set status or internal notes (mass-assignment test); no `/api/leads` public CRUD route exists
- [ ] The schema module is imported by both the server action and the client form (an import test or a build check proves there is one source)
- [ ] Unit, DB and HTTP suites, lint, typecheck and build pass

**Gotchas**
- Normalising to `62...` assumes Indonesian numbers. An English-language site may receive international numbers. Decide the rule (recommendation: convert Indonesian formats `0812...`, `+62812...`, `62812...` to `62...`, accept other valid country-coded numbers as digits, reject the rest) and write it down in the schema tests.
- The Leads schema comes from CPR-46 and its filters use service values. Changing the interest list means updating the CPR-46 filters; flag that to its owner.
- Server actions are public endpoints: authorise nothing by hidden fields, and limit body size.
- Redirects inside server actions throw in Next.js; keep persistence and the redirect ordered so a failed save never redirects.

**References**
- Previous CPR-47 text (Indonesian): fields per PRD section 8.2, same schema on client and server, WhatsApp number normalised to `62...`, service prefilled from the URL, consent checkbox with privacy link, server action saves to Leads then redirects to thank-you, on failure show an error in the page language with inputs kept and WhatsApp as a fallback; unit tests for normalisation and validation, integration test for the server action
- PRD FR-LEAD-04, FR-LEAD-05, FR-LEAD-08, FR-LEAD-09, FR-LEAD-10
```


### NEW-waitlist-form-ui · [Lead] Waitlist form (UI)

- **Action:** NEW (frontend half of the waitlist; the server half is the existing CPR-48)
- **Milestone:** M3
- **Assignee:** Faishal
- **Priority:** Medium
- **Blocked by:** CPR-39, CPR-48
- **Blocks:** CPR-49, CPR-51, CPR-56
- **Labels:** none

```markdown
**Context**
People who want the AI agent product join a waitlist; the product itself is built separately (team CBT) and is not on sale. CPR-48 builds storage, the server action, the admin list and the CSV export (Farhan, per `docs/superpowers/plans/2026-10-15-admin-cms.md`). This ticket builds the form UI on the Product page: hero and final CTA (`docs/design/page-patterns.md` section 2.2). Home does not hold a form; its CTA links to the Product page. PRD Rev. 3 section 8.3, FR-WL-01, FR-WL-02.

**Scope**
- Inline form in the Product hero and the Product final CTA: email (required), business type (optional), privacy consent (required); labels, helper text and errors per `docs/design/components.md` section 6.
- Client validation with the shared schema from CPR-48.
- Success state: "You're on the list. We'll email you when Sino is ready." with the `check-pop` Lottie (L3), static check under reduced motion. The same success is shown for a new and an already registered email.
- Error state: calm message; the typed email stays.
- Slots for honeypot and Turnstile (CPR-49).
- The anchor `#waitlist` used by the Home CTA.
- Fires `waitlist_submit` through the analytics helper (CPR-51).
- When the product status is `live` (NEW-cms-product), this form is replaced by the "Try" call to action; implement the switch through the page DTO, not by editing code.

**Out of scope**
- Server action, constraint, CSV export, admin list (CPR-48). Anti-spam (CPR-49).

**Acceptance criteria**
- [ ] TDD: failing Testing Library tests first
- [ ] Invalid email or missing consent shows an accessible error; valid input shows the success state
- [ ] A duplicate email and a new email produce the same visible success (the UI never reveals that an email was already registered)
- [ ] On a simulated server error the email is kept and an error shows
- [ ] The form is keyboard operable and works at 360 px; the `#waitlist` anchor is not hidden behind the sticky header
- [ ] The form is not rendered on Home (Home links to the Product page) unless the product owner decides otherwise
- [ ] The business type options come from the Business types data (NEW-cms-product) or the agreed fixed list; see the gotcha

**Gotchas**
- Do not show copy that implies capabilities not confirmed by CBT. The product name is a working name (Q9); read it from the site settings.
- The waitlist "business type" in PRD section 8.3 is a segment-style choice. `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.3 uses the Business types collection for Product tabs (online shop, cafe and restaurant, local services) and for the contact form options. These are different lists in the PRD (contact form: Small business, Company, Startup, Other). Confirm with the product owner whether one collection serves all three or whether a `kind` field separates them.
- The email "We'll email you when Sino is ready" promises a later email; sending that email is outside v1 unless approved (see CPR-50).

**References**
- `docs/design/page-patterns.md` section 2.2; PRD FR-WL-01, FR-WL-02
- Previous CPR-48 text (Indonesian) before the split: waitlist form with email, business type and consent on Home and the chatbot page, server validation and anti-spam. The UI part is here; the server and admin parts stay in CPR-48
```

### NEW-cms-shell · [Admin] Admin UI kit and layout on the shared design system

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` section 5)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** High
- **Blocked by:** CPR-26
- **Blocks:** CPR-23, CPR-46, CPR-48, NEW-cms-audit, NEW-cms-faq, NEW-cms-pages, NEW-cms-product
- **Labels:** none

```markdown
**Context**
The custom admin at `/admin` needs one shared layout and component kit so every admin ticket builds on the same parts. It uses the public site tokens with a denser, calmer layout, light only, Indonesian UI (FR-ADM-05). This ticket takes over the "admin component additions" that used to sit in CPR-26. Spec: `docs/design/admin-ui.md` (sections 1 to 4, 6); plan: `docs/superpowers/plans/2026-10-15-admin-cms.md` section 3.

**Scope**
- **Layout:** sidebar 248 px (hierarchical, three levels, ARIA tree pattern: arrow keys, Right and Left expand and collapse, Enter navigates; collapses to a 64 px icon rail under 1280 px and to a drawer under 768 px; expanded state remembered in localStorage inside try/catch), top bar 56 px (breadcrumb, search trigger, "Lihat situs" link, user menu), page header (title, status badge, meta line, actions; compact sticky version after 80 px), main area with a 320 px side panel for status, publish and SEO. Items the signed-in role cannot access are not rendered (the server still checks).
- **Navigation groups** as in `admin-ui.md` section 3 and 4.2, with Indonesian labels (Dasbor, Konten, Prospek, Pengaturan, Sistem). Routes for sections owned by other tickets can be placeholders.
- **Data display:** data table on TanStack Table with server-side sorting, filtering and pagination through URL params (search, chip filters, column visibility, density toggle, bulk selection bar, empty, loading skeleton and error states); pagination (page size 20, 50, 100; an out-of-range page redirects to the last page, which fixes the current Users list behaviour); stat card, list card, activity feed, completeness card, description list, avatar, tooltip and popover, empty state, skeleton.
- **Form controls:** toggle switch, radio cards, combobox and multi-select, slug input (public path prefix, auto-generate until edited, redirect warning when changing a published slug), sortable list (dnd-kit with keyboard sorting), date picker (react-day-picker, Indonesian locale, Monday start), locale tabs with completeness dots (only enabled locales render; with `en` only, no tabs are shown), text field with counter (amber at 90%, red and save blocked over the limit), copy rule hint (inline error on an em dash or en dash with one-click replace, using the validator from NEW-copy-lint), choice pickers (thumbnail grid over a code-defined list of poses, icons, tints), secret field (masked, write-only, "managed by environment" state).
- **Rich text editor component** (Tiptap, `admin-ui.md` section 4.6): toolbar, slash menu, paste cleaning, JSON output, word count, em dash flag. The allowed-node validation and the renderer stay in CPR-31.
- **Overlays and feedback:** dialog (focus trap, Escape, destructive confirm by typing the name), drawer, dropdown menu, toast (`check-pop` Lottie once on success), inline banner, progress bar.
- Admin-only libraries load only under the `/admin` route group.

**Out of scope**
- Image dropzone, image field and media picker (CPR-23). SEO panel (NEW-cms-seo). Dashboard charts, KPI pages, the "Profil saya" page and the command palette (see the open decisions in section 6 of the alignment file: no ticket in `admin-cms.md` covers them).
- Public site components (CPR-26).

**Acceptance criteria**
- [ ] TDD: failing Testing Library tests first for every component
- [ ] Sidebar keyboard behaviour follows the ARIA tree pattern (tests for arrows, expand and collapse, Enter) and items are not rendered for a role without access (Admin and Editor fixtures)
- [ ] Data table: sort, filter and page state live in URL params and survive reload and the back button; a request for a page beyond the last redirects to the last page
- [ ] Text counter blocks saving over the limit; the copy rule hint flags an em dash and the replacement removes it
- [ ] Locale tabs render nothing with a single enabled locale and render tabs with completeness dots when a second locale is added in a test fixture
- [ ] Dialogs trap focus, close with Escape and return focus to the trigger; destructive confirm needs the typed name
- [ ] No hardcoded colours (semantic tokens only); admin UI strings are Indonesian
- [ ] A bundle check shows no admin-only library in any public route bundle
- [ ] Reduced motion: no shimmer, no transitions beyond fades of 150 ms or less
- [ ] Unit, lint, typecheck and build pass

**Gotchas**
- Versions of the admin libraries are listed in `docs/design/admin-ui.md` section 4.1 (checked 2026-10-15 in that document). Re-check with `npm view`, pin exact versions and run the license check.
- Hiding a menu item is not an authorisation check; every query and action still checks session and role (FR-ADM-06).
- Primitives (Button, Input, Badge, Dialog base) live in `src/components/ui/` from CPR-26 and are shared; admin-only parts live in `src/components/admin/`.
- The shell is the largest dependency of the admin tickets. Ship it in slices (layout, table, form controls, overlays) so dependants can start early.

**References**
- `docs/design/admin-ui.md`; `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.7, 3; PRD FR-ADM-05, FR-ADM-06
- Replaces the "admin component additions" scope of the previous CPR-26 (table, pagination, filters, confirmation dialog, language tabs, upload and media picker, save and error states)
```

### NEW-cms-contract · [Admin] Public query contract, DTO fixtures and cache tags

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 1 and 5)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** High
- **Blocked by:** none
- **Blocks:** CPR-27, CPR-28, CPR-29, CPR-30, CPR-31, CPR-32, CPR-33, CPR-35, CPR-36, CPR-37, CPR-38, CPR-39, CPR-40, CPR-41, CPR-42, CPR-43, CPR-45, NEW-cms-pages, NEW-cms-seo
- **Labels:** none

```markdown
**Context**
The landing page (Faishal) and the CMS (Farhan) meet at typed public query functions. Agreeing that boundary first lets both sides work in parallel: landing tickets build against typed fixtures while CMS tickets build the real queries. This is the first CMS ticket. `docs/superpowers/plans/2026-10-15-admin-cms.md` section 1; wave plan in `docs/superpowers/plans/2026-10-15-agent-swarm.md` section 5.

**Scope**
- Folder convention per entity: `src/features/<entity>/` with `schema.ts` (Drizzle), `input.ts` (validators shared by the admin forms; Zod-free parsers per the plan), `service.server.ts` (admin mutations with capability guards), `query.server.ts` (admin queries), `public.server.ts` (public read functions), `types.ts` (DTOs for both sides).
- Contract rules written into the repo docs: public functions take an explicit `locale`; return **published** data only; return safe projections (never drafts, lead data, author emails or storage keys); sections hide when data is empty and the DTO makes "empty" explicit (`[]` or `null`, never placeholder text).
- Typed DTOs and one realistic fixture per public function for: site settings, page content per page, services, product capabilities, business types, FAQ items, work, posts, categories, team, media (public projection).
- `src/lib/cache/tags.ts` as the single file of cache tag names (for example `services:en`, `page:home:en`, `settings`), used by both sides. CPR-33 owns invalidation.
- Shared field limits (headline, meta title 60, meta description 160, and so on) in one module that both the validators and the layout reference, matching `docs/design/copywriting.md`.

**Out of scope**
- Implementing the entity tables and admin screens (each entity ticket). Invalidation logic (CPR-33).

**Acceptance criteria**
- [ ] TDD: failing tests first. Every fixture validates against its DTO type guard or parser
- [ ] A projection test per public function proves it returns no field outside its DTO (no internal ids, lead data, emails, storage keys, draft fields)
- [ ] A test proves empty collections are returned as `[]` and missing optional content as `null`
- [ ] Cache tags are defined only in `src/lib/cache/tags.ts`; a test builds each tag for `en` and for a fixture second locale
- [ ] The fixtures contain no em dash or en dash (the copy lint test scans them)
- [ ] A short contract README lists each public function, its DTO and its fixture path so landing developers can import them without asking

**Gotchas**
- A DTO change affects both sides: require the PR to update fixtures and tell the other owner.
- Fixtures should be realistic English copy (short, within the layout limits), not lorem ipsum, so landing component tests expose layout problems.
- Keep the DTOs locale-ready (explicit `locale` argument) even though only `en` exists.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 1, 4; `docs/superpowers/plans/2026-10-15-agent-swarm.md` sections 3 and 5
- PRD Rev. 3 section 9.4 (storage and publication), FR-SEO-05
```

### NEW-cms-pages · [Admin] Page content editor (Home, Product, Services overview, About, Contact, Thank you, 404, Blog/Work index)

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.2 and 5)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** High
- **Blocked by:** NEW-cms-shell, NEW-cms-contract, CPR-23
- **Blocks:** CPR-54, NEW-cms-preview
- **Related to:** CPR-35, CPR-36, CPR-38, CPR-39, CPR-40, CPR-41, CPR-42, CPR-54
- **Labels:** none

```markdown
**Context**
Page text is edited in the admin without a redeploy. Layout and section order live in code (`docs/design/page-patterns.md` section 2); the admin edits the content inside each section and a visibility toggle for optional sections. It does not reorder or add sections (no page builder, PRD non-goal). This ticket takes over the page content part of the old CPR-29 (CPR-29 is now site settings only). `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.2 and 4; `docs/design/admin-ui.md` section 5.

**Scope**
- Table `page_content` (`page_key`, `locale`, `data` JSONB, `updated_by`, `updated_at`). The JSONB shape is validated by a per-page schema in code on write and on read, with a version and a migration function on read.
- Admin "Halaman" list: the fixed set of pages with last updated and completeness per locale; page editor with a section-by-section accordion in page order, a visibility toggle per optional section, and a side panel (status, preview link from NEW-cms-preview, SEO panel from NEW-cms-seo).
- Editable content per page (from the CMS plan section 2.2):
  - Home: hero (eyebrow, headline, lead, two CTA labels, Sino poster media), two paths (per card eyebrow, title, body, CTA label, pose choice), Meet Sino, capabilities (title, intro; cards come from NEW-cms-product), how we work (4 steps), who we help (3 cards with icon choice), selected work (title, intro, toggle), from the blog (title, toggle), FAQ (title, intro), final CTA.
  - Product: hero (including up to 4 mockup chat bubbles and 3 floating `ui-chip` texts, waitlist form intro), capabilities intro, how it works (4 steps), made for your business (tabs, up to 4), you stay in control (3 features), comparison (toggle and rows), FAQ, final CTA, product status `coming_soon` or `live` (coordinate with NEW-cms-product).
  - Services overview, About (story as rich text, mission, values, Meet Sino, team toggle), Contact (up to 3 meta chips, headline, lead, 3 steps, response-time text only if the Founder approves an SLA, form intro, consent label with link), Thank you, 404, Privacy policy (rich text and effective date), Blog index and Work index (title, intro, empty-state text).
- Pose and icon choices are selects over a code-defined list (the asset set in `docs/design/3d-asset-requirements.md`), not free uploads.
- Public read function `getPageContent(page, locale)` with DTO and fixture from NEW-cms-contract; pages save as published in v1, with an unsaved-changes guard.
- Public copy fields use the copy validator; field limits come from the shared limits module.

**Out of scope**
- Rendering the pages (page tickets). Preview links (NEW-cms-preview). SEO fields (NEW-cms-seo). Site settings (CPR-29).

**Acceptance criteria**
- [ ] TDD: failing tests first
- [ ] Each page's schema accepts its fixture and rejects missing required fields and over-limit text
- [ ] Reading a document saved with an older schema version migrates it and returns the current DTO (test with a fixture of version 1 and version 2)
- [ ] An optional section toggled off is returned as hidden in the DTO and is not rendered by the landing page
- [ ] Editor and Admin can edit; anonymous requests are rejected on the action and the query
- [ ] Saving text with an em dash or en dash is rejected with an inline error
- [ ] Pose and icon selects accept only values from the code-defined list (test with an unknown value)
- [ ] Rich text fields (About story, Privacy) store structured JSON validated against the allowed node list

**Gotchas**
- JSONB drifts from the code schema if nobody tests it: load every fixture through the current schema in a test.
- Rich text depends on the editor component from NEW-cms-shell and the node validation from CPR-31. If CPR-31 lands later, use the validator interface from the contract and add the real validation when it merges.
- Page copy depends on unanswered questions (Q9 to Q11); keep names as data.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.2, 4, 7; `docs/design/page-patterns.md` section 2; `docs/design/admin-ui.md` section 5
```

### NEW-cms-product · [Admin] Product capabilities, business types and product status

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.3 and 5)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** NEW-cms-shell
- **Blocks:** CPR-54
- **Related to:** CPR-36, CPR-39, NEW-waitlist-form-ui, CPR-47, CPR-54
- **Labels:** none

```markdown
**Context**
The Product page and Home show the AI agent as a set of capabilities phrased as requests to Sino, plus tabs by business type, and the page switches from "Coming soon" to a live call to action when the product launches. These are data, not code. `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.3; `docs/design/page-patterns.md` sections 2.1 and 2.2; `docs/design/brand-positioning.md` section 3.1.

**Scope**
- `product_capability` with translations: key, title phrased as a request ("Sino, reply to today's customer chats"), body, tint (choice: teal, sun, mint, neutral), pose (choice over the code-defined list), mockup lines (up to 4), order, featured. Used on Home and Product.
- `business_type` with translations: key, label, example day text, order. Used by the Product page tabs (and see the gotcha about the contact form).
- Product status `coming_soon` or `live`, exposed in the page DTO so CTAs switch from "Join the waitlist" to "Try Sineva AI Agents" without a deploy (brand-positioning section 3.3).
- Admin list and form with choice pickers and sortable ordering (components from NEW-cms-shell), permissions Admin and Editor, validation and copy validator.
- Public read functions with DTOs and fixtures per NEW-cms-contract.
- Helper text on the capability form: only capabilities confirmed by team CBT may be published (`docs/design/copywriting.md` rule 3).

**Out of scope**
- Rendering (CPR-36, CPR-39). Page text (NEW-cms-pages).

**Acceptance criteria**
- [ ] TDD: failing tests first for validation, ordering and permission
- [ ] Capabilities and business types can be created, edited, reordered and removed by Admin and Editor; anonymous writes are rejected
- [ ] The public query returns capabilities in order, with `featured` flag, tint and pose from the allowed lists only
- [ ] The mockup lines are limited to 4 and checked by the copy validator
- [ ] The product status is stored once and read by the Home and Product DTOs; switching it changes the CTA fields in the DTO (test)
- [ ] The public query returns no unpublished or internal fields

**Gotchas**
- "Business type" means different things: the Product tabs use industries (online shop, cafe and restaurant, local services), while the contact form and waitlist use a segment (Small business, Company, Startup, Other, PRD section 8.2). `admin-cms.md` lists this collection as the source for both. Confirm one collection with a `kind` field, or two lists, before building.
- Capability text must not claim channels or integrations that are not confirmed (Q11).
- Product name is a working name (Q9); never hardcode it.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.3; `docs/design/components.md` section 4 (`card-task`); PRD Rev. 3 FR-PRD-01
```

### NEW-cms-faq · [Admin] Shared FAQ library with tags and JSON-LD output

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.3 and 5)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** NEW-cms-shell
- **Blocks:** CPR-54
- **Related to:** CPR-27, CPR-36, CPR-37, CPR-39, CPR-57, CPR-54
- **Labels:** none

```markdown
**Context**
FAQ blocks appear on Home, Product, Services and each service detail page. One shared library, filtered by tag, avoids copy drifting between pages, and the same data feeds the `FAQPage` structured data (FR-SVC-04, FR-SEO-04). `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.3; `docs/design/components.md` section 7.

**Scope**
- Tables `faq_item` (question, answer as rich text with limited marks, per locale), `faq_item_tag` with tags `home`, `product`, `services` and `service:<slug>`.
- Admin list filtered by tag, form with tag selection, ordering inside a tag, validators, copy validator, permissions Admin and Editor.
- Public read function `getFaq(tag, locale)` with DTO and fixture (NEW-cms-contract).
- A builder that converts a FAQ list to valid `FAQPage` JSON-LD from the same data (plain text or safely escaped limited HTML for `acceptedAnswer`), consumed by the `FaqSection` JSON-LD option and validated in CPR-57.

**Out of scope**
- FAQ block UI (NEW-section-blocks). Rich text node validation (CPR-31).

**Acceptance criteria**
- [ ] TDD: failing tests first
- [ ] Items can be tagged with several tags; the public query returns only items for the requested tag in the stored order
- [ ] The answer accepts only the allowed marks (bold, italic, link, list); other markup is rejected
- [ ] The JSON-LD builder output validates as `FAQPage` (schema shape test) and contains no raw unsafe HTML
- [ ] Saving text with an em dash or en dash is rejected
- [ ] Anonymous writes are rejected

**Gotchas**
- `admin-cms.md` section 2.3 lists a "FAQ (list)" field on Services and also tag `service:<slug>` in this library. Pick one source (recommendation: the library with `service:<slug>` tags) so the service form does not duplicate it. Decide before CPR-27.
- The plan lists no ordering field for FAQ items; define the order per tag.
- FAQ answers must not contain unverified claims.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.3; PRD FR-SVC-04, FR-SEO-04
```

### NEW-cms-seo · [Admin] SEO fields, global SEO settings, snippet/OG preview, redirects

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.4 and 5)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** NEW-cms-contract
- **Blocks:** CPR-52
- **Related to:** CPR-57, CPR-33
- **Labels:** none

```markdown
**Context**
SEO values are editable per document and globally, and renamed slugs must not break links. The landing side (CPR-52, CPR-57) renders metadata, sitemap and structured data from this data. `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.4; PRD FR-SEO-01.

**Scope**
- **Global SEO settings:** title template (`{title} | Sineva`), default meta description, default OG image, a site-wide robots toggle (off on previews), Search Console verification token, Organization data for JSON-LD (name, logo, `sameAs` from the social links).
- **Per-document SEO fields** for pages, services, work and posts: meta title (60 characters or fewer), meta description (160 or fewer), OG image (falls back to the generated `next/og` card), canonical override and noindex toggle (Admin only). A reusable SEO panel with live counters, a Google snippet preview and an OG card preview.
- **Redirects:** table `redirect` (`from_path` unique, `to_path`, status 301 or 308), created automatically when a published slug changes, with an Admin-only list and form, conflict and loop detection, and request-time resolution.
- A slug change and its redirect are written in one transaction; invalidation of old and new paths is triggered through CPR-33.
- Public read functions with DTOs and fixtures (NEW-cms-contract).

**Out of scope**
- Rendering metadata, canonical and OG (CPR-52). Sitemap, robots and JSON-LD output (CPR-57).

**Acceptance criteria**
- [ ] TDD: failing tests first
- [ ] Title and description limits are enforced on the server with the live counters in the form
- [ ] Editors can edit per-document SEO fields but not the canonical override, noindex toggle, global SEO settings or redirects (role tests)
- [ ] A redirect with a duplicate `from_path` is rejected; a redirect that creates a loop or a chain over the limit is rejected with a clear message
- [ ] Changing a published slug creates the redirect and updates the slug atomically; a failure in either rolls back both (database test)
- [ ] Redirect resolution does not apply to `/admin` or API paths
- [ ] The SEO panel shows the snippet and OG previews with the final title template

**Gotchas**
- Redirect lookup runs on requests; keep it cheap (indexed lookup, small cache) so it does not slow every page.
- The global robots toggle must default to "off" (no indexing) on preview deployments and on, deliberately, only in production.
- Canonical and noindex overrides are powerful; log them in the audit log (NEW-cms-audit).

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.4; PRD FR-SEO-01 to FR-SEO-05; `docs/design/admin-ui.md` section 5 (Settings: SEO, Redirects)
```

### NEW-cms-email · [Admin] Email settings (Resend API / SMTP), encrypted secrets, templates, test send

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.6 and 5)
- **Milestone:** M3
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** CPR-12
- **Blocks:** CPR-50
- **Labels:** none

```markdown
**Context**
The product owner asked for email configuration in the admin. The PRD keeps Resend as the provider; Resend also offers SMTP, so both modes are supported. Sending stays asynchronous to the form response (FR-LEAD-09). `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.6; `docs/design/admin-ui.md` section 5 (Settings: Email).

**Scope**
- Mode choice: `resend-api` or `smtp` (radio cards).
- SMTP fields: host, port, security (STARTTLS or TLS), username. Secret field for the SMTP password or Resend API key, **encrypted at rest** (AES-256-GCM, key from the environment variable `SETTINGS_ENCRYPTION_KEY`), write-only in the UI (never shown, "replace secret" action).
- From name, from email, reply-to. Lead notification recipients are stored in Site Settings (CPR-29) and shown here with a link.
- Templates in the database: lead notification (internal), auto-reply (per locale), waitlist confirmation (per locale); subject and body with placeholders (`{name}`, `{service}`) and a fixed branded layout in code.
- "Send test email" button: sends to the current admin and shows the provider response.
- Precedence: if `SMTP_*` or `RESEND_API_KEY` environment variables are set they override the database values and the UI shows "Managed by environment".
- Every change writes an audit entry (NEW-cms-audit helper) that records field names, never secret values.
- Admin only.

**Out of scope**
- Sending logic and the default template copy (CPR-50, CPR-21). Domain verification (CPR-12).

**Acceptance criteria**
- [ ] TDD: failing tests first, including an encryption round trip and a tamper test (a modified ciphertext fails to decrypt)
- [ ] A saved secret is never returned to the client or written to logs or the audit log; the UI shows only a masked state
- [ ] With the environment variables set, the form shows "Managed by environment" and the environment value is used
- [ ] An Editor and an anonymous user cannot read or change email settings (direct action and query tests)
- [ ] Test send works with a mock provider in tests and shows the provider response without exposing secrets
- [ ] Templates render placeholders with HTML escaping; a name containing markup or newlines cannot inject HTML or headers
- [ ] A missing `SETTINGS_ENCRYPTION_KEY` fails safe (no plaintext fallback)

**Gotchas**
- SMTP from a VPS IP is often blocked or lands in spam; prefer the Resend API in production and keep SMTP as the fallback. SPF, DKIM and DMARC are required either way (CPR-12).
- Key rotation: document how to re-encrypt stored secrets when the key changes.
- The waitlist confirmation template exists here, but sending a waitlist email is not in the v1 PRD. Sending needs a product owner decision and consent wording.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.6; PRD FR-LEAD-06, FR-LEAD-07, FR-LEAD-09
```

### NEW-cms-audit · [Admin] Audit log

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.7 and 5)
- **Milestone:** M3
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Low
- **Blocked by:** NEW-cms-shell
- **Blocks:** none
- **Labels:** none

```markdown
**Context**
The team needs to know who changed what and when, especially for settings, secrets, redirects and users. `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.7; `docs/design/admin-ui.md` sections 4.3 (activity feed) and 5 (Audit log).

**Scope**
- Table `audit_log`: actor, entity, entity id, action, changed field names (never the values of secrets), timestamp.
- A helper called from the admin service layer so an audit entry is written in the same database transaction as the change.
- Instrument the mutations that already exist (users and roles from CPR-24) and provide the helper that later tickets call (media, services, pages, settings, email settings, redirects, leads status changes).
- Admin-only read-only list with filters by actor and entity; feeds the activity feed component on the dashboard.

**Out of scope**
- Dashboard charts and KPI cards. Exporting the log.

**Acceptance criteria**
- [ ] TDD: failing tests first
- [ ] A mutation writes its audit entry in the same transaction; a rolled-back mutation leaves no entry (database test)
- [ ] Secret values and lead personal data never appear in an entry; only field names do
- [ ] Editor and anonymous users cannot read the log (direct query tests)
- [ ] The list filters by actor and by entity and is paginated through URL params
- [ ] Existing user and role changes appear in the log

**Gotchas**
- The log contains staff identities; decide a retention period and record it (UU PDP).
- Each later admin ticket must call the helper; add the check to the review checklist of those tickets so entries are not forgotten.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.7; PRD FR-ADM-04 to FR-ADM-06
```

### NEW-cms-preview · [Admin] Preview links for pages and services

- **Action:** NEW (from `docs/superpowers/plans/2026-10-15-admin-cms.md` sections 2.7 and 5)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** NEW-cms-pages
- **Blocks:** none
- **Related to:** CPR-27, CPR-30, CPR-31
- **Labels:** none

```markdown
**Context**
Work and posts have draft, publish and preview (FR-ADM-02, CPR-30, CPR-31). Pages and services save as published in v1, so editors need a way to see the page with their current, unsaved form state before saving. `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.7.

**Scope**
- A preview link in the page and service editors that renders the real landing page with the current form state.
- A signed, short-lived preview token; the form state is stored server-side under that token (not in the URL) for a short time.
- The preview route requires an Admin or Editor session as well as a valid token, answers with `noindex` and `Cache-Control: no-store`, and bypasses the static cache.
- Previews never write to the public snapshot and never trigger cache revalidation.
- Check the draft mode support in the installed Next.js docs before choosing the mechanism.

**Out of scope**
- Preview for work and posts (CPR-30, CPR-31).

**Acceptance criteria**
- [ ] TDD: failing tests first
- [ ] Anonymous requests with a valid token are rejected; requests with a session but an expired or tampered token are rejected
- [ ] The preview response has `noindex` and `no-store`, and is not served from or stored in the public cache
- [ ] The preview shows unsaved changes; saving nothing leaves the public page unchanged
- [ ] The preview does not call the revalidation helper (test with a spy)
- [ ] Stored preview state is removed after expiry

**Gotchas**
- A shared preview link can leak unpublished copy: keep the token lifetime short and require the session.
- The preview renders landing components with draft data; make sure the data goes through the same public DTO shape as production so the preview is faithful.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.7; PRD FR-ADM-02
```


## 4. Update existing tickets

Paste each fenced block as the new description. Fields outside the block are set with the Linear fields. "Priority: keep current" means do not touch the existing Linear priority (the digest does not include it).

### NEW-cms-dashboard · [Admin] Dashboard: KPI cards, gradient charts, activity feed

- **Action:** NEW (gap closed on 2026-10-15)
- **Milestone:** M3
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** NEW-cms-shell, NEW-cms-audit, CPR-46
- **Blocks:** none
- **Labels:** none

```markdown
**Context**
The admin landing screen (`/admin`) should show what needs attention: new leads, waitlist growth, drafts waiting, missing translations. Spec: `docs/design/admin-ui.md` sections 4.3 (stat card, list card, activity feed), 4.4 (charts) and 5 (Dasbor). Scope from `docs/superpowers/plans/2026-10-15-admin-cms.md` section 5.

**Scope**
- KPI stat cards: new leads (period), waitlist signups (period), drafts waiting, missing translations. Delta vs previous period, sparkline.
- Gradient area chart of leads per day/week with range presets (7, 30, 90 days, custom range via the date range picker) and a dashed previous-period series.
- Bar chart: leads per service and per segment. Donut: leads per status with legend chips that open the filtered lead table.
- List cards: latest leads (Admin), drafts waiting (Admin + Editor).
- Activity feed from the audit log.
- Role-aware: Editor sees only content cards (drafts, missing translations, activity on content).
- Aggregations run server-side with SQL (no loading all rows), cached per request only (no public cache).

**Out of scope**
- Analytics from Umami (traffic) in the dashboard. Exports.

**Acceptance criteria**
- [ ] TDD: failing tests first (aggregation queries, role filtering, component rendering)
- [ ] Charts use Recharts with brand tokens only; area fill is the teal gradient from `admin-ui.md` 4.4
- [ ] Every chart has a text summary for screen readers and a "Lihat sebagai tabel" toggle
- [ ] Reduced motion disables chart animation
- [ ] Editor never receives lead or waitlist numbers (server-side check, tested)
- [ ] Empty data shows an empty state, not a flat line
- [ ] Dashboard renders in under 1 s on a seeded DB with 10k leads (DB test with timing budget)

**Gotchas**
- Time zone: aggregate by Asia/Jakarta days, store UTC.
- Recharts is client-only; keep data fetching in a server component and pass serialised data.

**References**
- `docs/design/admin-ui.md` 4.3, 4.4, 5; `docs/superpowers/plans/2026-10-15-admin-cms.md` 2.7, 5; PRD FR-CRM-03
```

### NEW-cms-profile · [Admin] My profile: profile, password, active sessions, preferences

- **Action:** NEW (gap closed on 2026-10-15)
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** Medium
- **Blocked by:** NEW-cms-shell
- **Blocks:** none
- **Labels:** none

```markdown
**Context**
Every signed-in user needs a self-service page at `/admin/profil`. Spec: `docs/design/admin-ui.md` section 4.9. Builds on the CPR-24 session and lockout rules.

**Scope**
- Profil: edit name; email read-only for Editors (Admins change emails via Users); avatar upload via the image dropzone into `media-private` with square crop.
- Keamanan: change password (current, new 12-128 chars, confirm) and revoke other sessions on change.
- Sesi aktif: list sessions (user agent, IP, last active) with "Keluar dari sesi ini" and "Keluar dari semua perangkat lain".
- Preferensi: table density and sidebar default, stored per user.
- Re-authentication required for password and session actions when the session is older than 15 minutes.
- Audit entries for every change.

**Out of scope**
- Two-factor authentication. Email change verification flow.

**Acceptance criteria**
- [ ] TDD: failing tests first (DB + HTTP)
- [ ] Wrong current password counts toward the CPR-24 lockout rules and never reveals details
- [ ] Changing the password revokes all other sessions in the same transaction (DB test)
- [ ] A user can only see and revoke their own sessions (direct request tests)
- [ ] Avatar upload rejects non-images by content sniffing
- [ ] Keyboard and screen-reader operable (component tests)

**Gotchas**
- Better Auth session listing exposes tokens internally; project only safe fields to the client.

**References**
- `docs/design/admin-ui.md` 4.9; PRD FR-ADM-04, FR-ADM-06; CPR-24
```

### 4.1 M0: infrastructure

### CPR-8 · [Infra] Provision VPS and install Coolify

- **Action:** UPDATE
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** none
- **Blocks:** CPR-11, NEW-seaweedfs
- **Labels:** none

```markdown
**Context**
Hosting is a VPS with Coolify (decision D2). Provider and region are still open (Q2). Rev. 3 adds a requirement: the same VPS also runs SeaweedFS (media and database backups, see NEW-seaweedfs), so disk and memory must be sized for it. PRD Rev. 3 infra section (14.2) and backup section (13.6).

**Scope**
- Choose provider and region (Jakarta or Singapore).
- Spec at least 2 vCPU, 4 GB RAM, 80 GB SSD, Ubuntu LTS. **Re-check the disk size for media plus SeaweedFS volumes before buying**: the 80 GB minimum was set before SeaweedFS was added. Write the estimate down: expected media GB + PostgreSQL GB + (14 daily compressed dumps) + Docker images and OS + 30% headroom. Re-check RAM headroom for SeaweedFS next to PostgreSQL and a Next.js build (builds can fail on 2 GB).
- Prefer a provider that lets you add or resize a data volume without rebuilding the server, and mount SeaweedFS data on its own path or volume so it can grow independently.
- Non-root user, SSH key only, password login disabled.
- Firewall opens only 22, 80 and 443; automatic security updates.
- Install Coolify and secure its dashboard (strong admin account, HTTPS subdomain).

**Out of scope**
- Deploying SeaweedFS (NEW-seaweedfs), app deployment (CPR-11), Cloudflare setup (CPR-9).

**Acceptance criteria**
- [ ] VPS runs at or above the minimum spec, and the disk and RAM sizing note (with the calculation) is recorded in the PRD or the runbook
- [ ] SSH login with a password is rejected, and the firewall opens only 22, 80 and 443
- [ ] Automatic security updates are active
- [ ] The Coolify dashboard is reachable over HTTPS and protected by login
- [ ] Provider, region and monthly cost are recorded in the PRD (Q2 closed)
- [ ] The provider's volume resize and snapshot options are noted (input for Q8, the off-host backup decision)

**Gotchas**
- Media, database and database backups share this one disk by default. A full disk stops PostgreSQL as well as media. Add a disk usage alert (also in NEW-seaweedfs).
- Do not open SeaweedFS or database ports in the firewall; only 22, 80 and 443 stay open.

**References**
- PRD section 13.3, 14.2, Q2; `docs/superpowers/plans/2026-10-15-website-redesign.md` section 2 (gotcha 5)
- Previous text: provider and region (Jakarta or Singapore), minimum 2 vCPU, 4 GB, 80 GB SSD, Ubuntu LTS, non-root and SSH key only, firewall 22, 80 and 443 with automatic updates, Coolify with secured dashboard; acceptance criteria are carried over above
```

### CPR-9 · [Infra] Setup Cloudflare: DNS, CDN, Turnstile

- **Action:** UPDATE (title changed: R2 removed)
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** CPR-6
- **Blocks:** CPR-11, CPR-12, CPR-49, NEW-auth-client-ip, NEW-seaweedfs
- **Labels:** none

```markdown
**Context**
Cloudflare provides DNS, proxy and CDN, and Turnstile (anti-spam). Rev. 3 removes Cloudflare R2: media and backups move to SeaweedFS on the VPS (NEW-seaweedfs). Cloudflare still sits in front as the CDN for a dedicated media host. PRD Rev. 3 infra section (14.1, 14.2) and FR-LEAD-12.

**Scope**
- Cloudflare account, add the domain, change nameservers; SSL mode Full (strict).
- DNS records for the app, for the Coolify dashboard subdomain and for the **media CDN host** `media.<domain>` (proxied; origin and cache rules are completed in NEW-seaweedfs).
- Turnstile production widget (site key and secret key) plus documentation of the official test keys for local and CI.
- No R2 buckets and no R2 API tokens (removed from scope).

**Out of scope**
- SeaweedFS deployment and buckets (NEW-seaweedfs). Restricting the origin to Cloudflare IPs and the trusted client IP (NEW-auth-client-ip). Email DNS records (CPR-12).

**Acceptance criteria**
- [ ] Domain status is Active in Cloudflare and SSL mode is Full (strict)
- [ ] DNS records exist and are proxied for the app and for `media.<domain>`
- [ ] Turnstile site key and secret key exist as secrets (not in the repo), and the test keys are documented in the README
- [ ] `media.<domain>` returns a valid HTTPS response through Cloudflare for a sample object once NEW-seaweedfs is deployed (record the check on this ticket when that ticket closes)
- [ ] No R2 resource is created or referenced

**Gotchas**
- Turnstile needs `challenges.cloudflare.com` in the CSP (CPR-53).
- Cloudflare caches according to origin `Cache-Control`; published media is served with immutable headers (NEW-seaweedfs). The private bucket must never be reachable through this host.
- Large admin uploads pass through the Cloudflare proxy, which has a request body size limit that depends on the plan (recalled from memory, not verified: check the current limit for the plan in use).

**References**
- PRD FR-LEAD-12, infra section; `docs/superpowers/plans/2026-10-15-website-redesign.md` phase 2
- Previous text (Indonesian): Cloudflare account, nameservers, SSL Full (strict), R2 buckets `sineva-compro-media` and `sineva-compro-backup` with limited API token, Turnstile production widget with test keys documented; acceptance criteria were: domain Active, two R2 buckets with S3 credentials as secrets, Turnstile keys and README test keys, public media access through a subdomain or R2 public URL. The R2 criteria are replaced by the media host criteria above
```

### CPR-11 · [Infra] Deploy production and per-PR preview via Coolify

- **Action:** UPDATE
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** CPR-9, CPR-7, CPR-8, NEW-seaweedfs
- **Blocks:** CPR-13, CPR-14, CPR-53, NEW-auth-client-ip
- **Relation changes (Blocked by):** add NEW-seaweedfs
- **Labels:** none

```markdown
**Context**
The app deploys automatically from GitHub to the VPS. Each pull request gets a preview environment. Rev. 3 changes media storage from R2 to SeaweedFS, so previews need their own SeaweedFS prefix instead of an R2 prefix. PRD Rev. 3 infra section (14.2).

**Scope**
- Connect the repo to Coolify through the GitHub App; Dockerfile for Next.js `standalone`.
- PostgreSQL production and staging managed by Coolify; every PR gets an isolated database on the staging instance.
- **Per-PR media isolation:** each preview writes media only under its own SeaweedFS prefix (for example `preview/pr-<n>/` in a preview or private bucket), cleaned up when the PR closes. Previews never receive the production SeaweedFS keys.
- Environment variables and secrets separated per environment.
- `main` deploys to production; each PR gets a preview deployment (database per PR on staging, no production personal data).
- Production domain and preview subdomains through Cloudflare (proxy on, HTTPS).

**Out of scope**
- SeaweedFS deployment (NEW-seaweedfs). Security headers (CPR-53). Monitoring (CPR-14). Backups (CPR-13).

**Acceptance criteria**
- [ ] A merge to `main` deploys production automatically
- [ ] Every PR gets a preview URL that opens
- [ ] Production and previews use separate databases
- [ ] Drizzle SQL migrations that were reviewed run in one controlled deploy step before the app receives traffic; startup never changes the schema automatically
- [ ] Media uploaded in a preview lands under that preview's prefix and cannot overwrite or read production objects (test with the preview key against a production object)
- [ ] The preview prefix is removed when the PR is closed (or a documented cleanup job does it)
- [ ] No secret is stored in the repo

**Gotchas**
- SeaweedFS access control may not support per-prefix scoping the way you expect (recalled, not verified). If it only scopes per bucket, use a separate preview bucket and a preview-only key.
- Preview deployments are not behind the same Cloudflare rules as production; see NEW-auth-client-ip for the IP handling fallback.
- Preview databases must never be seeded from production data.

**References**
- PRD infra section 14.2; `docs/superpowers/plans/2026-10-15-website-redesign.md` phase 2
- Previous text: GitHub App to Coolify, standalone Dockerfile, PostgreSQL production and staging, per-PR database and media prefix (R2), env and secrets per environment, `main` to production, per-PR preview, domains via Cloudflare; acceptance criteria are carried over above
```

### CPR-12 · [Infra] Setup Resend and verify email domain

- **Action:** UPDATE
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** CPR-9
- **Blocks:** CPR-50, NEW-cms-email
- **Labels:** none

```markdown
**Context**
Lead notification emails and automatic replies are sent through Resend. Rev. 3: the brand is "Sineva" and the emails are in English. The domain comes from CPR-6. PRD FR-LEAD-06, FR-LEAD-07 and infra section (14.1).

**Scope**
- Resend account; verify the domain with SPF, DKIM and DMARC through Cloudflare DNS.
- Sender address on the new domain, for example `hello@<domain>` (display name "Sineva"); a Reply-To that points to the lead inbox.
- API key stored as a secret in Coolify.
- English templates are written in CPR-50 and the copy in CPR-21; this ticket only proves delivery with a test message.

**Out of scope**
- Template content and sending logic (CPR-50, CPR-21).

**Acceptance criteria**
- [ ] Domain shows Verified in Resend
- [ ] A test email lands in a Gmail inbox (not spam) with SPF and DKIM pass
- [ ] A DMARC record is published
- [ ] The sender display name is "Sineva" and no email text uses the old two-word brand name
- [ ] API key is a Coolify secret, not in the repo

**Gotchas**
- Start DMARC with a monitoring policy (`p=none`) and tighten later; a strict policy before DKIM and SPF are stable can drop real mail.
- The legal entity is not formed yet; do not put an address or legal name in the footer of test emails.
- NEW-cms-email lets the admin switch between the Resend API and SMTP. Domain authentication (SPF, DKIM, DMARC) is required in both modes, so this ticket does not change. Environment variables (`RESEND_API_KEY`, `SMTP_*`) override values saved in the admin.

**References**
- PRD FR-LEAD-06, FR-LEAD-07, section 14.1; `docs/design/copywriting.md` section 1 (brand rule)
- Previous acceptance criteria (Verified in Resend, Gmail inbox with SPF and DKIM pass, DMARC present) are carried over above
```

### CPR-13 · [Infra] Daily database backup to SeaweedFS + off-host copy

- **Action:** UPDATE (title changed from "Backup database harian ke R2")
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** CPR-11, NEW-seaweedfs
- **Blocks:** CPR-61
- **Relation changes (Blocked by):** add NEW-seaweedfs; remove CPR-9
- **Labels:** none

```markdown
**Context**
Lead data is the most valuable data and the database lives on one VPS, so it needs automatic backups. Rev. 3 moves the backup target from Cloudflare R2 to the SeaweedFS `backups` bucket and adds an **off-host copy**, because SeaweedFS runs on the same VPS as PostgreSQL and one disk failure would lose both. The off-host target is open question Q8. PRD Rev. 3 backup section (13.6).

**Scope**
- Daily PostgreSQL production backup through Coolify scheduled backups to the SeaweedFS `backups` bucket (S3-compatible, custom endpoint, path-style).
- Off-host copy of each daily backup to a location outside the VPS and outside its provider account where possible (target decided in Q8).
- Retention 14 days at both locations.
- Backups that contain personal data are encrypted before they leave the VPS.
- A failed or missing backup produces an alert.
- Restore runbook at `docs/runbooks/restore-backup.md` covering both restore paths (from SeaweedFS and from the off-host copy).

**Out of scope**
- The restore test itself (CPR-61, M5). SeaweedFS deployment (NEW-seaweedfs).

**Acceptance criteria**
- [ ] A backup file appears automatically every day in the SeaweedFS `backups` bucket
- [ ] The same backup appears at the off-host target every day
- [ ] Backups older than 14 days are removed automatically at both locations
- [ ] A forced backup failure triggers an alert (tested once)
- [ ] The restore runbook is in the repo and covers both locations
- [ ] Backup access keys are separate from the media keys and are not in the repo

**Gotchas**
- The SeaweedFS part can ship before Q8 is answered, but this ticket is not Done until the off-host copy works. Do not mark backups complete on SeaweedFS alone.
- Verify that Coolify can target a custom S3 endpoint with path-style addressing, and that SeaweedFS supports the expiry method you choose; if not, use a cleanup job.
- Off-host storage costs and egress: record the monthly cost next to the Q8 decision.

**References**
- PRD Rev. 3 section 13.6; `docs/superpowers/plans/2026-10-15-website-redesign.md` section 2 (gotcha 5)
- Previous text: daily PostgreSQL backup through Coolify to R2 bucket `sineva-compro-backup`, 14-day retention, runbook in `docs/runbooks/restore-backup.md`; acceptance criteria were daily file in R2, auto-delete after 14 days, runbook in repo. Restore test stays in M5
```

### CPR-14 · [Infra] Setup Sentry and uptime monitor

- **Action:** UPDATE
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** CPR-11
- **Blocks:** none
- **Labels:** none

```markdown
**Context**
Production errors and downtime must be noticed before visitors report them. Rev. 3: English is the only locale and has no URL prefix, so the home page to monitor is `/`, not `/id`. PRD section 13.6, FR-LEAD-09.

**Scope**
- Sentry (free plan) for Next.js server and client, source maps, environments production and preview.
- External uptime monitor (Better Stack or UptimeRobot) for `/` and `/admin`, notifications to the Founder. The anonymous `/admin` response is a redirect to the login page, so configure the monitor to follow redirects and expect the login page, or monitor the login URL directly.
- Add the media host (`media.<domain>`) as a third monitor if it is not already created in NEW-seaweedfs.

**Out of scope**
- CSP entries for Sentry (CPR-53).

**Acceptance criteria**
- [ ] A test error in production appears in Sentry with a readable stack trace
- [ ] The monitor sends a notification when the site is taken down temporarily (tested)
- [ ] The monitor runs outside the VPS
- [ ] Monitors cover `/` and `/admin` (login page); none points at `/id`
- [ ] Sentry events contain no lead or waitlist personal data (verify with a test submission that fails on purpose)

**Gotchas**
- Scrub request bodies and form fields from Sentry events; the contact form carries personal data (UU PDP).
- Source map upload needs a Sentry auth token as a build secret, not committed.

**References**
- PRD section 13.6, FR-LEAD-09
- Previous text: Sentry for server and client with source maps and environments; external monitor for `/id` and `/admin` with notifications to the Founder; acceptance criteria carried over above
```


### 4.2 M1: content and design

### CPR-16 · [Content] Decide portfolio showcase topics

- **Action:** UPDATE (currently In Progress)
- **Milestone:** M1
- **Assignee:** Farhan Fadillah Rafi (keep)
- **Priority:** keep current
- **Blocked by:** none
- **Blocks:** CPR-55
- **Labels:** none

```markdown
**Context**
With no client portfolio yet, early credibility comes from 2 to 3 internal showcase projects (decision D5), labelled "Internal demo project" (FR-PF-03). Building the demos is outside this project. Rev. 3 positions Sineva as an AI consulting company (Product: AI agents for UMKM; Services: AI Discovery, AI Build, AI Enablement), so the showcase topics must demonstrate AI work, not generic web development. PRD Rev. 3 portfolio and positioning sections; `docs/design/brand-positioning.md` section 3.

**Scope**
- Choose 2 to 3 AI-focused topics. Each topic maps to one service so the Services and Work pages reinforce each other. Starting proposals to refine (not decided):
  - AI Build: order dashboard for a fictional UMKM food business with automation simulated end to end (narrowed from the earlier WhatsApp idea into a self-contained simulation; draft already in `docs/content/showcase-draft.md`).
  - AI Discovery: a sample discovery output (process map, ranked AI opportunities, recommended first step) for a fictional small business.
  - AI Enablement: a sample team guide or playbook for using AI day to day.
  - Product tie-in: FAQ and booking assistant for a fictional clinic (needs team CBT, only features confirmed in Q11).
  - The case study of how this Sineva website was designed and built, only if it shows AI-assisted work and contains no invented results.
- For each topic: related service, who builds the demo, estimated readiness.
- Create the demo build tickets in the right team or project.

**Out of scope**
- Building the demos. Entering them into the admin (CPR-55).

**Acceptance criteria**
- [ ] At least 2 topics approved by the Founder, each linked to a service and clearly AI-focused
- [ ] Each topic has an owner and a demo build ticket
- [ ] Open question Q4 is closed in the PRD
- [ ] Every topic is described as an "Internal demo project" with no invented client, metric or testimonial

**Gotchas**
- Demos that touch the AI Agents product depend on team CBT and on which capabilities are confirmed (Q11). Do not promise features that are not confirmed.
- The earlier Sineva-website case study may read as a web-development showcase, which Rev. 3 no longer sells as a standalone service. Keep it only if the AI angle is real.

**References**
- PRD Rev. 3 portfolio section, FR-PF-03, Q4; `docs/content/showcase-draft.md` (PR #7)
- Previous text and progress (Indonesian): 2 to 3 topics with proposals (FAQ and booking chatbot for a fictional clinic, WhatsApp order dashboard for an F&B UMKM, the Sineva website itself as a case study); draft written 15 Oct with two candidates (website case study, UMKM order dashboard with automation simulation) and the chatbot as a backup; owners, schedule, demo tickets and Q4 still open; no acceptance criterion ticked yet
```

### CPR-17 · [Content] Draft privacy policy (English)

- **Action:** UPDATE
- **Milestone:** M1
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** none
- **Blocks:** CPR-54
- **Labels:** none

```markdown
**Context**
The contact form and the waitlist collect personal data, so a privacy policy aligned with the Indonesian personal data protection law (UU PDP) is mandatory before launch. Rev. 3: the policy is English only at launch (Indonesian can follow with the `id` locale), the brand is "Sineva", and the storage provider changes from Cloudflare R2 to SeaweedFS. PRD Rev. 3 privacy section (13.4) and FR-PRV-01.

**Scope**
- Data collected: contact form, waitlist, cookie-less analytics (Umami), error monitoring (Sentry), technical logs.
- Purpose and legal basis (explicit consent through the checkbox).
- Retention: Leads 24 months from last interaction; Waitlist until 12 months after the product launches or until deletion is requested (defaults, subject to legal review); database backups are kept 14 days and contain personal data.
- Recipients and infrastructure: Resend (email), Cloudflare (DNS, CDN, Turnstile), Umami, Sentry, the VPS provider that hosts the database and the SeaweedFS media and backup storage, and the off-host backup provider once Q8 is decided.
- Data subject rights, how to request access or deletion (public email, handled manually by the Admin), and contact details.
- Naming: "Sineva". The legal entity name and address are added when the company is formed (fields stay hidden while empty, FR-GLB-03).
- Identify the legal reviewer (Q6) and schedule the review before M4.

**Out of scope**
- Indonesian version (future `id` locale). The page layout (CPR-35).

**Acceptance criteria**
- [ ] A complete English draft covers every point above
- [ ] The legal reviewer is named (Q6) and the review is scheduled before M4
- [ ] The draft passes the copy rules: no em dash or en dash, no old two-word brand name, no unverified claims
- [ ] A list of questions for the legal reviewer is attached (see gotchas)

**Gotchas**
- SeaweedFS is software, not a company. The processor to name is the VPS provider (and the off-host backup provider), not "SeaweedFS". Have legal confirm how to describe self-hosted storage.
- Several recipients (Cloudflare, Resend, Sentry, Umami Cloud) are foreign providers. Ask legal whether UU PDP cross-border transfer wording is needed.
- Rev. 2 listed Cloudflare R2 and the old brand name in this policy; both must be gone.

**References**
- PRD FR-PRV-01, section 13.4, Q6
- Previous text (Indonesian): draft ID and EN covering form, waitlist, cookie-less analytics; purpose and consent; retention (Leads 24 months, Waitlist until 12 months after chatbot launch); third parties (Resend, Cloudflare, Umami, Sentry, VPS provider); rights and contact; decide legal reviewer (Q6). Acceptance: complete draft and reviewer decided with review scheduled before M4
```

### CPR-18 · [Design] Design system from brand identity

- **Action:** UPDATE
- **Milestone:** M1
- **Assignee:** Faishal (keep)
- **Priority:** keep current
- **Blocked by:** none
- **Blocks:** CPR-22, CPR-26
- **Related to:** NEW-prd-rev3, CPR-15
- **Labels:** none

```markdown
**Context**
The logo and brand identity exist and have been turned into a documented design system for code: `docs/design/` (tokens, components, motion, page patterns, mascot, 3D assets, accessibility and performance budgets, copywriting). It is Sintra-inspired, light theme only (PRD Rev. 3), and is complete in the docs but **pending Founder approval**. Open question Q5 is answered: the UI is built code-first (Figma is optional, see CPR-22). Q7 is answered: logo SVGs exist (`assets/brand/logos/svg/`: stacked and symbol, original and dark variants). Entry point: `docs/design/README.md`.

**Scope**
- Get the Founder to review and approve `docs/design/` (brand-positioning, tokens, components, motion, page-patterns, copywriting, mascot-sino, 3d-asset-requirements, accessibility-performance).
- Export the **horizontal logo lockup** (symbol plus wordmark) needed by the navbar (`docs/design/components.md` section 2) from Figma or the traced SVG, plus optimised PNG or WebP.
- Independently re-check the text and background colour pairs in `docs/design/tokens.md` section 1.3 against WCAG AA (recompute with the formula, attach the result). The permanent automated check lives in CPR-26.
- Record the decision on the CPR-26 local spec conflict (Manrope and `#077A7E` versus Plus Jakarta Sans and `--teal-700 #00686D`). Recommendation: the tokens in the docs win (higher contrast, one consistent scale).
- Record Q5 (code-first) and Q7 (answered) in PRD Rev. 3.

**Out of scope**
- Implementing tokens and components in code (CPR-26). Hi-fi screens (CPR-22). Dark theme: the dark logo variants stay in the repo for a future dark mode but are unused in v1.

**Acceptance criteria**
- [ ] Founder approval of `docs/design/` is recorded (comment or PR approval)
- [ ] Q5 and Q7 are recorded in the PRD (code-first; logo SVG available)
- [ ] The horizontal lockup exists as SVG (light variant) with an optimised raster fallback
- [ ] All semantic text and background pairs in `tokens.md` section 1.3 are verified AA, with the calculation attached
- [ ] The font and action colour conflict with the CPR-26 local spec is decided and written down
- [ ] Dark mode is documented as a post-launch backlog item, not a v1 requirement

**Gotchas**
- The brand teal `#00949B` is only 3.68:1 on white: never use it for body text, links or white button labels. Text and actions use `--teal-700 #00686D`.
- The Founder directive of 15 Oct 2026 allowed temporary assistant-built UI while this ticket was open. That permission was never design-system approval; approval is what this ticket delivers.

**References**
- `docs/design/README.md`, `docs/design/tokens.md`, `docs/design/components.md`; `assets/brand/logos/README.md`
- Previous text (Indonesian): logo to SVG and optimised PNG or WebP; dark-background logo variant; decide Figma first or code (Q5); colour tokens for light and dark themes with AA in both, typography, spacing, radius, shadow; base components; acceptance: Q5 and Q7 decided, logo SVG for light and dark backgrounds, tokens documented, all pairs AA in both themes, Founder approval. The dark-theme parts are dropped (light only in v1)
```

### CPR-21 · [Content] English copywriting (primary)

- **Action:** UPDATE (title changed from "Copywriting Bahasa Inggris"; scope replaced)
- **Milestone:** M1
- **Assignee:** Faishal (proposed, needs confirmation; currently unassigned)
- **Priority:** keep current
- **Blocked by:** NEW-prd-rev3
- **Blocks:** CPR-54
- **Relation changes (Blocked by):** add NEW-prd-rev3; remove CPR-19
- **Related to:** NEW-copy-lint
- **Labels:** none

```markdown
**Context**
English is now the primary and only launch language, so this ticket is no longer a localisation of the Indonesian copy. The copy is written from scratch for the new information architecture (AI consulting company, Product plus three Services) using `docs/design/copywriting.md` and `docs/design/page-patterns.md`. The Indonesian draft in `docs/content/copy-id.md` stays as source material for a future `id` locale only; its positioning (Web Development plus AI & Automation) is outdated. PRD Rev. 3 content rules.

**Scope**
- Final English copy for every section of every page in `docs/design/page-patterns.md` section 2: Home, Product (AI Agents), Services list and the three service details (AI Discovery, AI Build, AI Enablement) with FAQ, Work, Blog list, About, Contact and thank-you, 404, plus shared UI microcopy for `messages/en.json`.
- Metadata for every page: title 60 characters or fewer in the pattern `{Page topic} | Sineva`, description 160 characters or fewer (one benefit sentence plus one call to action).
- WhatsApp message templates per context (general, each service, product, thank-you), see `docs/design/copywriting.md` section 6.
- Email texts: lead notification and automatic reply (content for CPR-50).
- Alt text rules applied to the image list from the page patterns.
- FAQ items for the shared FAQ library (NEW-cms-faq), tagged for Home, Product, Services and each service.
- Deliverables: `docs/content/copy-en.md` and `docs/content/seo-en.json` (same structure as the Indonesian files), ready for CPR-54 to enter into the admin.

**Out of scope**
- Privacy policy text (CPR-17). Indonesian copy. Entering the copy into the admin (CPR-54).

**Acceptance criteria**
- [ ] Every section in `docs/design/page-patterns.md` section 2 has final English copy
- [ ] Copy checklist in `docs/design/copywriting.md` section 9 passes for every page (headline 8 words or fewer, hero 10, one primary CTA per section, sentence case, no idioms that cannot be localised)
- [ ] No em dash or en dash anywhere (checked by NEW-copy-lint once available, or a manual search until then)
- [ ] Meta titles are 60 characters or fewer and descriptions 160 or fewer, verified by a script or a character count table
- [ ] No unverified claims: no invented numbers, testimonials, client logos, ratings or results
- [ ] Reviewed by a fluent English speaker and approved by the Founder

**Gotchas**
- Product name (Q9), service names (Q10) and product capabilities (Q11) are not decided. Use the working names, mark every dependent sentence "pending confirmation" and keep them in one place so they can be changed once.
- Brand is "Sineva" (never the two-word old brand name); the mascot is "Sino".
- Do not promise business results or mention channels (WhatsApp, Instagram) the product team has not confirmed.
- Copy for the Product page must only describe capabilities confirmed by team CBT.

**References**
- `docs/design/copywriting.md` (all sections), `docs/design/brand-positioning.md`, `docs/design/page-patterns.md`
- Previous text (Indonesian): localise every Indonesian text including meta, WhatsApp templates and emails; localisation means adapted for English readers, not word by word. Acceptance: every Indonesian text has an English equivalent, reviewed by a fluent speaker. Replaced by from-scratch English copy; the review criterion is kept
```

### CPR-22 · [Design] Hi-fi key screens for approval (optional Figma)

- **Action:** UPDATE (title changed from "Desain UI high-fidelity")
- **Milestone:** M1
- **Assignee:** Faishal
- **Priority:** keep current
- **Blocked by:** CPR-18
- **Blocks:** none
- **Relation changes (Blocked by):** remove CPR-20
- **Labels:** none

```markdown
**Context**
Hi-fi design for every page is no longer needed: the design system in `docs/design/` and the page patterns define the pages, and the UI is built code-first (Q5). What the Founder still needs is a visual check on the most important screens before the full build, in the light theme only. The screens can be Figma frames or reviewable pages built from the shared components, whichever is faster. `docs/design/page-patterns.md` sections 2.1, 2.2 and 2.8.

**Scope**
- Three key screens, mobile (360 px) and desktop (1440 px): Home, Product (AI Agents) and Contact.
- Light theme only, using the tokens and components of the design system.
- Interactive states on those screens: hover, focus, disabled, loading, error (contact form).
- Floating WhatsApp button and the sticky CTA bar (mobile) visible on the screens.
- Optional Figma: if used, link the file; if not, link the preview pages or screenshots.

**Out of scope**
- Other pages (built from page patterns). Dark mode and the theme toggle (removed). Admin UI design (the admin uses the shared admin kit, see CPR-26).
- Wireframes (CPR-20, canceled).

**Acceptance criteria**
- [ ] Home, Product and Contact exist for mobile and desktop in light theme, with the states above
- [ ] Focus states are clearly visible and colour contrast meets AA
- [ ] Approved by the Founder (approval recorded on this ticket)
- [ ] Feedback from the review is written back into `docs/design/` where it changes a rule

**Gotchas**
- Do not include text that is not final copy from CPR-21; use real draft copy so the review is not about lorem ipsum.
- Sino shown on the screens must match the available renders (NEW-sino-renders) or be clearly marked placeholder.

**References**
- `docs/design/page-patterns.md`, `docs/design/components.md`, `docs/design/tokens.md`; PRD FR-GLB-05 (now light only)
- Previous text (Indonesian): final designs for all public pages mobile and desktop in light and dark; interactive states; floating WhatsApp; theme toggle in header and mobile menu; "Internal demo project" label; Rev. 2 addition: admin UI design from the CPR-20 wireframes. Acceptance: all pages and states in both themes, focus and AA, Founder approval. Reduced to three key screens in light only
```


### 4.3 M2: admin and foundations

### CPR-23 · [Admin] Manage media and upload to SeaweedFS

- **Action:** UPDATE (title changed from "...upload ke R2")
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** keep current
- **Blocked by:** CPR-24, CPR-7, NEW-seaweedfs, NEW-cms-shell
- **Blocks:** CPR-27, CPR-28, CPR-29, CPR-31, NEW-cms-pages
- **Relation changes (Blocked by):** add NEW-seaweedfs, NEW-cms-shell; remove CPR-9
- **Labels:** none

```markdown
**Context**
Media is managed in the custom admin. Binary files live in SeaweedFS (S3-compatible, self-hosted on the VPS, behind the Cloudflare CDN); metadata and alt text live in PostgreSQL. No CMS collection or adapter. Rev. 3 replaces Cloudflare R2 with SeaweedFS and requires a swappable storage interface. PRD Rev. 3 media section (9.1, 14.1); `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.5; `docs/design/admin-ui.md` sections 4.5 and 5 (media library); `docs/superpowers/plans/2026-10-15-website-redesign.md` section 3.

**Scope**
- Schema Media with `media_translation` for alt text and caption per locale (only `en` is filled at launch); fields: file reference, alt (required per enabled locale), caption, focal point, credit, width, height, dominant colour, content hash.
- `MediaStore` interface (put, get, head, delete, presigned URL) with two implementations: the S3 implementation (AWS SDK v3 S3 client, custom endpoint, path-style addressing, credentials from server environment only) and an in-memory fake for unit tests.
- S3 operations the adapter uses and the integration test must cover: PutObject, GetObject, HeadObject, DeleteObject, ListObjectsV2, presigned GET and PUT, and multipart upload for files above 5 MB.
- Buckets (from NEW-seaweedfs): published assets live in `media-public` and are served through the CDN host; draft-only uploads live in `media-private` and are shown with signed URLs for preview; an upload is copied to the public bucket when it is first used by published content. Environment prefix keeps preview and production objects apart (see CPR-11).
- Allowed types: JPEG, PNG, WebP, AVIF, SVG (sanitised on the server, or rejected if sanitising is not implemented), MP4 and WebM up to 20 MB, PDF up to 10 MB. Maximum image 10 MB and 6000 px on the longest side.
- On upload: content-type sniffing (not the file extension), random object key containing the content hash, EXIF stripped, width, height and dominant colour stored.
- Delivery: `next/image` with a custom loader or remote pattern for the CDN host; responsive sizes from Next's image optimiser, no pre-generated variants in v1.
- Admin media library (grid, search, filter by type, usage count "used in N places", details drawer, replace file keeping the same media ID, delete blocked while in use) and the image dropzone and image field of `admin-ui.md` section 4.5 (states, focal point picker, alt per locale). Built on the admin kit (NEW-cms-shell).
- Upload action checks session and Admin or Editor permission, file type and size, and metadata input.
- Alt text is required per enabled locale before the media can be used on a published document.
- Public queries expose only safe metadata (public URL, alt, dimensions, dominant colour), never bucket names, keys or internal paths; DTO and fixture per NEW-cms-contract.

**Out of scope**
- Deploying SeaweedFS and creating buckets and keys (NEW-seaweedfs). The rich text editor (NEW-cms-shell, CPR-31).

**Acceptance criteria**
- [ ] TDD: failing tests first for the `MediaStore` contract and the upload validation
- [ ] Admin and Editor can upload, choose an image and edit its alt text; the object exists in SeaweedFS and renders on the website through the media host
- [ ] Anonymous or unauthorised uploads, invalid files (wrong signature, type or size), and a missing alt text are rejected on the server
- [ ] A file with a faked extension or content type (for example an HTML file named `.png`) is rejected by content sniffing; a photo loses its EXIF location data
- [ ] Storage credentials never reach the client (a check over the production client bundle finds no key or secret names); preview and production prefixes are separate
- [ ] Integration test against a SeaweedFS container (the Compose service from NEW-seaweedfs) passes for every S3 operation listed above, including multipart
- [ ] Deleting media that is in use is blocked and shows where it is used; replacing a file keeps the media ID
- [ ] Media cannot be attached to a published document while an enabled locale lacks alt text
- [ ] Alt text and captions are checked with the shared copy validator (no em dash or en dash)

**Gotchas**
- SeaweedFS is S3-compatible, not full S3: presigned URLs, multipart and error codes must be verified by the integration test rather than assumed.
- Path-style is mandatory (`forcePathStyle`); virtual-host style fails without wildcard DNS.
- Do not accept SVG without sanitising (script injection).
- Cloudflare limits request body size by plan; large uploads may need a direct presigned upload (verify the limit).
- The "copy to the public bucket on first publish" step must be idempotent and must not leave a published document pointing at a private object.

**References**
- PRD Rev. 3 section 9.1, FR-ADM-05, FR-ADM-06; NEW-seaweedfs; `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.5
- Previous text (Indonesian): Media schema with alt text ID and EN, list and picker, upload and edit form; S3-compatible R2 storage adapter with environment prefix and server-side credentials; upload checks session, Admin or Editor permission, file type and size, metadata; responsive images; public query only safe metadata. Acceptance criteria are carried over above with R2 replaced by SeaweedFS and ID/EN replaced by locale-ready English
```

### CPR-26 · [Layout] Base components from the design system

- **Action:** UPDATE (re-scoped)
- **Milestone:** M2
- **Assignee:** Faishal (proposed reassignment from Farhan; needs confirmation). Farhan currently holds this ticket (In Progress) with an unpushed local spec commit `baff2e0`, so agree the handoff before starting
- **Priority:** keep current
- **Blocked by:** CPR-18, CPR-7
- **Blocks:** CPR-32, NEW-cms-shell, NEW-motion-foundation, NEW-section-blocks
- **Labels:** none

```markdown
**Context**
Every public page is built from the same base components. Rev. 3 provides the design system in `docs/design/`, so this ticket re-scopes from "invent a design system" to "implement `docs/design/tokens.md` and `docs/design/components.md`". Light theme only. The earlier local spec (`docs/superpowers/specs/2026-10-15-cpr-26-ui-foundations-design.md`, commit `baff2e0`, never pushed) chose Manrope and action colour `#077A7E`. The tokens supersede it: Plus Jakarta Sans plus Geist Mono, and action colour `--teal-700 #00686D` (6.56:1 with white). Both pass AA; the decision is recorded in CPR-18. Coordinate before building so two kits do not exist.

**Scope**
- Tokens in `src/app/globals.css` as CSS variables, mapped to Tailwind v4 `@theme`, in two layers: primitive (`--teal-*`, `--ink-*`, ...) and semantic (`--color-canvas`, `--color-text`, `--color-action-primary`, ...), plus gradients, spacing, radius, elevation, surface effects and the motion easing and duration variables from `docs/design/motion.md` section 2.
- Fonts: Plus Jakarta Sans (variable) and Geist Mono through `next/font/google` (self-hosted at build), subsets `latin` and `latin-ext`, `display: swap`, 120 KB total or less.
- Components per `docs/design/components.md`: Button (variants primary, dark, secondary, ghost, link, whatsapp; sizes sm, md, lg, xl; loading and disabled states), Link, Input, Select (native), Textarea, Checkbox, Card (variants base, path, task, feature, work, post, stat, step), Badge (incl. "coming soon"), Chip (filter), Eyebrow, Container, Section (tones), SectionHeader, Split.
- Test setup: Vitest with jsdom and Testing Library for components.
- Optional dev gallery of the components (the local spec used `/admin/ui`, returning 404 in production); keep it only if it still fits.

**Out of scope**
- Accordion, tabs, hero and other section blocks (NEW-section-blocks). Navbar and footer (CPR-32). Dark mode. Admin components such as tables, dialogs, locale tabs and the rich text editor (NEW-cms-shell, which builds on the primitives from this ticket).

**Acceptance criteria**
- [ ] TDD: failing tests first for each component and for the token checks below
- [ ] A unit test reads the token table and fails when a semantic token differs from `docs/design/tokens.md`, and verifies that each text/background pair listed as passing in section 1.3 meets the stated WCAG ratio
- [ ] No hardcoded colour in components: a test or lint rule finds no hex or `rgb()` value under the component source
- [ ] Form components have a label, a visible error state (`aria-invalid`, `aria-describedby`) and a visible focus state (2 px `--color-focus` ring, 2 px offset)
- [ ] All interactive components work with the keyboard and have a touch target of at least 44 by 44 px
- [ ] Fonts load through `next/font` without layout shift and within the 120 KB budget
- [ ] No dark theme code or `.dark` variants exist (light only); the old "works in light and dark" criterion is removed
- [ ] Unit, lint, typecheck and build pass

**Gotchas**
- `--teal-500 #00949B` is only 3.68:1 on white; it never carries body text, links or white button labels.
- `--color-text-brand` and links use `--teal-700`.
- Components take text from props (messages or DB), never hardcoded strings.
- The local commit `baff2e0` is not on the remote: ask Farhan to push it or share it before work starts, and decide what to salvage (jsdom and Testing Library setup, gallery idea).
- Hover and press transitions need the motion tokens; they are part of this ticket so NEW-motion-foundation can build on them.

**References**
- `docs/design/tokens.md`, `docs/design/components.md`, `docs/design/accessibility-performance.md` section 1
- Previous text and acceptance criteria (Indonesian): tokens in Tailwind with theme-switching CSS variables, typography, spacing; Button, Link, Input, Select, Textarea, Checkbox, Card, Badge, Container, Section; optimised web fonts; no hardcoded colours; form labels, errors and focus; keyboard operable; both themes (dropped). The Rev. 2 addition for admin components (table, pagination, filter, confirmation dialog, language tabs, upload and media picker, save and error states) moved to NEW-cms-shell
```

### CPR-27 · [Admin] Manage services content

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** keep current
- **Blocked by:** CPR-24, CPR-23, NEW-cms-contract
- **Blocks:** CPR-30, CPR-33, CPR-54
- **Relation changes (Blocked by):** add NEW-cms-contract
- **Labels:** none

```markdown
**Context**
Services are edited from the custom admin without redeploying. Rev. 3 changes the offer: Web Development is no longer a standalone service. The seed is three services (names proposed, pending Q10): **AI Discovery**, **AI Build**, **AI Enablement**. Content is English only at launch but stored per locale so a second locale needs no schema change. PRD Rev. 3 sections 9.1, 9.4, FR-SVC-02; `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.3; `docs/design/brand-positioning.md` section 3.2; `docs/design/page-patterns.md` sections 2.3 and 2.4.

**Scope**
- Schema Services with translations per `(entity_id, locale)`, stable ID, slug unique per locale (database constraint). Fields (CMS plan section 2.3): slug, title, short summary, icon (choice), pose (choice over the code-defined list of Sino poses), problems solved (list of title and body, 3 to 4), deliverables (list), process (list, defaults to the Home "how we work" steps), tools (tags, not localised), FAQ (see the gotcha), CTA label, order, SEO (through the SEO panel of NEW-cms-seo). Add **who it is for**: the Services list cards need it (`page-patterns.md` section 2.3) and it is not in the PRD or CMS plan field list; add it to the PRD.
- Publish and unpublish, and drag ordering (admin kit from NEW-cms-shell). Admin list and add/edit form, locale tabs (not shown while only `en` is enabled), array editors.
- Public read function with explicit locale and safe projection; DTO and fixture per NEW-cms-contract.
- Server actions allowed for Admin and Editor, with server validation, field errors and save state.
- English seed for the three services (from the CPR-21 copy), loaded by a repeatable seed step, not by startup.
- Public copy fields are checked with the shared copy validator (no em dash or en dash).

**Out of scope**
- Service pages (CPR-37). Cache invalidation (CPR-33).

**Acceptance criteria**
- [ ] TDD: failing tests first for validation, permission and constraint behaviour
- [ ] All fields can be edited in the English locale and are returned by the public query without cross-locale fallback
- [ ] A duplicate slug in the same locale is rejected by the database constraint, including concurrent requests
- [ ] Admin and Editor can manage, publish, unpublish and reorder services; anonymous requests cannot write; the public query returns only published services in the stored order
- [ ] Schema, query and action, form UI and validation and permission tests are all in this ticket
- [ ] The seed creates exactly three English services with slugs `ai-discovery`, `ai-build`, `ai-enablement` and is safe to run twice
- [ ] A translation row for a second locale can be added in a test fixture without a schema change
- [ ] Saving a field containing an em dash or en dash is rejected with a field error

**Gotchas**
- Slugs and names depend on Q10. Keep them in seed data only, never hardcoded in components, so a rename is a data change.
- Do not recreate "Web Development" as a service; web delivery is described inside AI Build.
- The admin UI language stays Indonesian (FR-ADM-05) while the stored content is English.
- The CMS plan lists both a "FAQ (list)" field on each service and the `service:<slug>` tag in the shared FAQ library (NEW-cms-faq). Use one source (recommendation: the library) so the form does not duplicate it, and decide before building.
- Pose and icon values are keys of a code-defined list, never free uploads.

**References**
- PRD Rev. 3 sections 9.1, 9.4, FR-SVC-02, FR-ADM-05
- Previous text (Indonesian): two services (Web Development and AI & Automation) edited without redeploy; schema with ID/EN translations, stable ID, per-locale unique slug; list and form with language picker, arrays, SEO; explicit-locale public query; Admin/Editor actions; server validation. Acceptance criteria carried over above, with ID/EN replaced by locale-ready English
```

### CPR-29 · [Admin] Manage site settings

- **Action:** UPDATE (re-scoped to site settings only; page content moved to NEW-cms-pages; title changed from "...pengaturan situs & konten halaman")
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** keep current
- **Blocked by:** CPR-23, CPR-24, NEW-cms-contract
- **Blocks:** CPR-33, CPR-54
- **Relation changes (Blocked by):** add NEW-cms-contract
- **Labels:** none

```markdown
**Context**
Site-wide settings stay editable from `/admin` without a redeploy. The previous scope of this ticket also covered page content; the CMS plan moved that to NEW-cms-pages, so this ticket is the site settings singleton only. Rev. 3 changes the WhatsApp contexts, adds feature toggles and removes the old page set. `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.1; PRD Rev. 3 section 9.2, FR-LEAD-03, FR-ADM-05; `docs/design/admin-ui.md` section 5 (Settings: Situs).

**Scope**
Singleton `site_settings` plus `site_settings_translation`, edited in groups on the admin kit (NEW-cms-shell):
- **Brand:** site name (default "Sineva"), default OG image (media), organisation logo for structured data (media). Also store the product name (working name "Sineva AI Agents", Q9) so a rename is one change; this field is not in the CMS plan list, add it there.
- **Contact:** public email, WhatsApp number (E.164), business hours (text per locale), address (optional), legal entity data (optional). Optional fields are not rendered while empty (FR-GLB-03).
- **WhatsApp templates:** one message per context and locale: general, one per service (listed automatically from the Services data), product, thank-you. A preview of the final `wa.me` link. Placeholders (for example `{service}`) form a contract with CPR-45; document and test the supported ones.
- **Social:** Instagram, LinkedIn, TikTok, YouTube, X URLs (optional); only filled ones render.
- **Lead routing:** lead inbox email address(es), waitlist notification on or off.
- **Feature toggles:** show the team section, show "Selected work" on Home, enable the logo intro, enable the realtime Sino mascot, enable the sticky CTA bar. These let the team switch off heavy features without a deploy if performance regresses.
- **Analytics:** Umami website ID and an enable flag (public values, not secrets).
- **Verification:** Google Search Console verification token.
- Public read function with DTO and fixture per NEW-cms-contract; Admin and Editor actions with server validation; integration secrets stay in environment variables.
- Public copy fields use the shared copy validator.

**Out of scope**
- Page content (NEW-cms-pages). Email provider settings and templates (NEW-cms-email). SEO global settings (NEW-cms-seo). Product capabilities (NEW-cms-product).

**Acceptance criteria**
- [ ] TDD: failing tests first for validation, permission and the E.164 parser
- [ ] Every field above is on the admin form and returned by the settings query
- [ ] The WhatsApp number is validated as E.164 (unit tests for valid, missing plus, letters, too short, too long); templates support the documented placeholders with unit tests
- [ ] Optional fields (address, legal data, social links) are returned as `null` when empty and are not rendered
- [ ] Each feature toggle changes the corresponding DTO flag and the landing page honours it (checked in the landing tickets that use it)
- [ ] Anonymous actions are rejected; the groups an Editor may change are enforced on the server (see the gotcha)
- [ ] Settings are stored per locale where marked (hours, templates) with no cross-locale fallback; a second locale needs no schema change
- [ ] Schema, query, action, UI and tests are in this ticket; no CMS global or plugin is used
- [ ] Saving text with an em dash or en dash is rejected

**Gotchas**
- The CMS plan says Editors cannot manage settings secrets, email settings and similar; site settings contain no secrets, but lead routing, analytics ID and verification token are operational. Recommendation: Editors edit Contact, WhatsApp templates and Social; Admin only for Brand, Lead routing, Feature toggles, Analytics and Verification. Confirm with the product owner.
- `wa.me` needs digits only; settings store E.164 with a plus. The builder (CPR-45) strips the plus.
- The Rev. 2 settings list had one chatbot context and two services; make sure none of the old fields remain.
- Product name, service names and capabilities are open (Q9, Q10, Q11): store them as data, never in code.

**References**
- `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.1; PRD Rev. 3 section 9.2, FR-LEAD-02, FR-LEAD-03
- Previous text (Indonesian): site settings per PRD 9.2 (WhatsApp number and templates per context and language, lead inbox, public email, hours, address and legal, social, default SEO and OG, team toggle) and page content for Home, About, Contact and thank-you, Chatbot product page, Privacy (ID/EN) with per-page admin forms; schema, translations, public queries; Admin/Editor actions; secrets in environment. The page content part moved to NEW-cms-pages
```

### CPR-30 · [Admin] Manage work (portfolio) with draft, publish and preview

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** keep current
- **Blocked by:** CPR-27, NEW-cms-contract
- **Blocks:** CPR-33, CPR-55
- **Relation changes (Blocked by):** add NEW-cms-contract
- **Labels:** none

```markdown
**Context**
Showcase and client projects are managed in the custom admin; the public site shows only the published snapshot. Rev. 3 names this area **Work** in the UI and routes (`/work`, `/work/[slug]`); the data entity stays `Portfolio`. PRD Rev. 3 sections 9.1, 9.4, FR-PF-03, FR-ADM-02; `docs/design/page-patterns.md` section 2.5.

**Scope**
- Schema Portfolio with translations per locale; fields (PRD 9.1): title, slug, project type (Internal showcase or Client project), summary, challenge, solution, result, technology, cover, gallery, demo URL, related service, featured flag, SEO (SEO panel from NEW-cms-seo).
- Draft kept separate from the published snapshot per locale; publish and unpublish; authorised preview.
- Public query returns only published snapshots. Preview is `noindex` and never enters the public cache.
- Slug and field validation; publish runs in a transaction. Cache invalidation is done by CPR-33; a slug change creates a redirect (NEW-cms-seo).
- Forms use the admin kit (NEW-cms-shell); the public read function, DTO and fixture follow NEW-cms-contract.
- Public copy fields use the shared copy validator.

**Out of scope**
- The Work pages (CPR-38) and Home featured block (CPR-43).

**Acceptance criteria**
- [ ] TDD: failing tests first for draft, publish and permission behaviour
- [ ] All fields and translations have forms; project type is required; internal showcase items are clearly labelled in the data so the page can show "Internal demo project" (FR-PF-03)
- [ ] Saving a draft does not change the public snapshot; an anonymous preview request is rejected
- [ ] Publish and unpublish work in a transaction; the slug is unique per locale
- [ ] Permission tests and a "draft does not leak" test pass (public query, sitemap data, preview URL without a session)
- [ ] UI, queries and actions are all in this ticket

**Gotchas**
- Results text must not contain invented metrics. Add helper text to the form: "Only real, verified results" (`docs/design/copywriting.md` rule 2).
- Keep the `Portfolio` entity name in code and database; only UI strings and URLs say "Work".

**References**
- PRD Rev. 3 sections 9.1, 9.4, FR-PF-03, FR-ADM-02, FR-ADM-05
- Previous text (Indonesian): Portfolio schema with ID/EN translations, project type, featured, relations to Services and Media; list and edit form, draft separate from published snapshot per locale, publish and unpublish, authorised preview; public query only published snapshots; preview noindex and uncached; slug and field validation, publish transaction. Acceptance criteria carried over above
```

### 4.4 M2: layout

### CPR-32 · [Layout] Header, mobile menu and footer

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Priority:** keep current
- **Blocked by:** CPR-26, NEW-motion-foundation, NEW-i18n-en, NEW-cms-contract
- **Blocks:** CPR-34, CPR-35, CPR-36, CPR-37, CPR-38, CPR-39, CPR-40, CPR-41, CPR-42, CPR-45, CPR-56, NEW-logo-intro
- **Relation changes (Blocked by):** add NEW-motion-foundation, NEW-i18n-en, NEW-cms-contract; remove CPR-22, CPR-29
- **Labels:** none

```markdown
**Context**
The header and footer appear on every public page. Rev. 3 replaces the Rev. 2 layout (language and theme toggles) with the Sintra-inspired navbar and footer from the design system. `docs/design/components.md` sections 2, 3 and 12; `docs/design/motion.md` section 5 and section 4.5. PRD Rev. 3 FR-GLB-01 to FR-GLB-03.

**Scope**
- **Navbar (desktop 1024 px and up):** horizontal logo lockup (symbol plus wordmark; until the export from CPR-18 exists, symbol plus "Sineva" set in Plus Jakarta Sans), links Product, Services, Work, Blog, About, ghost button "Chat on WhatsApp", dark CTA "Book a consultation". Height 72 px.
- **Behaviour (motion.md section 5):** transparent at the top; background `--surface-nav` plus blur after 8 px of scroll; hides when scrolling down more than 8 px, shows immediately when scrolling up; never hides while a dropdown or the mobile menu is open or while focus is inside the header.
- **Dropdowns (Product, Services):** one shared panel that morphs between triggers; opens on hover with an 80 ms intent delay and on click or Enter; closes on Escape, outside click or focus leaving; sibling links dim to 60% while hovering; chevron rotates. Product panel: capability group items plus a "Join the waitlist" promo card. Services panel: AI Discovery, AI Build, AI Enablement plus "See all services". Item content comes from `messages/en.json` in v1.
- **Mobile (under 1024 px):** logo plus burger (44 px); full-screen sheet with a clip-path wipe, accordions for sections, fixed bottom action bar with the primary CTA and WhatsApp; body scroll locked, focus trapped, Escape closes.
- **No theme toggle. The language switcher slot exists but is hidden while only one locale is enabled.**
- **Footer:** columns Product, Services, Company (About, Work, Blog, Contact), Legal (Privacy policy), contact and social data from the site settings (CPR-29, fixture first); symbol logo; social icons only for accounts that exist; `© 2026 Sineva`; address and legal lines hidden while empty in Site Settings; decorative large wordmark watermark (`aria-hidden`).
- **Floating WhatsApp button** (components.md section 12): presentation only (56 px circle on mobile, pill with label on desktop that collapses to the icon after first scroll, sits above the sticky CTA bar when that bar is visible). The context-aware link comes from CPR-45.
- Layout contract with `StickyCtaBar` from NEW-section-blocks (stacking and spacing).
- Skip-to-content link, `aria-current` on the active link.

**Out of scope**
- WhatsApp link building and contexts (CPR-45). Logo intro (NEW-logo-intro). Language switcher behaviour (CPR-34, deferred).

**Acceptance criteria**
- [ ] TDD: failing tests first. Unit test for the scroll-direction logic (8 px thresholds, never hides when a dropdown is open or focus is inside); Testing Library tests for the navbar, mobile menu and footer
- [ ] Desktop and mobile layouts match `components.md` section 2 and the tokens
- [ ] Dropdowns work by keyboard (open with Enter or Space, arrow navigation, Escape closes and returns focus to the trigger) and by hover with the intent delay
- [ ] The mobile menu opens and closes by keyboard, focus stays inside while open, Escape closes, body scroll is locked
- [ ] The header is always visible while any element inside has keyboard focus
- [ ] The footer hides address and legal lines when empty (test with empty and filled settings)
- [ ] No theme toggle and no visible language switcher; the language slot renders nothing with one locale
- [ ] `prefers-reduced-motion`: no hide-on-scroll animation, dropdown opens without scale and morph, menu opens with a fade of 150 ms or less
- [ ] Touch targets 44 px or larger; axe reports no critical or serious issues
- [ ] Final wiring: once CPR-29 merges, the footer and navbar read the real site settings instead of the fixture

**Gotchas**
- iOS scroll lock and focus trap are easy to get wrong; test on a real device in CPR-59.
- Hover dropdowns do not exist on touch devices; click must work everywhere.
- Hiding the header on scroll can hide the focused element; the focus rule above is a hard requirement.
- The sticky header covers anchor targets; set `scroll-margin-top` on headings.
- Brand name is "Sineva", never the old two-word form.

**References**
- `docs/design/components.md` sections 2, 3, 12; `docs/design/motion.md` sections 4.5, 5; PRD FR-GLB-01, FR-GLB-02, FR-GLB-03
- Previous text and acceptance criteria (Indonesian): header with logo, navigation, slots for language and theme toggles and a "Konsultasi Gratis" CTA; mobile menu at 1024 px and below; footer from Site Settings with address and legal hidden while empty. Acceptance: matches UI design, mobile menu keyboard operable with focus kept inside, footer hides empty fields. All three are kept; the language and theme parts are removed
```

### CPR-34 · [I18n] Language switcher to the equivalent page

- **Action:** UPDATE (deferred; milestone removed)
- **Milestone:** none (post-launch backlog)
- **Assignee:** Faishal
- **Priority:** keep current (suggest Low)
- **Blocked by:** CPR-32, NEW-i18n-en
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-i18n-en; remove CPR-25
- **Labels:** none

```markdown
**DEFERRED.** English is the only locale at launch (PRD Rev. 3), so there is nothing to switch between. This ticket is kept for the day a second locale (Indonesian, `id`) is enabled. Do not schedule it before that decision.

**Context**
When a visitor changes language they should stay on the same page, not return to Home. CPR-25 prepared the route registry and the slug resolver contract; NEW-i18n-en keeps them i18n-ready. The header has a hidden slot for the switcher (CPR-32). PRD Rev. 3 FR-I18N-03.

**Scope** (unchanged from the original, applies when a second locale exists)
- Language switcher in the header and mobile menu that opens the equivalent page, including slugs of admin-managed documents resolved by entity ID.
- Selected language stored in a cookie.
- An article without a version in the target language sends the visitor to the blog list of that language.
- `lang_switch` analytics event (CPR-51) is enabled together with this ticket.

**Preconditions to re-open (checklist)**
- [ ] A decision to enable a second locale, with the translated content plan
- [ ] `id` added to routing as a data change (NEW-i18n-en proved it possible) and pathnames from `docs/design/page-patterns.md` section 1
- [ ] hreflang and sitemap alternates added in CPR-52 and CPR-57
- [ ] Copy and admin content translated (Indonesian source material: `docs/content/copy-id.md`, outdated positioning)

**Acceptance criteria** (original, unchanged)
- [ ] Switching language on a service, work and article page opens the same page in the other language
- [ ] A single-language article sends the visitor to the target language blog list
- [ ] The language choice is stored in a cookie
- [ ] TDD: failing tests first for the resolver mapping and the fallback rule

**Gotchas**
- Do not build the switcher UI now; a hidden slot is enough.
- Locale detection (cookie then Accept-Language) was removed by NEW-i18n-en; re-introducing it is part of enabling a second locale.

**References**
- PRD Rev. 3 FR-I18N-03; `docs/superpowers/plans/2026-10-15-cpr-25-i18n-routing.md`
- Founder confirmation 15 Oct 2026 (previous text): the switcher is provided later; CPR-25 only prepared the route registry and resolver contract
```


### 4.5 M2: pages

All page tickets are built from the shared kit (CPR-26) and section blocks (NEW-section-blocks), follow `docs/design/page-patterns.md`, take UI strings from `messages/en.json` and page content from the admin data (NEW-cms-pages, NEW-cms-product, NEW-cms-faq, CPR-27 to CPR-31) through the typed queries and fixtures of NEW-cms-contract, and must satisfy the per-page checklist in `docs/design/accessibility-performance.md` section 3. Assignee for all of them: Faishal. Priority: keep current.

### CPR-35 · [Layout] 404 and Privacy Policy pages

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-cms-contract
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-cms-contract; remove CPR-29
- **Labels:** none

```markdown
**Context**
Two supporting pages are required at launch. Rev. 3: English only, with the Sino mascot on the 404 page. `docs/design/page-patterns.md` section 2.9; PRD Rev. 3 FR-GLB-04 and FR-PRV-01.

**Scope**
- **404:** Sino pose S11 (scratching helmet), headline "Sino can't find this page.", short line to get back on track, links to Home, Services and Contact. Text comes from the 404 page content (NEW-cms-pages); use the fixture from NEW-cms-contract until it merges.
- **Privacy Policy:** rich text from the Privacy page content (NEW-cms-pages) plus the effective date; 720 px reading column; sticky table of contents on desktop (1024 px and up) built from the headings; "last updated" date shown.
- Sino stills use a placeholder until NEW-sino-renders delivers S11.

**Out of scope**
- Writing the policy text (CPR-17). The thank-you page (CPR-42).

**Acceptance criteria**
- [ ] TDD: failing tests first (HTTP test for the status code, component tests for the table of contents)
- [ ] An unknown URL returns the 404 page **with HTTP status 404**
- [ ] The 404 page links to Home, Services and Contact and uses `alt=""` for the decorative Sino image
- [ ] The Privacy Policy page renders the admin content and the effective date; the table of contents lists every heading and works by keyboard
- [ ] The privacy page has one H1 and no skipped heading levels
- [ ] No em dash or en dash in the page strings
- [ ] Final wiring: once NEW-cms-pages merges, both pages read the real public queries instead of the fixtures

**Gotchas**
- In the App Router a "not found" rendered after the response started streaming can come back with status 200. Assert the real status over HTTP, not only the rendered text (CPR-25 also saw a 404 shell quirk in Next.js 16.4).
- The table of contents needs stable heading IDs; duplicate headings must not collide.

**References**
- `docs/design/page-patterns.md` section 2.9; PRD FR-GLB-04, FR-PRV-01
- Previous text: 404 in two languages with links to Home, Services, Contact; Privacy Policy as rich text with effective date from the page content. Acceptance: unknown URL shows the 404 for the language with HTTP 404; privacy visible in both languages from the admin. Reduced to English only
```

### CPR-36 · [Home] Static Home sections

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-section-blocks, NEW-cms-contract
- **Blocks:** CPR-43, NEW-sino-hero
- **Relation changes (Blocked by):** add NEW-section-blocks, NEW-cms-contract; remove CPR-29
- **Labels:** none

```markdown
**Context**
The Home page shows both pillars at once: Product (use it yourself) and Services (let us build it with you). This ticket builds the static sections, whose text comes from the Home page content in the admin (NEW-cms-pages), with capabilities from NEW-cms-product and FAQ items from NEW-cms-faq, all through the typed queries and fixtures of NEW-cms-contract. Dynamic sections (selected work, latest articles) are CPR-43. `docs/design/page-patterns.md` section 2.1; `docs/design/brand-positioning.md` section 3.3; PRD Rev. 3 FR-HOME-*.

**Scope** (section order follows page-patterns 2.1)
1. **Hero** (aurora background): `HeroSplit` with text left and the Sino stage right. Eyebrow "AI consulting and AI agents", H1 (10 words or fewer), lead, two CTAs: **Book a free consultation** (to `/contact`, primary) and **Join the waitlist** (to the waitlist form on `/products/ai-agents`, secondary). The Sino slot renders the poster; the realtime canvas arrives with NEW-sino-hero.
2. **Two paths:** `TwoPaths` ("Use it yourself" to Product, "Let us build it with you" to Services), each with a Sino pose and CTA.
3. **Meet Sino:** centered header and a short intro of the AI agent. Ship it static first; the scroll-scrubbed scene is a later decision (Q1 sprite or GLB scrub).
4. **What Sino can do:** `TaskCardGrid` with 4 to 5 capabilities phrased as requests ("Sino, reply to today's customer chats"). Only capabilities confirmed by team CBT (Q11).
5. **How we work:** `StickySteps` with 4 steps: Talk, Plan, Build, Support.
6. **Who we help:** 3 cards: small businesses, growing companies, startups.
9. **FAQ:** `FaqSection`, 5 to 7 questions across product and services.
10. **Final CTA:** `FinalCta` with both CTAs plus WhatsApp.
- Sections 7 (selected work) and 8 (from the blog) are added by CPR-43.

**Out of scope**
- Realtime Sino (NEW-sino-hero). Dynamic sections (CPR-43). Waitlist form (CPR-48, on the Product page).

**Acceptance criteria**
- [ ] TDD: failing tests first (page renders each section from fixture content; CTA targets; heading structure)
- [ ] Layout matches the design on mobile and desktop and uses only tokens and shared blocks
- [ ] All page text comes from the admin content or `messages/en.json` (no hardcoded copy in components)
- [ ] Primary CTA goes to `/contact`; the secondary CTA goes to the waitlist form on the Product page
- [ ] One H1; the hero headline is 10 words or fewer; no section tone repeats on adjacent sections; only one inverse section (the final CTA)
- [ ] The hero poster is the LCP element and the hero has CLS 0
- [ ] Sections that depend on proof (stats, logos, testimonials) are not rendered; none are invented
- [ ] Optional sections hidden by the page content toggles are not rendered; the sticky CTA bar follows the site setting
- [ ] When the product status is `live` (NEW-cms-product) the secondary CTA switches from "Join the waitlist" to "Try" plus the product name, through the data, not a code edit
- [ ] Final wiring: once NEW-cms-pages, NEW-cms-product and NEW-cms-faq merge, the page reads the real queries instead of the fixtures

**Gotchas**
- "How we work" replaces the Rev. 2 four steps (Konsultasi, Proposal, Pengerjaan, Pendampingan); do not keep the old step names.
- The Rev. 2 "chatbot teaser with waitlist form" no longer exists on Home; page-patterns 2.1 has no inline waitlist form. Confirm with the product owner that Home links to the Product page instead.
- Product name, capabilities and service names are open (Q9, Q10, Q11): keep them in data.

**References**
- `docs/design/page-patterns.md` sections 2.1 and 3; `docs/design/copywriting.md` section 3; PRD FR-HOME-01, 02, 03, 05, 06, 08 (revised)
- Previous text (Indonesian): hero, who it is for, services, work process, closing CTA, chatbot teaser slot; acceptance: matches design on mobile and desktop, all text from the admin, main CTA to Contact and second CTA to Services. The second CTA now goes to the waitlist
```

### CPR-37 · [Services] Services list and detail pages

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-section-blocks, NEW-cms-contract
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-section-blocks, NEW-cms-contract; remove CPR-27
- **Labels:** none

```markdown
**Context**
The Services pages explain the three consulting services (AI Discovery, AI Build, AI Enablement) and lead to Contact. Names are proposed (Q10). `docs/design/page-patterns.md` sections 2.3 and 2.4; PRD Rev. 3 FR-SVC-01 to FR-SVC-04. Data comes from CPR-27 (services) and NEW-cms-faq (FAQ items tagged `services` and `service:<slug>`) through the typed queries and fixtures of NEW-cms-contract.

**Scope**
- **List `/services`:** hero (H1, lead, primary CTA, Sino S7); three large service cards with pose S7 to S9, "who it is for" and a CTA to the detail page; how we work (same 4-step sticky story as Home); who we help; selected work (hidden if none); FAQ; final CTA.
- **Detail `/services/[slug]`:** breadcrumb; hero (H1, lead, CTA **Plan my AI project** to `/contact?service={slug}`, pose); problems we solve (3 to 4 cards); what you get (deliverables with check icons); process (4 compact steps); tools we use (text chips, no logos); related work; FAQ with `FAQPage` JSON-LD enabled; final CTA; sticky CTA bar on mobile.
- Unknown slugs return 404.

**Out of scope**
- Service data and admin (CPR-27). JSON-LD validation across the site (CPR-57).

**Acceptance criteria**
- [ ] TDD: failing tests first (route handling, CTA parameter, 404 for unknown slug, section presence from fixture data)
- [ ] The detail page shows every section of FR-SVC-02 (problems, what you get, process, tools, FAQ, CTA)
- [ ] The CTA carries the correct `?service=` value (the service slug) and the contact form preselects it (checked together with CPR-47)
- [ ] An unknown slug shows the 404 page with status 404
- [ ] The FAQ block emits valid `FAQPage` JSON-LD
- [ ] The sticky CTA bar appears on mobile only and never covers the floating WhatsApp button
- [ ] Related work is hidden when there is none
- [ ] Final wiring: once CPR-27 and NEW-cms-faq merge, the pages read the real queries instead of the fixtures

**Gotchas**
- Web Development is not a service any more; do not create a page for it. Web delivery is part of AI Build.
- "Tools we use" are text chips only (no third-party logos or claims).
- Sino poses S7 to S9 are placeholders until NEW-sino-renders delivers them.

**References**
- `docs/design/page-patterns.md` sections 2.3, 2.4; PRD FR-SVC-01, FR-SVC-02, FR-SVC-03, FR-SVC-04
- Previous text (Indonesian): list and detail pages for two services; CTA to Contact with a service parameter (`?layanan=` in Indonesian, `?service=` in English); acceptance: detail shows all FR-SVC-02 sections, CTA carries the right parameter, unknown slug 404
```

### CPR-38 · [Portfolio] Work list and detail pages

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-section-blocks, NEW-cms-contract
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-section-blocks, NEW-cms-contract; remove CPR-30
- **Labels:** none

```markdown
**Context**
The Work section shows showcase and client projects. The UI calls it **Work** (`/work`, `/work/[slug]`); the data entity stays `Portfolio` (CPR-30). `docs/design/page-patterns.md` section 2.5; PRD FR-PF-01 to FR-PF-03.

**Scope**
- **List `/work`:** H1 and intro; `chip-filter` by service (All plus the three services); grid of `card-work`; the "Internal demo project" badge for internal showcase items (FR-PF-03); empty state with Sino and a CTA.
- **Detail `/work/[slug]`:** hero with the cover in a `media-frame`; summary and meta (service, project type, stack); challenge; solution; result (no invented metrics); gallery; demo link (new tab, `rel="noopener noreferrer"`); related service; CTA.
- Only published items appear. Filtering works without a full page reload and the filtered state is shareable by URL.
- Title, intro and empty-state text come from the Work index page content (NEW-cms-pages).

**Out of scope**
- Data model and admin (CPR-30). Home featured block (CPR-43).

**Acceptance criteria**
- [ ] TDD: failing tests first (filter logic, badge rule, published-only query usage)
- [ ] The filter works without a full reload, and the filtered result opens from a shared URL (for example `?service=<slug>`)
- [ ] Internal showcase items always show the label "Internal demo project" on cards and on the detail page
- [ ] Only published items are listed; an unpublished slug returns 404
- [ ] Empty state shows Sino S11 or S13 with a call to action when there are no items
- [ ] External demo links open in a new tab with `rel="noopener noreferrer"`
- [ ] No unverified metric appears in any template text
- [ ] Final wiring: once CPR-30 and NEW-cms-pages merge, the pages read the real queries instead of the fixtures

**Gotchas**
- A client-side filter that reads `useSearchParams` needs a Suspense boundary and `'use client'`; a server-rendered filter with `Link` navigation is simpler and indexable.
- Canonical for filtered list URLs points to the unfiltered list (decided in CPR-52).
- The Rev. 2 filter "Web / AI" is replaced by the three services.

**References**
- `docs/design/page-patterns.md` section 2.5; `docs/design/components.md` sections 4 and 5; PRD FR-PF-01, FR-PF-02, FR-PF-03
- Previous text (Indonesian): list grid with filter All / Web / AI; detail with summary, challenge, solution, result, technology, gallery, demo link in a new tab with `rel="noopener"`, related service, CTA; "Internal demo project" label for internal showcase. Acceptance criteria carried over above
```

### CPR-39 · [Product] AI Agents product page

- **Action:** UPDATE (title changed from "Halaman Produk Chatbot")
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-section-blocks, NEW-cms-contract
- **Blocks:** NEW-waitlist-form-ui
- **Relation changes (Blocked by):** add NEW-section-blocks, NEW-cms-contract; remove CPR-29
- **Labels:** none

```markdown
**Context**
The product is not launched yet, so the page is a "Coming soon" page that collects the waitlist. Rev. 3 turns the Rev. 2 chatbot page into the AI Agents product page (working name "Sineva AI Agents", Q9) with a richer structure. Capabilities may only be those confirmed by team CBT (Q11). `docs/design/page-patterns.md` section 2.2; `docs/design/brand-positioning.md` section 3.1; PRD FR-PRD-01.

**Scope** (page-patterns 2.2)
1. **Hero:** H1, lead, inline waitlist form on the left (form UI from CPR-48), phone mockup with a chat UI and Sino on the right, floating `ui-chip`s. "Coming soon" badge.
2. **Capabilities:** `TaskCardGrid`, one `card-task` per capability with a Sino pose (S2 to S6).
3. **How it works:** `StickySteps` (Connect your channels, Teach Sino your business, Let Sino handle the busywork, Review and approve; copy subject to CBT confirmation).
4. **Made for your business:** segmented control by business type (online shop, cafe and restaurant, local services) with an example day each. Builds the tabs component of `components.md` section 8.
5. **You stay in control:** 3 `card-feature` (privacy, approvals, human hand-off), only confirmed facts.
6. **Ways of working comparison** (optional): Doing it manually, Generic AI chat, Sineva AI Agents. Builds the comparison table of `components.md` section 9 only if the product owner keeps it.
7. **FAQ** (`FaqSection`).
8. **Final CTA:** waitlist plus "Need it customised? Book a consultation".
- All text from the Product page content (NEW-cms-pages), capabilities and business types from NEW-cms-product, FAQ items from NEW-cms-faq, in English. The CTAs follow the product status (`coming_soon` or `live`) from NEW-cms-product.

**Out of scope**
- The waitlist form behaviour and storage (CPR-48 for the server, NEW-waitlist-form-ui for the form). Product name decision.

**Acceptance criteria**
- [ ] TDD: failing tests first (sections render from fixture content; tabs keyboard behaviour; waitlist anchor)
- [ ] All content comes from the admin content, in English
- [ ] The "Coming soon" label is clearly visible near the hero
- [ ] The segmented control follows the ARIA tabs pattern (arrow keys, `aria-selected`, panels)
- [ ] The page has an anchor (for example `#waitlist`) that the Home CTA links to
- [ ] Every capability and mockup chat line corresponds to a confirmed capability (checklist signed off by CBT)
- [ ] The comparison table, if included, becomes stacked cards on mobile and uses no competitor names
- [ ] When the product status is `live`, the waitlist form and "Coming soon" label are replaced by the "Try" call to action through the data
- [ ] Final wiring: once NEW-cms-pages, NEW-cms-product and NEW-cms-faq merge, the page reads the real queries instead of the fixtures

**Gotchas**
- Do not claim channels (WhatsApp, Instagram), integrations or results before CBT confirms them.
- Mockup screens are HTML on top of a rendered device frame so text stays sharp and translatable; the phone frame render (P0) comes from NEW-sino-renders, use a placeholder until then.
- The product name is a working name: take it from the site setting (CPR-29), never hardcode it.
- At most one hero-size Sino per viewport; do not add a second realtime canvas on this page.

**References**
- `docs/design/page-patterns.md` section 2.2; `docs/design/components.md` sections 8, 9, 10; PRD FR-PRD-01
- Previous text (Indonesian): "Coming soon" page for the chatbot with core value, planned features, FAQ and a waitlist form slot; acceptance: all content from the admin in both languages and a clearly visible "Segera hadir" label. Both are kept in English
```

### CPR-40 · [Blog] Blog list page

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-cms-contract
- **Blocks:** CPR-44
- **Relation changes (Blocked by):** add NEW-cms-contract; remove CPR-31
- **Labels:** none

```markdown
**Context**
The blog list shows articles of the page locale with a category filter. English is the only locale at launch, but the query stays locale-aware so a second locale can be added later. `docs/design/page-patterns.md` section 2.6; PRD FR-BLOG-01, FR-BLOG-04, FR-I18N-05.

**Scope**
- Featured latest article as a wide split card (cover left; category, title, excerpt, date right).
- `chip-filter` row for categories; the filter uses the query parameter `?category=`.
- Grid of `card-post` (3 columns on desktop), 9 articles per page, pagination.
- The canonical URL of a filtered list points to the main list.
- Only articles published in the page locale are listed.
- Empty state (microcopy: "No articles yet. Check back soon, or talk to us today.") with a CTA; title, intro and empty-state text come from the Blog index page content (NEW-cms-pages).

**Out of scope**
- Article page (CPR-44). Blog data and admin (CPR-31). Canonical and sitemap plumbing details (CPR-52, CPR-57).

**Acceptance criteria**
- [ ] TDD: failing tests first (pagination maths, filter parsing, locale filter, canonical value)
- [ ] The category filter and pagination work (9 per page)
- [ ] An article that exists only in another locale is not listed (verified with a fixture article in a second locale)
- [ ] The canonical URL of a filtered list is the unfiltered list; an unknown `?category=` shows the empty or unfiltered state without an error
- [ ] The empty state renders when no articles exist
- [ ] Article cards show category, date and read time; titles clamp to 2 lines
- [ ] Final wiring: once CPR-31 and NEW-cms-pages merge, the page reads the real queries instead of the fixtures

**Gotchas**
- FR-BLOG-01 defines the canonical for filtered lists but not for paginated pages (`?page=2`). Decide with CPR-52 (recommendation: paginated pages are self-canonical).
- The Rev. 2 parameter `?kategori=` (Indonesian) no longer exists; use `?category=`.

**References**
- `docs/design/page-patterns.md` section 2.6; PRD FR-BLOG-01, FR-BLOG-04, FR-I18N-05
- Previous text (Indonesian): 9 per page with pagination, category filter `?kategori=` (ID) or `?category=` (EN), canonical of filtered pages to the main list, articles without the language version are hidden. Acceptance criteria carried over above
```

### CPR-41 · [About] About page

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-section-blocks, NEW-cms-contract
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-section-blocks, NEW-cms-contract; remove CPR-29, CPR-28
- **Labels:** none

```markdown
**Context**
The company profile page: who Sineva is, what it stands for, and the team. `docs/design/page-patterns.md` section 2.7; PRD FR-ABT-01 and FR-ABT-02.

**Scope**
- Hero with scene C3 (Sino with two people at a meeting table; use S13 or a placeholder until it exists).
- Company story, mission and values (cards), "Meet Sino" (what the mascot stands for), all from the About page content (NEW-cms-pages).
- Team section from Team data (CPR-28), shown or hidden by the toggle in Site Settings (CPR-29).
- Final CTA.

**Out of scope**
- Team data admin (CPR-28). Legal and address data in the footer (CPR-32).

**Acceptance criteria**
- [ ] TDD: failing tests first (team section visibility from the toggle, content rendering)
- [ ] The Team section disappears when its toggle is off in the admin
- [ ] All content comes from the admin content, in English
- [ ] Team photos come from Media with alt text; team members without a photo render a fallback
- [ ] No invented facts (founding year, headcount, awards, client numbers)
- [ ] Final wiring: once NEW-cms-pages, CPR-28 and CPR-29 merge, the page reads the real queries instead of the fixtures

**Gotchas**
- Scene C3 is P1 in the asset list; the page must work without it.
- Legal entity data is still empty; render nothing for empty fields.

**References**
- `docs/design/page-patterns.md` section 2.7; PRD FR-ABT-01, FR-ABT-02
- Previous text: company story, vision and mission, values, team from Team data with a toggle. Acceptance: team hidden when the toggle is off, all content from the admin in both languages (now English)
```

### CPR-42 · [Contact] Contact and thank-you pages

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-32, NEW-cms-contract
- **Blocks:** CPR-47
- **Relation changes (Blocked by):** add NEW-cms-contract; remove CPR-29
- **Labels:** none

```markdown
**Context**
The Contact page is the main conversion page. Rev. 3 uses the "book a demo" layout: reassurance on the left, form card on the right. The form itself is built in CPR-47; this ticket builds the page layout and the thank-you page. `docs/design/page-patterns.md` sections 2.8 and 2.9; PRD FR-CTC-01, FR-CTC-02, FR-SEO-03.

**Scope**
- **Contact `/contact`:** page background `--color-canvas-alt`; centered meta chips (for example "Free consultation · No obligation"), H1, lead; two columns: left three `card-step` items (Tell us your goal; We reply with next steps; We plan it together), the WhatsApp alternative, email, opening hours and, only if filled, the address; right the form card slot (CPR-47).
- Contact content (meta chips, headline, lead, three steps, form intro) comes from NEW-cms-pages; opening hours, public email and address come from the site settings (CPR-29).
- **Thank-you `/contact/thank-you`:** Sino S10 plus check animation (Lottie L3, static fallback), what happens next, WhatsApp button for a faster reply (context "thank-you"), links to Blog and Product; `noindex`.

**Out of scope**
- The form and its states (CPR-47). WhatsApp link building (CPR-45).

**Acceptance criteria**
- [ ] TDD: failing tests first (address hidden when empty, noindex metadata, slot rendering)
- [ ] Layout matches the design on mobile and desktop
- [ ] The address appears only when filled in the admin
- [ ] The thank-you page has `noindex` and is excluded from the sitemap data
- [ ] The WhatsApp button on the thank-you page uses the thank-you context template
- [ ] Meta chips and copy contain no promise that is not approved (no response time unless the Founder approves an SLA)
- [ ] Final wiring: once NEW-cms-pages and CPR-29 merge, the pages read the real queries instead of the fixtures

**Gotchas**
- `docs/design/copywriting.md` section 5 allows a time figure ("within one business day") only if the Founder approves it.
- The chip "15 min call" appears in the component spec as an example only; do not use it unless a call is really offered.

**References**
- `docs/design/page-patterns.md` sections 2.8, 2.9; PRD FR-CTC-01, FR-CTC-02, FR-SEO-03
- Previous text and acceptance criteria (Indonesian): contact page with form slot, WhatsApp, email, opening hours, address if filled; thank-you with WhatsApp button and `noindex`; layout matches design, address only if filled, thank-you `noindex`. All kept
```

### CPR-43 · [Home] Dynamic Home sections (work and articles)

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-36, NEW-cms-contract
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-cms-contract; remove CPR-30, CPR-31
- **Labels:** none

```markdown
**Context**
Two Home sections depend on data: Selected work (section 7) and From the blog (section 8). Both are hidden while there is no data. `docs/design/page-patterns.md` section 2.1; PRD FR-HOME-04, FR-HOME-07.

**Scope**
- **Selected work:** up to 3 featured, published Work items as `card-work`.
- **From the blog:** the 3 latest articles in the page locale as `card-post`.
- Each section is hidden when it has no items.
- Insert both sections into the Home composition from CPR-36 at positions 7 and 8.

**Out of scope**
- Work and Blog data and admin (CPR-30, CPR-31). List pages (CPR-38, CPR-40).

**Acceptance criteria**
- [ ] TDD: failing tests first (selection, ordering, hidden when empty)
- [ ] Only featured and published items are shown, maximum 3
- [ ] The latest articles come only from the page locale
- [ ] A section is not rendered at all (no empty heading) when it has no data
- [ ] Adjacent section tones are recomputed after hiding, so two neighbours never share the same non-white tone
- [ ] The "Selected work" section also respects its toggle in the page content and in the site settings
- [ ] Final wiring: once CPR-30 and CPR-31 merge, the sections read the real queries instead of the fixtures

**Gotchas**
- Hiding a section changes which sections are adjacent. The tone helper from NEW-section-blocks must run after the visible list is known.
- Showcase cards always show the "Internal demo project" badge (FR-PF-03), also on Home.

**References**
- `docs/design/page-patterns.md` section 2.1 (sections 7 and 8); PRD FR-HOME-04, FR-HOME-07
- Previous text and acceptance criteria (Indonesian): featured work maximum 3, latest 3 articles in the page language, sections hidden when empty. All kept
```

### CPR-44 · [Blog] Article page

- **Action:** UPDATE
- **Milestone:** M2
- **Assignee:** Faishal
- **Blocked by:** CPR-40
- **Blocks:** none
- **Labels:** none

```markdown
**Context**
The reading page for one article. Rev. 3 adds a sticky table of contents and the animated copy-link feedback from the design system. `docs/design/page-patterns.md` section 2.6; PRD FR-BLOG-02, FR-BLOG-03.

**Scope**
- Breadcrumb; H1 on the left and cover on the right on desktop; author, published and updated dates, estimated read time.
- Body in a 720 px column rendered from structured rich text (headings, lists, links, images, quotes, code blocks).
- **Sticky table of contents** in a left column on desktop (1024 px and up), built from the headings, with the active heading highlighted.
- Share buttons: WhatsApp, LinkedIn, copy link (with the `check-pop` Lottie L3 and a "Link copied" tooltip; static icon swap if L3 is missing).
- 3 related articles from the same category (never the article itself).
- Final CTA.

**Out of scope**
- BlogPosting JSON-LD (CPR-57). Editor and renderer data model (CPR-31).

**Acceptance criteria**
- [ ] TDD: failing tests first
- [ ] Every rich text element (heading, list, link, image, quote, code) renders as designed and unsafe content is not rendered
- [ ] Read time is computed automatically and has unit tests (document the formula, for example 200 words per minute rounded up, minimum 1 minute)
- [ ] The related list never includes the article itself and holds at most 3 articles of the same category
- [ ] The table of contents lists the headings, works by keyboard and appears only on desktop
- [ ] The copy-link button works with the clipboard API and shows feedback; share links use correct encoding
- [ ] Reduced motion: no animated check, static state change only
- [ ] Final wiring: once CPR-31 merges, the page reads the real posts query instead of the fixture

**Gotchas**
- Clipboard API needs a secure context; provide a fallback message when it fails.
- Heading IDs must be stable and unique, or the table of contents breaks on duplicate headings.
- Code blocks and images in a 720 px column need overflow handling on 360 px screens.

**References**
- `docs/design/page-patterns.md` section 2.6; `docs/design/motion.md` section 6 (copy-link); PRD FR-BLOG-02, FR-BLOG-03
- Previous text (Indonesian): title, cover, author, date, estimated read time, rich text, share buttons (WhatsApp, LinkedIn, copy link), 3 related articles from the same category. Acceptance: rich text elements as designed, read time computed with unit test, related list excludes the article. All kept
```


### 4.6 M3: lead and integrations

### CPR-45 · [Lead] Contextual WhatsApp buttons

- **Action:** UPDATE
- **Milestone:** M3
- **Assignee:** Faishal. Spans frontend and settings; kept whole because the admin-editable number and templates already live in CPR-29 (Farhan). No split needed
- **Priority:** keep current
- **Blocked by:** CPR-32, NEW-cms-contract
- **Blocks:** CPR-51
- **Relation changes (Blocked by):** add NEW-cms-contract; remove CPR-29
- **Labels:** none

```markdown
**Context**
WhatsApp is the main contact channel. Every WhatsApp button opens a chat with a message prefilled for the page the visitor came from. Rev. 3: English templates, contexts for the three services and the AI Agents product. The number and templates are edited in Site Settings (CPR-29); this ticket builds the link utility and the buttons. The floating button's presentation is built in CPR-32. PRD Rev. 3 FR-GLB-02, FR-LEAD-01 to FR-LEAD-03; `docs/design/copywriting.md` section 6; `docs/design/components.md` section 12.

**Scope**
- Utility that builds `https://wa.me/<number>?text=<encoded message>` from the Site Settings number and the template of a context.
- Contexts: general, one per published service (listed from the Services data, never hardcoded; service name placeholder), AI Agents product, thank-you page. Context is resolved from the route.
- Wire the link into the floating button (CPR-32) and into WhatsApp buttons in the hero, CTAs, Contact and thank-you pages.
- Each button reports its `location` (floating, hero, cta, contact, thank-you) and `context` for the `whatsapp_click` event (CPR-51).
- Number and templates come from CPR-29 data, so changing them needs no redeploy.

**Out of scope**
- Editing the number and templates in the admin (CPR-29). The floating button's look and collapse behaviour (CPR-32). Analytics wiring (CPR-51).

**Acceptance criteria**
- [ ] TDD: failing unit tests first for the link builder: URL encoding (spaces, `&`, `?`, `#`, apostrophes, emoji, newlines), digits-only number, each context, placeholder substitution
- [ ] The message matches the context of the page (service pages use the service name, the product page uses the product context)
- [ ] Changing the number or a template in the admin changes the link without a deploy (integration test with seeded settings)
- [ ] The floating button does not cover important content on mobile (bottom spacing reserved; sits above the sticky CTA bar when visible)
- [ ] If no number is configured the WhatsApp buttons are not rendered (and the missing setting is logged), instead of producing a broken link
- [ ] WhatsApp links open in a new tab with `rel="noopener noreferrer"`
- [ ] Final wiring: once CPR-29 and CPR-27 merge, the number, templates and service contexts come from the real data instead of the fixture

**Gotchas**
- `wa.me` expects digits only, with country code and no plus or leading zeros, while Site Settings stores the number as E.164 (with a plus): strip the plus in the builder (unit test).
- The template placeholder contract (for example `{service}`) is defined in CPR-29; keep both sides in sync with a shared test.
- The product name is a working name; templates must read it from the site setting, not from code.

**References**
- PRD Rev. 3 FR-GLB-02, FR-LEAD-01 to FR-LEAD-03; `docs/design/copywriting.md` section 6
- Previous text (Indonesian): `wa.me` link builder with a message per context (general, Web Development, AI & Automation, Chatbot product) and per language; number and templates from Site Settings; floating button on all public pages; WhatsApp buttons in hero, CTA, Contact, thank-you. Acceptance criteria carried over above (language dimension removed, floating button presentation moved to CPR-32)
```

### CPR-47 · [Lead] Contact form (UI and client validation)

- **Action:** UPDATE (split; title changed from "Form kontak & server action")
- **Milestone:** M3
- **Assignee:** Faishal
- **Priority:** keep current
- **Blocked by:** CPR-42, NEW-lead-intake-action
- **Blocks:** CPR-49, CPR-51, CPR-56
- **Relation changes (Blocked by):** add NEW-lead-intake-action; remove CPR-46
- **Labels:** none
- **Split proposal:** this ticket is the frontend half. The server action, shared schema, number normalisation and persistence moved to **NEW-lead-intake-action** (Farhan).

```markdown
**Context**
The contact form is the structured lead channel and no lead may be lost. It is now split: this ticket builds the form UI, client validation and states; NEW-lead-intake-action builds the validated server action, persistence and redirect. Both use one shared schema module, so client and server rules cannot drift. Layout and fields: `docs/design/page-patterns.md` section 2.8; form spec: `docs/design/components.md` section 6; microcopy: `docs/design/copywriting.md` section 5. PRD Rev. 3 section 8.2 and FR-LEAD-04, 08, 10.

**Scope**
- Form card on `/contact` (slot from CPR-42): fields Name, Work email, WhatsApp number (`inputmode="tel"`, placeholder `+62 812 3456 7890`), Company (optional), Business type, What do you need help with (AI Discovery, AI Build, AI Enablement, AI Agents product, Not sure yet), Budget range (optional), Message (minimum 20 characters), Privacy consent with a link to the Privacy Policy. Submit label "Send message".
- Client validation with the shared schema from NEW-lead-intake-action; error messages follow the microcopy pattern ("Enter an email like name@company.com.").
- Error summary at the top on submit with links to the fields; `aria-invalid`, `aria-describedby`; focus moves to the summary.
- Prefill the interest field from `?service=` (values: `ai-discovery`, `ai-build`, `ai-enablement`, `ai-agents`, `not-sure`); unknown values are ignored.
- Submitting state (loading, disabled, `aria-busy`); Lottie `send-plane` (L4, P1) when available, spinner otherwise.
- Server error state: calm message, the typed values are kept, and a WhatsApp button (general context, CPR-45) is offered as a backup.
- Slots for the honeypot field and the Turnstile widget (implemented in CPR-49), placed above the submit button.

**Out of scope**
- Server action, schema definition, normalisation, persistence, redirect (NEW-lead-intake-action). Spam protection (CPR-49). Emails (CPR-50).

**Acceptance criteria**
- [ ] TDD: failing Testing Library tests first for each rule below
- [ ] All fields and validation rules match the shared schema (a test imports the same schema module as the server action)
- [ ] `?service=ai-build` preselects "AI Build"; an unknown value leaves the field empty
- [ ] On a simulated server error the form shows the error, keeps every typed value and shows the WhatsApp fallback
- [ ] Error summary appears on invalid submit, focus moves to it and each link focuses its field
- [ ] The form is fully keyboard operable; labels are visible; field text is 16 px or larger; touch targets 44 px or larger
- [ ] Double submission is prevented while a request is in flight
- [ ] The thank-you redirect (from the server action) works end to end (checked in the E2E of CPR-56)
- [ ] Reduced motion: no animated loading icon, static spinner or text

**Gotchas**
- The WhatsApp number format: the server normalises to `62...`; the UI only gives guidance and must not rewrite the number while typing.
- Keep autocomplete attributes (`name`, `email`, `tel`, `organization`) so browsers can autofill.
- Budget options are proposed and need copy approval (for example: under IDR 10M, IDR 10M to 50M, IDR 50M to 150M, over IDR 150M, not sure yet).
- The business type options here (Small business, Company, Startup, Other) are a segment list. The CMS plan names the Business types collection (industries such as online shop and cafe) as the source of the contact form options too. Confirm one collection with a `kind` field, or two lists, before wiring the options (see NEW-cms-product).
- The `form_submit` analytics event fires after the redirect; see CPR-51.

**References**
- `docs/design/page-patterns.md` section 2.8; `docs/design/components.md` section 6; PRD section 8.2, FR-LEAD-04, FR-LEAD-08, FR-LEAD-10
- Previous text and acceptance criteria (Indonesian): fields per PRD 8.2, same validation on client and server, `62...` normalisation, service prefilled from the URL parameter, consent checkbox with privacy link, server action saves and redirects, on failure show an error in the page language with inputs kept and WhatsApp as backup; unit tests for normalisation and validation and integration test for the action. The server parts moved to NEW-lead-intake-action
```

### CPR-48 · [Lead] Waitlist storage, admin list and CSV export

- **Action:** UPDATE (re-scoped to server and export as in the CMS plan; title changed from "Waitlist chatbot & ekspor CSV"; form UI moved to NEW-waitlist-form-ui)
- **Milestone:** M3
- **Assignee:** Farhan Fadillah Rafi (currently unassigned)
- **Priority:** keep current
- **Blocked by:** NEW-cms-shell
- **Blocks:** CPR-49, CPR-56, CPR-62, NEW-waitlist-form-ui
- **Relation changes (Blocked by):** add NEW-cms-shell; remove CPR-24, CPR-36, CPR-39
- **Labels:** none

```markdown
**Context**
People who want the AI agent product join a waitlist; the product itself is built separately (team CBT) and is not on sale. This ticket is the server side: storage, validated server action, admin list and CSV export. The form UI on the Product page is NEW-waitlist-form-ui (Faishal). The product name is a working name, so server code must not hardcode it. PRD Rev. 3 section 8.3, FR-WL-01 to FR-WL-03, FR-ADM-01; `docs/superpowers/plans/2026-10-15-admin-cms.md` section 2.3 (Waitlist) and section 5.

**Scope**
- Schema `waitlist` in PostgreSQL (Drizzle migration): normalised email (trimmed, lowercased) with a unique constraint, business type (optional), locale, consent timestamp, created at.
- Shared schema module for the form (imported by NEW-waitlist-form-ui for client validation).
- Server action `joinWaitlist`: validate (email, consent), run the anti-spam hook (CPR-49), insert. A conflict on the specific email unique constraint is treated as success with the same result as a new signup, including concurrent submissions. Any other database error is not hidden.
- Admin list of waitlist entries (Admin only) with filters and the table from the admin kit (NEW-cms-shell); CSV export (Admin only, `Cache-Control: no-store`, formula-injection protection).
- Waitlist notification to the lead inbox when enabled in the site settings (CPR-29).

**Out of scope**
- The form UI and success state (NEW-waitlist-form-ui). Anti-spam implementation (CPR-49). Emails to waitlist members (not in v1 unless approved).

**Acceptance criteria**
- [ ] TDD: failing tests first. Integration test: the same email submitted twice, and submitted concurrently, produces one row and an identical success result both times
- [ ] A non-duplicate database failure (simulated) returns an error and is not reported as success
- [ ] Admin sees the list and can download the CSV; Editor and anonymous requests are rejected on the query and on the export endpoint directly, not only by hiding the menu
- [ ] CSV cells that start with `=`, `+`, `-`, `@`, tab or carriage return are neutralised (test with each prefix)
- [ ] The export response is not cached (`no-store`) and is not served from the public static cache
- [ ] No public CRUD endpoint exists for the waitlist
- [ ] Unit, DB and HTTP suites, lint, typecheck and build pass

**Gotchas**
- Only the known email unique-constraint conflict counts as success. Catching every insert error would hide real outages and lose signups.
- The uniform success response is deliberate: it stops visitors from probing whether an email is registered (FR-WL-02).
- Retention: waitlist data is kept until 12 months after the product launches or until deletion is requested (PRD section 13.4); keep deletion possible from the admin or by operator script.
- The Admin UI language is Indonesian (FR-ADM-05), so list and export headers in the admin are Indonesian even though the public site is English.

**References**
- PRD FR-WL-01, FR-WL-02, FR-WL-03, FR-ADM-01, FR-ADM-05
- Previous text (Indonesian): schema with normalised email and unique constraint, optional business type, locale and time; form on Home and chatbot page with server validation and anti-spam; a known duplicate counts as the same success (also concurrent) while other DB errors are visible; list and CSV export Admin only, uncached, safe against formula injection; integration tests for concurrent duplicates, storage failure and permissions; no public CRUD endpoint. Acceptance criteria carried over above; the form parts moved to NEW-waitlist-form-ui
```

### CPR-50 · [Lead] Notification and auto-reply emails

- **Action:** UPDATE
- **Milestone:** M3
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** keep current
- **Blocked by:** CPR-12, NEW-lead-intake-action, NEW-cms-email
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-lead-intake-action, NEW-cms-email; remove CPR-47
- **Labels:** none

```markdown
**Context**
Sineva should know about every new lead immediately, and the prospect should get a confirmation. Rev. 3: brand "Sineva", English templates (texts come from CPR-21). Sending uses Resend with the verified domain (CPR-12). The provider mode (Resend API or SMTP), the encrypted secrets and the editable templates come from NEW-cms-email. PRD FR-LEAD-06, FR-LEAD-07, FR-LEAD-09, section 15.

**Scope**
- After a lead is saved (NEW-lead-intake-action), send a notification to the lead inbox from Site Settings (CPR-29).
- Send an automatic reply to the prospect in English, signed "Sineva". Templates are the stored ones from NEW-cms-email (seeded from the CPR-21 copy); if none is stored, use the code default.
- An email failure is logged and sent to Sentry; it never cancels the lead and the visitor still sees the success page.
- Sending does not block the response to the visitor.
- Mock email adapter for local development and CI; real emails only from preview and production.
- Each email has a plain-text alternative; placeholders (`{name}`, `{service}`) are replaced and HTML-escaped inside a fixed branded layout in code.

**Out of scope**
- Domain verification (CPR-12). Template copy (CPR-21). Email settings, secrets and the template editor (NEW-cms-email). Waitlist emails (not in v1 unless approved; the template exists in NEW-cms-email).

**Acceptance criteria**
- [ ] TDD: failing tests first with the mock adapter
- [ ] The notification and the auto-reply are sent from a preview deployment (record one real test)
- [ ] When sending fails: the lead stays saved, the visitor still sees the success page, and the error appears in Sentry
- [ ] Integration test with the mock adapter checks recipients, subject, reply-to and body for both emails
- [ ] Prospect-supplied text (name, message) cannot inject headers or HTML into either email
- [ ] Neither email contains an em dash, an en dash or the old two-word brand name (the copy lint test scans the templates)
- [ ] The Sentry event for a failure contains no personal data from the lead
- [ ] The emails use the stored templates (placeholders replaced and escaped); with no stored template the code default is used

**Gotchas**
- The notification contains personal data and goes only to the internal inbox.
- A response time promise in the auto-reply needs Founder approval (`docs/design/copywriting.md` section 5).

**References**
- PRD FR-LEAD-06, FR-LEAD-07, FR-LEAD-09, section 15
- Previous text and acceptance criteria (Indonesian): notification to the lead inbox, auto-reply in the prospect's language from the copywriting templates, failure logged and sent to Sentry without cancelling the lead, mock adapter locally and in CI; acceptance: sent in preview, lead kept and success shown on failure, integration test with the mock. Language dimension removed
```

### CPR-51 · [Analytics] Umami integration and event tracking

- **Action:** UPDATE
- **Milestone:** M3
- **Assignee:** Faishal (proposed, needs confirmation)
- **Priority:** keep current
- **Blocked by:** NEW-waitlist-form-ui, CPR-45, CPR-47, NEW-section-blocks
- **Blocks:** none
- **Relation changes (Blocked by):** add NEW-waitlist-form-ui, NEW-section-blocks; remove CPR-48
- **Labels:** none

```markdown
**Context**
The main metric is conversion to WhatsApp and the form. Umami is used because it needs no cookies (decision D7). Rev. 3 adds the `path_select` event (which of the two paths a visitor picks) and makes `lang_switch` conditional on a second locale. PRD Rev. 3 analytics section (12) and section 4.4.

**Scope**
- Umami Cloud account and the cookie-less script. The website ID and the enable flag come from the Analytics group of the site settings (CPR-29).
- A typed `track(event, props)` helper; analytics are disabled in local development and in previews.
- Events and properties (update the PRD table in NEW-prd-rev3):
  - `whatsapp_click`: `location` (floating, hero, cta, contact, thank-you), `context`, `locale`
  - `cta_click`: `cta`, `page`, `locale`
  - `form_submit`: `service`, `business_type`, `locale`
  - `waitlist_submit`: `locale`
  - `path_select` (new): `path` (product or services), `page`, `locale` (property set proposed; confirm)
  - `lang_switch`: `from`, `to`, only wired when a second locale is enabled (CPR-34)

**Out of scope**
- A cookie banner (not needed). Self-hosting Umami (only if the free plan limit is exceeded).

**Acceptance criteria**
- [ ] TDD: failing unit tests first for the helper (disabled in local and preview, property shape, no personal data allowed in properties)
- [ ] The five active events (`whatsapp_click`, `cta_click`, `form_submit`, `waitlist_submit`, `path_select`) appear in the Umami dashboard when tested in production
- [ ] Event properties match the PRD table
- [ ] No analytics cookie is set in the browser (check the cookie jar)
- [ ] No event property contains an email, phone number or free text typed by the visitor
- [ ] `lang_switch` is not emitted while only one locale exists

**Gotchas**
- `form_submit` happens before a redirect to the thank-you page; send it from the thank-you page (for example with a one-time flag) or with a beacon so it is not lost.
- The Umami script host must be in the CSP (CPR-53).
- `business_type` and `service` are category values, not personal data; keep them to the fixed option lists.

**References**
- PRD analytics section 12, section 4.4
- Previous text (Indonesian): Umami Cloud script without cookies; events `whatsapp_click`, `cta_click`, `form_submit`, `waitlist_submit`, `lang_switch` with properties per PRD 12; disabled locally and in preview. Acceptance: all five events visible in Umami in production, properties match the table, no analytics cookie
```


### 4.7 M4: content, SEO, security and QA

### CPR-52 · [SEO] Meta, OG and canonical

- **Action:** UPDATE (title changed: hreflang removed from scope)
- **Milestone:** M4
- **Assignee:** Faishal
- **Priority:** keep current
- **Blocked by:** NEW-cms-seo, NEW-i18n-en
- **Blocks:** CPR-57
- **Relation changes (Blocked by):** add NEW-cms-seo, NEW-i18n-en; remove CPR-29, CPR-25
- **Labels:** none

```markdown
**Context**
Every page should be read correctly by search engines and look right when shared. Rev. 3: English is the only locale, so **no hreflang tags are emitted until a second locale exists**; the code must make adding them a data change. The default OG image uses the Sino render B1 and the title is drawn at request time with `next/og`. PRD Rev. 3 FR-SEO-01, FR-SEO-02; `docs/design/3d-asset-requirements.md` section 3.7 (B1); `docs/design/copywriting.md` section 7.

**Scope**
- Render the SEO data stored by NEW-cms-seo (per-document title, description, OG image, canonical override, noindex toggle, and the global title template and defaults). Editing and storage are not part of this ticket.
- `generateMetadata` on every page: title pattern `{Page topic} | Sineva`, description, canonical, Open Graph and Twitter card.
- Canonical URLs: unprefixed English URLs; filtered blog and work lists point to the unfiltered list; decide the rule for paginated lists with CPR-40.
- OG image: default asset B1 plus a dynamic image through `next/og` that renders the page title over the B1 layout.
- hreflang and `x-default` generation implemented behind the locale list: emitted only when more than one locale is enabled.
- `noindex` for the thank-you page, preview routes and 404, and for any document whose noindex toggle is set; honour the canonical override when set.

**Out of scope**
- Sitemap, robots and JSON-LD (CPR-57). Producing the B1 render (NEW-sino-renders).

**Acceptance criteria**
- [ ] TDD: failing tests first for the canonical and metadata builders
- [ ] Every public page has a title (60 characters or fewer), a description (160 or fewer) and an OG image
- [ ] No `hreflang` link appears in the HTML while one locale is enabled; a unit test with a fixture of two locales shows they are generated correctly (including `x-default`)
- [ ] Canonical is correct for each page type, including filtered blog and work lists, with and without query parameters
- [ ] The thank-you page, preview routes and 404 carry `noindex`
- [ ] The OG image is 1200 by 630 and 300 KB or less, and renders a long title without overflow
- [ ] No em dash or en dash in any metadata or OG text

**Gotchas**
- `next/og` needs the font data loaded explicitly as bytes (it cannot use `next/font`); verify against the Next.js version in this repo (recalled, not verified).
- Absolute URLs need `metadataBase` with the final host; www or non-www is decided in CPR-60.
- The Rev. 2 text required `hreflang` for `id`, `en` and `x-default`; remove those expectations from tests added earlier.

**References**
- PRD Rev. 3 FR-SEO-01, FR-SEO-02; `docs/design/copywriting.md` section 7
- Previous text and acceptance criteria (Indonesian): SEO fields in admin schema and forms with site defaults, `generateMetadata`, hreflang for `id`, `en`, `x-default`, canonical; each page has title, description, OG image; hreflang only to existing equivalents; canonical correct including filtered blog pages. The hreflang parts are deferred
```

### CPR-53 · [Infra] Security headers

- **Action:** UPDATE
- **Milestone:** M4
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation)
- **Priority:** keep current
- **Blocked by:** CPR-11, NEW-seaweedfs
- **Blocks:** CPR-60
- **Relation changes (Blocked by):** add NEW-seaweedfs
- **Labels:** none

```markdown
**Context**
Security hardening before launch. Rev. 3 changes what the CSP must allow: media comes from the SeaweedFS media host behind Cloudflare, the realtime mascot loads a draco wasm decoder, and Lottie and GSAP run on the page. PRD section 13.3; `docs/superpowers/plans/2026-10-15-website-redesign.md` section 2 (gotcha 6).

**Scope**
- CSP that allows what is actually used: Turnstile (`challenges.cloudflare.com`), Umami host, Sentry ingest host, the media CDN host in `img-src` and `media-src` (and `connect-src` for the GLB fetch), self-hosted fonts and decoders.
- `'wasm-unsafe-eval'` for the draco decoder; **no `'unsafe-eval'`**. Lottie (light build, SVG renderer) works without eval. Verify whether three.js draco workers need `worker-src blob:` (recalled from memory, not verified).
- HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- Start in report-only mode on preview, then enforce.

**Out of scope**
- Trusted client IP and origin lockdown (NEW-auth-client-ip).

**Acceptance criteria**
- [ ] securityheaders.com grade A or better for production
- [ ] No CSP violation in the console on public pages and on `/admin`, checked on: Home with the mascot active, the logo intro, a Lottie animation, a page with the Turnstile widget, an article with images from the media host
- [ ] An automated browser test listens for `securitypolicyviolation` events across those pages and fails on any
- [ ] `'unsafe-eval'` does not appear in the policy; `'wasm-unsafe-eval'` appears only on routes that load the decoder (or its presence is justified in the PR)
- [ ] The media host is allowed for images and video loops, and no wildcard host is used

**Gotchas**
- Next.js inline scripts need a nonce or hash strategy; a nonce-based policy makes pages dynamic, which interacts with the static rendering goal (FR-SEO-05). Check the trade-off with the Next.js docs in `node_modules/next/dist/docs/`.
- Scope `'wasm-unsafe-eval'` to the route that needs it if the framework allows per-route policies.
- Every new third-party host added later (analytics, fonts) needs a CSP entry; add the check to the release checklist.

**References**
- PRD section 13.3; `docs/design/mascot-sino.md` section 2 (decoder); `docs/design/motion.md` section 7 (dotLottie rejected for WASM)
- Previous text (Indonesian): CSP that still allows Turnstile, Umami, Sentry, R2; HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; acceptance: securityheaders.com at least A, no CSP violation on public pages and `/admin`. R2 is replaced by the media host
```

### CPR-54 · [Content] Final English content entry

- **Action:** UPDATE
- **Milestone:** M4
- **Assignee:** Faishal (proposed, needs confirmation)
- **Priority:** keep current
- **Blocked by:** CPR-21, CPR-27, CPR-17, CPR-29, CPR-28, NEW-copy-lint, NEW-cms-pages, NEW-cms-product, NEW-cms-faq
- **Blocks:** CPR-58, CPR-59
- **Relation changes (Blocked by):** add NEW-copy-lint, NEW-cms-pages, NEW-cms-product, NEW-cms-faq
- **Labels:** none

```markdown
**Context**
All final copywriting is entered into the custom admin before launch. Rev. 3: English only. The copy comes from CPR-21 (`docs/content/copy-en.md`, `seo-en.json`) and the privacy policy from CPR-17 after legal review. PRD Rev. 3 content requirements (formerly FR-I18N-04).

**Scope**
- Enter all final English text: site settings and page content (Home, Services list, Product, About, Contact, thank-you, Privacy), the three Services, Team, WhatsApp templates, metadata, and initial articles if any. Also the 404 and Blog and Work index texts, product capabilities and business types (NEW-cms-product), shared FAQ library items (NEW-cms-faq), global SEO settings and per-page SEO fields (NEW-cms-seo), and the email templates (NEW-cms-email).
- Privacy Policy published only after legal review.
- Alt text for every image.
- Final names for the product and the services (Q9, Q10) and confirmed product capabilities (Q11) are applied as data.

**Out of scope**
- Writing the copy (CPR-21, CPR-17). Showcase items (CPR-55).

**Acceptance criteria**
- [ ] All site settings, page content and the three Services are complete in English
- [ ] Every image has alt text
- [ ] The reviewed Privacy Policy is published
- [ ] The admin accepted every field through the shared copy validator (no em dash or en dash)
- [ ] A crawl of the preview or production site finds no placeholder text (for example "pending confirmation", "TODO", "lorem") and no use of the old two-word brand name
- [ ] Hidden sections (work, blog, team, address, legal) behave correctly with the final data set
- [ ] Capabilities, business types, FAQ items, global SEO settings and email templates are filled in and reviewed

**Gotchas**
- Do not enter copy that depends on unanswered questions (Q9, Q10, Q11) as final; settle them first or the names will change twice.
- Enter the content with an Editor account at least once to confirm the Editor role can do all of it.

**References**
- `docs/content/copy-en.md`; PRD Rev. 3 content requirements, section 4.3
- Previous text and acceptance criteria (Indonesian): enter all final ID and EN text into the admin; global and Services complete in both languages; all images with ID and EN alt text; legally reviewed privacy policy published. English only now
```

### CPR-56 · [QA] Playwright E2E for critical flows

- **Action:** UPDATE
- **Milestone:** M4
- **Assignee:** Faishal (proposed, needs confirmation). Admin scenarios (`e2e/admin/`) are written by Farhan; public scenarios (`e2e/public/`) by Faishal
- **Priority:** keep current
- **Blocked by:** CPR-47, NEW-waitlist-form-ui, CPR-48, CPR-10, CPR-32, NEW-logo-intro
- **Blocks:** CPR-60
- **Relation changes (Blocked by):** add NEW-waitlist-form-ui, CPR-32, NEW-logo-intro; remove CPR-65, CPR-34
- **Labels:** none

```markdown
**Context**
Flows that produce leads must not break unnoticed. Rev. 3 removes the language and theme scenarios and adds scenarios for the new motion and navigation. PRD section 15 (E2E row, revised).

**Scope**
Public scenarios:
- Submit the contact form and land on the thank-you page (including a `?service=ai-build` prefill).
- WhatsApp links carry the right message per context (general, a service page, product page, thank-you).
- Join the waitlist (new email and the same email again show the same success).
- 404 page returns status 404.
- **Reduced motion run:** the key scenarios run with `reducedMotion: 'reduce'`; assert no logo intro overlay, no Sino canvas, no autoplay video.
- **Logo intro:** appears on the first load, is skipped by a key press, is absent on the second navigation in the same session and absent in the reduced motion run.
- **Navbar dropdown keyboard:** open with Enter, move with arrow keys, Escape closes and returns focus to the trigger; mobile menu traps focus.
- Removed from the old list: language switch and theme toggle scenarios.

Admin scenarios (kept from Rev. 2): login and logout and a revoked session; Admin creates an Editor; Editor edits, publishes and previews an article; a draft does not leak to the public site; Admin filters leads and changes status and notes and exports the waitlist; Editor and anonymous users are denied personal data by direct URL or action; lockout after 5 failures for 15 minutes including direct calls to the auth handler. Use a test database fixture, never production data. Added from the CMS plan: edit the Home hero in the admin and see it live after saving; publish a post and see it in the blog list and the sitemap; an Editor cannot open settings, email settings or leads.

**Out of scope**
- Lighthouse and axe (CPR-58). Manual device tests (CPR-59).

**Acceptance criteria**
- [ ] All public and admin scenarios pass with a Postgres service, Turnstile test keys and the mock email adapter
- [ ] The reduced motion run and the logo intro scenarios pass
- [ ] The dropdown and mobile menu keyboard scenarios pass
- [ ] CI: the PR fails when an E2E scenario fails (**applies once CPR-10 is resumed**). While CI stays deferred, run the suite locally before merge and attach the output to the PR as evidence

**Gotchas**
- The logo intro skips itself for `navigator.webdriver`, which Playwright sets. Provide a test-only way to force the intro (never enabled in production) or the intro scenarios cannot run.
- The Sino canvas depends on WebGL; in headless runs the loading gate may choose the poster. Assert the poster path in CI and the canvas path in a headed or GPU-enabled run.
- Use the fixed Turnstile test keys and the mock email adapter; real services only in preview and production.

**References**
- PRD section 15; `docs/design/motion.md` sections 3.1, 5, 9; `docs/design/accessibility-performance.md` section 1
- Previous text and acceptance criteria (Indonesian): add to CI: contact form to thank-you, language switch on service and article, WhatsApp link message, waitlist, 404, theme switch with persistence; plus Rev. 2 admin scenarios; acceptance: all pass in CI with Postgres service, Turnstile test key and mock email, PR fails if E2E fails
```

### CPR-58 · [QA] Lighthouse CI and accessibility audit

- **Action:** UPDATE
- **Milestone:** M4
- **Assignee:** Faishal (proposed, needs confirmation)
- **Priority:** keep current
- **Blocked by:** CPR-10, CPR-54, NEW-logo-intro, NEW-sino-hero, NEW-sino-renders
- **Blocks:** CPR-60
- **Relation changes (Blocked by):** add NEW-logo-intro, NEW-sino-hero, NEW-sino-renders; remove CPR-65
- **Labels:** none

```markdown
**Context**
PRD quality targets are checked automatically. Rev. 3: light theme only, and the measurements must run **with the logo intro and the Sino mascot enabled**, because those are the biggest performance risks. Budgets are in `docs/design/accessibility-performance.md` section 2. PRD section 4.3, 13.1, 13.2.

**Scope**
- Lighthouse CI for the 5 key pages: Home, a Service detail page, a Work detail page, an Article, Contact. Mobile profile, default throttling.
- axe accessibility checks on the same pages in the light theme.
- Budgets (from the design docs): LCP under 2.5 s (the LCP element is the headline or the Sino poster, never the canvas or the Lottie overlay); CLS under 0.1 (hero 0); INP under 200 ms; initial JS 130 KB gzip or less on content pages and 170 KB or less on Home before lazy chunks; Home lazy chunks: three.js plus mascot 190 KB gzip or less, GLB 600 KB brotli or less, animation libraries 60 KB gzip or less; fonts 120 KB or less in total; hero poster 120 KB or less; Lottie files 60 KB or less each (intro 120 KB).
- Fix every finding.

**Out of scope**
- Dark mode checks (removed). Manual device testing (CPR-59).

**Acceptance criteria**
- [ ] All five key pages score 90 or higher in all four Lighthouse categories (Performance, Accessibility, Best Practices, SEO) with the intro and the mascot enabled
- [ ] No axe violation of level critical or serious in the light theme
- [ ] Every budget above is measured and recorded in a table; none is exceeded
- [ ] The logo intro adds 100 ms or less to LCP (reuse the measurement from NEW-logo-intro)
- [ ] CI: the PR fails when a score drops below the threshold (**applies once CPR-10 is resumed**); until then run locally and attach reports

**Gotchas**
- The logo intro skips itself for automation (`navigator.webdriver`). Verify whether Lighthouse triggers that rule; if it does, the intro is not measured. Use the test-only force flag defined in NEW-logo-intro and keep it out of production builds.
- In a headless run the mascot loading gate (WebGL2, device memory, FPS probe) may fall back to the poster, so the score does not reflect the canvas path. Add a run that forces the canvas path.
- Lighthouse scores vary between runs; use the median of several runs.

**References**
- `docs/design/accessibility-performance.md` sections 1 to 3; `docs/design/mascot-sino.md` section 8; PRD sections 4.3, 13.1, 13.2
- Previous text and acceptance criteria (Indonesian): Lighthouse CI for 5 key pages with threshold 90 on mobile; axe in light and dark; fix all findings; all four categories 90 or higher, no critical or serious axe finding in both themes, PR fails below the threshold. Dark theme removed
```

### CPR-59 · [QA] Device testing and content completeness check

- **Action:** UPDATE
- **Milestone:** M4
- **Assignee:** Faishal (proposed, needs confirmation)
- **Priority:** keep current
- **Blocked by:** CPR-54, NEW-logo-intro, NEW-sino-hero
- **Blocks:** CPR-60
- **Relation changes (Blocked by):** add NEW-logo-intro, NEW-sino-hero; remove CPR-65
- **Labels:** none

```markdown
**Context**
The last manual test before launch. Rev. 3: English, light theme only, plus the motion and mascot features that behave differently on real devices. PRD sections 13.5, 15 and FR-I18N-04 (now "content complete in English").

**Scope**
- Test on iPhone (Safari), Android (Chrome) including a **low-end Android device with the Sino mascot active**, and desktop Chrome, Firefox, Edge and Safari. Light theme only.
- With the operating system "reduce motion" setting on: no logo intro, no mascot canvas, no autoplay video, no scroll scrub.
- Logo intro: never blocks reading or input; skippable; once per session.
- Mascot: look-at smooth at 60 fps on a laptop and 45 fps or more on a mid-range Android; poster fallback works when WebGL is blocked or Save-Data is on.
- 360 px width and 200% zoom without horizontal scroll.
- English content completeness checklist: every page and every UI string present, no placeholder text, no em dash or en dash, alt text on all images.
- Email test: notification and auto-reply arrive in the inbox (not spam) with SPF and DKIM passing.

**Out of scope**
- Automated suites (CPR-56, CPR-58).

**Acceptance criteria**
- [ ] No blocker bug on any target device and browser in the light theme (a results table per device is attached)
- [ ] The reduced motion pass is clean (no intro, canvas or video)
- [ ] The mascot meets the frame rate targets, with device model and measured numbers recorded
- [ ] The content completeness checklist is 100% complete
- [ ] Notification and auto-reply emails reach the inbox, not spam
- [ ] No horizontal scroll at 360 px and at 200% zoom

**Gotchas**
- iOS Safari has its own behaviour for scroll lock, the alpha video fallback (HEVC with alpha) and WebGL memory; test it on a real phone, not only an emulator.
- Check the floating WhatsApp button never covers the sticky CTA bar or a form submit button on small screens.

**References**
- PRD sections 13.5, 15; `docs/design/accessibility-performance.md` sections 1 and 3; `docs/design/mascot-sino.md` section 8
- Previous text and acceptance criteria (Indonesian): test on iPhone, Android, desktop browsers in light and dark; bilingual completeness checklist; email SPF and DKIM test; no blocker bug in both themes, checklist 100%, emails in inbox. English and light only now
```

### 4.8 M5: launch

### CPR-61 · [Launch] Backup restore test

- **Action:** UPDATE
- **Milestone:** M5
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation)
- **Priority:** keep current
- **Blocked by:** CPR-13
- **Blocks:** CPR-64
- **Labels:** none

```markdown
**Context**
A backup is only trusted once a restore has worked. Rev. 3 has two backup locations (SeaweedFS `backups` bucket and the off-host copy, CPR-13), so both paths must be proven. PRD Rev. 3 backup section (13.6) and section 4.3.

**Scope**
- Restore the latest backup **from SeaweedFS** into an isolated recovery database (not a PR preview database, not production), following the runbook.
- Restore the latest backup **from the off-host copy** the same way, from a machine that is not the VPS.
- Verify the data is intact (lead and content tables readable, row counts plausible, an admin login works against the restored copy).
- Update the runbook where a step was missing.

**Out of scope**
- Building the backup jobs (CPR-13).

**Acceptance criteria**
- [ ] The SeaweedFS restore succeeds and lead and content data read correctly
- [ ] The off-host restore succeeds and lead and content data read correctly
- [ ] Restore duration for each path is recorded in the runbook
- [ ] The decryption key or credentials needed for the off-host copy are retrievable from the documented location (password manager), without relying on the VPS
- [ ] `docs/runbooks/restore-backup.md` is updated with every step that was missing

**Gotchas**
- Restoring only from SeaweedFS does not prove survival of a VPS or disk loss. The off-host path is the real test.
- Never restore onto production or a preview database.

**References**
- PRD Rev. 3 sections 4.3, 13.6; CPR-13
- Previous text and acceptance criteria (Indonesian): restore the newest backup from R2 into an isolated recovery database following the runbook, verify the data, update the runbook; acceptance: restore works with lead and content data readable, restore time recorded in the runbook
```

### CPR-62 · [Docs] Admin guide for content and leads

- **Action:** UPDATE
- **Milestone:** M5
- **Assignee:** Farhan Fadillah Rafi
- **Priority:** keep current
- **Blocked by:** CPR-46, CPR-33, CPR-48
- **Blocks:** CPR-64
- **Labels:** none

```markdown
**Context**
Non-technical staff must be able to run the website without a developer. **Guide language: Indonesian**, because the admin UI language is Indonesian (FR-ADM-05), even though the public site content is English. PRD section 4.3.

**Scope**
Short guide for Admin and Editor covering:
- Login, logout and what happens after 5 failed attempts (15 minute lockout).
- Editing the content of each page (Home, Services, Product, About, Contact, Privacy) and site settings.
- Writing and publishing an article (draft, preview, publish), choosing category, author and media with alt text.
- Adding a work item (the "Work" section), including the "Internal demo project" type.
- Managing leads and their status; exporting the waitlist; handling a personal data deletion request (UU PDP).
- What an Editor can and cannot do.
- The CMS plan screens: SEO fields and redirects, the shared FAQ library, product capabilities, email settings with test send, the audit log, feature toggles and preview links (mark Admin-only areas).
- **Writing rules for public content** (the content is English while the guide is Indonesian): no em dash or en dash, no invented numbers, testimonials or client logos, sentence case, alt text rules; link to `docs/design/copywriting.md`.
- Use only screens and actions that are actually implemented. No screenshots or steps from the old CMS panel. The first Admin bootstrap by the operator command is documented separately for developers; there is no public admin registration.

**Out of scope**
- Developer or operator documentation (runbooks).

**Acceptance criteria**
- [ ] The guide exists at `docs/admin-guide.md` and as a Linear document
- [ ] A non-technical person completed the main tasks (edit a page, publish an article, change a lead status, export the waitlist) using only the guide
- [ ] Every step matches the real screens (reviewed against the production admin)
- [ ] The writing rules section is present and matches the copy lint behaviour (the admin rejects dashes)

**Gotchas**
- Admin labels are Indonesian while the entered content is English; call this out so editors do not translate public text into Indonesian by mistake.
- Update screenshots after any admin UI change.

**References**
- PRD section 4.3, FR-ADM-05, FR-ADM-06
- Previous text (Indonesian): short Indonesian guide for Admin and Editor: login, page content, writing and publishing articles in two languages, adding portfolio, managing leads and status, exporting the waitlist, handling data deletion requests; Rev. 2: only implemented pages and actions, bootstrap documented separately, no old CMS screenshots. Acceptance: available as `docs/admin-guide.md` and as a Linear document, tried by a non-technical person without help
```


## 5. Cancel, keep with comment, keep with note

### 5.1 CANCEL (status Canceled plus comment)

Set the status to Canceled, post the comment below, then remove the ticket's relations. Nothing is deleted; the old description stays in Linear.

### CPR-19 · [Content] Copywriting Bahasa Indonesia

- **Action:** CANCEL (currently In Progress, assignee Farhan Fadillah Rafi)
- **Replacement:** CPR-21 (English copywriting, written from scratch)
- **Relation cleanup:** remove the "blocks CPR-21" relation

```markdown
Canceled for PRD Rev. 3. English is now the primary and only launch language (`docs/design/brand-positioning.md` section 6), and the new positioning (AI consulting company with a Product pillar and three Services) makes this Indonesian draft outdated: it describes Web Development plus AI & Automation.

Nothing is lost: the draft stays in the repo as source material for a future `id` locale (`docs/content/copy-id.md`, `docs/content/seo-id.json`, merged in PR #6). There is no separate "Indonesian later" ticket yet; create one when a second locale is approved.

Replacement: CPR-21, English copywriting written from scratch against `docs/design/copywriting.md` and `docs/design/page-patterns.md`. Reusable from this ticket: the tone notes, the metadata length checks (title 60, description 160 characters) and the public WhatsApp number already recorded.
```

### CPR-20 · [Design] Wireframe semua halaman

- **Action:** CANCEL
- **Replacement:** `docs/design/page-patterns.md` for the public pages (no ticket); CPR-22 for the key-screen review; NEW-cms-shell for the admin UI
- **Relation cleanup:** remove the "blocks CPR-22" relation

```markdown
Canceled for PRD Rev. 3. The UI is built code-first (Q5), and `docs/design/page-patterns.md` now defines the sitemap, the section order of every page and the reusable section blocks, so separate wireframes would duplicate it.

Replacements:
- Public pages: `docs/design/page-patterns.md` (sections 1 to 3) and `docs/design/components.md`. A visual check on the three most important screens remains in CPR-22 (Home, Product, Contact, light only).
- Admin screens (the Rev. 2 addition on this ticket: login and lockout, dashboards, content lists and forms, media, rich text, drafts, Users, leads and waitlist, with empty, error, loading, forbidden and locked states): `docs/design/admin-ui.md` defines the layout, components and key screens, and NEW-cms-shell builds them. Carry the state list above into the acceptance criteria of the admin tickets that build those screens.
```

### CPR-65 · [Layout] Mode terang & gelap

- **Action:** CANCEL
- **Replacement:** none (dark mode becomes a post-launch backlog idea; create a Backlog ticket with no milestone only when the product owner asks)
- **Relation cleanup:** remove the "blocked by CPR-26, CPR-32" and "blocks CPR-58, CPR-59, CPR-56" relations

```markdown
Canceled for PRD Rev. 3: the website is light theme only in v1 (decision D10 is superseded). Dark mode moves to the post-launch backlog.

What carries over: the design tokens are split into primitive and semantic layers, so a dark theme later means swapping the semantic values (`docs/design/tokens.md`). The dark logo variants stay in `assets/brand/logos/svg/`. The old acceptance ideas (initial theme from `prefers-color-scheme`, saved choice, no flash on load, accessible toggle, logo swap) can seed a future ticket.

Effects on other tickets: CPR-56, CPR-58 and CPR-59 no longer wait for this ticket, and their theme criteria were removed.
```

### 5.2 KEEP status Done, add a comment

These tickets stay Done. Post the comment only.

### CPR-5 · [PRD] Review & finalisasi PRD Company Profile v1

- **Action:** KEEP (Done) plus comment
- **Assignee:** Farhan Fadillah Rafi (keep)

```markdown
Rev. 3 impact (15 Oct 2026): this ticket finalised PRD Rev. 1 and Rev. 2. PRD Rev. 3 (NEW-prd-rev3) supersedes it with the AI consulting positioning, English-only launch, light theme only and SeaweedFS instead of Cloudflare R2. This ticket stays Done as history and is not reopened.
```

### CPR-7 · [Infra] Inisialisasi fondasi Next.js & admin custom

- **Action:** KEEP (Done) plus comment
- **Assignee:** Farhan Fadillah Rafi (keep)

```markdown
Rev. 3 impact: the Next.js, Drizzle, PostgreSQL and Better Auth foundation is unchanged. Three later changes touch parts of it: NEW-i18n-en replaces the next-intl routing configuration, CPR-26 replaces the Tailwind setup with the design tokens and adds the component test setup, and NEW-auth-client-ip must land before deployment so the login rate limit does not share one bucket for all visitors.
```

### CPR-15 · [Content] Susun outline konten per halaman

- **Action:** KEEP (Done) plus comment
- **Assignee:** Farhan Fadillah Rafi (keep)

```markdown
Rev. 3 impact: for the English site the outline in `docs/content/outline.md` is superseded by `docs/design/page-patterns.md` (sitemap and section order) and `docs/design/brand-positioning.md` (positioning and offer). The Indonesian outline stays as history and as source material for a future `id` locale.
```

### CPR-24 · [Admin] Kelola Editor dan lockout login

- **Action:** KEEP (Done) plus comment
- **Assignee:** Farhan Fadillah Rafi (keep)

```markdown
Rev. 3 impact: roles, lockout and capability guards stay as built. Follow-ups: NEW-auth-client-ip (without a trusted client IP, better-auth's rate limiter falls back to one shared bucket, evidence in `src/lib/auth/options.ts` and the rate limiter source), and the CMS plan extends what Editors cannot access (email settings, redirects, settings secrets, audit log); keep those guards capability-based like the existing ones.
```

### CPR-25 · [I18n] Routing dua bahasa & slug lokal

- **Action:** KEEP (Done) plus comment
- **Assignee:** Farhan Fadillah Rafi (keep)

```markdown
Rev. 3 impact: the routing built here (`localePrefix: 'always'`, `id` as default, Indonesian slugs, cookie and Accept-Language redirect from `/`) will be replaced by NEW-i18n-en: English default and only locale with `localePrefix: 'as-needed'`. The slug resolver contract and the pathnames registry structure stay. The CPR-25 test suites are rewritten first in NEW-i18n-en (test first, then routing).
```

### 5.3 KEEP with a minor note appended

Append the note to the end of the existing description (do not replace the description). Titles can be translated to English as listed in the summary table. Relations are set from the "Blocked by" lines.

### CPR-6 · [Infra] Choose and buy domain

- **Action:** KEEP plus note
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (keep)
- **Blocked by:** none
- **Blocks:** CPR-9
- **Labels:** none

```markdown
**Rev. 3 note**
The brand is "Sineva". Base the domain name on "sineva", not on a name that adds "tech". The domain will also host the media CDN host `media.<domain>` (CPR-9, NEW-seaweedfs) and the email sender (CPR-12). Acceptance criteria are unchanged. The chosen name closes Q1 in PRD Rev. 3.
```

### CPR-10 · [Infra] Setup CI GitHub Actions

- **Action:** KEEP (stays deferred, Backlog) plus note
- **Milestone:** M0
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation; currently unassigned)
- **Blocked by:** CPR-7
- **Blocks:** CPR-56, CPR-58
- **Related to:** CPR-25, NEW-i18n-en
- **Labels:** none

```markdown
**Rev. 3 note**
Still deferred by the Founder (15 Oct 2026). When it resumes, rebase draft PR #3 on the changed tests: the CPR-25 routing tests are rewritten by NEW-i18n-en (English default, `as-needed` prefix, 58-case locale matrix replaced), CPR-26 adds jsdom and Testing Library, and the stages from CPR-56 (Playwright, including a reduced-motion run) and CPR-58 (Lighthouse and axe) are added. CPR-56 and CPR-58 have "run in CI" criteria that apply only after this ticket resumes; until then those suites run locally and their output is attached to PRs.
```

### CPR-28 · [Admin] Manage team and authors

- **Action:** KEEP plus note
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Blocked by:** CPR-23, CPR-24, NEW-cms-contract
- **Blocks:** CPR-31, CPR-54
- **Relation changes (Blocked by):** add NEW-cms-contract
- **Labels:** none

```markdown
**Rev. 3 note**
Content is English only at launch but stored per locale (role and bio per locale, no schema change later). Add the fields from the CMS plan: social link and "show on About". Build the forms on the admin kit (NEW-cms-shell), expose a public read function with DTO and fixture as defined in NEW-cms-contract, and run role and bio text through the shared copy validator. Acceptance criteria are unchanged except "ID/EN" now means locale-ready English.
```

### CPR-31 · [Admin] Manage blog, categories and rich text editor

- **Action:** KEEP plus note
- **Milestone:** M2
- **Assignee:** Farhan Fadillah Rafi
- **Blocked by:** CPR-23, CPR-28, NEW-cms-contract
- **Blocks:** CPR-33
- **Relation changes (Blocked by):** add NEW-cms-contract
- **Labels:** none

```markdown
**Rev. 3 note**
- The category filter parameter is `?category=` (the Indonesian `?kategori=` no longer exists).
- The rich text editor UI component (Tiptap) is built in NEW-cms-shell. This ticket keeps the structured rich text validation (allowed nodes: heading, list, link, image, quote, code; unsafe protocols and HTML rejected), the renderer, posts, categories, draft and publish snapshots per locale, and preview.
- Cover: a media item or a cover-kit combination (pose plus gradient, asset B2 which is P1).
- Acceptance criterion "publishing in one language does not add the other language to the list, sitemap or hreflang" is tested with a fixture second locale; with `en` only, no hreflang is produced.
- Expose the public read function, DTO and fixture as defined in NEW-cms-contract, and run text fields through the copy validator.
```

### CPR-55 · [Content] Enter portfolio showcase items

- **Action:** KEEP plus note
- **Milestone:** M4
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation)
- **Blocked by:** CPR-16, CPR-30
- **Blocks:** CPR-60
- **Labels:** none

```markdown
**Rev. 3 note**
English only. Items come from the AI-focused topics decided in CPR-16 (ideally one per service). Project type stays "Internal showcase" with the visible label "Internal demo project". The UI and route name is "Work". No invented metrics in the result field. At least 2 published items with working demos are still required.
```

### CPR-57 · [SEO] Sitemap, robots and structured data

- **Action:** KEEP plus note
- **Milestone:** M4
- **Assignee:** Faishal
- **Blocked by:** CPR-52
- **Blocks:** CPR-60
- **Labels:** none

```markdown
**Rev. 3 note**
- Sitemap covers the single enabled locale (English) and only published, indexable pages; alternates and `hreflang` appear only when a second locale is enabled.
- `robots.txt` follows the global robots toggle from NEW-cms-seo (off on previews) and blocks `/admin`; the thank-you page stays `noindex`.
- JSON-LD: Organization from the global SEO settings (name, logo, `sameAs`), Service, BlogPosting, BreadcrumbList, and FAQPage generated from the shared FAQ library (NEW-cms-faq). Validate with the Rich Results Test.
```

### CPR-60 · [Launch] Production go-live

- **Action:** KEEP plus note
- **Milestone:** M5
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation)
- **Blocked by:** CPR-57, CPR-55, CPR-59, CPR-58, CPR-53, CPR-56, NEW-auth-client-ip
- **Blocks:** CPR-63, CPR-64
- **Relation changes (Blocked by):** add NEW-auth-client-ip
- **Labels:** none

```markdown
**Rev. 3 note**
New blocker: NEW-auth-client-ip (the login rate limit must not share one bucket for all visitors). Decide the canonical host (www or non-www) before CPR-52 sets `metadataBase`. Extend the smoke test to the media host `media.<domain>` (public bucket readable, private bucket not), the logo intro, the Sino mascot with its poster fallback, and a forced failure of the email provider (lead still saved).
```

### CPR-63 · [Launch] Register Search Console and submit sitemap

- **Action:** KEEP plus note
- **Milestone:** M5
- **Assignee:** Farhan Fadillah Rafi (proposed, needs confirmation)
- **Blocked by:** CPR-60
- **Blocks:** CPR-64
- **Labels:** none

```markdown
**Rev. 3 note**
Verify the domain through DNS as written, or with the verification token stored in the global SEO settings (NEW-cms-seo). The sitemap contains the English locale only.
```

### CPR-64 · [Launch] Definition of Done v1 sign-off

- **Action:** KEEP plus note
- **Milestone:** M5
- **Assignee:** Farhan Fadillah Rafi (keep)
- **Blocked by:** CPR-63, CPR-61, CPR-62, CPR-60
- **Blocks:** none
- **Labels:** none

```markdown
**Rev. 3 note**
The checklist is section 4.3 of PRD Rev. 3: English only, light theme only, Lighthouse and axe measured with the intro and mascot enabled, backup restore proven from SeaweedFS and from the off-host copy. Also confirm in the sign-off that the Rev. 3 open questions Q8 to Q11 are closed.
```

### 5.4 KEEP, no description change

- **CPR-1 to CPR-4** (onboarding): out of scope of this alignment, no change.
- **CPR-33** · [Admin] Refresh cache after content changes. Assignee Farhan Fadillah Rafi. Relation change: add NEW-cms-contract to Blocked by (cache tags live in `src/lib/cache/tags.ts`). Optional comment: "Rev. 3 note: use the tags from `src/lib/cache/tags.ts` (NEW-cms-contract); the enabled locale list is `['en']` today, the logic is unchanged; slug renames also revalidate the redirect target (NEW-cms-seo)."
- **CPR-46** · [Lead] Manage leads and mini-CRM. Assignee Farhan Fadillah Rafi. Relation change: add NEW-cms-shell to Blocked by (the lead list and detail use the admin kit). Optional comment: "Rev. 3 note: the service filter values are the string keys of NEW-lead-intake-action (AI Discovery, AI Build, AI Enablement, AI Agents product, not sure), not a database enum; status changes write audit entries once NEW-cms-audit exists."
- **CPR-49** · [Lead] Anti-spam: honeypot, Turnstile, rate limit. Assignee Farhan Fadillah Rafi (proposed, needs confirmation). Relation change: Blocked by becomes CPR-47, NEW-waitlist-form-ui, CPR-48, CPR-9, NEW-lead-intake-action. Optional comment: "Rev. 3 note: the 5 submissions per 10 minutes per IP limit needs a trusted client IP behind Cloudflare; reuse `getClientIp` from NEW-auth-client-ip. The widget slots are in CPR-47 and NEW-waitlist-form-ui; the checks run in NEW-lead-intake-action and CPR-48."

## 6. Alignment with the admin CMS plan and the swarm playbook

Read: `docs/superpowers/plans/2026-10-15-admin-cms.md` and `docs/superpowers/plans/2026-10-15-agent-swarm.md`. The nine CMS tickets of the CMS plan (section 5) are included above as NEW tickets assigned to Farhan Fadillah Rafi: NEW-cms-shell, NEW-cms-contract, NEW-cms-pages, NEW-cms-product, NEW-cms-faq, NEW-cms-seo, NEW-cms-email, NEW-cms-audit, NEW-cms-preview. Their milestones and blockers match the CMS plan table.

### 6.1 How the CMS plan shaped the ticket split

1. **CPR-48 stays the server ticket.** The CMS plan re-scopes CPR-48 as server plus export (Farhan). The waitlist form UI therefore became a new ticket, NEW-waitlist-form-ui (Faishal). The contact form uses the same pattern in the other direction: CPR-47 is the UI and NEW-lead-intake-action is the server action. Both are the same split, only the "existing" ticket differs because the CMS plan fixed CPR-48.
2. **CPR-29 is site settings only.** Page content moved to NEW-cms-pages (the CMS plan table). Pages that read page content now relate to NEW-cms-pages.
3. **Admin kit moved out of CPR-26 into NEW-cms-shell** (including the rich text editor component and the table, dialog, locale tabs and media picker parts).
4. **Landing tickets depend on NEW-cms-contract, not on CMS data tickets.** The CMS plan and swarm playbook build landing pages on typed fixtures while the CMS builds the real queries. Hard blockers on CPR-27, 29, 30, 31 and NEW-cms-pages would defeat that, so landing tickets are blocked by NEW-cms-contract and only related to the data tickets, with an acceptance criterion to switch from fixtures to real queries. If the team prefers strict ordering, restore the old blockers.
5. **CPR-50 uses the email templates and settings of NEW-cms-email**, and CPR-52 renders the SEO data stored by NEW-cms-seo.
6. **Media draft handling** follows the CMS plan: draft-only uploads in `media-private` with signed preview URLs, public assets in `media-public` (CPR-23).

### 6.2 Open decisions and gaps found while aligning

- **Business type is one name for different lists.** Contact form and waitlist: segment (Small business, Company, Startup, Other, PRD section 8.2). Product tabs: industry (online shop, cafe and restaurant, local services). The CMS plan says one collection feeds both. Decide one collection with a `kind`, or two lists (affects NEW-cms-product, CPR-47, NEW-waitlist-form-ui).
- **Service FAQ appears twice** in the CMS plan (a FAQ list on each service and `service:<slug>` tags in the shared FAQ library). Choose one before CPR-27 (recommendation: the library).
- **Not covered by any ticket in the CMS plan:** the admin dashboard with KPI cards and charts (`admin-ui.md` section 4.4 and 5), the "Profil saya" page at `/admin/profil` (profile, password change, sessions, preferences, section 4.9), and the command palette (section 4.2). Propose two tickets (dashboard, profile) and either fold the palette into NEW-cms-shell or defer it. Not drafted here because they are outside the approved ticket list.
- **Feature toggles in site settings** (show team, show selected work on Home, enable logo intro, enable realtime Sino, enable sticky CTA bar, in CPR-29) must be honoured by NEW-logo-intro, NEW-sino-hero, NEW-section-blocks (sticky bar), CPR-36, CPR-41 and CPR-43. Each of those has an acceptance line for it.
- **Waitlist confirmation email** template exists in NEW-cms-email but PRD Rev. 3 does not require sending one; the success message ("We'll email you when Sino is ready") implies a later email. Decide whether v1 sends any waitlist email.
- **Editor permissions** are extended in the CMS plan (no access to email settings, redirects, settings secrets, users, leads, waitlist). PRD section 9.3 must say so in Rev. 3.
- **Doc inconsistencies spotted:** `docs/design/3d-asset-requirements.md` still says meshopt while `docs/design/mascot-sino.md` chose draco; PRD file is still Rev. 2 text while Rev. 3 is being written (section numbers in this file follow Rev. 2).

### 6.2a Decisions taken on 2026-10-15 for the gaps above

- Business type: two lists. **Segment** (Small business, Company, Startup, Other) is a fixed enum in code for the contact and waitlist forms; **Industries** is a CMS collection for the Product tabs (CMS plan 2.3 updated).
- Service FAQ: only through the shared FAQ library with `service:<slug>` tags (CMS plan 2.3 updated).
- Dashboard and profile: new tickets NEW-cms-dashboard and NEW-cms-profile; command palette is part of NEW-cms-shell.
- Waitlist email: none in v1; success is shown on screen only (CMS plan 2.6 updated).
- Editor permissions: PRD 9.3 updated.
- Mascot compression: draco everywhere (3d-asset-requirements.md updated).

### 6.3 Suggested build waves

The waves in `docs/superpowers/plans/2026-10-15-agent-swarm.md` section 5 map onto these tickets (W1 NEW-i18n-en, NEW-copy-lint, NEW-cms-contract; W2 CPR-26, NEW-motion-foundation, NEW-seaweedfs, CPR-29; W3 CPR-32, NEW-section-blocks, NEW-logo-intro, NEW-cms-shell, CPR-23; W4 Home, Product, Services pages with NEW-cms-pages, NEW-cms-product, NEW-cms-faq, CPR-27; W5 remaining pages with CPR-30, CPR-31, CPR-28, NEW-cms-seo, CPR-33, NEW-cms-preview; W6 NEW-sino-hero, NEW-lottie-library, NEW-cms-email, CPR-46, CPR-48, CPR-50, NEW-cms-audit; W7 SEO, QA and launch). Branches are named `faishal/<ticket>` for landing and `farhan/<ticket>` for CMS. One ticket is one pull request.
