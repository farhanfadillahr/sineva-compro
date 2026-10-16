# Vercel deployment runbook (phase 1)

| | |
|---|---|
| Scope | Phase 1 static public site on Vercel (CPR-94) |
| Not in scope | The CMS phase (admin, PostgreSQL, SeaweedFS), which moves to VPS + Coolify ([PRD §14.2](../prd/2026-10-14-company-profile-prd.md), CPR-8, CPR-11) |
| Security headers | Baseline only. The full Content-Security-Policy is CPR-53 |

Phase 1 has no CMS, so the public site needs neither the admin nor a database. The admin code is still in the repository, so the deployment has to switch it off and still build. Both are covered below.

## 1. Phase 1 limitations

- **No admin.** `/admin/**` and `/api/auth/**` answer a bare `404` while `ADMIN_ENABLED` is off (the production default). Do not set `ADMIN_ENABLED=true` on Vercel: there is no database to back it.
- **No database.** Nothing connects to PostgreSQL at build or at runtime. The `DATABASE_URL` below is a build-time placeholder only.
- **Contact goes through the WhatsApp composer.** The site builds a `wa.me` link from the visitor's message. There is no form backend, no email sending, and no stored leads.
- **Content is static.** It comes from `src/content/static` and `messages/`. A content change is a code change and a new deployment.
- **SEO routes are available.** `/robots.txt` follows the indexing switch, and `/sitemap.xml` includes public pages and published articles. Preview and prelaunch deployments remain noindex.

## 2. Import the project

1. In Vercel, **Add New > Project**, import the Git repository, and select the team.
2. **Framework Preset:** Next.js (auto-detected).
3. **Root Directory:** repository root (`./`).
4. **Install Command:** leave the default. Vercel detects `package-lock.json` and uses `npm ci`.
5. **Build Command:** `npm run build` (the default for Next.js is `next build`, which is what the script runs).
6. **Output Directory:** leave the default.
7. **Node.js Version:** **24.x** (Project Settings > Build and Deployment > Node.js Version). `package.json` pins `engines.node` to `>=24.15.0 <25`, and Vercel maps a range like this to the latest 24.x. Vercel supports Node 24.x: <https://vercel.com/docs/functions/runtimes/node-js/node-js-versions>.
8. Enable **Automatically expose System Environment Variables** (Project Settings > Environment Variables). The site reads `VERCEL_ENV`, `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL`, which exist only when this is on: <https://vercel.com/docs/environment-variables/system-environment-variables>.
9. Set the environment variables (section 3) **before** the first deployment.
10. Production Branch: `main`.

## 3. Environment variables

Vercel applies a changed variable only to new deployments, so redeploy after every change: <https://vercel.com/docs/environment-variables>.

`SITE_URL` and `SITE_INDEXABLE` are read when the public layout is evaluated, which is at build time for prerendered pages.

| Name | Required | Example | Purpose | Environments |
|---|---|---|---|---|
| `SITE_URL` | Production: yes. Preview: no | `https://www.sineva.example` | Public origin. Feeds `metadataBase`, so canonical and Open Graph URLs are absolute. Must be an `http(s)` origin with no path, query or credentials, otherwise the build fails on purpose. When unset it falls back to `https://$VERCEL_PROJECT_PRODUCTION_URL` on a production deployment, then `https://$VERCEL_URL`, then `http://127.0.0.1:3000`. | Production. Leave unset on Preview so each preview points at itself. |
| `SITE_INDEXABLE` | Production before launch: no. At launch: yes | `true` | Launch switch for search engines. Only the exact string `true` allows indexing, and only on production. Anything else (unset, `false`, `1`) means `noindex, nofollow`. | Production only. Never set on Preview (it would be ignored there anyway). |
| `ADMIN_ENABLED` | No | unset | Admin switch. Unset in production means off. Only `true` turns it on. | Leave unset on Vercel. |
| `DATABASE_URL` | Yes, build-time placeholder | `postgres://placeholder:placeholder@127.0.0.1:5432/placeholder` | Read by the disabled admin routes while Next.js collects page configuration at build. No connection is made. See section 4. | Production, Preview |
| `BETTER_AUTH_SECRET` | Yes, build-time placeholder | output of `openssl rand -base64 32` | Same reason. At least 32 non-blank characters. Use a random value, not a real secret and not a value reused from another environment. | Production, Preview |
| `BETTER_AUTH_URL` | Yes, build-time placeholder | same value as `SITE_URL` | Same reason. An `http(s)` origin, no path. On Preview any valid origin works, for example `https://preview.invalid`. | Production, Preview |
| `LOGO_INTRO_FORCE` | No | `1` | Lets the first-load splash play for automated browsers (webdriver), Sino clip included. Debug only. | Do not set |
| `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL` | Provided by Vercel | `production`, `my-site-abc.vercel.app`, `my-site.com` | System variables. `VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are host names without `https://`; the code adds the scheme. `VERCEL_PROJECT_PRODUCTION_URL` is set on preview deployments too, which is why the code only uses it when `VERCEL_ENV` is `production`. | Set by Vercel |

No real secret belongs in this project in phase 1. Do not paste the local `.env` into Vercel.

## 4. Why the build needs placeholders, and why that is safe

`next build` collects the page configuration of every route, including `/admin/**` and `/api/auth/[...all]`, even though the proxy answers 404 for them at runtime. Those routes read the server environment (`src/env/server.ts`) while being collected, so without the three variables the build stops with, for example, `Failed to collect configuration for /admin: DATABASE_URL is required`.

The placeholders satisfy the validators only:

- `DATABASE_URL`: protocol `postgres:` or `postgresql:`, a host, a database name, and no query parameters other than `sslmode` (`src/env/database-url.ts`). The loopback placeholder above passes.
- `BETTER_AUTH_SECRET`: at least 32 non-blank characters.
- `BETTER_AUTH_URL`: an `http(s)` origin without credentials, path or query.

It is safe because the database pool is created lazily (a `pg` `Pool` opens no connection until the first query), nothing queries at build, and with `ADMIN_ENABLED` off the proxy returns 404 before any admin or auth code runs.

Verified: with no `.env` file and only `SITE_URL`, `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` set, `npm run build` exits 0. With `DATABASE_URL` alone it fails on `BETTER_AUTH_SECRET`, so all three are needed.

The clean fix, when the admin owner has time, is to read the server env lazily inside the request handlers instead of at module or page-config evaluation. Until then these placeholders stay in the project settings.

## 5. Preview deployments

- Every non-production deployment is `noindex, nofollow` through the `robots` meta tag, because `VERCEL_ENV` is not `production`. `SITE_INDEXABLE` cannot override this.
- Vercel also adds `X-Robots-Tag: noindex` to preview deployments, but omits it when a custom domain is assigned to a non-production branch (<https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines>). The meta tag still applies there.
- Canonical and Open Graph URLs on a preview point at that preview's own `VERCEL_URL`, not at production.
- Keep Vercel Deployment Protection on for previews so unreleased copy is not public.

## 6. Domains

1. Project Settings > Domains > add the production domain (and its `www` or apex counterpart). Follow the DNS records Vercel displays. Pick one canonical host and let the other redirect to it.
2. Set `SITE_URL` to the canonical origin, for example `https://www.sineva.example`, on **Production**, then redeploy.
3. `VERCEL_PROJECT_PRODUCTION_URL` is the shortest production custom domain, or the `vercel.app` domain when none exists. It is only the fallback when `SITE_URL` is unset. Prefer setting `SITE_URL` so the canonical host does not depend on that choice.

## 7. Headers

Set in `next.config.mjs`:

- `/mascot/*`, `/draco/*`, `/lottie/*`, `/og/*`: `Cache-Control: public, max-age=31536000, immutable`.
- All routes: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`.
- No Content-Security-Policy (CPR-53).

Gotcha: immutable for a year means a replaced file at the same URL is not picked up by returning visitors or by social crawlers. Give changed files a new name (for example `sino-v2.glb`, `default-v2.png`) and update the references.

## 8. Rollback

Vercel Instant Rollback, from <https://vercel.com/docs/instant-rollback>:

1. Project overview > Production Deployment tile > **Instant Rollback** (or Deployments > the row's menu > Instant Rollback).
2. Pick the earlier production deployment and confirm. Domains move back immediately.
3. After a rollback Vercel stops auto-assigning production domains, so new pushes to `main` do not go live. Use **Undo Rollback** (or `vercel promote <deployment-url>`) to resume.
4. A rollback does not change environment variables. The old deployment keeps the values it was built with, and a new variable value needs a new deployment, not a rollback.
5. Fix forward on `main`, then undo the rollback by promoting the fixed deployment.

Hobby plans can only roll back to the previous deployment.

## 9. Verify a deployment

Replace `$URL` with the deployment URL.

```bash
curl -sI $URL/                          # 200, security headers present
curl -sI $URL/services                  # 200
curl -sI $URL/admin                     # 404, no body
curl -sI $URL/api/auth/get-session      # 404, no body
curl -sI $URL/mascot/sino.glb           # 200, Cache-Control: public, max-age=31536000, immutable
curl -s  $URL/ | grep -oE '<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>'
```

Expected on a preview: `noindex, nofollow` and a canonical on the preview host. Expected on production after launch: `index, follow` and a canonical on `SITE_URL`.

## 10. Go-live checklist

- [ ] Project imported, Node.js 24.x, framework Next.js, production branch `main`.
- [ ] Automatically expose System Environment Variables is on.
- [ ] `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` set as build-time placeholders (Production and Preview). No real secret in the project.
- [ ] `ADMIN_ENABLED` is not set. `/admin` and `/api/auth/get-session` return 404 on the production URL.
- [ ] Production domain added and verified; `www` and apex redirect to one canonical host.
- [ ] `SITE_URL` set to the canonical origin (Production only).
- [ ] A preview deployment checked: `noindex, nofollow`, canonical on the preview host.
- [ ] Section 9 commands pass against the production URL while still `noindex`.
- [ ] Copy, legal pages and the WhatsApp number are final.
- [ ] At launch: set `SITE_INDEXABLE=true` on Production, redeploy, and confirm the meta robots is `index, follow`.
- [ ] Rollback target noted (the last known good production deployment).

## 11. Manual deployment from this local checkout

The local `.vercel/project.json` links this checkout to the existing `sineva` project. From the repository root:

```bash
npx vercel --prod
```

The CLI uploads the current local source and Vercel builds it. A separate local build is optional. Use `npx vercel` for a preview. If authentication is requested, run `npx vercel login` using the project owner account. On a fresh checkout, use `npx vercel link` and select the existing project before deploying.

GitHub setup was postponed by the owner earlier on 2026-10-16. At the final PR check, the project API showed a GitHub link to `farhanfadillahr/sineva-compro`, production branch `main`. PR #47 preview was `BLOCKED` with `TEAM_ACCESS_REQUIRED`: the commit author does not have permission to create deployments for this project. Connection alone does not prove a successful deployment. Use the manual command if needed, and verify the resulting deployment URL using section 9.
