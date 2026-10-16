# Sineva Company Profile

## What Sineva is

Sineva is an AI consulting company with two paths, shown side by side on the website:

- **Product:** Sino AI agents for small businesses (UMKM, Indonesian micro, small and medium enterprises). One agent handles many everyday tasks. Coming soon.
- **Services:** AI consulting in three parts. **AI Discovery** finds where AI fits, **AI Build** creates custom agents and automations, and **AI Enablement** trains teams and supports them after go-live.

This repository is the Sineva company profile website. Its main job is to turn visitors into prospects who contact Sineva for a consultation, and its second job is to collect interest in the product. The first launch (phase 1) is a static site in English, ready for more languages later. See the [positioning](docs/design/brand-positioning.md) and the [PRD (Rev. 3)](docs/prd/2026-10-14-company-profile-prd.md) for the full picture.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- next-intl for i18n
- Tailwind CSS 4
- three.js for the Sino 3D mascot in the hero, plus GSAP and lottie-web for motion
- Vitest and Testing Library for tests, ESLint and Prettier for code quality
- Optional admin and database (not needed for phase 1): Better Auth, Drizzle ORM, PostgreSQL, S3 client for media storage

## Setup

### Prerequisites

- Node.js 24.21.0 (pinned in `.nvmrc`, `package.json` requires `>=24.15.0 <25`) and npm
- Docker, only if you want to run the admin or the database

### Run the public site (phase 1)

```bash
nvm use
npm ci
npm run setup:env
npm run dev
```

Open `http://127.0.0.1:3000`.

The public site does not need PostgreSQL to run `dev` or `build`. Public content is static (`src/content/static` and `messages/`), and nothing connects to a database at build or at runtime. The build does need `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to be set, because the admin routes read them while Next.js collects page configuration. Without them `npm run build` fails with `DATABASE_URL is required`. `npm run dev` serves the public pages even without them. `npm run setup:env` creates a `.env` with random values for all of them. It refuses to overwrite an existing `.env`, and it never prints the values. The `DATABASE_URL` it writes only has to be a valid URL for the build, no database has to be running.

### Optional: admin and database

The admin (`/admin`) needs PostgreSQL, migrations and a bootstrap Admin account. Follow the [admin and database runbook](docs/runbooks/admin-and-database.md). Media storage is covered in the [SeaweedFS runbook](docs/runbooks/seaweedfs.md).

### Quality gate

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` runs the unit tests only and needs no database.

### Deploy

Phase 1 deploys to Vercel: see [docs/deploy/vercel.md](docs/deploy/vercel.md).

## Docs map

- [docs/prd](docs/prd/2026-10-14-company-profile-prd.md): product requirements
- [docs/design](docs/design/README.md): design system, brand positioning, copy rules
- [docs/deploy](docs/deploy/vercel.md): deployment
- [docs/runbooks](docs/runbooks/admin-and-database.md): admin, database and storage runbooks
- [docs/architecture](docs/architecture/README.md): architecture and decisions
