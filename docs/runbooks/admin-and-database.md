# Admin and database runbook

Everything here was moved from the repository README. It covers the custom admin (no headless CMS), PostgreSQL, Better Auth, Editor accounts, migrations, the test databases and the dependency audit. The phase 1 public site does not need any of it to run (see the [README](../../README.md) and the [Vercel runbook](../deploy/vercel.md)).

## Status

Sineva Compro is a Next.js App Router website with a **custom admin and no headless CMS**. The foundation provides PostgreSQL, Better Auth authentication, login/logout, operator bootstrap and a basic dashboard. Public ID/EN routing and shell are available through CPR-25. Business content, blog, media, SEO, mini-CRM and integrations follow in later tickets. The chatbot product is developed separately.

The CPR-7 foundation was integrated through [PR #1](https://github.com/farhanfadillahr/sineva-compro/pull/1), squash commit `641d867`. CPR-24 added Editor management, server authorization and account lockout; its test evidence is in the [CPR-24 validation](../architecture/cpr-24-account-access-validation.md). Not deployed yet.

## Runtime and dependencies

Node **24.21.0 LTS** per `.nvmrc`, engine `>=24.15.0 <25`. Next **16.4.0**, React **19.2.6**, Better Auth + adapter + CLI **1.7.7**, Drizzle ORM **0.45.4**, Drizzle Kit **0.31.11**, pg **8.23.1**, PostgreSQL **17.11-bookworm**. Direct versions are exact, the lockfile is tracked, and installation uses `npm ci` without force or legacy-peer-deps. Version and peer numbers were checked against the registry on 14 October 2026.

[Better Auth integration](https://better-auth.com/docs/integrations/next), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [Drizzle migrations](https://orm.drizzle.team/docs/migrations).

## Fresh local setup (admin and database)

Prerequisites: Node 24, npm, Docker Engine/Desktop and Compose v2. Run from the root of this checkout.

```bash
nvm use
npm ci
npm run setup:env
docker compose up -d --wait --wait-timeout 90 postgres
npm run db:migrate
npm run bootstrap:admin -- --confirm-database=sineva_compro_app
npm run dev
```

Bootstrap asks for the name/email and a hidden password through the terminal. The password is 12 to 128 characters, has no default value, and is neither passed as an argument nor printed. The database must be confirmed explicitly. A remote target needs an additional `--allow-remote`, only for operators who deliberately prepare that environment.

Website: `http://127.0.0.1:3000`. Admin: `http://127.0.0.1:3000/admin`, anonymous visitors are redirected to `/admin/login`. Public signup and the library's CRUD/operator endpoints over HTTP stay closed. Editor management is available through the Users page and authorized Server Actions. The library's per-IP rate limit still applies in addition to the account lockout.

The admin is on by default in development. In production it is off unless `ADMIN_ENABLED=true` (`src/proxy.ts`).

`setup:env` creates a mode 600 `.env` with random credentials, does not print the values, and refuses to overwrite. `.env.example` documents the developer/test DB URLs, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. The auth origin must match the application origin. Do not use production credentials for local/test, and do not print `docker compose config`; use `--quiet`.

The PostgreSQL URL validates the target before the driver is created. Query parameters only support a single `sslmode=verify-full` or `sslmode=disable`; host/port/credential overrides, fragments and TLS file reads through the query are rejected. Additional TLS configuration follows reviewed provisioning. Auth logs contain only fixed categories, with no raw messages/errors, tokens or SQL parameters.

## Managing Editor accounts

Sign in as Admin and choose **Pengguna** (Users). The Admin can add an Editor with a name/email/initial password, change the name/email, deactivate/activate accounts and replace the password. Admin accounts are shown read-only; creating an Admin still goes through operator bootstrap. Permanent deletion, role promotion, email invitations and self-service forgot-password are not available.

The password is 12 to 128 characters. Changing the email/password/status revokes all of the Editor's sessions in the same transaction; changing only the name does not force a logout. Reactivation does not bring old cookies back to life. Editors have content access, without the Users menu/access, Leads or Waitlist export. Every future feature must use a capability guard on its own query/action/preview/upload/export.

Five consecutive wrong passwords lock the account for 15 minutes, across every HTTP login path and regardless of IP. A successful login on an unlocked account resets the counter; after the lock expires, new attempts start a new cycle. A correct password during the lock produces no session and does not extend the lock. The lockout applies to new logins; sessions that are already active remain subject to expiry, logout, deactivation and revocation.

The `auth_lockout` state is stored in PostgreSQL, separate from the generator-produced auth schema. The transaction locks the account row, uses database time, verifies the password through the library, and returns the cookie only after commit. A database failure/timeout produces a 503 without a cookie; rate limit, CSRF and malformed requests are not counted as wrong passwords. A wrong password and a nonexistent/inactive/locked account use the same generic response. No constant-time claim is made.

## Transition for checkouts that previously used Payload

The old `sineva_compro` / `sineva_compro_test` databases and developer volumes are kept. The new application uses `sineva_compro_app` / `sineva_compro_app_test`; password hashes/sessions are not migrated automatically.

On an already initialized volume, changing `POSTGRES_DB` does not create a new database. Create the replacement database explicitly if it does not exist yet:

```bash
docker compose exec -T postgres createdb -U sineva sineva_compro_app
docker compose exec -T postgres-test createdb -U sineva sineva_compro_app_test
```

The second command is only for a test service that is already running. On a genuinely new service/volume, Compose initializes the new name from the configuration. Do not run `down -v`, drop the schema, or delete developer data to resolve an error.

Update `.env` with the new URLs and a random Better Auth secret; keep the old credentials safely if they are still needed. On the checkout used for this task, `.env.payload-legacy` holds the previous configuration (Git-ignored, mode 600). The actual developer port is **5434** because 5432 is used by another application; test is **5433**. Adjust the port and URL pairs when using this checkout.

## Public ID/EN routing

Note: this section describes the CPR-25 behavior (`localePrefix: 'always'`, `id` and `en`). PRD Rev. 3 changes this to `'as-needed'` with English only (see PRD section 10).

Public URLs are always prefixed with `/id` or `/en`. Examples: `/id/layanan/ai-otomasi` and `/en/services/ai-automation`, `/id/tentang-kami` and `/en/about`. A visit to `/` picks a valid `NEXT_LOCALE` cookie, then the `Accept-Language` weights, then `id`; a prefixed URL determines the language even when the cookie/browser differs. The query is kept on redirects. `/admin`, `/api`, `/_next` and `/brand` stay unprefixed.

`src/i18n/routing.ts` is the single source of pathnames; use the helpers from `src/i18n/navigation.ts` for public navigation. UI text only loads the active locale's dictionary, with no cross-language fallback. Add the same keys to both dictionaries; a unit test checks that they match. The admin stays Indonesian with its own root layout.

Public pages are currently a temporary shell and noindex. Blog/portfolio/service details without published data still return 404; CPR-27/30/31 handle the schema, constraints/queries and the integration of real content. `resolveTranslatedHref` accepts a translation reference with kind/identity/locale/published status; a missing post target leads to the blog list, other kinds become unavailable. The ID/EN toggle and its interaction are handled in CPR-34. Full hreflang/SEO follows in CPR-52.

Next 16.4 sends a temporary error shell for `notFound()` responses; the browser renders the locale's 404 layout after hydration. The HTTP 404 status, noindex and 404 text are tested over HTTP; the lang attribute on the 404 is checked in the browser DOM. Details of the evidence and its limits: [CPR-25 validation](../architecture/cpr-25-i18n-validation.md).

## Structure and module boundaries

- `src/app/(public)/[locale]/`: ID/EN public page shell and the localized 404.
- `src/i18n/`: pathname registry, navigation, active dictionary request and the slug resolver contract.
- `messages/`: UI dictionaries `id.json` and `en.json` with the same keys.
- `src/app/(admin)/admin/`: login and the authorized shell/dashboard; UI v1 is Indonesian with a light theme.
- `src/app/api/auth/[...all]/`: allowlist for login/logout/session and disabled signup, with no content CRUD API.
- `src/features/auth/`: library schema, atomic bootstrap, authoritative guard and the login/lockout policy.
- `src/features/users/`: parser, atomic query/service, actions and the Editor management components.
- `src/lib/db/`: pool/ORM factory for CLI/test and the server instance with `server-only`, one pool per process.
- `src/lib/auth/`: library configuration factory and separate server/client entries.
- `drizzle/`: versioned SQL migrations and metadata; startup does not create the DB/schema.
- `scripts/`: environment setup, migration and operator bootstrap.
- `tests/`: pure rules, real PostgreSQL, process CLI and Next.js HTTP.

The root layout stays a Server Component. Sessions, tokens/hashes and admin queries do not enter the public cache. The client only receives the Principal (ID/name/role) or a limited Users DTO (ID/name/email/role/status). Every authorized query/action calls its own server guard, instead of relying on the menu/layout.

## Migrations and schema

```bash
npm run auth:generate
npm run db:generate -- --name nama_perubahan
npm run db:check
npm run db:migrate
```

The auth generator uses the pinned CLI and the formatter; review the schema/SQL/indexes/foreign keys before applying. Migrations are tracked by Git and idempotent through the journal. No schema push and no automatic migration when the application starts. The initial migration is named `0000_auth_foundation`.

Bootstrap uses a time-limited advisory lock, rechecks whether a user exists after the lock, then creates the account and credential through the library API in a single transaction. Repeating it or running two processes does not create a second Admin. There is no anonymous create-first-user page.

## Testing

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

The test DB only accepts loopback and the name `sineva_compro_app_test`, with no fallback to the developer database. The bootstrap suite needs an empty test DB; fixtures belong only to the suite and are cleaned up by their identity. Do not delete developer accounts to make tests pass.

```bash
docker compose --profile test up -d --wait --wait-timeout 90 postgres-test
```

Run the migration and the server with **DATABASE_URL pointed at TEST_DATABASE_URL**, not at the developer DB. The following safe scripts check the target before running one of the commands:

```bash
npm run test:prepare
npm run test:database
npm run test:server
```

In a separate terminal after the test server is ready:

```bash
npm run test:integration
```

`test:server` uses the origin `http://127.0.0.1:3001`; for production HTTP, stop that dev server, run `npm run build`, then `npm run test:server -- --production`. Do not run the test DB suite and the HTTP suite at the same time, because both use bootstrap fixtures in the same DB.

## Dependency check

Audit of 14 October 2026 after the switch: four moderate findings in the Drizzle/esbuild migration tooling path; the full audit also shows five high findings in lint tooling (`braces`). There are no high/critical findings in the audit without dev dependencies. That esbuild tooling does not run a development server; lint only uses the repository source. No downgrade of Drizzle/framework and no `audit fix --force` was applied. Re-evaluate on upgrade; this result is not a claim that the application is fully safe.

## Documents and follow-up work

[PRD](../prd/2026-10-14-company-profile-prd.md) (the original text linked "PRD Rev. 2"; the file is now Rev. 3.1), [architecture](../architecture/README.md), [ADR](../architecture/decisions/2026-10-14-custom-admin.md), [CPR-7 plan](../superpowers/plans/2026-10-14-cpr-7-foundation.md), [custom foundation evidence](../architecture/custom-admin-foundation-validation.md), [Linear](https://linear.app/sineva-tech/project/company-profile-v1-ee7ed9a91d26).

This foundation does not yet cover the final marketing pages, content/blog/media CRUD, leads/waitlist, R2/Resend/analytics, CI or deploy. Follow CPR-23 and the next feature tickets; do not treat the dashboard shell as a complete admin or a launch-ready application.

The Payload plans/setup/verification in `docs` are labeled archive and only apply to the old commit `a7f00fb`. The original logo assets are unchanged; the public SVG is a byte-identical copy.
