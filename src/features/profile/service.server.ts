import 'server-only'
import { createHash } from 'node:crypto'
import { and, eq, ne, sql } from 'drizzle-orm'
import sharp from 'sharp'
import { db } from '../../lib/db/client.server'
import type { DatabaseTransaction } from '../../lib/db/connection'
import { readServerEnv } from '../../env/server'
import { createAuth } from '../../lib/auth/options'
import { writeAudit } from '../audit/service.server'
import { account, session, user } from '../auth/schema'
import { authLockout } from '../auth/lockout-schema'
import { applyLoginOutcome, evaluateLockout } from '../auth/lockout-policy'
import { loadPrincipal, assertCapability } from '../auth/access.server'
import { AccessDeniedError } from '../auth/access-errors'
import type { Principal } from '../auth/types'
import { CmsError } from '../cms/errors'
import { validateUpload } from '../media/validation'
import { MediaError } from '../media/metadata'
import { deviceLabel, parseName, parsePasswordChange, parsePreferences } from './input'
import { userPreference } from './schema'

/** Sessions older than this need the password again for security actions (admin-ui.md 4.9). */
const REAUTH_AFTER_MS = 15 * 60 * 1000
const env = () => readServerEnv(process.env)
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

async function currentSession(headers: Headers) {
  const result = await createAuth(db, env()).api.getSession({
    headers,
    query: { disableCookieCache: true },
  })
  if (!result) throw new AccessDeniedError('UNAUTHORIZED')
  return result.session
}

/** Every profile action: the signed-in principal and its current session, re-read in a transaction. */
async function profileTransaction<T>(
  headers: Headers,
  run: (
    tx: DatabaseTransaction,
    actor: Principal,
    sessionId: string,
    sessionCreatedAt: Date,
  ) => Promise<T>,
) {
  const current = await currentSession(headers)
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
    const actor = assertCapability(await loadPrincipal(tx, env(), headers), 'content:write')
    await tx.select({ id: user.id }).from(user).where(eq(user.id, actor.id)).for('update')
    return run(tx, actor, current.id, new Date(current.createdAt))
  })
}

export async function loadProfile(headers: Headers) {
  const actor = assertCapability(await loadPrincipal(db, env(), headers), 'content:write')
  const current = await currentSession(headers)
  const [row] = await db
    .select({ name: user.name, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, actor.id))
  const sessions = await db
    .select({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .where(and(eq(session.userId, actor.id), sql`${session.expiresAt} > now()`))
  const [preferences] = await db
    .select()
    .from(userPreference)
    .where(eq(userPreference.userId, actor.id))
  return {
    actor,
    profile: { name: row.name, email: row.email, hasAvatar: !!row.image },
    // Only safe fields: never the session token.
    sessions: sessions
      .map((s) => ({
        id: s.id,
        device: deviceLabel(s.userAgent),
        ipAddress: s.ipAddress,
        lastActive: s.updatedAt.toISOString(),
        current: s.id === current.id,
      }))
      .sort(
        (a, b) => Number(b.current) - Number(a.current) || b.lastActive.localeCompare(a.lastActive),
      ),
    preferences: {
      density: (preferences?.density as 'comfortable' | 'compact' | undefined) ?? 'comfortable',
      sidebarCollapsed: preferences?.sidebarCollapsed ?? false,
    },
    reauthRequired: Date.now() - new Date(current.createdAt).getTime() > REAUTH_AFTER_MS,
  }
}

export async function updateName(headers: Headers, input: unknown) {
  const name = parseName(input)
  await profileTransaction(headers, async (tx, actor) => {
    await tx.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, actor.id))
    await writeAudit(tx, actor, {
      entity: 'profile',
      entityId: actor.id,
      action: 'update',
      changedFields: ['name'],
    })
  })
}

/**
 * Checks the user's own password. A wrong password counts toward the CPR-24 lockout exactly like
 * a failed sign-in, and a locked account is refused without saying why.
 */
async function verifyOwnPassword(tx: DatabaseTransaction, userId: string, password: string) {
  const [stored] = await tx
    .select()
    .from(authLockout)
    .where(eq(authLockout.userId, userId))
    .for('update')
  const clock = await tx.execute<{ now: string }>(sql`SELECT clock_timestamp() AS now`)
  const now = new Date(clock.rows[0].now)
  const decision = evaluateLockout(stored ?? { failedAttempts: 0, lockedUntil: null }, now)
  const failed = () =>
    new CmsError('INVALID', 'Password tidak cocok.', { currentPassword: 'Password tidak cocok.' })
  if (decision.locked) throw failed()
  const [credential] = await tx
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
  const context = await createAuth(tx, env()).$context
  const valid =
    !!credential?.password &&
    (await context.password.verify({ hash: credential.password, password }))
  const state = applyLoginOutcome(decision.state, valid ? 'success' : 'failure', now)
  await tx
    .insert(authLockout)
    .values({ userId, ...state })
    .onConflictDoUpdate({ target: authLockout.userId, set: state })
  return { valid, failed }
}

/**
 * Changes the password and revokes every other session in the same transaction. The failure
 * counter must survive a wrong password, so that case commits its counter update and then reports.
 */
export async function changePassword(headers: Headers, input: unknown) {
  const data = parsePasswordChange(input)
  const result = await profileTransaction(headers, async (tx, actor, sessionId) => {
    const check = await verifyOwnPassword(tx, actor.id, data.currentPassword)
    if (!check.valid) return 'invalid' as const
    const context = await createAuth(tx, env()).$context
    const hash = await context.password.hash(data.newPassword)
    await tx
      .update(account)
      .set({ password: hash, updatedAt: new Date() })
      .where(and(eq(account.userId, actor.id), eq(account.providerId, 'credential')))
    await tx.delete(session).where(and(eq(session.userId, actor.id), ne(session.id, sessionId)))
    await writeAudit(tx, actor, {
      entity: 'profile',
      entityId: actor.id,
      action: 'password_change',
      changedFields: ['password', 'sessions'],
    })
    return 'changed' as const
  })
  if (result === 'invalid')
    throw new CmsError('INVALID', 'Password tidak cocok.', {
      currentPassword: 'Password tidak cocok.',
    })
}

/** Ends one of the user's own other sessions, or all of them (`sessionId: 'others'`). */
export async function revokeSessions(headers: Headers, input: unknown) {
  const data = isRecord(input) ? input : {}
  const target = typeof data.sessionId === 'string' ? data.sessionId : ''
  const password = typeof data.password === 'string' ? data.password : ''
  if (!target) throw new CmsError('INVALID', 'Sesi tidak valid.')
  const result = await profileTransaction(headers, async (tx, actor, sessionId, createdAt) => {
    if (target === sessionId) throw new CmsError('INVALID', 'Gunakan "Keluar" untuk sesi ini.')
    if (Date.now() - createdAt.getTime() > REAUTH_AFTER_MS) {
      if (!password)
        throw new CmsError('INVALID', 'Masukkan password untuk melanjutkan.', {
          password: 'Masukkan password untuk melanjutkan.',
        })
      if (!(await verifyOwnPassword(tx, actor.id, password)).valid) return 'invalid' as const
    }
    // Scoped to the user's own sessions: another user's session id simply matches nothing.
    const deleted = await tx
      .delete(session)
      .where(
        target === 'others'
          ? and(eq(session.userId, actor.id), ne(session.id, sessionId))
          : and(eq(session.userId, actor.id), eq(session.id, target), ne(session.id, sessionId)),
      )
      .returning({ id: session.id })
    if (target !== 'others' && !deleted.length)
      throw new CmsError('NOT_FOUND', 'Sesi tidak ditemukan.')
    await writeAudit(tx, actor, {
      entity: 'profile',
      entityId: actor.id,
      action: 'delete',
      changedFields: ['sessions'],
    })
    return deleted.length
  })
  if (result === 'invalid')
    throw new CmsError('INVALID', 'Password tidak cocok.', { password: 'Password tidak cocok.' })
  return result
}

export async function savePreferences(headers: Headers, input: unknown) {
  const preferences = parsePreferences(input)
  await profileTransaction(headers, async (tx, actor) => {
    await tx
      .insert(userPreference)
      .values({ userId: actor.id, ...preferences, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userPreference.userId,
        set: { ...preferences, updatedAt: new Date() },
      })
    await writeAudit(tx, actor, {
      entity: 'profile',
      entityId: actor.id,
      action: 'update',
      changedFields: ['preferences'],
    })
  })
}

export async function readPreferences(userId: string) {
  const [row] = await db.select().from(userPreference).where(eq(userPreference.userId, userId))
  return {
    density: (row?.density as 'comfortable' | 'compact' | undefined) ?? 'comfortable',
    sidebarCollapsed: row?.sidebarCollapsed ?? false,
  }
}

/**
 * Avatar: the type is checked by content sniffing (not the extension or the declared type),
 * cropped to a 256 px square WebP without metadata and stored in private storage.
 */
export async function uploadAvatar(
  headers: Headers,
  input: { body: Buffer; filename: string; contentType: string },
) {
  const file = await validateUpload(input.body, input.filename, input.contentType)
  if (file.kind !== 'image') throw new MediaError('INVALID', 'Avatar harus berupa gambar.')
  const square = await sharp(file.body)
    .rotate()
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer()
  const { mediaStore } = await import('../../lib/media/runtime.server')
  const store = mediaStore()
  const actor = assertCapability(await loadPrincipal(db, env(), headers), 'content:write')
  const key = `${store.prefix}/avatars/${actor.id.replace(/[^A-Za-z0-9_-]/g, '')}-${createHash('sha256').update(square).digest('hex')}.webp`
  await store.put({ bucket: 'private', key, body: square, contentType: 'image/webp' })
  await profileTransaction(headers, async (tx, latest) => {
    await tx
      .update(user)
      .set({ image: `private:${key}`, updatedAt: new Date() })
      .where(eq(user.id, latest.id))
    await writeAudit(tx, latest, {
      entity: 'profile',
      entityId: latest.id,
      action: 'update',
      changedFields: ['image'],
    })
  })
}

/** Short-lived signed URL of the signed-in user's avatar, or `null`. */
export async function avatarUrl(headers: Headers) {
  const actor = assertCapability(await loadPrincipal(db, env(), headers), 'content:write')
  const [row] = await db.select({ image: user.image }).from(user).where(eq(user.id, actor.id))
  if (!row?.image?.startsWith('private:')) return null
  const { mediaStore } = await import('../../lib/media/runtime.server')
  return mediaStore().presign(
    { bucket: 'private', key: row.image.slice('private:'.length) },
    'GET',
    120,
  )
}
