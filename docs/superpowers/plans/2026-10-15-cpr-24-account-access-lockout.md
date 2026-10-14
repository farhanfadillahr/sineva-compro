# CPR-24 — Account Access and Lockout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin dapat mengelola akun Editor dengan otorisasi server, credential/session library yang atomik, serta lockout akun 15 menit setelah lima kegagalan login berturut-turut pada seluruh jalur HTTP login.

**Architecture:** Fitur Users memiliki validasi/query/service/action/UI sendiri dalam modular monolith Next.js. Better Auth tetap memverifikasi password dan mengelola session; policy login mengikat adapter pada transaksi PostgreSQL, mengunci akun, dan menolak pembuatan session sebelum insert ketika akun terkunci. Shared guard membaca status/peran terbaru pada server; database row lock yang sama dipakai login dan mutation akun.

**Tech Stack:** Node 24 LTS, Next 16.4.0, React 19.2.6, TypeScript strict, Better Auth 1.7.7, Drizzle ORM 0.45.4, node-postgres 8.23.1, PostgreSQL 17, Vitest, Browser bawaan Codex.

**Spec:** [Rancangan CPR-24 yang disetujui](../specs/2026-10-15-cpr-24-account-access-lockout-design.md). [PRD Rev. 2](../../prd/2026-10-14-company-profile-prd.md) §9.3 dan [CPR-24](https://linear.app/sineva-tech/issue/CPR-24/admin-kelola-pengguna-peran-admineditor-and-lockout-login).

**Status:** spec telah disetujui; plan ini menunggu review dan pilihan metode eksekusi. Belum ada source fitur/migration CPR-24 yang dibuat. Base adalah `origin/main` pada `641d867d863010ccbc96780d9930335f837de5a2`; branch CPR-24 menggunakan worktree terisolasi yang sudah ada. Checkout utama memiliki perubahan dokumen lokal yang dipertahankan.

## Global Constraints

- Next.js admin custom, Better Auth 1.7.7, PostgreSQL/Drizzle, dua peran `admin`/`editor`, signup tertutup, bootstrap Admin melalui operator, lockout 15 menit setelah lima kegagalan berturut-turut. Bahasa UI admin adalah Indonesia.
- UI hanya mengelola Editor: tambah, ubah nama/email, aktif/nonaktif, dan ganti password. Tidak membuat/mempromosikan/mengubah Admin atau menghapus akun permanen.
- Password awal dan pengganti 12–128 karakter; validator identitas mengikuti batas fondasi: nama 2–80 karakter setelah trim dan email maksimal 254 karakter setelah normalisasi lowercase/trim.
- Tidak mengubah algoritma hash/session, schema auth hasil generator, signup publik, endpoint operator HTTP, logo, atau kontrak scope konten/lead.
- Guard ada pada setiap query/action. Principal tidak berasal dari hidden input dan tidak memuat cookie, token, password/hash, IP atau seluruh row auth.
- Login malformed tidak menambah counter; error database/rate limit tidak dianggap password salah; login sukses mereset counter hanya jika akun tidak terkunci.
- Seluruh pemeriksaan memakai database test loopback tervalidasi. Migration developer memerlukan inventory data dan perintah operator; tidak menjalankan migration ke production atau menghapus volume/data.
- Suite DB dan HTTP bergantian. Fixture hanya dibersihkan berdasarkan ID/email miliknya; tanpa truncate/drop database, credential/log rahasia, atau email nyata.
- Dependensi langsung tetap exact; tidak menambah framework auth, redis, email/invitation atau paket validasi hanya untuk menggandakan validator yang sudah ada.
- Tidak merge/deploy sebagai bagian implementasi. PR disiapkan untuk review setelah seluruh acceptance dan review independen lulus.

## Review Focus

1. Request JSON malformed/terlalu besar, origin salah dan callback URL tidak dipercaya: gagal aman, tidak menambah counter, tidak membuat session; Task 2.
2. Password benar bersamaan dengan kegagalan kelima: hanya hasil yang konsisten dengan urutan transaksi yang sah; tidak ada session baru setelah lock aktif; Task 2.
3. Lock timeout/koneksi terputus dan rollback library: lock/koneksi dilepas, tidak ada fail-open atau counter/session parsial; Tasks 1–2.
4. ID target Admin/diri sendiri, role palsu, email duplicate dan role aktor yang berubah: target tidak berubah atau operasi rollback; Task 3.
5. Penggantian password/ban dengan login konkuren atau kegagalan revokasi: tidak ada credential baru dengan session lama yang tetap valid; Task 3.

## Struktur file dan kontrak bersama

| File                                                      | Tanggung jawab                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/features/auth/lockout-policy.ts`                     | Aturan threshold/expiry/reset murni                                        |
| `src/features/auth/lockout-schema.ts`                     | Tabel aplikasi `auth_lockout`, terpisah dari generator auth                |
| `src/features/auth/login-input.ts`                        | Parsing login JSON terbatas, normalisasi email, pembatasan body            |
| `src/features/auth/login-errors.ts`                       | Klasifikasi kegagalan auth yang dikenal dan response generik               |
| `src/features/auth/login-handler.server.ts`               | Envelope transaksi/row lock/handler library/counter                        |
| `src/features/auth/access.server.ts`, `access-errors.ts`  | Principal authoritative dan error otorisasi, tanpa dependency auth → Users |
| `src/features/auth/session.server.ts`                     | Adapter Next headers/redirect untuk guard bersama                          |
| `src/lib/auth/options.ts`                                 | Konfigurasi auth + hook request-scoped sebelum session dibuat              |
| `src/lib/db/schema.ts`, `drizzle/`                        | Agregasi schema dan migration aditif                                       |
| `src/features/users/types.ts`, `input.ts`, `errors.ts`    | DTO/input/error domain aman                                                |
| `src/features/users/query.server.ts`, `service.server.ts` | Query berizin dan mutation transaksional melalui library                   |
| `src/features/users/actions.ts`, `components/`            | Adapter Server Actions, state form dan komponen Users                      |
| `src/app/(admin)/admin/(protected)/users/`                | Halaman daftar/tambah/edit dan penolakan akses                             |
| `tests/helpers/auth-context.ts`                           | Fixture test-owned dengan auth library dan cleanup                         |
| `tests/unit/`, `tests/database/`, `tests/integration/`    | Regresi aturan, transaksi/otorisasi dan HTTP production                    |

Interface publik antartask ditetapkan sekali:

```ts
// lockout-policy.ts
type LockoutState = { failedAttempts: number; lockedUntil: Date | null }
function evaluateLockout(state: LockoutState, now: Date): { locked: boolean; state: LockoutState }
function applyLoginOutcome(
  state: LockoutState,
  outcome: 'failure' | 'success',
  now: Date,
): LockoutState

// options.ts: parameter baru optional, caller fondasi tetap kompatibel
type AuthPolicy = { beforeCreateSession?: (userId: string) => Promise<void> }
function createAuth(
  database: Database | DatabaseTransaction,
  env: ServerEnv,
  policy?: AuthPolicy,
): Auth

// login-handler.server.ts dan access.server.ts
function handlePasswordLogin(
  database: Database,
  env: ServerEnv,
  request: Request,
): Promise<Response>
function loadPrincipal(
  database: Database | DatabaseTransaction,
  env: ServerEnv,
  headers: Headers,
): Promise<Principal | null>
function assertCapability(principal: Principal | null, capability: Capability): Principal
class AccessDeniedError extends Error {
  code: 'UNAUTHORIZED' | 'FORBIDDEN'
}

// users/types.ts
type UserSummary = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor'
  active: boolean
}
type UserListInput = { search: string; page: number; pageSize: number }
type UserPage = { users: UserSummary[]; total: number; page: number; pageSize: number }
type CreateEditorInput = { name: string; email: string; password: string }
type UpdateEditorInput = { userId: string; name: string; email: string }
type EditorStatusInput = { userId: string; active: boolean }
type EditorPasswordInput = { userId: string; newPassword: string }
type UsersErrorCode =
  'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'UNAVAILABLE'
type UserActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Record<string, string>
  userId?: string
}
class UsersServiceError extends Error {
  code: UsersErrorCode
  fieldErrors?: Record<string, string>
}
function parseCreateEditor(input: unknown): CreateEditorInput
function parseUpdateEditor(input: unknown): UpdateEditorInput
function parseEditorStatus(input: unknown): EditorStatusInput
function parseEditorPassword(input: unknown): EditorPasswordInput
function parseUserList(input: unknown): UserListInput

// query.server.ts dan service.server.ts: semua mengautentikasi headers sendiri
function listUsers(
  database: Database,
  env: ServerEnv,
  headers: Headers,
  input: UserListInput,
): Promise<UserPage>
function getEditor(
  database: Database,
  env: ServerEnv,
  headers: Headers,
  userId: string,
): Promise<UserSummary>
function createEditor(
  database: Database,
  env: ServerEnv,
  headers: Headers,
  input: unknown,
): Promise<UserSummary>
function updateEditor(
  database: Database,
  env: ServerEnv,
  headers: Headers,
  input: unknown,
): Promise<UserSummary>
function setEditorActive(
  database: Database,
  env: ServerEnv,
  headers: Headers,
  input: unknown,
): Promise<{ success: true }>
function changeEditorPassword(
  database: Database,
  env: ServerEnv,
  headers: Headers,
  input: unknown,
): Promise<{ success: true }>
```

`ServerEnv`/`Auth` adalah alias dari `ReturnType<typeof readServerEnv>` dan `ReturnType<typeof createAuth>` yang sudah ada, bukan tipe auth paralel. Function declaration di atas adalah kontrak plan, bukan file source siap compile; implementasi memakai import tipe dari modul pemilik. Biarkan return factory `createAuth` diinfer oleh konfigurasi Better Auth; jangan mengannotasi factory dengan alias `Auth` yang berasal dari ReturnType factory itu sendiri, agar tidak membuat tipe rekursif atau menghilangkan API plugin.

### Task 1: State lockout, migration dan fixture terisolasi

**Files:** Create `src/features/auth/lockout-policy.ts`, `lockout-schema.ts`, `tests/helpers/auth-context.ts`, `tests/unit/auth-lockout.test.ts`, `tests/database/lockout-schema.test.ts`; modify `src/lib/db/schema.ts`, `vitest.database.config.mts`, `vitest.integration.config.mts`; generate migration di `drizzle/`.

**Consumes:** `createDatabase`, `readTestEnv`, `createAuth`, schema auth fondasi. **Produces:** `LockoutState`, dua fungsi policy pada kontrak, tabel `authLockout`, dan `createAuthTestContext()` dengan fixture/cleanup nyata.

- [ ] Tulis tes RED untuk threshold, lock tidak diperpanjang, expiry boundary dan reset sukses:

```ts
import { expect, it } from 'vitest'
import { applyLoginOutcome, evaluateLockout } from '../../src/features/auth/lockout-policy'

it('locks the fifth failure and never extends an active lock', () => {
  const now = new Date('2026-10-15T00:00:00.000Z')
  const fifth = applyLoginOutcome({ failedAttempts: 4, lockedUntil: null }, 'failure', now)
  expect(fifth.failedAttempts).toBe(5)
  expect(fifth.lockedUntil?.toISOString()).toBe('2026-10-15T00:15:00.000Z')
  expect(applyLoginOutcome(fifth, 'failure', new Date('2026-10-15T00:01:00Z'))).toEqual(fifth)
  expect(evaluateLockout(fifth, new Date('2026-10-15T00:15:00Z'))).toEqual({
    locked: false,
    state: { failedAttempts: 0, lockedUntil: null },
  })
})

it('clears failures on success but cannot clear an active lock', () => {
  const now = new Date('2026-10-15T00:00:00Z')
  expect(applyLoginOutcome({ failedAttempts: 3, lockedUntil: null }, 'success', now)).toEqual({
    failedAttempts: 0,
    lockedUntil: null,
  })
  const locked = { failedAttempts: 5, lockedUntil: new Date('2026-10-15T00:15:00Z') }
  expect(applyLoginOutcome(locked, 'success', now)).toEqual(locked)
})
```

- [ ] Run `npm test -- tests/unit/auth-lockout.test.ts`; kedua tes harus gagal karena modul/perilaku baru belum ada.
- [ ] Implementasikan policy murni: evaluasi expiry dengan `lockedUntil <= now`; threshold tepat 5; lock aktif tidak berubah; tidak membaca clock mesin di fungsi. Tambahkan schema berikut dan export melalui agregator:

```ts
import { sql } from 'drizzle-orm'
import { check, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './schema'

export const authLockout = pgTable(
  'auth_lockout',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
  },
  (table) => [check('auth_lockout_attempts_range', sql`${table.failedAttempts} between 0 and 5`)],
)
```

- [ ] Buat `createAuthTestContext()` berikut dengan `readTestEnv` dan satu `createDatabase`. Pembuatan akun tanpa headers hanya helper test trusted; tidak menambah jalur produksi. Setiap IP default memakai subnet dokumentasi IPv6 baru agar data rate-limit fixture file lain tidak mengganggu tes account lockout. Tes limiter memakai IP yang sama secara sengaja.

```ts
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { inArray } from 'drizzle-orm'
import { readTestEnv } from '../../src/env/test'
import { createDatabase } from '../../src/lib/db/connection'
import { createAuth } from '../../src/lib/auth/options'
import { user } from '../../src/features/auth/schema'

type TestIdentity = { id: string; name: string; email: string; password: string }

export async function createAuthTestContext() {
  const env = readTestEnv(process.env)
  const connection = createDatabase(env.databaseUrl)
  const auth = createAuth(connection.db, env)
  const ownedIds: string[] = []
  const ip = () => {
    const groups = randomUUID().replaceAll('-', '').match(/.{4}/g)!
    return ['2001', 'db8', ...groups.slice(0, 6)].join(':')
  }
  const request = (email: string, password: string, address = ip()) =>
    new Request(`${env.authUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        origin: env.authUrl,
        'content-type': 'application/json',
        'x-forwarded-for': address,
      },
      body: JSON.stringify({ email, password }),
    })
  return {
    env,
    connection,
    auth,
    ip,
    request,
    async create(role: 'admin' | 'editor'): Promise<TestIdentity> {
      const input = {
        name: 'Access Test',
        email: `access-${randomUUID()}@example.test`,
        password: randomUUID(),
      }
      const created = await auth.api.createUser({ body: { ...input, role } })
      ownedIds.push(created.user.id)
      return { id: created.user.id, ...input }
    },
    async headersFor(identity: TestIdentity): Promise<Headers> {
      const response = await auth.handler(request(identity.email, identity.password))
      if (response.status !== 200) throw new Error('Fixture sign-in failed')
      const cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ')
      return new Headers({ cookie, origin: env.authUrl })
    },
    async cleanup() {
      try {
        if (ownedIds.length) await connection.db.delete(user).where(inArray(user.id, ownedIds))
      } finally {
        await connection.pool.end()
      }
    },
  }
}
```

- [ ] Untuk mengimpor modul `server-only` dalam tes Node, alias hanya marker tersebut ke `node_modules/server-only/empty.js` pada config database/integration. Guard/session/library nyata tidak dimock. Contoh konfigurasi:

```ts
import { fileURLToPath } from 'node:url'
// Properti resolve ditambahkan pada defineConfig yang sudah ada.
const serverOnly = fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url))
const resolve = { alias: { 'server-only': serverOnly } }
```

- [ ] Run `npm run db:generate -- --name=auth_lockout`, periksa SQL hanya CREATE tabel/index/constraint baru; generator auth tetap tidak diubah. Run `npm run test:prepare` dua kali ke DB test. Tes schema harus membuktikan FK cascade untuk fixture, constraint menolak -1/6, timestamp timezone roundtrip dan tidak ada penghapusan tabel lama.
- [ ] Run unit policy + suite database; commit `feat(auth): add persisted account lockout state (CPR-24)` dengan source/schema/test/migration task ini saja.

### Task 2: Login HTTP transaksional dan non-enumerasi

**Files:** Create `src/features/auth/login-input.ts`, `login-errors.ts`, `login-handler.server.ts`, `tests/unit/login-input.test.ts`, `tests/database/account-lockout.test.ts`, `tests/integration/account-lockout.test.ts`; modify `src/lib/auth/options.ts`, `src/app/api/auth/[...all]/route.ts`.

**Consumes:** Task 1 policy/schema/fixture. **Produces:** `handlePasswordLogin` dan `AuthPolicy.beforeCreateSession`; handler HTTP login tidak mempunyai dispatch alternatif.

- [ ] Tulis RED memakai DB/library nyata: empat kegagalan, kegagalan kelima, password benar tetap ditolak selama lock, reset sukses dan login sesudah expiry. Setiap request memakai IP test berbeda untuk membuktikan lockout akun tidak bergantung pada limit per IP:

```ts
const context = await createAuthTestContext()
try {
  const editor = await context.create('editor')
  for (let index = 1; index <= 5; index++) {
    const response = await handlePasswordLogin(
      context.connection.db,
      context.env,
      context.request(editor.email, 'incorrect-test-password', context.ip()),
    )
    expect(response.status).toBe(401)
    expect(response.headers.getSetCookie()).toEqual([])
  }
  const blocked = await handlePasswordLogin(
    context.connection.db,
    context.env,
    context.request(editor.email, editor.password, context.ip()),
  )
  expect(blocked.status).toBe(401)
  const result = await context.connection.pool.query(
    'SELECT failed_attempts, locked_until > clock_timestamp() AS locked FROM auth_lockout WHERE user_id=$1',
    [editor.id],
  )
  expect(result.rows).toEqual([{ failed_attempts: 5, locked: true }])
  const sessions = await context.connection.pool.query(
    'SELECT count(*)::int AS count FROM session WHERE user_id=$1',
    [editor.id],
  )
  expect(sessions.rows[0].count).toBe(0)
} finally {
  await context.cleanup()
}
```

- [ ] Run `npm run test:database -- tests/database/account-lockout.test.ts`; tes harus RED sebelum handler/policy dibuat.
- [ ] Implementasikan `AuthPolicy` sebagai parameter optional ketiga factory. Hook tidak melepas guard ban plugin; ia hanya memanggil callback request-scoped sebelum session disimpan:

```ts
// Di betterAuth options dalam createAuth(database, env, policy).
databaseHooks: policy?.beforeCreateSession ? {
  session: { create: { before: async (session) => {
    await policy.beforeCreateSession!(session.userId)
  } } },
} : undefined,
```

- [ ] Implementasikan parser body JSON maksimum 8 KiB menggunakan reader dengan penghentian setelah batas; validasi Content-Type, JSON object, email string ≤254 dan password string nonkosong ≤128. Normalisasi email; pertahankan hanya opsi library yang tervalidasi (`rememberMe` boolean dan `callbackURL` string ≤2048), tanpa menganggap callback dipercaya. Rebuild Request dengan body canonical dan headers/origin asli. JSON malformed/oversized ditolak 400/413 tanpa SQL counter; callback/origin tetap diverifikasi library. Tambahkan tes unit untuk seluruh kondisi, termasuk role/actorId tambahan yang ditolak.
- [ ] Implementasikan envelope `database.transaction`: `SET LOCAL lock_timeout='5s'`; lookup user canonical `FOR UPDATE`; baca state + `clock_timestamp()` setelah lock didapat; evaluasi expiry; buat auth pada `tx` dengan hook untuk menolak session ketika state terkunci. Jalankan handler library pada semua credential attempt agar rate limit, CSRF dan pekerjaan password tetap berlaku. Contoh hook pada akun terkunci:

```ts
import { APIError } from 'better-auth/api'
const scopedAuth = createAuth(tx, env, {
  beforeCreateSession: async (userId) => {
    if (decision.locked && target?.id === userId) {
      throw new APIError('UNAUTHORIZED', {
        code: 'INVALID_EMAIL_OR_PASSWORD',
        message: 'Invalid email or password',
      })
    }
  },
})
const response = await scopedAuth.handler(normalizedRequest)
```

`target`, `decision`, `tx` dan `normalizedRequest` berasal dari lookup/policy/parser pada step ini. Tidak memanggil handler dari pool lain di dalam transaksi dan tidak menulis/menjalankan session di luar envelope.

- [ ] Periksa response clone tanpa mencetak body. Counter hanya berubah untuk code library `INVALID_EMAIL_OR_PASSWORD` pada akun dikenal, tidak terkunci dan tidak banned; sukses 200 mereset state. `BANNED_USER`/lock/invalid credential dinormalisasi menjadi JSON 401 `{code:'INVALID_EMAIL_OR_PASSWORD',message:'Invalid email or password'}` tanpa Set-Cookie. Rate limit 429, CSRF/origin 403, malformed 400 dan infrastructure error tidak menambah counter. Database/commit failure, termasuk response 5xx yang sudah ditangkap handler library, dikembalikan sebagai response aman 503, tanpa cookie sukses atau raw error. Log hanya kategori tetap.
- [ ] Di route POST, dispatch `/sign-in/email` hanya ke envelope; GET/login POST lain tetap mengikuti allowlist fondasi. Signup/operator endpoints tetap tertutup. Tidak mengubah auth client untuk membuat endpoint kedua.
- [ ] Tambahkan burst lima password salah secara konkuren: seluruh response 401 dan final state tepat 5/locked, tanpa session. Untuk password benar + kegagalan kelima konkuren dari state 4, hasil harus cocok dengan salah satu urutan serial sah: valid menang → 200, kemudian state 1/unlocked; salah menang → state 5/locked dan valid 401. Tidak menerima state locked dengan session baru dari request yang kalah setelah lock.
- [ ] Tambahkan lock timeout dengan transaksi test yang menahan row target: request gagal aman, setelah lock dilepas request berikutnya berhasil diproses dan pool tetap dapat dipakai. Tambahkan trigger fixture yang menolak INSERT session untuk membuktikan tidak ada cookie/session parsial ketika library gagal; hapus trigger/function pada finally sebelum cleanup.
- [ ] Tambahkan pemeriksaan rate limit tetap berlaku pada akun terkunci dan callback/origin invalid tidak memicu counter. Bandingkan status/body/Set-Cookie untuk unknown email, password salah, banned dan lock. Unknown email tidak membuat user/lockout row.
- [ ] Untuk expiry fixture, set `locked_until` hanya pada ID test melalui clock SQL database, lalu assert nilainya sudah expired sebelum login. Jangan menunggu 15 menit atau mengirim Date ke kolom tanpa timezone.
- [ ] Run suites DB dan HTTP bergantian pada build production; commit `feat(auth): enforce transactional login lockout (CPR-24)` setelah regresi library binding, nested transaction dan failure counter terbukti GREEN.

### Task 3: Guard authoritative dan service Users atomik

**Files:** Create `src/features/auth/access.server.ts`, `access-errors.ts`, `src/features/users/types.ts`, `input.ts`, `errors.ts`, `query.server.ts`, `service.server.ts`, `tests/unit/users-input.test.ts`, `tests/database/users-access.test.ts`, `users-mutations.test.ts`; modify `src/features/auth/session.server.ts`, `authorization.ts`, `tests/unit/authorization.test.ts`.

**Consumes:** Factory auth berparameter policy, schema user/session/lockout dan fixture. **Produces:** `loadPrincipal`, `assertCapability`, DTO/error domain dan semua function Users pada kontrak bersama.

- [ ] Tulis RED matrix Admin/Editor/anonim untuk query dan mutation nyata. Contoh pengujian target dan payload:

```ts
await expect(
  listUsers(db, env, editorHeaders, { search: '', page: 1, pageSize: 20 }),
).rejects.toMatchObject({ code: 'FORBIDDEN' })
await expect(
  createEditor(db, env, new Headers(), {
    name: 'Editor Test',
    email: 'editor@example.test',
    password: 'valid-test-password',
  }),
).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
await expect(
  createEditor(db, env, adminHeaders, {
    name: 'Editor Test',
    email: 'editor@example.test',
    password: 'valid-test-password',
    role: 'admin',
  }),
).rejects.toMatchObject({ code: 'VALIDATION' })
await expect(
  setEditorActive(db, env, adminHeaders, { userId: admin.id, active: false }),
).rejects.toMatchObject({ code: 'FORBIDDEN' })
```

`db`, `env`, identities dan headers diperoleh dari context Task 1. Buat fresh credential fixture untuk tiap mutation yang mengubah akses.

- [ ] Run `npm run test:database -- tests/database/users-access.test.ts tests/database/users-mutations.test.ts` dan `npm test -- tests/unit/users-input.test.ts`; harus RED.
- [ ] Definisikan `UsersServiceError` dengan constructor code/message/fieldErrors aman. Implementasikan lima parser pada kontrak dengan whitelist object berikut; `invalidInput()` membuat `new UsersServiceError('VALIDATION', 'Periksa kembali data yang Anda masukkan.')`, tanpa menyertakan value input:

```ts
function requireKeys(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalidInput()
  const data = value as Record<string, unknown>
  if (Object.keys(data).some((key) => !keys.includes(key))) throw invalidInput()
  return data
}

export function parseCreateEditor(input: unknown): CreateEditorInput {
  const data = requireKeys(input, ['name', 'email', 'password'])
  try {
    return validateBootstrapInput(data)
  } catch {
    throw invalidInput()
  }
}
```

Import `validateBootstrapInput` dari fitur auth; role selalu fixed Editor di service. Update menerima tepat userId/name/email dan menerapkan batas nama/email fondasi; status tepat userId/active boolean; password tepat userId/newPassword dengan batas 12–128 dan bukan whitespace. ID nonkosong ≤128; page 1..100000 dan pageSize default 20 dengan batas maksimum 50; search trim ≤100. SQL query selalu parameterized; pencarian `%`/`_` diperlakukan literal saat pengguna memasukkannya. Unit tests mencakup value non-string/File-like, extra keys, duplicate-field FormData di adapter, dan batas ukuran.

- [ ] `loadPrincipal` memanggil `createAuth(database, env).api.getSession` dengan `disableCookieCache:true`, menolak user banned/role tak dikenal dan mengeluarkan Principal terbatas. `assertCapability` melempar `AccessDeniedError` milik fitur auth dengan UNAUTHORIZED/FORBIDDEN; tidak mengimpor error Users sehingga tidak membuat dependency terbalik. Adapter Next tetap mengarahkan anonim ke login; service framework-independent memakai headers nyata, bukan objek Principal client. Role yang berubah pada DB berlaku pada request berikutnya.
- [ ] Query Users mengautentikasi sebelum SELECT. Daftar memfilter role dikenal sebelum menghitung count dan memproyeksikan DTO, dengan pagination stabil menurut createdAt/id; tidak melakukan cast role asing menjadi Editor. `getEditor` menolak target bukan Editor; Admin boleh terlihat read-only di daftar.
- [ ] Pada mutation, gunakan satu transaksi/adapter library. Dapatkan actor dari session, kunci row actor/target dengan urutan ID konsisten, lalu konfirmasi ulang role/banned actor dan role Editor target dari rows yang dikunci. Login Task 2 mengunci row target yang sama. Create memegang actor lock dan mengandalkan constraint unique email untuk dua request bersamaan.
- [ ] Gunakan API server library dengan headers aktor nyata dan body whitelist: createUser(role Editor), adminUpdateUser(name/email), banUser/unbanUser dan setUserPassword. Setelah email/password/status berubah, panggil revokeUserSessions di dalam transaksi sebelum commit; nama saja tidak membutuhkan logout. Tidak memasukkan data arbitrary, role/banned/password lewat adminUpdateUser, atau memakai API operator tanpa headers di service produksi.
- [ ] Tambahkan duplicate-email race: tepat satu Editor dan credential dibuat. Paksa credential insert gagal dengan trigger database test dan assert tidak ada user parsial. Untuk password change, paksa DELETE session gagal dan assert rollback password + revokasi: password lama/session lama masih konsisten; tidak ada credential baru dengan session lama yang tertinggal. Trigger/function hanya DB test dan dibersihkan pada finally.
- [ ] Tambahkan ban/password change bersamaan dengan login. Setelah ban commit, tidak ada session valid dan login gagal; setelah password change commit, tidak ada session dengan password lama yang dibuat sesudah revokasi. Session yang dibuat sebelum mutation ikut dicabut. Aktif kembali tidak menghidupkan cookie lama; email lama tidak dapat login setelah update.
- [ ] Uji actor/session expired/revoked, role berubah dan akun nonaktif; Admin/self/role palsu tidak termodifikasi. Uji capability Leads/Waitlist ditolak Editor melalui guard bersama tanpa membuat endpoint data yang belum ada. Tangkap console pada forced failure untuk memastikan password/token/query parameters tidak dicetak.
- [ ] Run unit/DB suites, lint/typecheck; commit `feat(users): add authorized editor management services (CPR-24)`.

### Task 4: Halaman dan Server Actions Users

**Files:** Create `src/features/users/actions.ts`, `components/user-form.tsx`, `editor-status-form.tsx`, `editor-password-form.tsx`, `user-table.tsx`; create route pages `src/app/(admin)/admin/(protected)/users/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `not-found.tsx`; modify protected layout dan `src/app/globals.css`; create `tests/database/users-actions.test.ts`, `tests/integration/users-pages.test.ts`.

**Consumes:** Guard/query/service/DTO Task 3. **Produces:** daftar/tambah/edit Editor yang bekerja lewat Server Actions, dengan menu sesuai izin dan penolakan server.

- [ ] Tulis RED untuk action nyata dengan request headers fixture dari mocked `next/headers`, sementara service/DB/auth tetap nyata. Panggil exported action langsung dengan FormData role/id target palsu dan Editor/anonim: state error, tidak ada mutation. Header mocking hanya menyediakan request context; tidak memalsukan role/Principal. Tambahkan HTTP production anon/Editor tidak mendapat form/detail Users dan Admin mendapat halaman/noindex tanpa hash/token/password.
- [ ] Read panduan Next terpasang `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` dan `03-api-reference/04-functions/not-found.md` sebelum source UI/action. Jangan mengaktifkan authInterrupts eksperimental hanya untuk penolakan route.
- [ ] Definisikan exported action `(previousState: UserActionState, formData: FormData): Promise<UserActionState>` untuk create/update/status/password. Ambil `await headers()` di setiap action; parse field yang sah, tolak extra keys aplikasi seperti role/actorId/emailVerified, dan abaikan hanya metadata framework `$ACTION_` yang tidak diteruskan ke service. Service melakukan guard lagi. Return hanya message/fieldErrors/userId; tidak mengembalikan credential atau raw Error.
- [ ] Terapkan pola adapter berikut untuk create; action lain memanggil service pemiliknya dengan aturan state yang sama:

```ts
'use server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client.server'
import { readServerEnv } from '@/env/server'
import { createEditor } from './service.server'
import type { UserActionState } from './types'

export async function createEditorAction(
  previous: UserActionState,
  form: FormData,
): Promise<UserActionState> {
  void previous
  try {
    const input = readCreateEditorForm(form)
    const editor = await createEditor(db, readServerEnv(process.env), await headers(), input)
    revalidatePath('/admin/users')
    return { status: 'success', message: 'Akun Editor berhasil dibuat.', userId: editor.id }
  } catch (error) {
    return toUserActionState(error)
  }
}
```

`readCreateEditorForm` dibuat pada adapter action task ini; ia memeriksa allowed keys dan field duplicate sebelum memanggil `parseCreateEditor`. `readUpdateEditorForm`, `readEditorStatusForm` dan `readEditorPasswordForm` memakai parser pemilik pada kontrak. Metadata `$ACTION_` diabaikan saat membuat object aplikasi. `toUserActionState` dibuat di `users/errors.ts`: maps `AccessDeniedError`/`UsersServiceError`, unknown error → message kategori tetap; tidak mencetak error. Action ini tidak memanggil redirect/notFound di dalam try/catch; navigasi client setelah sukses memakai userId yang aman.

- [ ] Halaman memanggil query berizin sebelum merender data. Anon → redirect login; Forbidden/not-found target → `notFound()` tanpa menelan interrupt; status response streamed tidak dijadikan satu-satunya bukti keamanan. Cek body tidak mengandung data/form target. Protected layout memakai Principal untuk menampilkan menu Users hanya saat `can(principal,'users:manage')`; layout tidak menggantikan guard query/action.
- [ ] Form client memakai `useActionState`, label terhubung, password autocomplete new-password, error `role=alert`, tombol pending, dan reset password input setelah sukses. Separate form status/password mengurangi kemungkinan perubahan tak sengaja. Akun Admin hanya read-only; form Editor tidak mempunyai dropdown role. Table menampilkan status/peran/search/pagination serta empty state.
- [ ] Tambahkan CSS memakai warna/typography/token shell yang sudah ada, tanpa desain marketing baru atau perubahan logo. Form/table harus dapat dibaca pada 390 px dan 1440 px; tidak membocorkan data melalui attributes/title/serialized props. Render password kosong pada SSR.
- [ ] Run action/HTTP tests, lint/typecheck/build; commit `feat(admin): add editor account management UI (CPR-24)`.

### Task 5: Acceptance production, review dan handoff

**Files:** seluruh tests fitur, `README.md`, `docs/architecture/cpr-24-account-access-validation.md`, spec/plan checklist, draft PR dan Linear CPR-24.

**Consumes:** hasil Task 1–4. **Produces:** evidence terikat revision yang diuji, review independen dan PR yang layak direview.

- [ ] Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run db:check`, lalu `npm run test:prepare`, `npm run test:database`. DB dan HTTP tidak dijalankan paralel. Periksa `auth:generate` tidak menghapus tabel aplikasi atau mengubah schema library; `db:generate` setelah migration final no-op.
- [ ] Build production setelah menghentikan server preview terkait secara terkontrol; start `npm run test:server -- --production`, lalu `npm run test:integration`. Runtime harus menunjuk DB test dan origin auth sama dengan URL tes. Request tidak memakai database developer sebagai fallback.
- [ ] Browser pada origin yang diizinkan: buat Admin fixture melalui operator; Admin membuat Editor, mengubah nama/email, menonaktifkan, mengaktifkan dan mengganti password. Login Editor, cek menu Users tidak ada dan akses langsung ditolak. Uji login/logout serta lima password salah → password benar masih gagal → expiry fixture via DB test → login berhasil. Jika IP limiter ikut menolak, laporkan sebagai limiter; gunakan tes HTTP dengan IP test berbeda sebagai bukti threshold akun. Tidak menonaktifkan limiter/CSRF dalam source untuk memperoleh hasil GREEN.
- [ ] Periksa form/table pada 390×844 dan 1440×1000, label/fokus/error/loading, noindex dan console/hydration. Error JavaScript/hydration tidak boleh tersisa; respons HTTP 401/429 yang sengaja dipicu dicatat sebagai hasil negatif yang diharapkan. Screenshot tanpa input password/token disimpan sebagai bukti chat. Pulihkan viewport dan bersihkan hanya fixture milik pemeriksaan.
- [ ] Inventaris database developer sebelum migration aditif. Jalankan migration lokal secara eksplisit; pertahankan database/volume lama. README menjelaskan bootstrap Admin, pengelolaan Editor, batas auth, lockout/counter, dan bahwa invite/forgot-password email belum tersedia. Bukti mencatat commands, counts, revision dan keterbatasan yang nyata.
- [ ] Fresh whole-branch reviewer memeriksa transaksi/urutan lock, semua jalur login, otorisasi action/query, session revocation, payload whitelisting dan redaksi log. Reproduksi temuan penting dengan tes RED sebelum perbaikan; jalankan regression GREEN dan suite relevan. Jangan mengklaim review selesai dari laporan parsial.
- [ ] Setelah seluruh acceptance lulus, commit/push dan buat/update PR dengan judul `CPR-24 | [Admin] Kelola Editor dan lockout login`; attach PR ke chat. Linear mencentang hanya acceptance yang mempunyai bukti; status tetap In Progress sampai integrasi. Tidak merge/deploy tanpa instruksi user.

## Self-review plan

| Requirement spec                                                            | Task pemilik                          |
| --------------------------------------------------------------------------- | ------------------------------------- |
| Threshold 5, expiry 15 menit, reset sukses dan state persisten              | 1–2                                   |
| Semua HTTP login, rate limit/CSRF, generic failures dan concurrent attempts | 2                                     |
| Admin-only Users, target Editor, Principal authoritative/role fresh         | 3–4                                   |
| Credential/user atomicity, ban/password/email + session revocation          | 3                                     |
| Daftar/tambah/edit/status/password, bahasa Indonesia dan field aman         | 4                                     |
| Guard future upload/preview/export tanpa dummy CRUD                         | 3, kemudian tiket fitur masing-masing |
| Production/browser, fixtures, migration aman, quality dan review            | 5                                     |

Tidak ada jalur alternatif sign-in, password/hash buatan aplikasi, Admin promotion UI, endpoint operator browser, atau email nyata. Kelima Review Focus memiliki tes yang ditempatkan pada task pemilik. Implementation internals boleh diperbaiki setelah eksperimen/regresi menunjukkan incompatibility, tetapi perubahan requirement produk atau batas auth harus dikonfirmasi sebelum dilanjutkan.

## Metode eksekusi untuk review

**Rekomendasi: Native**, implementasi task berurutan oleh coordinator dengan satu reviewer independen pada seluruh branch di akhir. Task login dan Users memakai transaksi, factory auth dan urutan row lock yang sama, sehingga menjaga satu implementer mengurangi perbedaan antarmuka dan biaya context. Pengujian RED/GREEN dan bukti per task tetap wajib.

Alternatif **Subagent-driven** memberi implementer/reviewer baru pada setiap task sebelum lanjut, ditambah review seluruh branch. Ini memberi pemeriksaan lebih sering, dengan biaya context lebih besar. User memilih metode setelah membaca plan; source fitur tidak ditulis sebelum review plan selesai.
