import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../lib/db/client.server'
import type { Database, DatabaseTransaction } from '../../lib/db/connection'
import { readServerEnv } from '../../env/server'
import { assertCapability, loadPrincipal } from '../auth/access.server'
import { AccessDeniedError } from '../auth/access-errors'
import type { Capability, Principal } from '../auth/types'
import { mediaUsage } from '../media/schema'
import type { MediaOwner } from '../media/types'

export type CmsMutation<T> = Readonly<{
  headers: Headers
  capability?: Capability
  /** Admin only, on top of the capability (for example settings and redirects). */
  adminOnly?: boolean
  /**
   * Media referenced by the document. Published references are copied to public storage by the
   * media service inside the same transaction; an empty list clears the owner's usage rows.
   */
  media?: Readonly<{
    owner: MediaOwner
    refs: readonly Readonly<{ field: string; mediaId: string; published: boolean }>[]
  }>
  run: (tx: DatabaseTransaction, actor: Principal) => Promise<T>
}>

async function actorIn(
  tx: Database | DatabaseTransaction,
  headers: Headers,
  capability: Capability,
  adminOnly: boolean,
) {
  const actor = assertCapability(
    await loadPrincipal(tx, readServerEnv(process.env), headers),
    capability,
  )
  if (adminOnly && actor.role !== 'admin') throw new AccessDeniedError('FORBIDDEN')
  return actor
}

/**
 * One transaction for a CMS change: the principal is re-read inside it (a demoted or banned user
 * cannot finish a save), the media usage rows and the audit entry the callback writes commit or
 * roll back together with the content.
 */
export async function cmsMutation<T>(input: CmsMutation<T>): Promise<T> {
  const capability = input.capability ?? 'content:write'
  const adminOnly = input.adminOnly ?? false
  // Fail fast before touching storage or locks.
  await actorIn(db, input.headers, capability, adminOnly)
  const media = input.media
  if (media && media.refs.length) {
    // Loaded lazily: the media runtime needs storage credentials only when media is used.
    const { mediaService } = await import('../../lib/media/runtime.server')
    return mediaService().withReferences(
      input.headers,
      media.owner,
      media.refs.map((ref) => ({ ...ref })),
      async (tx) => input.run(tx, await actorIn(tx, input.headers, capability, adminOnly)),
    )
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
    const actor = await actorIn(tx, input.headers, capability, adminOnly)
    if (media)
      await tx
        .delete(mediaUsage)
        .where(
          and(eq(mediaUsage.entity, media.owner.entity), eq(mediaUsage.entityId, media.owner.id)),
        )
    return input.run(tx, actor)
  })
}

/** Read guard for admin pages and queries. */
export async function cmsReader(
  headers: Headers,
  capability: Capability = 'content:write',
): Promise<Principal> {
  return assertCapability(await loadPrincipal(db, readServerEnv(process.env), headers), capability)
}
