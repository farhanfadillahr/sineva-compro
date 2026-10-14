# CPR-7 — Custom Admin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti fondasi Payload dengan aplikasi Next.js tanpa headless CMS, database milik aplikasi, autentikasi library dan shell admin custom yang dibuktikan pada build production lokal.

**Architecture:** Website publik dan admin berada dalam satu modular monolith. Fitur memiliki schema, query, action dan kebijakan akses; Drizzle mengakses PostgreSQL, Better Auth menangani mekanisme autentikasi. Konten/blog/lead berikutnya tetap mengikuti tiket fitur, bukan dipindahkan ke file statis.

**Tech Stack:** Node 24 LTS, npm, Next.js App Router, React, TypeScript strict, Tailwind, next-intl, PostgreSQL, Drizzle ORM + node-postgres, Better Auth, Vitest dan Playwright untuk alur UI.

**Spec:** [PRD Rev. 2](../../prd/2026-10-14-company-profile-prd.md), terutama §9, §13–16; [arsitektur](../../architecture/README.md); [ADR](../../architecture/decisions/2026-10-14-custom-admin.md); CPR-7 di Linear.

**Status:** Task 1–3 terimplementasi dan teruji pada salinan kerja CPR-7. Gate teknis Task 4, review independen dan acceptance browser production lokal selesai; pemeriksaan UI pada 15 Oktober 2026 meliputi login/logout, dua viewport dan login setelah restart database developer. Publikasi source/metadata akhir PR belum dilakukan. Lihat [bukti baru](../../architecture/custom-admin-foundation-validation.md).

**Kondisi awal:** commit `a7f00fb` di branch fondasi lama berisi Next 16.4.0, React 19.2.6, Node 24.21.0 dan integrasi Payload 3.90.2. Draft [PR #1](https://github.com/farhanfadillahr/sineva-compro/pull/1) tetap draft, tidak memenuhi Rev. 2. [Rencana lama](2026-10-14-cpr-7-payload-foundation-superseded.md) dan [verifikasi lama](../../architecture/foundation-validation.md) adalah arsip.

## Global Constraints

- Tidak menggunakan headless CMS; website publik dan admin custom satu aplikasi/repo/deployment.
- PostgreSQL menyimpan data aplikasi; chatbot tetap repo/database/deployment terpisah.
- Library auth menangani password/session; tidak membuat algoritma hashing/session sendiri.
- Signup publik ditutup; Admin pertama dibuat melalui perintah operator eksplisit, tanpa password bawaan atau bootstrap anonim.
- Setiap query/action admin memeriksa session dan izin di server, bukan hanya layout atau UI.
- Dependensi langsung exact, lockfile dilacak, instalasi menggunakan `npm ci`; tidak memakai force/legacy-peer-deps untuk mengabaikan konflik.
- Tidak menghapus volume/database/data developer. Inventory data sebelum mengganti schema; migration tidak dijalankan ke production dalam CPR-7.
- Secret hanya environment; tidak dicetak/di-commit; file setup menolak overwrite.
- Lokal memakai database developer dan test terpisah; preview database per PR; production terisolasi.
- CPR-7 mencakup session dasar, bootstrap dan shell admin. Peran lengkap/pengelolaan Users/lockout adalah CPR-24; form konten/media/lead mengikuti tiket masing-masing.
- UI marketing, routing ID/EN lengkap, tema publik, R2, email, analytics, CI dan deploy mengikuti tiket pemilik. Tidak menambah workflow cloud atau mengubah DNS dalam fondasi.
- Aset brand dan hasil tracing tidak diubah. Jangan menjalankan generator aplikasi yang menimpa repo.
- Rencana telah direview dan di-commit; eksekusi pengganti dicatat terpisah dari bukti Payload lama.

## Review Focus

1. Session palsu/expired dan action yang dipanggil langsung: query/action server menolak; Task 3.
2. Database salah lingkungan, belum dimigrasi atau koneksi tidak selesai: batas waktu dan error aman, tanpa membuat DB otomatis; Task 2.
3. Bootstrap dijalankan ulang/bersamaan: paling banyak satu Admin pertama, tanpa kehilangan akun atau credential tercetak; Task 3.
4. Source CMS dihapus tetapi route/dependency/config lama tertinggal: scan manifest/source dan uji HTTP; Task 1 + 4.
5. Auth/CSS hanya berjalan di dev, logout atau login setelah restart rusak: browser pada build production dan DB persisten; Task 4.

## Batas file dan kontrak

Path relatif terhadap root repo. Folder dibuat saat ada file nyata.

| File / folder | Perubahan dan tanggung jawab |
|---|---|
| `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json` | Hapus integrasi Payload; dependency/config aplikasi baru |
| `src/app/(payload)/`, `src/collections/`, `src/payload.config.ts`, `src/payload-types.ts` | Hapus dari source aktif setelah inventory |
| `src/migrations/` | Migration Payload lama berhenti menjadi jalur aktif; sejarah Git tetap dapat dipulihkan |
| `src/app/layout.tsx`, `src/app/(public)/layout.tsx`, `page.tsx`, `globals.css` | Root bersama minimal + homepage bukti fondasi; locale pada CPR-25 |
| `src/app/(admin)/admin/login/page.tsx` | UI login custom |
| `src/app/(admin)/admin/(protected)/layout.tsx`, `page.tsx` | Shell/dashboard berizin |
| `src/app/api/auth/[...all]/route.ts` | Handler auth resmi, tanpa generic content API |
| `src/env/server.ts`, `.env.example`, `scripts/setup-env.mjs` | Hapus secret CMS, validasi env auth/DB dan setup tanpa overwrite |
| `src/lib/db/client.server.ts`, `src/lib/db/schema.ts` | Pool/ORM server dan agregasi schema |
| `src/features/auth/schema.ts` | Schema auth dari generator versi library terpasang, direview |
| `src/lib/auth/server.ts`, `client.ts` | Konfigurasi auth server dan client terpisah |
| `src/features/auth/session.server.ts`, `authorization.ts` | Validasi session dan kebijakan dasar |
| `scripts/bootstrap-admin.ts` | Bootstrap operator eksplisit melalui library auth |
| `drizzle.config.ts`, `drizzle/` | Migration SQL aplikasi yang dilacak Git |
| `tests/unit/`, `tests/integration/`, `tests/e2e/` | Ganti bukti CMS dengan pemeriksaan aplikasi baru |
| `README.md`, `docs/architecture/foundation-validation.md` | Setup aktual pengganti dan evidence baru; hasil lama tetap berlabel historis |

Kontrak fondasi untuk tiket berikutnya:

```typescript
type AdminRole = "admin" | "editor";
type Principal = { id: string; role: AdminRole; name: string };
type Capability = "content:write" | "users:manage" | "leads:manage" | "waitlist:export";
// session.server.ts: membaca session library dari request, bukan input user
// getPrincipal(): Promise<Principal | null>
// requirePrincipal(): Promise<Principal>; menolak session tidak valid
// authorization.ts: can(principal: Principal, capability: Capability): boolean
// requireCapability(capability: Capability): Promise<Principal> di session.server.ts
```

Kontrak ini menetapkan batas antarmuka, bukan file implementasi siap salin. Session/token/hash penuh tidak menjadi `Principal` atau props client. CPR-24 melengkapi kebijakan, perubahan role, lockout, pengelolaan akun dan seluruh negative tests sebelum konten/CRM dibuka.

## Task 1: Lepas integrasi CMS tanpa merusak repo

**Files:** manifest/lockfile, konfigurasi Next/TS, route/layout, source Payload dan tes lama pada tabel di atas.

**Consumes:** fondasi lama pada `a7f00fb`, PRD Rev. 2, inventory file/data.
**Produces:** Next.js tanpa route/dependency CMS; halaman publik dan entry admin custom, konfigurasi tanpa wrapper CMS.

- [x] Periksa status Git dan seluruh file bergantung CMS; pisahkan perubahan user yang muncul setelah base commit.

```bash
git status --short
rg -n 'payload|@payloadcms|PAYLOAD_SECRET|withPayload' package.json next.config.mjs tsconfig.json src scripts tests .env.example
rg --files src tests scripts
```

- [x] Catat database dan jumlah entitas yang ada tanpa mencetak PII/secret. Jika ada data yang perlu disimpan, buat database pengganti dan rencana export-import; jangan drop schema/volume atau menganggap password hash kompatibel.
- [x] Periksa registry, peer dependency dan advisory untuk versi stabil Drizzle/pg/Better Auth/adapter/CLI yang kompatibel dengan Node/Next terpasang. Catat angka final dan sumber dalam README; pin exact. Pertahankan Next/React/Node yang kompatibel kecuali ada alasan upgrade yang dibuktikan.
- [x] Hapus paket langsung Payload, kebutuhan peer/override yang hanya berasal dari CMS, scripts generator dan alias TS Payload. Regenerasi lockfile secara normal, lalu periksa graph dependency/audit. Override yang masih diperlukan dependency lain tidak dihapus tanpa pemeriksaan.
- [x] Lepas `withPayload`, route CMS, config/types/import map/SCSS dan collection lama. Hentikan penggunaan migration Payload; jangan menimpa database yang telah berisi schema lama.
- [x] Buat root layout minimal, pindahkan homepage/CSS ke route group publik; admin memiliki subtree sendiri di bawah root. Provider i18n/theme publik tidak membungkus handler auth atau memaksa `use client` pada root.
- [x] Ganti tes HTTP yang sebelumnya mengharapkan panel CMS/API Users. Dalam aplikasi baru endpoint legacy `/api/users` tidak terdaftar (404); protected admin mengarah ke login, bukan create-first-user.
- [x] Jalankan lint/typecheck dan scan source/manifest aktif. Referensi dalam arsip dokumentasi diizinkan; import/dependency/config CMS aktif harus nol.

## Task 2: Database aplikasi dan migration terkontrol

**Files:** `src/env/server.ts`, setup/.env.example/compose, `src/lib/db/`, `src/features/auth/schema.ts`, `drizzle.config.ts`, `drizzle/`, tes konfigurasi/database.

**Consumes:** aplikasi tanpa CMS dari Task 1.
**Produces:** pool PostgreSQL/ORM server, schema auth dan migration baru, perintah database yang konsisten.

- [x] Perbarui kontrak environment: `DATABASE_URL`, `TEST_DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` dan origin publik. Secret auth acak minimal 32 karakter. Hilangkan `PAYLOAD_SECRET` dari kontrak aktif; setup tidak menimpa `.env` yang ada.
- [x] Tes validasi secret kosong/pendek, protokol URL salah, URL auth tanpa origin valid, dan larangan credential/secret muncul dalam error. Jalankan unit suite sebelum dan sesudah perubahan.
- [x] Gunakan node-postgres Pool dengan maksimum awal 10 koneksi, `connectionTimeoutMillis: 5000`, query/statement timeout awal 30 detik; satu instance per proses yang tidak bertambah saat hot reload. Uji listener yang tidak menyelesaikan handshake dan nama DB yang salah: gagal terbatas waktu, tanpa CREATE DATABASE otomatis.
- [x] Konfigurasi Better Auth melalui adapter Drizzle versi terpasang, signup publik dimatikan. Generate schema auth melalui CLI terpin, review field/index/foreign key dan agregasikan schema. Gunakan schema library untuk credential/session, bukan tabel/hash buatan sendiri.
- [x] Buat migration SQL aplikasi di `drizzle/` dari schema yang direview. Jangan menerapkan migration baru pada database Payload lama tanpa rencana cutover. Migration auth tidak sekaligus membuat semua tabel konten kosong.
- [x] Standarkan scripts yang benar-benar dibuat: `db:generate`, `db:migrate`, `db:check`, `test:database`. Migration hanya melalui perintah operator/deploy; tidak ada schema push pada startup.
- [x] Jalankan migration pada database test kosong, jalankan ulang, pastikan no-op dan graph/schema tetap konsisten.

```bash
npm run db:generate
npm run db:check
npm run db:migrate
npm run test:database
```

Perintah di atas baru sah setelah scripts dibuat. Test menerima hanya database loopback khusus test, tidak mengambil `DATABASE_URL` production sebagai fallback dan hanya membersihkan fixture milik suite.

## Task 3: Session, bootstrap operator dan shell admin custom

**Files:** auth server/client/handler, auth feature guards, bootstrap CLI, route login/protected, tes session/bootstrap.

**Consumes:** schema/library dari Task 2.
**Produces:** login/logout berbasis library, `Principal` dan guard server, Admin pertama dari operator, dashboard minimal.

- [x] Tulis negative tests untuk signup langsung ke handler, session palsu/expired, protected query tanpa login dan bootstrap dua proses. Run untuk membuktikan perilaku belum ada sebelum implementasi.
- [x] Pasang handler resmi library di `/api/auth/[...all]`; konfigurasi trusted origins/cookie sesuai environment. Signup dinonaktifkan untuk seluruh permintaan HTTP. Tidak membuat endpoint account CRUD custom terbuka.
- [x] Implementasikan `getPrincipal`, `requirePrincipal`, `can`, dan `requireCapability` dengan kontrak di atas. Baca session pada server, ambil role server, keluarkan field aman. Semua aksi yang perlu izin memanggil guard sendiri.
- [x] Implementasikan `scripts/bootstrap-admin.ts`: validasi DB tujuan/environment; baca email/nama/password melalui input operator aman; buat akun melalui API library yang diverifikasi untuk versi terpasang; role awal ditetapkan server. Tidak mencetak credential, tidak mengaktifkan signup pada handler aplikasi.
- [x] Serialisasi bootstrap dengan PostgreSQL advisory lock pada koneksi khusus; setelah memperoleh lock, periksa akun yang sudah ada, lakukan create melalui library, dan tunggu operasi selesai sebelum lock dilepas dalam `finally`. Bootstrap kedua menghasilkan status sudah tersedia, tidak membuat akun baru. Jangan mempertahankan transaksi dari query count yang memiliki snapshot usang.
- [x] Buat login custom dengan label/error/loading, logout melalui library, dan dashboard minimal berisi nama pengguna serta navigasi sesuai izin dasar. Redirect `/admin` tanpa session ke `/admin/login`; jangan mengirim token/hash sebagai props atau membuka form create-first-user.
- [x] Tes login/logout dengan cookie sebenarnya; session setelah logout tidak mengakses query/protected page. Jalankan ulang bootstrap dan uji dua bootstrap konkuren pada DB test kosong.

**Batas:** pengelolaan akun lengkap, Editor/RBAC seluruh fitur dan lockout 5 kegagalan/15 menit dikerjakan dalam CPR-24. Fondasi belum boleh dianggap siap launch sebelum tiket itu lulus; jangan mengklaim library menyediakan lockout requirement secara otomatis.

## Task 4: Bukti fondasi baru dan handoff

**Files:** seluruh tests fondasi, README setup baru, catatan evidence, draft PR/CPR-7.

**Consumes:** hasil Task 1–3.
**Produces:** evidence untuk fondasi tanpa CMS dan batas pekerjaan berikutnya yang jelas.

- [x] Instalasi bersih melalui `npm ci`; verifikasi runtime, dependency graph dan audit. Regenerasi schema/migration tidak menghasilkan diff tak disengaja.
- [x] Jalankan quality gate dan tes database/HTTP terhadap DB test.

```bash
npm ci
npm ls --all
npm run lint
npm run typecheck
npm test
npm run format:check
npm run test:database
npm run test:integration
npm run build
git diff --check
```

- [x] Jalankan hasil build production dengan database test dan uji homepage, redirect/login admin, signup ditolak, API Users legacy 404, session invalid ditolak. Status/response diperiksa sesuai auth handler yang dipilih; jangan bergantung pada string error library yang tidak stabil.
- [x] Verifikasi lewat browser yang diizinkan: bootstrap operator → login → dashboard → logout → login; restart DB developer dan login lagi dengan akun yang sama; cek styling, label/focus, console/hydration. Lulus pada `http://localhost:3001` tanggal 15 Oktober 2026 setelah user membuka origin tersebut. Fixture dibersihkan; ukuran browser dipulihkan. Penolakan awal origin `127.0.0.1` tetap dicatat sebagai riwayat, tanpa bypass izin.
- [x] README menjelaskan source yang sekarang berjalan, setup/migration/bootstrap/testing aktual. Simpan evidence baru dengan commit/versi/perintah/hasil; catatan Payload tetap berlabel arsip.
- [ ] Ubah judul/deskripsi PR sesuai implementasi akhir setelah source pengganti dipublikasikan; source saat ini belum di-commit/push. PR boleh keluar dari draft hanya jika seluruh acceptance fondasi baru lulus dan review selesai. Tidak merge/deploy sebagai bagian penggantian lokal ini.

## Tiket berikutnya dan pembagian scope

| Tiket | Deliverable admin custom |
|---|---|
| CPR-24 | Akun Admin/Editor, izin pada query/action, pengelolaan Users, lockout 5 kegagalan/15 menit |
| CPR-23 | Metadata/media, validasi upload dan alt ID/EN, R2 melalui adapter aplikasi |
| CPR-27, CPR-28 | Schema + form daftar/edit layanan/tim + query publik + validasi/test |
| CPR-29 | Pengaturan situs/konten halaman, form per bahasa, field SEO, toggle/field opsional |
| CPR-30 | Portfolio, draft/snapshot/publish/preview dan relasi layanan |
| CPR-31 | Posts/Categories, editor rich text, publikasi per bahasa, preview |
| CPR-33 | Invalidasi cache setelah commit, URL lama/baru, daftar/padanan/beranda/sitemap |
| CPR-25, CPR-34 | Routing locale dan padanan berdasarkan ID/slug terjemahan database |
| CPR-46, CPR-48 | Tabel/query/action/UI mini-CRM dan waitlist/CSV khusus Admin |
| CPR-52 | Metadata dari schema/form aplikasi, tanpa plugin SEO CMS |
| CPR-20, CPR-22, CPR-26 | Desain/komponen admin custom selain halaman publik |
| CPR-56, CPR-62 | E2E admin dan panduan Admin/Editor berdasarkan UI custom |

Modul `[CMS]` menjadi `[Admin]`; M2 menjadi **Admin & Halaman**. Identifier tetap `CPR-{nomor}`; tampilan mengikuti `CPR-{nomor} | [MODUL] Aksi`. Dependency yang berubah karena custom admin (contohnya upload harus menunggu otorisasi) diperbarui di Linear.

## Self-review rencana

- Kebutuhan konten/blog/lead tetap ada di PRD dan tiket, termasuk bahasa, SEO, media, draft/preview dan izin.
- Batas custom UI jelas; bukan penggantian nama CMS atau admin yang masih mengandalkan panel Payload.
- Langkah inventory/cutover menjaga data, logo dan source user; tidak ada drop volume otomatis.
- Hasil test lama tidak menandai checklist baru selesai.
- Source pengganti tersedia di salinan kerja; belum ada klaim fondasi lengkap atau aplikasi siap launch.
