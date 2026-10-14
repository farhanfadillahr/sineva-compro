# Sineva Tech — Company Profile

Fondasi website company profile Sineva Tech. Aplikasi menggunakan Next.js App Router
dan Payload CMS v3 dalam satu repo, dengan PostgreSQL sebagai database. Produk chatbot
dikembangkan di repo terpisah.

Referensi: [PRD](docs/prd/2026-10-14-company-profile-prd.md),
[arsitektur](docs/architecture/README.md), dan
[CPR-7](https://linear.app/sineva-tech/issue/CPR-7/infra-inisialisasi-kerangka-nextjs-payload-v3).

[Catatan verifikasi fondasi](docs/architecture/foundation-validation.md) mencatat
bukti pemeriksaan serta acceptance UI yang masih terbuka.

## Runtime dan dependensi

Gunakan Node.js **24.21.0 LTS** sesuai `.nvmrc`. Engine menerima Node 24 mulai 24.15.0;
Node 26 ditolak agar instalasi dan build memakai lini LTS yang sama.

Dependensi utama dikunci: Next.js **16.4.0**, React/React DOM **19.2.6**, Payload dan
seluruh paket langsung `@payloadcms/*` **3.90.2**. Peer dependency Payload mendukung
Next.js `>=16.3.3 <17`. PostgreSQL lokal memakai image resmi **17.11-bookworm**.
Semua versi langsung tersimpan exact dalam `package.json`; commit `package-lock.json`
dan gunakan `npm ci` untuk instalasi berikutnya. Upgrade dilakukan lewat perubahan
yang direview, tanpa `--force` atau `--legacy-peer-deps`.

Baseline rencana (Next 16.2.9/Payload 3.85.0) dinaikkan saat audit 14 Oktober 2026:
Payload memperbaiki [first-register RCE](https://github.com/payloadcms/payload/security/advisories/GHSA-97rh-rhh2-7vjv)
dan Next memperbaiki [cache poisoning SSG/ISR](https://github.com/vercel/next.js/security/advisories/GHSA-mcj8-r9mp-w47p).

Override keamanan dibatasi pada `payload → undici 7.29.1`,
`@payloadcms/next → sass 1.105.1`, dan `dompurify 3.4.17`. Override ini bersifat
sementara sampai paket induk memperbarui pin; hapus melalui PR upgrade setelah
audit dan migration/build diuji kembali. `esbuild` dan `yaml` tercantum sebagai
dev dependency untuk memenuhi peer Vite secara eksplisit.

ESLint 9.39.5 dipertahankan karena plugin import/react/a11y yang dibawa config
Next belum menerima ESLint 10. Versi 9 sudah deprecated; upgrade tooling perlu
menunggu kombinasi plugin yang kompatibel, tanpa mengabaikan peer dependencies.

Audit 14 Oktober 2026: `npm audit --omit=dev` mencatat lima temuan **moderate**
pada jalur `drizzle-kit → @esbuild-kit → esbuild`, tanpa temuan high/critical.
[Advisory tersebut](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99)
terkait server development esbuild; aplikasi ini tidak menjalankan server tersebut.
Audit seluruh dependency juga mencatat lima temuan
**high** pada jalur glob ESLint (`braces`), yang hanya digunakan untuk lint atas
source repo. Patch upstream yang kompatibel belum tersedia; rekomendasi audit
berupa downgrade framework tidak diterapkan. Evaluasi lagi saat upgrade dependency;
hasil audit ini tidak menjadi klaim keamanan menyeluruh.

## Setup lokal

Prasyarat: Git, Node 24, npm, Docker Desktop/Engine aktif, dan Docker Compose v2.
Jika memakai nvm, jalankan `nvm install` lalu `nvm use` dari root repo.

```bash
npm ci
npm run setup:env
docker compose up -d --wait --wait-timeout 90 postgres
npm run generate:types
npm run generate:importmap
npm run db:migrate
npm run dev
```

Buka website di `http://127.0.0.1:3000` dan CMS di `http://127.0.0.1:3000/admin`.
Pada database baru, buat akun admin pertama melalui form yang ditampilkan CMS.
Setelah akun tersedia, halaman tersebut menjadi halaman login; bootstrap akun
pertama tidak dapat dipakai kembali. Simpan kredensial lokal di password manager.

`setup:env` menghasilkan password database dan secret Payload secara acak ke `.env`
dengan permission `600`, menolak overwrite, dan tidak mencetak nilainya. `.env`
diabaikan Git. `.env.example` hanya mendokumentasikan variabel. Tidak memakai
credential production untuk pengembangan maupun pengujian.

Port database developer adalah 5432; service test memakai 5433. Bila mengubah
`POSTGRES_PORT`, sesuaikan port pada `DATABASE_URL`. Bila mengubah
`TEST_POSTGRES_PORT`, sesuaikan `TEST_DATABASE_URL`. Jangan menampilkan hasil
`docker compose config` yang berisi password; gunakan `docker compose config --quiet`.

## Struktur aplikasi

```text
src/
  app/
    (frontend)/   # Root layout website, Server Components, Tailwind CSS
    (payload)/    # Root layout CMS, admin dan REST API resmi Payload
  collections/   # Schema dan access control CMS
  env/           # Validasi konfigurasi server
  migrations/    # Perubahan schema yang direview dan disimpan di Git
  payload.config.ts
  payload-types.ts
tests/
  unit/          # Tanpa database
  integration/   # HTTP terhadap aplikasi lokal dan database test
assets/brand/    # Aset asli dan varian logo
docs/           # PRD, keputusan arsitektur dan rencana
scripts/        # Setup environment dan tracing logo
```

Kedua route group memiliki root layout sendiri. CSS frontend tidak diimpor ke
layout CMS. Users pada fondasi ini hanya dapat dibaca/diubah oleh pemilik akun;
read/create anonim ditolak dan delete dinonaktifkan. Peran Admin/Editor dan
pengelolaan pengguna lengkap akan diterapkan dalam CPR-24.

## Migration

Schema push otomatis dinonaktifkan (`push: false`) di semua environment.
Setelah mengubah collection/global:

```bash
npm run generate:types
npm run generate:importmap
npm run db:migrate:create -- nama-perubahan
```

Review SQL `up`/`down` dan index yang dihasilkan, hapus parameter generator yang
tidak digunakan bila diperlukan lint, lalu commit migration bersama perubahan
schema. Jalankan `npm run db:migrate` dan periksa `npm run db:migrate:status`.
Tidak mencampur migration dengan schema push atau menjalankan `migrate:fresh`
terhadap database developer. Deployment harus menjalankan migration sebelum
aplikasi menggunakan schema baru.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Typecheck menghasilkan route types Next.js sebelum menjalankan TypeScript strict.
Build menggunakan konfigurasi environment valid dan database yang sudah dimigrasi.
`npm run start` menjalankan hasil build production lokal. Paket Tailwind 4 dan
next-intl terpasang; routing bahasa akan ditambahkan pada CPR-25.

Untuk HTTP integration test, nyalakan database test:

```bash
docker compose --profile test up -d --wait --wait-timeout 90 postgres-test
node --input-type=module -e 'import "dotenv/config"; import { spawnSync } from "node:child_process"; const u = new URL(process.env.TEST_DATABASE_URL); if (!["localhost", "127.0.0.1"].includes(u.hostname) || u.pathname !== "/sineva_compro_test") throw new Error("Refusing non-test database"); const r = spawnSync("npm", ["run", "db:migrate"], {stdio:"inherit", env:{...process.env, DATABASE_URL:u.href}}); if(r.error) throw r.error; process.exit(r.status ?? 1);'
```

Di terminal terpisah, jalankan aplikasi dengan database test pada port 3001:

```bash
node --input-type=module -e 'import "dotenv/config"; import { spawn } from "node:child_process"; const u = new URL(process.env.TEST_DATABASE_URL); if (!["localhost", "127.0.0.1"].includes(u.hostname) || u.pathname !== "/sineva_compro_test") throw new Error("Refusing non-test database"); const child = spawn("npm", ["run", "dev", "--", "--port", "3001"], {stdio:"inherit", env:{...process.env, DATABASE_URL:u.href}}); child.on("error", () => {process.exitCode=1}); child.on("exit", code => {process.exitCode=code ?? 1});'
```

Jalankan `npm run test:integration` setelah server siap. Tes hanya mengizinkan
origin HTTP loopback; URL bawaan adalah `http://127.0.0.1:3001`, dapat diganti
dengan `TEST_BASE_URL`. Untuk memeriksa production, hentikan server dev test,
jalankan build, lalu ganti argumen `"dev"` di perintah peluncuran menjadi `"start"`.
Buka `/admin` di port 3001, buat akun khusus test melalui UI, login, dan periksa
dashboard serta dokumen Users. Respons HTML anonim tidak cukup untuk menguji CMS.

Service test menggunakan tmpfs dan dapat kehilangan data saat container dibuat
ulang. Database developer memakai volume persisten. Jangan memakai data produksi,
dump database, atau akun developer sebagai fixture test.

## Troubleshooting

- **Engine Node ditolak:** jalankan `nvm use`; periksa `node --version` adalah 24.x.
- **Docker tidak tersambung:** nyalakan Docker Desktop/Engine, lalu periksa `docker info`.
- **Port 5432/5433 bentrok:** ubah pasangan port dan URL terkait di `.env`.
- **Password database tidak cocok setelah `.env` diubah:** volume menyimpan credential
  saat pertama diinisialisasi. Gunakan credential sebelumnya atau ubah credential
  database melalui prosedur yang terkontrol; jangan menghapus volume sebagai perbaikan umum.
- **Tabel belum tersedia:** jalankan `npm run db:migrate`, lalu periksa status migration.
- **Ingin berhenti sementara:** `docker compose stop` dan `docker compose start`
  mempertahankan data developer. Jangan memakai `down -v` untuk troubleshooting.

## Batas fondasi

Homepage saat ini hanya kerangka. Koleksi konten, desain marketing, dua bahasa,
dark mode, formulir, media R2, Resend, dan analitik mengikuti tiket berikutnya.
CI adalah CPR-10; Dockerfile production, VPS/Coolify, database preview per PR,
backup, dan deploy adalah CPR-11. Build saat ini memakai pasangan standar
`next build`/`next start`; standalone output diterapkan bersama runner deploy.
