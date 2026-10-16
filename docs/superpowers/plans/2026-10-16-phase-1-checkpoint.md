# Phase 1 landing site: checkpoint and next steps

| | |
|---|---|
| Date | 2026-10-16 |
| Scope | Phase 1 public landing site (static content, no CMS). The CMS and admin are phase 2, owned by Farhan |
| Production | https://sinevaai.vercel.app (Vercel, account `sinevatech-5152`, project `sineva`). Deploy steps: [docs/deploy/vercel.md](../../deploy/vercel.md) |
| Linear | Project "Company Profile v1", team CPR |

Work was paused on purpose at this point. This file says what is done, what is half done (with the branch to resume from), and what is planned only.

## 1. Done (merged to `main` and deployed)

| Area | What exists | Ticket and PR |
|---|---|---|
| Foundations | i18n with English only and the `as-needed` prefix, design tokens and UI kit, motion foundation, shared section blocks, static content source, copy lint (no em or en dash) | CPR-72 #9, CPR-26 #14, CPR-74 #15, CPR-75 #16, CPR-91 #18, CPR-73 #11 |
| Layout | Header, mobile menu and footer; floating nav that hides on scroll; first-visit logo intro | CPR-32 #17, CPR-93 #29, CPR-76 #20 |
| Sino | 12 pre-rendered poses, poster, OG image, GLB v005 (draco); realtime 3D hero on Home (hover, click, scroll, look-at); every still pose floats and lifts (`AnimatedPose`) | CPR-70/69 #19, CPR-77 #31, CPR-92 #25 |
| Pages | Home, Services list and detail, Product (AI agents), Contact and thank-you (WhatsApp only), About, Privacy policy, 404 | CPR-36/43 #21, CPR-37 #23, CPR-39/79 #26, CPR-42/47 #27, CPR-41 #36, CPR-35 #37 |
| WhatsApp | Contextual message per page (general, product, service, thank-you); number `+6285199368510` | Built into CPR-32 and CPR-42. CPR-45 can be closed after a check |
| Deploy | Vercel readiness: the admin is off in production through `ADMIN_ENABLED`, `SITE_INDEXABLE=false` (not indexed yet), headers | CPR-94 #33, #35 |

## 2. Half done (branch pushed, resume from here)

Every branch is on GitHub. Branches marked "WIP" end with a `chore(wip)` commit whose gates were **not** run. Before a PR: rebase on `origin/main`, run `for g in format:check lint typecheck test build; do npm run $g; echo $?; done` (all must be 0), check the pages in a browser, then squash the WIP commit into proper Conventional Commits.

| Ticket | Branch | State | What is left |
|---|---|---|---|
| CPR-40/44 Blog list and article | `faishal/cpr-40-blog-pages` | 6 commits: blog query, model, metadata, JSON-LD, share logic, and the shared safe rich-text renderer. Stopped at the build step | Finish the list and article pages, then run the gates and a browser check. Then switch About (story) and Privacy (body) to the shared rich-text renderer. Content is in §3.2 |
| CPR-96 Animated Sino loops | `faishal/cpr-96-sino-loops` | `SinoLoop` component complete. All gates pass (the build passes when `.env` exists). Wired into Home Meet Sino, the final CTA, TwoPaths, thank-you and 404. Every loop is `ready: false`, so the stills still show | Render the remaining loops, copy them into `public/mascot/loops/` as `sino-loop-{wave,phone,build,thumbs,confused}.{webm,mov,webp}`, set `ready: true`, then check Chrome and Safari |
| CPR-96 loop renders | Mascot project (not git): `sino-3d-mascot/scripts/loops/` (render, encode, fringe check, montage) | Done: `L-wave` (`export/loops/web/L-wave.webm`, `.mov`, `-poster.webp`). Partial: `L-phone`. Not started: `L-build`, `L-thumbs`, `L-confused` | Run `scripts/loops/run_all.sh` per loop. Check each loop is 900 KB or less and has no fringe on white or `#EAF6F6` |
| CPR-98 Favicon and manifest | `faishal/cpr-98-favicon` (WIP) | Icons generated (`favicon.ico`, `icon.svg`, `apple-icon.png`, 192 and 512 PNGs), `manifest.ts`, tests, and the proxy matcher fix (`4251255`). The WIP commit also changes `package.json` and the lockfile (a dependency for the icon script). Review it | Run the gates. Check that `/favicon.ico`, `/icon.svg`, `/apple-icon.png` and `/manifest.webmanifest` return 200 on a production build and that the icon shows in the tab. Drop the dependency if it is not needed at runtime |
| CPR-52/57 SEO basics | `faishal/cpr-52-57-seo` | 3 commits. Scope: metadataBase, a unique title, description and canonical per page, OG and Twitter tags, `sitemap.ts`, `robots.ts` from `isIndexable`, Organization and WebSite JSON-LD, a 404 in production for `/dev-ui`, noindex for the `/work` placeholder | Check which of the scope is in the commits, finish the rest, run the gates, and curl `/robots.txt`, `/sitemap.xml` and the canonical tags. Add the blog URLs to the sitemap after the Blog work merges |
| README | `faishal/docs-readme` | Done and checked: an English README (what Sineva is, setup, docs map), and the admin material moved to `docs/runbooks/admin-and-database.md` | Open the PR, tag Farhan (the runbook is his material) and merge |

## 3. Planned only (implement later)

### 3.1 "How we work" section revamp

**Problem:** the product owner says the current "How we work" section (`src/components/sections/sticky-steps.tsx`, content in `src/content/static/pages.ts`) looks generic and "AI made". Big "01 Talk ..." numerals next to text blocks are a common template pattern and carry no brand character.

**Direction (pick one with the product owner first):**

| Option | Idea | Notes |
|---|---|---|
| A. Journey path | One curved teal path (the logo's arc shape) runs down the section. Each step is a stop on the path with a small Sino pose doing that step: talking (`L-wave`), thinking (magnifier), building (blocks), handing over (thumbs). The path draws itself with scroll (SVG `stroke-dashoffset`) | Most on brand, reuses the poses and loops. **Recommended** |
| B. Sticky stage | The left side holds one large sticky Sino stage that changes pose per step; the right side scrolls short step cards. Sintra style | Matches the Sintra reference, already partly in `StickySteps` |
| C. Horizontal cards | Scroll-snapped cards with a mini illustration, a short title and one line each | Simple and mobile friendly, least distinctive |

**Rules for any option:**
- Drop the large "01, 02" numerals as the main visual. If numbers stay, use a small pill (`Step 1`).
- Titles of 2 to 3 words, one line of copy each, simple English, no dashes.
- Each step gets a visual (a pose, loop or icon), not text only.
- Reduced motion turns it into a static list. Animate transform and opacity only. Mobile first.
- Keep the step data in `pages.ts` so the CMS can own it in phase 2.

**Steps to implement:**
1. Mock two options in a browser or Figma.
2. The product owner picks one.
3. Write TDD tests for the new section component: the order of the step data, the reduced-motion list, and accessible headings.
4. Build it, then check the Home and Services pages in Chrome and on mobile width.
5. Copy pass with the CPR-97 rules.

Ticket: create a new CPR ticket "[Home] How we work section revamp" (not created yet).

### 3.2 Blog content

**Problem:** the blog pages are not merged yet (§2), and the static posts in `src/content/static/posts.ts` are drafts. The site needs real articles before the blog is linked prominently.

**Plan:**
1. Finish and merge CPR-40/44 (§2) with the current draft posts.
2. Write 3 to 5 launch articles for small business owners. Simple English, practical, no unverified claims or statistics, no dashes. Suggested topics, matching the services:
   - "Where AI can help a small business first"
   - "Getting your business information ready for AI"
   - "Chatbot or AI agent: what is the difference"
   - "How to run a small AI pilot in 30 days"
   - "Keeping customer data safe when you use AI"
3. Each article needs:
   - a title of 60 characters or fewer;
   - a description of 160 characters or fewer;
   - a cover (a Sino pose or a simple illustration);
   - 600 to 1,000 words;
   - one CTA at the end (Book a free consultation or Chat on WhatsApp);
   - an author ("Sineva team").
4. Add them in `posts.ts`, run the copy lint, and add the URLs to the sitemap (CPR-57).
5. Until real articles exist, consider hiding the Blog nav link or showing a short "Articles coming soon" state rather than placeholder posts.

### 3.3 Sino jetpack launch animation

The full plan is in [2026-10-16-sino-jetpack-launch.md](2026-10-16-sino-jetpack-launch.md), ticket CPR-99.

### 3.4 Content sweep (CPR-97)

After the Blog work merges, sweep every page: no empty sections, simple wording, CTAs of 2 to 4 words, no em or en dash, metadata included. Include a before and after list of the strings in the PR.

### 3.5 Other open items

| Item | Ticket | Notes |
|---|---|---|
| P1 loops (5 capability cards, 3 service cards) | CPR-96 follow-up | After the P0 loops ship |
| 3D device props (phone, laptop, chat cards) | CPR-95 | Plan in `docs/design/3d-asset-requirements.md` §3.8 |
| Lottie library L3 to L10 | CPR-71 | |
| Analytics (Umami) | CPR-51 | Needs a host decision |
| Security headers and CSP | CPR-53 (Farhan) | Draco needs `worker-src blob:` and `'wasm-unsafe-eval'`; the logo intro needs the inline script hash (motion.md §3.1) |
| Playwright E2E, Lighthouse CI, accessibility audit, device testing | CPR-56, CPR-58, CPR-59 | Known baselines: mobile Lighthouse on Home is 88; Android FPS for the Sino hero is untested |
| Portfolio (`/work`) | CPR-38, CPR-16 | No content decided yet; keep it noindex and out of the nav |
| Language switcher | CPR-34 | Only when a second locale is added |
| Content still missing from the owner | none | Contact email and the legal entity details are empty in `src/content/static/site-settings.ts`; the privacy policy needs legal review (operator, providers, retention) |
| `.env.example` keys | CPR-94 | Add `SITE_URL`, `SITE_INDEXABLE` and `ADMIN_ENABLED`. Editing this file was blocked by a permission rule, so a person must do it |
| Git auto-deploy | CPR-94 | The repo owner must install the Vercel GitHub App. Until then, deploy with the CLI as in `docs/deploy/vercel.md` |
| Known small issues | none | The GLB file name has no hash (no immutable cache); the body scroll lock causes CLS of about 0.5; the floating WhatsApp label shifts layout; some poses are weak (handshake, laptop, blocks, confused) |
| CMS and admin, infra (Coolify, Cloudflare, domain, Resend, backups) | Farhan's tickets | Phase 2 |

## 4. Local worktrees

Unfinished work lives in local worktrees under `.claude/worktrees/` (git-ignored) and on the pushed branches above. Once a branch is merged, remove its worktree: `git worktree remove .claude/worktrees/<name>`.
