# CPR-10 — GitHub Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the preserved Native execution method, or superpowers:subagent-driven-development only if Founder changes that choice. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jalankan quality gate Compro otomatis pada PR ke `main`, dengan PostgreSQL disposable dan HTTP production, serta buktikan hasilnya di GitHub tanpa mengklaim proteksi merge yang belum tersedia.

**Architecture:** Satu job `verify` menjalankan pemeriksaan repo secara sequential. Helper Node kecil mengelola server production dan HTTP suite, memvalidasi environment test, memberi batas readiness, dan membersihkan proses miliknya. Workflow hanya memakai token read-only dan credential CI disposable.

**Tech Stack:** Node 24.21.0 (`.nvmrc`), TypeScript strict, Next.js 16.4.0, Vitest 4.1.11, PostgreSQL 17.11-bookworm, npm lockfile, GitHub-hosted Ubuntu 24.04, GitHub Actions.

**Spec:** [Rancangan CPR-10 yang disetujui](../specs/2026-10-15-cpr-10-github-actions-design.md), [PRD §14.3](../../prd/2026-10-14-company-profile-prd.md), [CPR-10](https://linear.app/sineva-tech/issue/CPR-10/cpr-10-infra-setup-ci-github-actions).

**Status:** Spec disetujui: CI dahulu, proteksi menyusul. Plan ini menunggu review Founder; belum ada implementasi workflow/helper. Metode Native mengikuti pilihan eksplisit Founder sebelumnya. Branch `farhanfadillahrafi/cpr-10-infra-setup-ci-github-actions` memakai worktree terisolasi yang sudah ada; base main `0156c0e997db79558adba11d874e17a75b7b0c6b`. Checkout utama yang memiliki perubahan dokumen lokal dipertahankan.

## Global Constraints

- Foundation dan akun Editor tetap memakai admin custom Next.js/Better Auth, tanpa headless CMS. Tidak mengubah UI, library produk atau struktur data.
- UI sementara mengikuti identitas Sineva Tech; implementasi desain final menunggu instruksi/referensi Founder. CPR-10 tidak membuat desain baru.
- Satu job Linux GitHub-hosted runner; job/status check bernama stabil `verify`.
- Event `pull_request` ke `main`, `push` ke `main`, dan `workflow_dispatch`; tidak memakai `pull_request_target`, path filter atau pengecualian PR draft.
- Action dipin ke full commit SHA resmi; Node dari `.nvmrc`; install memakai `npm ci` dan cache download npm berbasis lockfile.
- Timeout job 20 menit, readiness server 30 detik. Tidak ada `continue-on-error` pada quality gate.
- PostgreSQL 17.11-bookworm; user `sineva`; database `sineva_compro_app_test`; hanya loopback. SQL dan HTTP suite tidak dijalankan paralel.
- `DATABASE_URL` dan `TEST_DATABASE_URL` menunjuk service test yang sama; `BETTER_AUTH_URL`/`TEST_BASE_URL` memakai `http://127.0.0.1:3001`.
- Credential database dan auth secret khusus CI disposable; `BETTER_AUTH_SECRET` minimal 32 karakter. Tidak membaca credential produksi atau bergantung pada `.env` developer di runner.
- Token `contents: read`; checkout tanpa credential tersimpan; tidak mengunggah `.env`/cookie/password/token/hash/row database.
- Tidak menonaktifkan rate limit, origin check, lockout atau redaksi log agar CI hijau. Tidak menambah runtime dependency.
- Proteksi `main` ditunda sesuai keputusan Founder. Acceptance “PR dengan CI gagal tidak bisa di-merge” tetap unchecked dan CPR-10 belum Done atas scope awal. Tidak membeli paket atau mengubah visibility.
- Tidak merge/deploy tanpa instruksi Founder; E2E dan Lighthouse tetap di tiket terpisah.

## Review Focus

1. Port 3001 sudah dipakai server orang lain: helper gagal sebelum tes; tidak memakai readiness server tersebut dan tidak membunuhnya. Tes Task 1.
2. Server tidak ready, mati saat startup/tes, atau HTTP suite gagal spawn/keluar nonzero: hasil tetap gagal dan seluruh proses milik helper dibersihkan. Tes Task 1.
3. SIGINT/SIGTERM atau child mengabaikan SIGTERM: batal bukan sukses; seluruh process group milik helper dihentikan dengan fallback terbatas waktu. Tes Task 1; cancellation run Task 3.
4. Environment test kosong/salah dan `.env` developer berbeda: berhenti sebelum spawn; tidak fallback ke DB developer atau mencetak credential. Tes Task 1 dan service fresh Task 3.
5. Perubahan PR baru menggantikan run lama atau tes sengaja merah: job tetap berjalan pada revision baru dan merah tidak dilaporkan hijau; enforcement merge tetap belum diklaim. Pemeriksaan workflow Task 2 dan probe GitHub Task 3.

## Struktur file dan kontrak

| File                                               | Tanggung jawab                                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `scripts/lib/with-test-server.ts` (baru)           | Lifecycle server + HTTP command, deadline, exit status, process-group cleanup; tidak membaca `.env` atau memilih database. |
| `scripts/test-http-production.ts` (baru)           | CLI memvalidasi `readTestEnv`, menentukan command repo dan origin tetap, meneruskan exit code dengan error aman.           |
| `tests/unit/with-test-server.test.ts` (baru)       | Tes lifecycle memakai proses HTTP dummy pada port ephemeral; tidak memerlukan DB/Next build.                               |
| `tests/unit/test-http-production.test.ts` (baru)   | Tes contract environment/command dan error aman CLI.                                                                       |
| `tests/fixtures/test-server-worker.ts` (baru)      | Child worker fixture untuk tes sinyal pada helper, sehingga tidak mengirim sinyal ke Vitest.                               |
| `package.json`                                     | Script `test:http:production`; dependency dan script lain tetap.                                                           |
| `.github/workflows/ci.yml` (baru)                  | Trigger, permissions, concurrency, Postgres service dan job `verify`.                                                      |
| `README.md`, PRD §14.3                             | Cara menjalankan CI-equivalent lokal, urutan SQL/build/HTTP, serta batas proteksi.                                         |
| `docs/architecture/cpr-10-ci-validation.md` (baru) | Evidence lokal/GitHub terikat SHA dan status acceptance.                                                                   |
| Spec/plan CPR-10, Linear CPR-10                    | Checklist aktual; proteksi tidak ditutup tanpa bukti.                                                                      |

## Task 1: Runner HTTP production dengan cleanup teruji

**Files:** buat helper, CLI, fixture dan kedua unit-test file pada tabel; ubah `package.json` bagian scripts. `scripts/test-runtime.ts` dan `src/env/test.ts` tetap menjadi contract yang dipakai.

**Interfaces:**

```ts
// scripts/lib/with-test-server.ts
export type TestCommand = Readonly<{ file: string; args: readonly string[] }>
export type TestServerOptions = Readonly<{
  server: TestCommand
  tests: TestCommand
  env: NodeJS.ProcessEnv
  readyUrl: URL
  readinessTimeoutMs?: number // default 30_000
  pollIntervalMs?: number // default 200
  shutdownTimeoutMs?: number // default 2_000, sebelum SIGKILL
}>
export async function withTestServer(options: TestServerOptions): Promise<number>

// scripts/test-http-production.ts
export function productionHttpOptions(input: NodeJS.ProcessEnv): TestServerOptions
export async function main(input: NodeJS.ProcessEnv): Promise<number>
```

`withTestServer` menghasilkan 0 hanya jika server tetap hidup sampai seluruh HTTP tests sukses. Test nonzero diteruskan; startup/readiness/early-exit/spawn error menghasilkan 1; SIGINT 130; SIGTERM 143. Tidak memanggil `process.exit` dari library. CLI menetapkan `process.exitCode` setelah cleanup. Hanya CLI memuat `dotenv/config`.

- [ ] **Step 1 — tulis tes RED dengan child nyata.** Gunakan `node:net` untuk memperoleh port bebas pada `127.0.0.1`, HTTP dummy melalui `process.execPath -e`, dan Vitest timeout 10 detik untuk setiap kasus. Tutup listener/proses fixture di `afterEach`, termasuk ketika assertion gagal. Contoh inti:

```ts
import { expect, it } from 'vitest'
import { withTestServer } from '../../scripts/lib/with-test-server'

it.each([0, 7])('returns HTTP test exit %i and closes its server', async (code) => {
  const readyUrl = await unusedLoopbackUrl()
  const server = {
    file: process.execPath,
    args: [
      '-e',
      `require('node:http').createServer((q,s)=>s.end('ok')).listen(${readyUrl.port},'127.0.0.1')`,
    ],
  }
  expect(
    await withTestServer({
      server,
      tests: { file: process.execPath, args: ['-e', `process.exit(${code})`] },
      env: process.env,
      readyUrl,
      readinessTimeoutMs: 2_000,
      shutdownTimeoutMs: 200,
    }),
  ).toBe(code)
  expect(await canBindLoopback(readyUrl)).toBe(true)
})
```

`unusedLoopbackUrl(): Promise<URL>` membuka `net.Server` pada port 0, membaca `AddressInfo.port`, menutup listener dan mengembalikan URL. `canBindLoopback(url: URL): Promise<boolean>` mencoba bind lalu menutup listener sementara; mengembalikan false pada `EADDRINUSE`, sedangkan error lain menggagalkan tes. Kedua helper hanya untuk tes. Assertion port bebas membuktikan cleanup nyata.

- [ ] **Step 2 — tambahkan tes kegagalan berikut.** Gunakan Node-command pada tabel; periksa status serta apakah testcommand dijalankan melalui marker file dalam direktori `mkdtemp` milik tes. Bersihkan hanya direktori tersebut setelah setiap tes.

| Scenario               | Fixture/hasil yang diharapkan                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timeout                | Server `setInterval(()=>{},1000)`; readiness 150 ms → 1, marker tidak ada, proses berhenti.                                                        |
| Early exit             | Server `process.exit(0)` dan `process.exit(9)` → keduanya 1, marker tidak ada.                                                                     |
| Spawn failure          | Executable tidak ada untuk server dan terpisah untuk tests → 1, tidak ada unhandled rejection; port bebas.                                         |
| Server mati saat tests | Testcommand mengirim SIGTERM ke PID server dari file fixture lalu menunggu → 1, proses tests juga dihentikan.                                      |
| Port terpakai          | Listener fixture menjawab 200 pada readyUrl; helper → 1 sebelum spawn/tests, listener existing tetap bekerja.                                      |
| SIGINT/SIGTERM         | Jalankan worker fixture sebagai child; kirim sinyal saat startup dan saat HTTP suite aktif → 130/143, seluruh PID fixture berhenti dan port bebas. |
| Cleanup paksa          | Dummy server mendaftarkan `process.on('SIGTERM',()=>{})`; helper memakai SIGKILL setelah deadline shutdown; tidak hang.                            |
| Wrapper/grandchild     | Fixture wrapper menyalakan HTTP child dalam grup yang sama; cleanup menghentikan keduanya, termasuk bila wrapper sudah lebih dulu exit.            |

Worker mengimpor `withTestServer`, memakai dummy HTTP-command yang sama dan menulis PID server/tests ke direktori tes. Marker fase `server-started` dan `tests-started` menentukan kapan testparent mengirim sinyal untuk masing-masing kasus startup/tes aktif. Pasang signal handler sebelum spawn agar cancellation saat startup tidak lolos dari cleanup. Hanya testparent mengirim sinyal. `process.kill(pid, 0)` harus akhirnya menghasilkan `ESRCH`; gunakan deadline. Port unit tests bersifat ephemeral agar preview 3001 tetap bekerja. Tidak ada credential produksi dalam fixture/logs.

- [ ] **Step 3 — jalankan tes RED terarah.**

```bash
npm test -- tests/unit/with-test-server.test.ts tests/unit/test-http-production.test.ts
```

Harus gagal karena module/export belum ada; tidak mencoba migration database lokal.

- [ ] **Step 4 — implementasikan lifecycle.** Gunakan `spawn(file, [...args], { env, stdio: 'inherit', detached: true })` pada macOS/Linux, tanpa shell. Preflight bind/tutup host/port readyUrl; jika terpakai langsung gagal. Pasang listener `error` dan `exit` sejak spawn. Race setiap request readiness (request-timeout + AbortController) terhadap server-exit dan deadline total; hanya HTTP 2xx dianggap ready. Periksa server masih hidup sebelum/sesudah tes. Race test-exit terhadap server-exit tak terduga dan cancellation; hentikan tests jika server mati.

```ts
// Hanya grup dari proses detached yang dimulai helper ini.
function signalOwnedGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
}
```

Dalam `finally`: batalkan fetch/timer aktif, kirim TERM ke kedua grup milik helper (termasuk ketika wrapper langsung sudah exit), tunggu maksimal shutdownTimeoutMs, kirim KILL ke grup yang masih hidup, tunggu exit child langsung dan lepaskan signal listener milik helper. Hasil 0 hanya setelah cleanup sukses. Log hanya kategori pesan/status tetap, tanpa exception/command/env/URL lengkap. Jangan memakai `pkill` luas atau membunuh pemilik port. Library menolak platform non-POSIX dengan pesan jelas; target sekarang Linux/macOS.

- [ ] **Step 5 — implementasikan CLI dan tes environment.** Panggil `productionHttpOptions` sebelum spawn; tes meliputi DB kosong/remote/nama salah, auth secret terlalu pendek dan `DATABASE_URL` developer yang berbeda. Harus gagal aman tanpa spawn; config test valid mengganti DB/origin untuk server dan tests. Inti factory:

```ts
const validated = readTestEnv(input)
return {
  server: {
    file: process.execPath,
    args: ['--import', 'tsx', 'scripts/test-runtime.ts', 'server', '--production'],
  },
  tests: {
    file: process.execPath,
    args: ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.integration.config.mts'],
  },
  env: {
    ...input,
    DATABASE_URL: validated.databaseUrl,
    TEST_DATABASE_URL: validated.databaseUrl,
    BETTER_AUTH_URL: validated.authUrl,
    TEST_BASE_URL: validated.authUrl,
  },
  readyUrl: new URL('/admin/login', validated.authUrl),
  readinessTimeoutMs: 30_000,
}
```

`main` menangkap exception validasi/lifecycle dan menghasilkan 1 dengan pesan tetap `Production HTTP verification failed.`; tanpa raw Error. Import saat tes tidak memulai `main`: bandingkan `import.meta.url` dengan `pathToFileURL(resolve(process.argv[1])).href` pada entrypoint guard. Tambahkan script:

```json
"test:http:production": "tsx scripts/test-http-production.ts"
```

- [ ] **Step 6 — GREEN dan commit.** Jalankan tes terarah, seluruh `npm test`, lint/typecheck/format. `next typegen` boleh menghasilkan `.next/types` bila belum ada. Tidak perlu perubahan source produk atau dependency/lockfile. Commit `test(ci): add managed production HTTP runner (CPR-10)`.

## Task 2: Workflow GitHub minimal dan dokumentasi

**Files:** buat `.github/workflows/ci.yml`; ubah `README.md` dan PRD §14.3; buat evidence-document berisi hasil yang sudah diamati.

**Interfaces:** memakai `npm run test:http:production` dari Task 1, exit 0 = suite hijau dan server dibersihkan. Menghasilkan check `verify`; tanpa artifact/deployment atau kemampuan API-write.

- [ ] **Step 1 — tulis workflow.** Releases/tag-refs dan action metadata diperiksa pada 15 Oktober 2026 melalui GitHub API resmi: checkout v7.0.1 → `3d3c42e5aac5ba805825da76410c181273ba90b1`, setup-node v7.1.0 → `949feb2413d6458794dcd2491c4babbbce0c15c1`; keduanya `node24`. Gunakan SHA lengkap berikut:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
jobs:
  verify:
    name: verify
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    services:
      postgres:
        image: postgres:17.11-bookworm
        env:
          POSTGRES_USER: sineva
          POSTGRES_PASSWORD: ci-disposable-only
          POSTGRES_DB: sineva_compro_app_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd "pg_isready -U sineva -d sineva_compro_app_test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 12
    env:
      CI: 'true'
      NEXT_TELEMETRY_DISABLED: '1'
      DATABASE_URL: postgresql://sineva:ci-disposable-only@127.0.0.1:5433/sineva_compro_app_test
      TEST_DATABASE_URL: postgresql://sineva:ci-disposable-only@127.0.0.1:5433/sineva_compro_app_test
      BETTER_AUTH_SECRET: ci-disposable-auth-secret-for-isolated-tests-only
      BETTER_AUTH_URL: http://127.0.0.1:3001
      TEST_BASE_URL: http://127.0.0.1:3001
    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - name: Setup Node
        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: package-lock.json
      - name: Install
        run: npm ci
      - name: Format
        run: npm run format:check
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npm run typecheck
      - name: Unit tests
        run: npm test
      - name: Migration journal
        run: npm run db:check
      - name: Prepare test database
        run: npm run test:prepare
      - name: Database tests
        run: npm run test:database
      - name: Production build
        run: npm run build
      - name: Production HTTP tests
        run: npm run test:http:production
```

Tidak ada `NODE_ENV=production` saat install (dev tooling tetap dipasang). Tidak ada shell interpolation judul/body PR. Port service hanya untuk runner ephemeral; contract aplikasi tetap loopback. Tidak ada `if`/`continue-on-error` yang mengubah gagal menjadi sukses.

- [ ] **Step 2 — validasi YAML dan semantik.** Jalankan `npx prettier --check .github/workflows/ci.yml` dan parse dengan dependency `yaml` yang sudah ada:

```bash
node --input-type=module -e 'import{readFileSync}from"node:fs";import{parseDocument}from"yaml";const d=parseDocument(readFileSync(".github/workflows/ci.yml","utf8"),{uniqueKeys:true});if(d.errors.length)throw new Error("Invalid CI YAML");const w=d.toJS();if(w.jobs.verify.name!=="verify"||w.permissions.contents!=="read"||!("pull_request"in w.on)||("pull_request_target"in w.on))throw new Error("Invalid CI gate");console.log("CI YAML parsed; review remaining semantics against plan")'
```

Manually compare trigger filters, concurrency expression, job timeout, exact action refs, service health/env, command order dan tidak adanya bypass terhadap YAML di atas. GitHub run pada Task 3 adalah validasi platform yang sebenarnya; parse lokal bukan klaim schema Actions sepenuhnya valid. Tidak menambah test yang hanya menyalin semua baris workflow.

- [ ] **Step 3 — dokumentasikan perilaku.** README: perintah baru harus setelah build dan saat port 3001 bebas; helper tidak start dev, SQL/HTTP sequential, environment test aman, preview lokal jangan dimatikan sembarangan. Tambahkan bagian CI berisi event/check/stages dan batas proteksi, serta hapus “CI” dari daftar fitur belum ada hanya setelah workflow benar-benar diterapkan. PRD §14.3 mengganti urutan lama menjadi `format → lint → typecheck → unit → journal/migration → integration SQL → build → integration HTTP production`; E2E/Lighthouse disebut tahap tiket QA mendatang, bukan gate saat ini. Aturan “semua lulus sebelum merge” tetap kebijakan; enforcement server belum tersedia pada paket repo private ini.

- [ ] **Step 4 — verifikasi fresh secara lokal tanpa DB developer.** Gunakan checkout/archive test terpisah dari source revision dan PostgreSQL disposable bernama unik (port host bebas yang dipetakan ke `TEST_DATABASE_URL`). Jangan memakai `.env` dari checkout utama. Pastikan nama DB test sesuai validator; jalankan urutan workflow persis. Hentikan container/proses/checkout sementara milik task setelah selesai. Preview existing 3001 tidak boleh dibunuh karena port conflict: gunakan lingkungan/container terisolasi untuk end-to-end atau hentikan hanya session preview milik agen secara terkontrol lalu pulihkan setelahnya. Catat OS dan bahwa lokal bukan GitHub runner.

- [ ] **Step 5 — commit.** `git diff --check`, format/lint/typecheck/tests relevan lulus; periksa staged diff tidak memuat `.env`, credential pengguna, generated build atau source produk. Commit `ci: verify Compro against disposable PostgreSQL (CPR-10)`.

## Task 3: Bukti GitHub, review independen dan PR

**Files:** `docs/architecture/cpr-10-ci-validation.md`, checklist spec/plan; PR GitHub dan Linear CPR-10. Kode berubah hanya jika ada failure/review finding yang direproduksi dan diperbaiki.

**Interfaces:** consume workflow `CI`/job `verify` dan feature branch Task 2. Produce PR yang dapat direview, exact-SHA run evidence dan acceptance truthful; tidak menghasilkan merge/deploy/proteksi palsu.

- [ ] **Step 1 — publish draft PR.** Push feature branch, buat PR base `main` dengan judul `CPR-10 | [Infra] Setup CI GitHub Actions`; body dari file dengan `gh pr create --body-file`, lalu selalu `attach_artifact` dengan URL PR. Body menjelaskan check, urutan, bukti dan proteksi deferred. Trigger pertama dari event PR karena workflow belum ada pada default branch; jangan mengandalkan `workflow_dispatch` sebelum merge.

- [ ] **Step 2 — lihat run sesungguhnya.** Gunakan `gh pr checks <number>`, `gh run list --branch <branch> --event pull_request`, dan `gh run view <run-id> --json headSha,conclusion,event,jobs,url`. Cocokkan PR head dan checkout/merge ref; simpan URL run, head SHA, merge SHA bila ada, dan hasil tiap tahap. Perbaiki failure berdasarkan log aman, ulang suite relevan dan push; tidak mengubah timeout/security/test assertion hanya untuk hijau. Jika tidak bisa jalan karena billing/outage, simpan hasil aktual dan jangan centang acceptance yang belum terbukti.

- [ ] **Step 3 — negative gate terkontrol.** Sesudah run positif, tambahkan hanya test sementara berikut, commit dengan penanda probe, push dan tunggu job `verify` gagal tepat di unit tests:

```ts
// tests/unit/ci-negative-probe.test.ts — hanya commit probe
import { expect, it } from 'vitest'
it('CPR-10 intentionally proves a red gate', () => {
  expect('intentional CI probe').toBe('green')
})
```

Catat run URL/SHA/conclusion failure dan tahap berikutnya skipped. Hapus file probe dan commit pemulihan (tanpa force-push atau merge); run terbaru harus hijau. Probe gagal tetap di history branch untuk bukti, tetapi file/assertion gagal tidak ada pada final tree dan tidak boleh menjadi head yang di-merge. Jalur integrasi PR nantinya squash supaya commit probe tidak masuk history main.

- [ ] **Step 4 — concurrency/cancel.** Push dua revisi dokumentasi evidence berurutan saat run pertama masih aktif; verifikasi run lama canceled dan run baru mencapai `verify` success pada head terbaru. Catat canceled sebagai canceled, bukan pass. Jika run terlalu cepat, gunakan satu `gh run cancel <run-id>` untuk membuktikan cancellation aktual lalu rerun pada head yang sama, tanpa sleep buatan permanen dalam workflow. Process cleanup sinyal/TERM fallback dibuktikan unit tests Task 1; runner/service disposal dikonfirmasi log Actions. Canceled run tidak menjadi bukti semua tes lulus.

- [ ] **Step 5 — whole-branch independent review.** Reviewer baru memeriksa spec+diff, group cleanup/cancellation/readiness, safe environment, action SHAs/permissions/cache, urutan/fresh DB dan batas acceptance. Jangan mengklaim reviewer independen jika tool/agen reviewer tidak tersedia; laporkan keterbatasan tersebut. Reproduksi temuan dengan regression RED lalu perbaiki GREEN. Setiap perubahan source setelah run hijau membutuhkan run final pada head baru.

- [ ] **Step 6 — rekonsiliasi evidence dan handoff.** Bukti mencatat commands/counts/revision dan URL run positif/negatif/canceled/restored; tidak menyalin rahasia/log auth. README/PRD dan checklist hanya menyatakan hasil aktual. Final head tanpa probe memperoleh check `verify` success. Update PR ready setelah review selesai; attach jika belum. Linear centang workflow PR dan Postgres hanya setelah terbukti; “PR dengan CI gagal tidak bisa di-merge” tetap unchecked, status belum Done karena paket belum mendukung proteksi. Jangan mengirim request proteksi berulang atau mengubah billing/visibility. Laporkan PR dan keputusan yang masih tertunda, tanpa merge/deploy.

## Self-review plan

| Requirement spec                                                     | Pemilik dan bukti                                                    |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Workflow PR/push/manual, check stabil, timeout/concurrency           | Task 2 YAML; Task 3 run/head/cancel                                  |
| Checkout SHA pins, npm cache/ci, read-only/no secrets/deploy         | Task 2 configuration + independent review Task 3                     |
| Fresh PG 17.11, test-only loopback env/migrations, SQL sebelum build | Task 1 env tests; Tasks 2–3 fresh service execution                  |
| HTTP setelah build, deadline, early-exit/test failure/cancel cleanup | Task 1 fixture tests; Task 3 actual Linux run                        |
| Format/lint/types/unit/journal/DB/build/HTTP                         | Task 2 exact command sequence; Task 3 green run                      |
| Negative/positive proof pada revision yang benar                     | Task 3 probe, pemulihan dan latest-head checks                       |
| Dokumentasi status, branch protection deferred, no merge/deploy      | Tasks 2–3 README/PRD/evidence/Linear                                 |
| Review Focus 1–5                                                     | Task 1 port/failure/signal/env tests; Tasks 2–3 trigger/cancel/probe |

Tidak ada perubahan auth/schema/UI, runtime dependency baru, parallel fixture suites, deployment, atau klaim proteksi yang menggantikan bukti GitHub. Interface names/options konsisten antar-task. Pemeriksaan YAML ringan hanya sanity check; platform execution dan lifecycle tests adalah bukti utama. Setiap perubahan requirement baru dikonfirmasi ke Founder; penyesuaian implementasi yang menjaga contract boleh dilakukan berdasarkan bukti tes.
