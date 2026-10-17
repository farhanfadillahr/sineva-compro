import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db } from '../../lib/db/client.server'
import type { DatabaseTransaction } from '../../lib/db/connection'
import { writeAudit } from '../audit/service.server'
import type { Principal } from '../auth/types'
import { CmsError } from '../cms/errors'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { chainProblem, isReservedPath, normalizePath } from './paths'
import { redirect } from './schema'

export async function listRedirectsForAdmin(headers: Headers) {
  const actor = await cmsReader(headers, 'users:manage')
  return {
    actor,
    items: (await db.select().from(redirect).orderBy(asc(redirect.fromPath))).map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

function parseRule(input: unknown) {
  const data = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const fromPath = typeof data.fromPath === 'string' ? normalizePath(data.fromPath) : null
  const toPath = typeof data.toPath === 'string' ? normalizePath(data.toPath) : null
  const status = Number(data.status ?? 301)
  const errors: Record<string, string> = {}
  if (!fromPath) errors.fromPath = 'Gunakan path yang diawali /, tanpa domain atau query.'
  else if (isReservedPath(fromPath)) errors.fromPath = 'Path admin dan API tidak dapat diarahkan.'
  if (!toPath) errors.toPath = 'Gunakan path yang diawali /, tanpa domain atau query.'
  if (fromPath && toPath && fromPath === toPath)
    errors.toPath = 'Tujuan tidak boleh sama dengan asal.'
  if (![301, 308].includes(status)) errors.status = 'Pilih 301 atau 308.'
  if (Object.keys(errors).length) throw new CmsError('INVALID', 'Periksa kembali redirect.', errors)
  return { fromPath: fromPath!, toPath: toPath!, status }
}

async function insertRule(
  tx: DatabaseTransaction,
  actor: Principal,
  rule: { fromPath: string; toPath: string; status: number },
  source: 'manual' | 'auto',
) {
  const existing = await tx.select().from(redirect).for('update')
  if (source === 'manual' && existing.some((r) => r.fromPath === rule.fromPath))
    throw new CmsError('CONFLICT', 'Path asal sudah memiliki redirect.', {
      fromPath: 'Path asal sudah memiliki redirect.',
    })
  const problem = chainProblem(rule, existing)
  if (problem) throw new CmsError('INVALID', problem, { toPath: problem })
  const [created] = await tx
    .insert(redirect)
    .values({ ...rule, source, createdBy: actor.id })
    .onConflictDoUpdate({
      target: redirect.fromPath,
      set: {
        toPath: rule.toPath,
        status: rule.status,
        source,
        createdBy: actor.id,
        createdAt: new Date(),
      },
    })
    .returning({ id: redirect.id })
  await writeAudit(tx, actor, {
    entity: 'redirects',
    entityId: created.id,
    action: 'create',
    changedFields: ['fromPath', 'toPath', 'status'],
  })
}

export async function createRedirect(headers: Headers, input: unknown) {
  const rule = parseRule(input)
  await cmsMutation({
    headers,
    capability: 'users:manage',
    adminOnly: true,
    run: (tx, actor) => insertRule(tx, actor, rule, 'manual'),
  })
}

export async function deleteRedirect(headers: Headers, id: string) {
  await cmsMutation({
    headers,
    capability: 'users:manage',
    adminOnly: true,
    run: async (tx, actor) => {
      const [row] = await tx
        .delete(redirect)
        .where(eq(redirect.id, id))
        .returning({ id: redirect.id })
      if (!row) throw new CmsError('NOT_FOUND', 'Redirect tidak ditemukan.')
      await writeAudit(tx, actor, {
        entity: 'redirects',
        entityId: id,
        action: 'delete',
        changedFields: ['fromPath', 'toPath', 'status'],
      })
    },
  })
}

/**
 * Called inside the transaction that changes a published slug: the old path redirects (301) to
 * the new one, earlier redirects to the old path are pointed straight at the new one (no chains),
 * and a redirect away from the new path is removed because the path now has content. Any failure
 * rolls back the slug change too.
 */
export async function recordSlugChange(
  tx: DatabaseTransaction,
  actor: Principal,
  fromPath: string,
  toPath: string,
) {
  if (fromPath === toPath) return
  await tx.delete(redirect).where(eq(redirect.fromPath, toPath))
  await tx.update(redirect).set({ toPath }).where(eq(redirect.toPath, fromPath))
  await insertRule(tx, actor, { fromPath, toPath, status: 301 }, 'auto')
}

// ---------------------------------------------------------------------------------------------
// Request-time resolution: one indexed lookup per request, no in-memory cache.
// ---------------------------------------------------------------------------------------------

/**
 * The proxy runs apart from the admin actions (Next.js documents it must not rely on shared
 * modules or globals), so a module cache could never be cleared by a save: redirects stayed stale
 * for up to 30 seconds, including a live page sent to a 404 after a slug was changed back.
 * `from_path` is unique and indexed, so the lookup is a single index read.
 */
export async function resolveRedirect(path: string) {
  const normalized = normalizePath(path)
  if (!normalized || isReservedPath(normalized)) return null
  const [rule] = await db
    .select({ toPath: redirect.toPath, status: redirect.status })
    .from(redirect)
    .where(eq(redirect.fromPath, normalized))
    .limit(1)
  return rule ?? null
}
