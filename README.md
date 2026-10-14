# Sineva Tech — Company Profile

Website company profile Sineva Tech dengan Next.js App Router dan **admin custom tanpa headless CMS**. Fondasi menyediakan PostgreSQL, autentikasi Better Auth, login/logout, bootstrap operator, dan dashboard dasar. Konten ID/EN, blog, media, SEO, mini-CRM dan integrasi mengikuti tiket berikutnya. Produk chatbot dikembangkan terpisah.

Fondasi custom dipublikasikan pada branch CPR-7 melalui commit `e9cb9b3`; [PR #1](https://github.com/farhanfadillahr/sineva-compro/pull/1) siap untuk review. Pemeriksaan browser production lokal lulus pada 15 Oktober 2026 melalui origin `http://localhost:3001`, termasuk login/logout, responsif/fokus, console dan login setelah restart database developer. Bukti browser melengkapi tes HTTP. PR belum di-merge atau di-deploy.

## Runtime dan dependency

Node **24.21.0 LTS** sesuai `.nvmrc`, engine `>=24.15.0 <25`. Next **16.4.0**, React **19.2.6**, Better Auth + adapter + CLI **1.7.7**, Drizzle ORM **0.45.4**, Drizzle Kit **0.31.11**, pg **8.23.1**, PostgreSQL **17.11-bookworm**. Versi langsung exact, lockfile dilacak, instalasi memakai `npm ci` tanpa force/legacy-peer-deps. Angka versi/peer diperiksa pada registry 14 Oktober 2026.

[Integrasi Better Auth](https://better-auth.com/docs/integrations/next), [adapter Drizzle](https://better-auth.com/docs/adapters/drizzle), [migration Drizzle](https://orm.drizzle.team/docs/migrations).

## Setup lokal baru

Prasyarat: Node 24, npm, Docker Engine/Desktop dan Compose v2. Jalankan dari root checkout ini.

```bash
nvm use
npm ci
npm run setup:env
docker compose up -d --wait --wait-timeout 90 postgres
npm run db:migrate
npm run bootstrap:admin -- --confirm-database=sineva_compro_app
npm run dev
```

Bootstrap meminta nama/email dan password tersembunyi melalui terminal. Password 12–128 karakter, tanpa nilai bawaan; tidak dimasukkan ke argumen atau dicetak. Database harus dikonfirmasi secara eksplisit. Target remote memerlukan `--allow-remote` tambahan, hanya untuk operator yang sengaja menyiapkan environment tersebut.

Website: `http://127.0.0.1:3000`. Admin: `http://127.0.0.1:3000/admin`, anonim diarahkan ke `/admin/login`. Signup publik dan API pengelolaan akun melalui HTTP ditutup pada fondasi ini. Peran/UI pengelolaan akun lengkap dan lockout akun adalah CPR-24. Request rate limit library melengkapi keamanan; tidak diklaim sebagai lockout akun.

`setup:env` membuat `.env` mode 600 dengan credential acak, tidak mencetak nilainya dan menolak overwrite. `.env.example` mendokumentasikan URL DB developer/test, `BETTER_AUTH_SECRET` dan `BETTER_AUTH_URL`. Origin auth harus cocok dengan origin aplikasi. Jangan memakai credential production untuk lokal/test atau mencetak `docker compose config`; gunakan `--quiet`.

URL PostgreSQL memvalidasi target sebelum driver dibuat. Parameter query hanya mendukung satu `sslmode=verify-full` atau `sslmode=disable`; override host/port/credential, fragment dan pembacaan file TLS melalui query ditolak. Konfigurasi TLS tambahan mengikuti provisioning yang direview. Log auth hanya memuat kategori tetap, tanpa pesan/error mentah, token atau parameter SQL.

## Transisi checkout yang sebelumnya memakai Payload

Database lama `sineva_compro` / `sineva_compro_test` dan volume developer dipertahankan. Aplikasi baru memakai `sineva_compro_app` / `sineva_compro_app_test`; password hash/session tidak dimigrasikan otomatis.

Pada volume yang telah diinisialisasi, mengganti `POSTGRES_DB` tidak membuat database baru. Buat database pengganti secara eksplisit jika belum ada:

```bash
docker compose exec -T postgres createdb -U sineva sineva_compro_app
docker compose exec -T postgres-test createdb -U sineva sineva_compro_app_test
```

Perintah kedua hanya untuk service test yang sudah berjalan. Pada service/volume yang benar-benar baru, Compose menginisialisasi nama baru dari konfigurasi. Jangan menjalankan `down -v`, drop schema, atau menghapus data developer untuk menyelesaikan error.

Update `.env` dengan URL baru dan secret Better Auth acak; simpan credential lama secara aman bila masih dibutuhkan. Pada checkout tugas ini, `.env.payload-legacy` menyimpan konfigurasi sebelumnya (ignored Git, mode 600). Port developer aktual adalah **5434** karena 5432 digunakan aplikasi lain; test **5433**. Sesuaikan pasangan port dan URL ketika memakai checkout ini.

## Struktur dan batas modul

- `src/app/(public)/`: homepage dasar; routing locale mengikuti CPR-25.
- `src/app/(admin)/admin/`: login dan shell/dashboard berizin; UI v1 Indonesia dan tema terang.
- `src/app/api/auth/[...all]/`: allowlist login/logout/session dan signup yang dinonaktifkan, tanpa API CRUD konten.
- `src/features/auth/`: schema library, pemetaan Principal, kemampuan, bootstrap atomik dan guard session.
- `src/lib/db/`: factory pool/ORM untuk CLI/test dan instance server dengan `server-only`, satu pool per proses.
- `src/lib/auth/`: factory konfigurasi library dan entry server/client yang terpisah.
- `drizzle/`: migration SQL dan metadata versioned; startup tidak membuat DB/schema.
- `scripts/`: setup environment, migration dan bootstrap operator.
- `tests/`: aturan murni, PostgreSQL sebenarnya, CLI proses dan HTTP Next.js.

Root layout tetap Server Component. Session, token/hash dan query admin tidak masuk cache publik. Client hanya menerima Principal (ID/nama/peran). Setiap query/action berizin memanggil guard server sendiri, bukan mengandalkan menu/layout.

## Migration dan schema

```bash
npm run auth:generate
npm run db:generate -- --name nama_perubahan
npm run db:check
npm run db:migrate
```

Generator auth memakai CLI terpin dan formatter; review schema/SQL/index/foreign key sebelum menerapkan. Migration dilacak Git dan idempotent melalui journal. Tidak menggunakan schema push atau migration otomatis saat aplikasi mulai. Initial migration bernama `0000_auth_foundation`.

Bootstrap memakai advisory lock yang terbatas waktu, memeriksa ulang keberadaan pengguna setelah lock, kemudian membuat akun dan credential melalui API library dalam satu transaksi. Pengulangan/dua proses tidak membuat Admin kedua. Tidak menyediakan halaman create-first-user anonim.

## Pengujian

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Test DB hanya menerima loopback dan nama `sineva_compro_app_test`, tidak fallback ke database developer. Suite bootstrap memerlukan test DB kosong; fixture hanya milik suite dan dibersihkan berdasarkan identitasnya. Jangan menghapus akun developer agar tes lulus.

```bash
docker compose --profile test up -d --wait --wait-timeout 90 postgres-test
```

Jalankan migration dan server dengan **DATABASE_URL diarahkan ke TEST_DATABASE_URL**, bukan ke DB developer. Script aman berikut memeriksa target sebelum menjalankan salah satu perintah:

```bash
npm run test:prepare
npm run test:database
npm run test:server
```

Di terminal terpisah setelah server test siap:

```bash
npm run test:integration
```

`test:server` memakai origin `http://127.0.0.1:3001`; untuk production HTTP, hentikan server dev tersebut, jalankan `npm run build`, lalu `npm run test:server -- --production`. Test DB dan HTTP suite jangan dijalankan bersamaan karena keduanya memakai fixture bootstrap pada DB yang sama.

## Pemeriksaan dependency

Audit 14 Oktober 2026 setelah pergantian: empat moderate pada jalur tooling migration Drizzle/esbuild; audit penuh juga lima high pada tooling lint (`braces`). Tidak ada high/critical pada audit tanpa dev. Tooling esbuild tersebut tidak menjalankan development server; lint hanya memakai source repo. Tidak menerapkan downgrade Drizzle/framework atau `audit fix --force`. Evaluasi ulang saat upgrade; hasil ini bukan klaim aplikasi sepenuhnya aman.

## Dokumen dan pekerjaan lanjutan

[PRD Rev. 2](docs/prd/2026-10-14-company-profile-prd.md), [arsitektur](docs/architecture/README.md), [ADR](docs/architecture/decisions/2026-10-14-custom-admin.md), [rencana CPR-7](docs/superpowers/plans/2026-10-14-cpr-7-foundation.md), [bukti fondasi custom](docs/architecture/custom-admin-foundation-validation.md), [Linear](https://linear.app/sineva-tech/project/company-profile-v1-ee7ed9a91d26).

Fondasi ini belum mencakup halaman marketing final, CRUD konten/blog/media, RBAC/lockout lengkap, lead/waitlist, R2/Resend/analytics, CI atau deploy. Ikuti CPR-24, CPR-23 dan tiket fitur berikutnya; jangan menganggap shell dashboard sebagai admin lengkap atau aplikasi siap launch.

Rencana/setup/verifikasi Payload di `docs` berlabel arsip dan hanya berlaku pada commit lama `a7f00fb`. Aset logo asli tidak diubah; SVG publik adalah salinan byte-identik.
