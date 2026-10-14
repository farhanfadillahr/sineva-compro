# CPR-7 — Next.js + Payload Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyediakan fondasi Compro yang berjalan lokal, memiliki admin Payload dan PostgreSQL, serta lulus lint, typecheck, test, dan build.

**Architecture:** Satu aplikasi Next.js App Router dengan dua root layout: `(frontend)` untuk website dan `(payload)` untuk CMS/API. Payload memakai adapter PostgreSQL; database lokal dijalankan melalui Docker Compose. Konfigurasi server divalidasi saat dimuat, dan perubahan schema memakai migration yang disimpan di Git.

**Tech Stack:** Node.js 24 LTS, npm, Next.js 16, React 19, Payload 3, PostgreSQL 17, TypeScript, Tailwind CSS 4, next-intl 4, ESLint, Prettier, Vitest.

**Spec:** [PRD final](../../prd/2026-10-14-company-profile-prd.md), terutama §13.3, §14, §15, dan §16; [CPR-7 di Linear](https://linear.app/sineva-tech/issue/CPR-7/infra-inisialisasi-kerangka-nextjs-payload-v3).

**Base commit:** `393b487` pada `main`. Pada saat perencanaan, repo hanya berisi PRD, aset brand, dan script tracing. Rencana ini belum merupakan implementasi yang diuji.

**Architecture reference:** [Batas modul dan struktur aplikasi](../../architecture/README.md). Compro memakai modular monolith; modul fitur bertambah sesuai tiket, sementara CPR-7 tetap hanya membangun fondasi.

## Global Constraints

- “Next.js (App Router) + TypeScript, dengan Payload CMS v3 terpasang di dalam aplikasi yang sama.”
- “Database: PostgreSQL.”
- “Repo: `sineva-compro` (Git), terpisah dari repo chatbot.”
- “Versi Next.js dan Payload dikunci (*pin*) dan hanya dinaikkan secara sengaja.”
- “Semua secret disimpan di environment variable dan tidak pernah di-commit ke repo.”
- “Lingkungan kerja: lokal (Postgres via Docker Compose) → preview (per PR) → production.”
- Tailwind dan next-intl terpasang; routing ID/EN adalah CPR-25. Mode terang/gelap adalah CPR-65; design system adalah CPR-26.
- Users pada tiket ini hanya fondasi autentikasi. Peran Admin/Editor, lockout, dan pengujian izin lengkap merupakan CPR-24.
- CI GitHub Actions adalah CPR-10; VPS, container production, serta preview deployment adalah CPR-11. Tidak menambahkan workflow deploy, akun cloud, atau mengubah DNS dalam CPR-7.
- Homepage hanya membuktikan kerangka bekerja. Halaman marketing, koleksi konten, formulir, analitik, dan widget chatbot tidak termasuk tiket ini.
- Aset brand, script tracing, dan PRD dipertahankan. Jangan menjalankan generator aplikasi di root repo sehingga menimpa aset atau dokumen.

## Review Focus

1. Secret kosong/pendek atau URL database keliru: proses menolak konfigurasi dengan nama variabel, tanpa membocorkan nilainya; unit test pada Task 1.
2. PostgreSQL belum siap atau port dipakai aplikasi lain: healthcheck memiliki batas waktu dan gagal terlihat; konfigurasi port serta connection string harus konsisten; pemeriksaan operasional pada Task 2.
3. API Users dipanggil tanpa login: data pengguna tidak terbaca dan pembuatan pengguna biasa ditolak; HTTP integration test pada Task 3.
4. Bootstrap akun pertama dan restart database: admin pertama dibuat lewat `/admin`, akun kedua tidak bisa dibuat lewat bootstrap, dan akun pertama tetap bisa login setelah restart; pemeriksaan manual pada Task 4.
5. Build production atau CSS admin rusak walau dev berjalan: uji `/` dan `/admin` pada server production, cek keduanya secara visual, serta pastikan regenerasi types/import map tidak mengubah Git; Task 4.

## Keputusan teknis dan sumber

### Versi dan runtime

Baseline yang dapat dilacak ke source resmi adalah Payload `3.85.0`, Next.js `16.2.9`, dan React/React DOM `19.2.6`. Semua paket langsung `@payloadcms/*` harus memakai `3.85.0` yang sama. Ini baseline kompatibilitas, bukan klaim bahwa seluruh versi tersebut adalah rilis terbaru pada waktu eksekusi. [Peer dependencies Payload 3.85.0](https://github.com/payloadcms/payload/blob/v3.85.0/packages/next/package.json) mendukung Next.js `>=16.2.6 <17.0.0`; [template pada tag yang sama](https://github.com/payloadcms/payload/blob/v3.85.0/templates/blank/package.json) menyediakan acuan React.

Sebelum mengunci manifest, cek publikasi, peer dependencies, dan advisory dengan npm registry. Jika baseline memiliki advisory yang relevan, naikkan ke patch stabil yang didukung, samakan seluruh versi Payload, dan catat versi final beserta alasan di README. Tidak memakai `--legacy-peer-deps`, `--force`, canary, atau override untuk mengabaikan ketidakcocokan. `npm install --save-exact` menyimpan angka final; `package-lock.json` disimpan dan instalasi berikutnya memakai `npm ci`.

Target Node adalah `24.21.0` dengan engine `>=24.15.0 <25`. Node 24 termasuk LTS pada [jadwal resmi Node](https://nodejs.org/en/about/previous-releases). Node lokal yang ditemukan saat perencanaan adalah `26.5.0`; mengganti runtime sesi eksekusi perlu dilakukan sebelum instalasi, tanpa mengganti konfigurasi sistem secara global.

### Layout dan styling

Gunakan `(frontend)` dan `(payload)` sebagai dua root layout, tanpa `src/app/layout.tsx` bersama. CSS website hanya diimpor oleh layout frontend. Jangan memasang Tailwind Preflight sebagai stylesheet global bagi CMS. Halaman frontend tetap Server Component; tidak ada wrapper `use client` untuk seluruh aplikasi. Ini mengikuti [integrasi resmi Payload](https://payloadcms.com/docs/getting-started/installation) dan prinsip membatasi JavaScript client.

Tailwind 4 memakai plugin `@tailwindcss/postcss`, bukan konfigurasi Tailwind 3. next-intl cukup dipasang pada CPR-7: tidak membuat middleware/proxy bahasa atau membungkus `/admin` dengan provider bahasa. [Tailwind PostCSS](https://tailwindcss.com/docs/installation/using-postcss), [next-intl App Router](https://next-intl.dev/docs/getting-started/app-router).

### Database dan secret

Gunakan image `postgres:17.11-bookworm`, volume bernama, port terikat ke `127.0.0.1`, dan healthcheck. PostgreSQL pengujian memakai service terpisah, port 5433, serta database `sineva_compro_test`; pengujian tidak menghapus volume database developer. Tag dan direktori volume cocok dengan [image Postgres resmi](https://hub.docker.com/_/postgres).

Adapter menggunakan `push: false` dalam semua environment. Ini pilihan untuk tim campuran agar perubahan schema dapat direview dan startup tidak mengubah schema diam-diam. Migration awal dibuat dan dijalankan sebelum membuka admin. Jangan mencampur migration dan development push pada database yang sama. [Adapter Postgres](https://payloadcms.com/docs/database/postgres), [migration Payload](https://payloadcms.com/docs/database/migrations).

`.env` menjadi sumber konfigurasi lokal bagi Compose, Next.js, dan CLI Payload. Helper environment harus dapat dipakai oleh CLI dan Vitest: jangan menambahkan import `server-only` pada helper yang juga dimuat di Node biasa. Pembatasan server dijaga oleh lokasi import di `payload.config.ts`; secret tidak memakai prefix `NEXT_PUBLIC_`.

## Peta file

Path pada tabel relatif terhadap root `sineva-compro`.

| File | Tanggung jawab |
|---|---|
| `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc` | Dependensi, runtime, dan perintah yang konsisten |
| `tsconfig.json`, `next-env.d.ts` | TypeScript strict dan alias konfigurasi Payload |
| `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore` | Pemeriksaan kode tanpa memformat ulang arsip brand/PRD |
| `vitest.config.mts`, `vitest.integration.config.mts` | Unit test tanpa DB dan HTTP test terhadap aplikasi lokal |
| `.env.example`, `.gitignore` | Dokumentasi variabel dan pengecualian secret/generated output |
| `scripts/setup-env.mjs` | Membuat `.env` lokal dengan secret acak, tanpa menimpa file yang ada |
| `src/env/server.ts`, `tests/unit/server-env.test.ts` | Validasi variabel server dan kasus konfigurasi salah |
| `compose.yaml` | PostgreSQL developer dan service pengujian terpisah |
| `src/payload.config.ts`, `src/collections/Users.ts` | Konfigurasi Payload dan autentikasi dasar |
| `src/payload-types.ts` | Types yang dihasilkan Payload dan disimpan di Git |
| `src/migrations/` | Migration awal dan index yang dihasilkan CLI Payload |
| `src/app/(payload)/layout.tsx` | Layout CMS dari template resmi |
| `src/app/(payload)/admin/[[...segments]]/page.tsx` | Entry admin dari template resmi |
| `src/app/(payload)/admin/importMap.js` | Import map yang dihasilkan CLI |
| `src/app/(payload)/api/[...slug]/route.ts` | REST API Payload dari template resmi |
| `src/app/(payload)/custom.scss` | Entry CSS CMS; kosong dengan komentar penjelas |
| `src/app/(frontend)/layout.tsx`, `page.tsx`, `globals.css` | Website awal yang terpisah dari CMS |
| `next.config.mjs`, `postcss.config.mjs` | Integrasi framework dan compiler CSS |
| `tests/integration/foundation.test.ts` | Pemeriksaan halaman dan penolakan API Users tanpa login |
| `README.md` | Setup bersih, migration, testing, troubleshooting, dan batas tiket |

Tidak menambahkan GraphQL route pada tahap ini. `graphql` tetap dipasang jika diwajibkan peer dependency `@payloadcms/next`; penggunaannya tidak membuat endpoint publik tambahan.

## Persiapan eksekusi

- [ ] Baca PRD dan rencana ini. Pertahankan semua perubahan user yang muncul setelah base commit.
- [ ] Gunakan `superpowers:using-git-worktrees` saat mulai implementasi; pakai checkout terisolasi dan branch `farhanfadillahrafi/cpr-7-infra-inisialisasi-kerangka-nextjs-payload-v3` sesuai Linear. Rencana ini tidak membuat branch/worktree.
- [ ] Verifikasi `node --version`, `npm --version`, `docker --version`, dan `docker compose version`. Docker CLI ditemukan saat perencanaan, tetapi status daemon belum diperiksa.
- [ ] Aktifkan Node 24 LTS untuk sesi kerja melalui version manager yang sudah tersedia. Jika runtime belum tersedia, pasang runtime yang diperlukan melalui jalur persetujuan environment; jangan menjalankan instalasi global atau script shell unduhan yang tidak diperiksa.
- [ ] Periksa registry dengan perintah berikut dan simpan ringkasan versi final di README, tanpa menyalin konfigurasi/auth npm:

```bash
npm view payload@3.85.0 version engines
npm view @payloadcms/next@3.85.0 version peerDependencies
npm view @payloadcms/db-postgres@3.85.0 version engines
npm view next@16.2.9 version peerDependencies engines
npm view react@19.2.6 version
```

## Task 1: Runtime, tooling, dan konfigurasi server yang diuji

**Files:** Buat `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `vitest.config.mts`, `src/env/server.ts`, dan `tests/unit/server-env.test.ts`; tambah aturan aplikasi pada `.gitignore`.

**Interfaces:** Mengonsumsi environment sebagai `Record<string, string | undefined>`. Menghasilkan `readServerEnv(input): Readonly<{ databaseUrl: string; payloadSecret: string }>` yang tidak mengubah `process.env` dan tidak membuat koneksi database.

- [ ] **Step 1: Buat manifest dan instal dependensi.** Gunakan metadata dan scripts berikut:

```json
{
  "name": "sineva-compro",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24.15.0 <25" },
  "scripts": {
    "dev": "next dev --hostname 127.0.0.1",
    "build": "next build",
    "start": "next start --hostname 127.0.0.1",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "format:check": "prettier --check .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.mts",
    "setup:env": "node scripts/setup-env.mjs",
    "payload": "payload",
    "generate:types": "payload generate:types",
    "generate:importmap": "payload generate:importmap",
    "db:migrate": "payload migrate",
    "db:migrate:create": "payload migrate:create",
    "db:migrate:status": "payload migrate:status"
  }
}
```

Isi `.npmrc`: `save-exact=true` dan `engine-strict=true`, satu opsi per baris. Isi `.nvmrc`: `24.21.0`. Bila kompatibilitas registry telah lolos, jalankan:

```bash
npm install --save-exact next@16.2.9 react@19.2.6 react-dom@19.2.6 payload@3.85.0 @payloadcms/next@3.85.0 @payloadcms/db-postgres@3.85.0 @payloadcms/ui@3.85.0 graphql@16 dotenv@16 next-intl@4
npm install --save-dev --save-exact typescript@5.7.3 @types/node@24 @types/react@19.2 @types/react-dom@19.2 eslint@9 eslint-config-next@16.2.9 eslint-config-prettier@10 prettier@3 vitest@4 tailwindcss@4 @tailwindcss/postcss@4 postcss@8
```

Selector major pada beberapa argumen hanya digunakan saat instalasi pertama: hasil manifest harus berupa angka exact dan lockfile. Seluruh paket Tailwind harus berada pada minor yang sama. Jangan memasang editor rich text, storage, UI component kit, state manager, atau dependency chatbot untuk tiket ini.

- [ ] **Step 2: Buat konfigurasi compiler dan quality tools.** `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"], "@payload-config": ["./src/payload.config.ts"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next-env.d.ts` dibuat oleh Next.js ketika `typegen`, `dev`, atau `build` dijalankan; jangan menulis isinya manual atau mengabaikan error types. Pada Task 1 belum ada route aplikasi sehingga script typecheck masih memakai `tsc --noEmit`. Task 3 menambahkan `next typegen` sebelum `tsc` untuk memastikan fresh checkout juga memeriksa kontrak page/layout/route Next.js.

`eslint.config.mjs` memakai flat config:

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    '.next/**', 'node_modules/**', 'coverage/**', 'exports/**',
    'next-env.d.ts', 'src/payload-types.ts',
    'src/app/(payload)/admin/importMap.js'
  ])
])
```

Gunakan patch ESLint 9 yang menyediakan `defineConfig`; verifikasi dari hasil instalasi. Lint dijalankan terpisah dari build, sesuai [panduan ESLint Next.js](https://nextjs.org/docs/app/api-reference/config/eslint).

Isi `.prettierrc.json`:

```json
{ "singleQuote": true, "semi": false, "trailingComma": "all", "printWidth": 100 }
```

Isi `.prettierignore`:

```text
assets/
docs/
exports/
scripts/vectorize_logos.py
node_modules/
.next/
coverage/
package-lock.json
src/payload-types.ts
src/app/(payload)/
src/migrations/
```

Tambahkan `.gitignore`, sambil mempertahankan aturan exports/Python yang sudah ada:

```text
node_modules/
.next/
out/
coverage/
.vitest/
*.tsbuildinfo
next-env.d.ts
.env*
!.env.example
```

`vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    clearMocks: true,
  },
})
```

- [ ] **Step 3: Tulis unit test konfigurasi sebelum helper.** `tests/unit/server-env.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readServerEnv } from '../../src/env/server'

const valid = {
  DATABASE_URL: 'postgresql://local:local@127.0.0.1:5432/sineva_compro',
  PAYLOAD_SECRET: 'a'.repeat(48),
}

describe('server environment', () => {
  it('accepts a configured PostgreSQL URL and secret', () => {
    expect(readServerEnv(valid)).toEqual({
      databaseUrl: valid.DATABASE_URL,
      payloadSecret: valid.PAYLOAD_SECRET,
    })
  })

  it.each([undefined, '', ' '])('rejects a missing database URL: %s', (DATABASE_URL) => {
    expect(() => readServerEnv({ ...valid, DATABASE_URL })).toThrow('DATABASE_URL')
  })

  it.each(['invalid', 'https://example.com/db', 'postgresql://localhost']) (
    'rejects an unusable database URL: %s',
    (DATABASE_URL) => {
      expect(() => readServerEnv({ ...valid, DATABASE_URL })).toThrow('DATABASE_URL')
    },
  )

  it.each([undefined, '', 'short', ' '.repeat(48)])('rejects a weak/missing secret', (PAYLOAD_SECRET) => {
    expect(() => readServerEnv({ ...valid, PAYLOAD_SECRET })).toThrow('PAYLOAD_SECRET')
  })

  it('does not include secret or connection credentials in errors', () => {
    const value = 'https://private-user:private-password@example.com/private-db'
    try {
      readServerEnv({ ...valid, DATABASE_URL: value })
      expect.fail('Invalid URL was accepted')
    } catch (error) {
      const message = String(error)
      expect(message).toContain('DATABASE_URL')
      expect(message).not.toContain('private-password')
      expect(message).not.toContain(value)
    }
  })

  it('does not mutate the supplied environment', () => {
    const input = Object.freeze({ ...valid })
    readServerEnv(input)
    expect(input).toEqual(valid)
  })
})
```

Run: `npm test -- tests/unit/server-env.test.ts`. Expected: FAIL karena helper belum ada, bukan karena dependency/runtime salah.

- [ ] **Step 4: Implementasikan helper.** `src/env/server.ts`:

```ts
type Input = Record<string, string | undefined>

export function readServerEnv(input: Input): Readonly<{
  databaseUrl: string
  payloadSecret: string
}> {
  const databaseUrl = input.DATABASE_URL?.trim()
  if (!databaseUrl) throw new Error('DATABASE_URL is required')

  let parsed: URL
  try {
    parsed = new URL(databaseUrl)
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL')
  }
  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.pathname ||
    parsed.pathname === '/'
  ) {
    throw new Error('DATABASE_URL must include a PostgreSQL host and database')
  }

  const payloadSecret = input.PAYLOAD_SECRET
  if (!payloadSecret || payloadSecret.trim().length < 32) {
    throw new Error('PAYLOAD_SECRET must contain at least 32 nonblank characters')
  }
  return Object.freeze({ databaseUrl, payloadSecret })
}
```

Minimumnya 32 karakter bukan ukuran entropi; script pada Task 2 menghasilkan secret memakai cryptographic randomness. Jangan mengirim error asli parser URL ke log.

- [ ] **Step 5: Verifikasi dan commit deliverable pertama.** Jalankan `npm test`, `npm run lint`, `npm run typecheck`, dan `npm ls next payload @payloadcms/next @payloadcms/db-postgres`. Semua harus exit 0. Catat dependency baseline, lalu commit hanya file Task 1 dengan pesan `chore(infra): establish runtime and typed server configuration`.

## Task 2: PostgreSQL lokal dan setup secret tanpa overwrite

**Files:** Buat `.env.example`, `scripts/setup-env.mjs`, dan `compose.yaml`.

**Interfaces:** Menghasilkan `.env` dengan `DATABASE_URL` untuk database developer dan `TEST_DATABASE_URL` untuk database pengujian. Compose menyediakan service `postgres` pada loopback port 5432 dan `postgres-test` pada 5433 melalui profile `test`.

- [ ] **Step 1: Buat contoh environment tanpa credential production.** `.env.example`:

```dotenv
POSTGRES_USER=sineva
POSTGRES_PASSWORD=
POSTGRES_DB=sineva_compro
POSTGRES_PORT=5432
TEST_POSTGRES_PORT=5433
DATABASE_URL=
TEST_DATABASE_URL=
PAYLOAD_SECRET=
```

- [ ] **Step 2: Buat setup lokal yang tidak mencetak secret dan tidak menimpa `.env`.** `scripts/setup-env.mjs`:

```js
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const password = randomBytes(24).toString('base64url')
const secret = randomBytes(48).toString('base64url')
const values = {
  POSTGRES_PASSWORD: password,
  DATABASE_URL: `postgresql://sineva:${password}@127.0.0.1:5432/sineva_compro`,
  TEST_DATABASE_URL: `postgresql://sineva:${password}@127.0.0.1:5433/sineva_compro_test`,
  PAYLOAD_SECRET: secret,
}
let content = readFileSync('.env.example', 'utf8')
for (const [key, value] of Object.entries(values)) {
  content = content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
}
try {
  writeFileSync('.env', content, { flag: 'wx', mode: 0o600 })
  console.log('Created .env for local development; credentials were not printed.')
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
    console.error('.env already exists; refusing to overwrite it.')
    process.exitCode = 1
  } else {
    throw error
  }
}
```

Dokumentasikan bahwa mengubah `POSTGRES_PORT` juga memerlukan port yang sama di `DATABASE_URL`. Service pengujian memiliki pasangan `TEST_POSTGRES_PORT` / `TEST_DATABASE_URL` sendiri. Password yang dihasilkan hanya untuk lokal; identitas DB dan secret production ditentukan di CPR-11.

- [ ] **Step 3: Buat Compose dengan healthcheck dan persistent volume.** `compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:17.11-bookworm
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?Run npm run setup:env first}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Run npm run setup:env first}
      POSTGRES_DB: ${POSTGRES_DB:?Run npm run setup:env first}
    ports:
      - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 10s

  postgres-test:
    image: postgres:17.11-bookworm
    profiles: [test]
    environment:
      POSTGRES_USER: ${POSTGRES_USER:?Run npm run setup:env first}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Run npm run setup:env first}
      POSTGRES_DB: sineva_compro_test
    ports:
      - "127.0.0.1:${TEST_POSTGRES_PORT:-5433}:5432"
    tmpfs:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 10s

volumes:
  postgres_data:
```

Jangan memakai `container_name` atau host port `0.0.0.0`; keduanya mengganggu isolasi dan meningkatkan paparan lokal. Gunakan [perintah Compose resmi](https://docs.docker.com/reference/cli/docker/compose/up/) dengan batas kesiapan.

- [ ] **Step 4: Verifikasi konfigurasi dan lifecycle.** Run `npm run setup:env`; expected exit 0 dan file mode 600. Run lagi; expected exit 1, hash `.env` sebelum/sesudah sama. Jangan menampilkan isi/hash secret ke percakapan. Run `docker compose config --quiet`; expected exit 0. Jangan memakai `docker compose config` tanpa `--quiet` karena bisa menampilkan password.

```bash
docker compose up -d --wait --wait-timeout 90 postgres
docker compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose --profile test up -d --wait --wait-timeout 90 postgres-test
```

Expected: kedua service healthy pada port loopback masing-masing. Jika daemon berhenti, nyalakan Docker yang sudah terpasang sesuai izin lingkungan; jika port bentrok, ubah pasangan variabel di `.env`, lalu ulangi. Tidak menjalankan `down -v` untuk memperbaiki masalah koneksi.

- [ ] **Step 5: Commit.** Periksa `git check-ignore .env` menghasilkan `.env`, lalu commit `.env.example`, script, dan Compose dengan pesan `chore(infra): add isolated local PostgreSQL services`.

## Task 3: Aplikasi frontend dan CMS dari entry point resmi

**Files:** Buat `src/collections/Users.ts`, `src/payload.config.ts`, `src/migrations/`, `src/payload-types.ts`, kedua route group, `next.config.mjs`, `postcss.config.mjs`, `vitest.integration.config.mts`, dan `tests/integration/foundation.test.ts`; ubah script typecheck pada `package.json`.

**Interfaces:** `/` adalah HTML frontend; `/admin` adalah UI autentikasi Payload; `/api/users` menolak read/create anonim. `@payload-config` menunjuk `src/payload.config.ts`. CLI menghasilkan types/import map serta migration yang siap dijalankan pada database developer maupun test.

- [ ] **Step 1: Tulis HTTP test terhadap perilaku fondasi.** Buat `vitest.integration.config.mts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30000,
  },
})
```

`tests/integration/foundation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

const origin = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001'
const parsed = new URL(origin)
if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.protocol !== 'http:') {
  throw new Error('Foundation integration tests may only target a local HTTP server')
}

describe('foundation HTTP behavior', () => {
  it('serves the frontend document', async () => {
    const response = await fetch(new URL('/', origin), { signal: AbortSignal.timeout(15000) })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('Sineva Tech')
  })

  it('serves an admin page', async () => {
    const response = await fetch(new URL('/admin', origin), { signal: AbortSignal.timeout(15000) })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
  })

  it('does not expose users without authentication', async () => {
    const response = await fetch(new URL('/api/users', origin), {
      signal: AbortSignal.timeout(15000),
    })
    expect([401, 403]).toContain(response.status)
    const body = await response.json()
    expect(body.docs).toBeUndefined()
  })

  it('denies normal user creation without authentication', async () => {
    const response = await fetch(new URL('/api/users', origin), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'unauthorized-foundation@example.invalid',
        password: 'A-valid-shaped-local-test-password-123',
      }),
      signal: AbortSignal.timeout(15000),
    })
    expect([401, 403]).toContain(response.status)
  })
})
```

Run `npm run test:integration`; expected FAIL karena aplikasi lokal belum berjalan. Ini tidak menggantikan pembuktian pembuatan admin pertama melalui UI. Jangan memakai snapshot HTML lengkap atau menguji source package framework sebagai unit test.

- [ ] **Step 2: Buat konfigurasi Users dan Payload.** `src/collections/Users.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => req.user ? { id: { equals: req.user.id } } : false,
    update: ({ req }) => req.user ? { id: { equals: req.user.id } } : false,
    delete: () => false,
  },
  fields: [],
}
```

Email/password berasal dari auth bawaan Payload. Bootstrap akun pertama memakai alur first user milik Payload, bukan seed berpassword tetap atau izin `create: () => true`. Periksa bootstrap UI pada Task 4; jika policy memblokir alur bawaan pada versi terpasang, telusuri implementasi resmi terlebih dahulu dan pertahankan penolakan POST Users anonim.

`src/payload.config.ts`:

```ts
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { Users } from './collections/Users'
import { readServerEnv } from './env/server'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const env = readServerEnv(process.env)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
  },
  collections: [Users],
  secret: env.payloadSecret,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: env.databaseUrl },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
})
```

Tidak menambahkan locale, role field, Media, rich text editor, atau provider storage pada konfigurasi ini. Tiket berikutnya memperluas config dan menghasilkan migration baru.

- [ ] **Step 3: Pasang config Next.js dan compiler CSS.** `next.config.mjs`:

```js
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
}

export default withPayload(nextConfig)
```

Gunakan output standar Next.js agar `next build` dan `next start` menjadi pasangan yang didukung. `output: 'standalone'`, penyalinan static assets ke bundle tersebut, serta Dockerfile runner non-root adalah CPR-11 dan harus diuji bersama. Tidak menggunakan flag pengabaian TypeScript, build error, atau experimental framework flags.

`postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

- [ ] **Step 4: Salin entry point CMS dari tag resmi yang sesuai versi terpasang.** Untuk baseline ini, download tiga file berikut dari tag `v3.85.0` dan baca hasilnya sebelum digunakan:

```text
https://raw.githubusercontent.com/payloadcms/payload/v3.85.0/templates/blank/src/app/(payload)/layout.tsx
https://raw.githubusercontent.com/payloadcms/payload/v3.85.0/templates/blank/src/app/(payload)/admin/[[...segments]]/page.tsx
https://raw.githubusercontent.com/payloadcms/payload/v3.85.0/templates/blank/src/app/(payload)/api/[...slug]/route.ts
```

Pertahankan folder dan import path-nya. Layout memasang `RootLayout`, `handleServerFunctions`, dan `importMap`; page memasang `RootPage` dan `generatePageMetadata`; API memakai REST handlers resmi. Jangan mengambil file dari `main` yang dapat berbeda dari versi paket, atau menyalin seluruh website template beserta konten/plugin tambahan. Jika patch Payload berubah pada preflight, gunakan tag patch tersebut untuk ketiga file.

Buat `src/app/(payload)/custom.scss` dengan isi:

```scss
/* CMS styles are isolated from the public website stylesheet. */
```

Hasilkan `src/app/(payload)/admin/importMap.js` lewat `npm run generate:importmap`, bukan dengan mengarang daftar import. Jangan membungkus layout Payload dengan root `<html>` tambahan.

- [ ] **Step 5: Buat frontend minimal.** `src/app/(frontend)/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sineva Tech',
  description: 'Web development, AI, dan otomasi bisnis.',
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
```

`src/app/(frontend)/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Sineva Tech</h1>
      <p className="mt-4">Web development, AI, dan otomasi bisnis.</p>
    </main>
  )
}
```

`src/app/(frontend)/globals.css`:

```css
@import "tailwindcss";

body {
  font-family: system-ui, sans-serif;
}
```

Root layout statis berbahasa Indonesia ini hanya untuk kerangka. CPR-25 memindahkan page ke `[locale]` dan menyesuaikan `lang`. Tidak membuat design token atau mengganti aset brand pada tahap ini.

- [ ] **Step 6: Hasilkan schema dan verifikasi terhadap database test.** Pastikan database developer dan test healthy, lalu run:

```bash
npm run generate:types
npm run generate:importmap
npm run db:migrate:create -- initial-users
npm run db:migrate
npm run db:migrate:status
```

Baca migration SQL dan index yang dihasilkan; migration awal hanya membuat struktur Payload/Users dan tabel internalnya. Hapus parameter destructuring yang tidak digunakan dari fungsi migration hasil generator, misalnya `{ db, payload, req }` menjadi `{ db }` jika isinya hanya menjalankan SQL. Pertahankan parameter yang dipakai dan seluruh SQL/up/down; jangan melemahkan lint global untuk melewatkan warning. Jangan menulis schema ulang dengan SQL manual atau `migrate:fresh`.

Setelah route group tersedia, perbarui script typecheck:

```bash
npm pkg set 'scripts.typecheck=next typegen && tsc --noEmit'
npm run typecheck
```

Expected: route types dan `next-env.d.ts` dibuat, kemudian pemeriksaan TypeScript exit 0, tanpa membutuhkan `dev` yang pernah berjalan. Ini mengikuti [CLI Next.js](https://nextjs.org/docs/app/api-reference/cli/next#next-typegen-options).

Untuk memigrasi database test, muat `.env` dengan Node, pastikan `TEST_DATABASE_URL` menunjuk loopback dan nama database `sineva_compro_test`, kemudian jalankan CLI migration dengan `DATABASE_URL` diganti pada **child process**. Contoh perintah dari root repo:

```bash
node --input-type=module -e 'import "dotenv/config"; import { spawnSync } from "node:child_process"; const u = new URL(process.env.TEST_DATABASE_URL); if (!["localhost", "127.0.0.1"].includes(u.hostname) || u.pathname !== "/sineva_compro_test") throw new Error("Refusing non-test database"); const r = spawnSync("npm", ["run", "db:migrate"], {stdio:"inherit", env:{...process.env, DATABASE_URL:u.href}}); if(r.error) throw r.error; process.exit(r.status ?? 1);'
```

Jalankan server test pada terminal tersendiri, terhadap database test yang sama:

```bash
node --input-type=module -e 'import "dotenv/config"; import { spawn } from "node:child_process"; const u = new URL(process.env.TEST_DATABASE_URL); if (!["localhost", "127.0.0.1"].includes(u.hostname) || u.pathname !== "/sineva_compro_test") throw new Error("Refusing non-test database"); const child = spawn("npm", ["run", "dev", "--", "--port", "3001"], {stdio:"inherit", env:{...process.env, DATABASE_URL:u.href}}); child.on("error", () => {process.exitCode=1}); child.on("exit", code => {process.exitCode=code ?? 1});'
```

Setelah startup berhasil, run `npm run test:integration`. Expected: empat HTTP tests PASS. Jika connection refused, cek server; jangan skip tests atau menambah retries tanpa batas. Hentikan process test setelah selesai.

- [ ] **Step 7: Commit.** Jalankan unit tests, lint, typecheck, dan formatter; periksa perubahan migration; commit deliverable dengan pesan `feat(infra): bootstrap Next.js and authenticated Payload admin`.

## Task 4: Verifikasi production dan panduan developer

**Files:** Buat `README.md`; perbaiki hanya file yang gagal pemeriksaan fondasi.

**Interfaces:** Developer baru dapat melakukan setup dengan Node yang ditentukan, `npm ci`, setup environment, Compose, migration, dan `npm run dev`. CPR-10/CPR-11 memakai quality scripts yang sama.

- [ ] **Step 1: Tulis README dengan urutan setup yang dapat diikuti.** Sertakan versi final dependensi, alasan Node LTS, prasyarat Docker aktif, struktur `(frontend)` / `(payload)`, tautan PRD/Linear, dan langkah berikut:

```bash
npm ci
npm run setup:env
docker compose up -d --wait --wait-timeout 90 postgres
npm run generate:types
npm run generate:importmap
npm run db:migrate
npm run dev
```

Alamat lokal: `http://127.0.0.1:3000` dan `http://127.0.0.1:3000/admin`. Dokumentasikan login admin pertama melalui UI, aturan secret, unit test, HTTP test dengan database/service terpisah, cara menambah migration, dan perbedaan development/production. Jangan memasukkan email/password admin ke README atau `.env.example`.

Troubleshooting harus menjelaskan: Node 26 ditolak engine; Docker daemon belum aktif; port 5432/5433 bentrok; password database lama pada volume tidak berubah saat `.env` diubah; dan schema yang belum dimigrasi. `docker compose stop`/`start` mempertahankan data. Tidak menyarankan penghapusan volume sebagai perbaikan umum.

- [ ] **Step 2: Verifikasi admin pertama dan persistence pada database developer.** Buka `/admin`, buat satu akun lokal melalui UI, logout/login, lalu buka `/admin/create-first-user` kembali: bootstrap tambahan harus ditolak/dialihkan. Jalankan `docker compose restart postgres`, tunggu healthcheck healthy, dan login lagi dengan akun yang sama. Jangan merekam password di screenshot/tool output. Jika belum ada browser/izin untuk interaksi lokal, catat pemeriksaan UI belum selesai; CPR-7 tidak boleh ditandai Done hanya karena API merespons.

- [ ] **Step 3: Jalankan seluruh quality gate.**

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Build dijalankan memakai environment lokal yang valid dan PostgreSQL yang sudah dimigrasi. Pemeriksaan HTTP dari Task 3 dijalankan kembali terhadap `npm run start -- --port 3001` dengan `DATABASE_URL` database test melalui child process yang sama; ini mengganti argumen `dev` menjadi `start` pada perintah peluncuran sebelumnya. Matikan server dev/test yang menggunakan port tersebut sebelum menjalankan production server.

Pada server production lokal, pastikan `/` dan `/admin` bisa dibuka, lalu buat akun pertama khusus pengujian pada database `sineva_compro_test` melalui UI, logout, dan login kembali. Jika akun pengujian sudah ada, gunakan akun itu dan pastikan bootstrap tambahan ditolak. Buka dashboard serta dokumen Users setelah login; periksa console/hydration dan styling CMS. Respons HTML anonim saja tidak membuktikan dashboard authenticated berjalan. Jangan memakai akun production atau menyalin data developer ke database test.

- [ ] **Step 4: Periksa reproducibility dan dependency findings.** Run `npm ci`, ulangi quality gate bila instalasi mengubah hasil, lalu `npm run generate:types` dan `npm run generate:importmap`. Expected: `git diff --exit-code -- src/payload-types.ts 'src/app/(payload)/admin/importMap.js'` exit 0 setelah hasil generator sebelumnya telah di-commit pada Task 3. Review `npm audit --omit=dev`; jika ada temuan, nilai apakah dependency benar-benar dipakai dan patch kompatibel tersedia. Jangan menjalankan `npm audit fix --force`. Catat temuan dan keputusan; jangan mengklaim “aman sepenuhnya” hanya berdasarkan audit.

- [ ] **Step 5: Review akhir dan serah terima.** Periksa `git diff --check`, `.env` tetap ignored, tidak ada kredensial/database dump/artefak build yang di-track, seluruh dependensi langsung memakai versi exact, dan dua PNG sumber masih sama. Commit dokumentasi dengan pesan `docs(infra): document foundation setup and validation`.

Setelah implementasi telah diverifikasi, lakukan review branch. Buat PR yang menjelaskan fondasi yang berubah, hasil quality gate, dan pemeriksaan admin/persistence; attach PR ke chat melalui tool Codex. Jangan merge ke `main` atau deploy tanpa arahan integrasi yang berlaku. Update CPR-7 ke Done hanya setelah seluruh acceptance criteria berikut terbukti.

## Acceptance criteria dan bukti penyelesaian

| Kriteria Linear | Bukti |
|---|---|
| `docker compose up` + `npm run dev` menjalankan website dan `/admin` | Compose healthy; HTTP dan pemeriksaan UI pada kedua URL |
| Akun admin pertama bisa dibuat melalui `/admin` | Pembuatan, logout/login, dan bootstrap kedua ditolak |
| `lint`, `typecheck`, `test`, `build` lulus | Output perintah dengan exit 0; HTTP test production tambahan |
| Next.js dan Payload di-pin, tanpa `^` | Manifest exact + lockfile; `npm ls` tanpa peer conflict |
| README berisi setup lokal | Developer dapat mengikuti urutan setup tanpa credential production |
| Kualitas tambahan | Secret tidak terlacak; data bertahan setelah restart; CSS frontend/CMS terpisah |

## Hasil self-review rencana

- Scope seluruh acceptance criteria CPR-7 dipetakan ke Task 1–4.
- Input konfigurasi buruk diuji tanpa mencetak secret; endpoint Users memiliki negative HTTP tests.
- CLI Payload dan Next membaca `.env` yang sama; helper dapat dijalankan pada Node biasa.
- Development dan pengujian memakai database terpisah; schema push dinonaktifkan sehingga perubahan schema dapat direview.
- Semua command/file/interface yang diperlukan ditulis; jenis migration adalah output generator, bukan nama file timestamp yang ditebak.
- Status runtime/browser/daemon yang belum diuji dibedakan dari keputusan desain. Tidak ada klaim aplikasi sudah berjalan sebelum eksekusi.
- Review teknis independen memperbaiki tiga detail: route typegen sebelum pemeriksaan types, parameter tidak terpakai pada migration generator, dan pengujian dashboard authenticated pada production server lokal.
- Rekomendasi eksekusi: **Native**, empat task berurutan di sesi ini, dilanjutkan satu review branch independen. Subagent per task dapat dipilih jika Founder mengutamakan review independen lebih sering dan menerima tambahan biaya konteks.
