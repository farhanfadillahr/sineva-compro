import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { APIError, type CollectionBeforeOperationHook } from 'payload'

export const protectFirstUser: CollectionBeforeOperationHook = async ({ args, operation }) => {
  if (operation !== 'create' || args.req.user) return args

  const req = args.req
  const sessions = req.payload.db.sessions as PostgresAdapter['sessions'] | undefined
  const transactionID = await req.transactionID
  const transaction = transactionID ? sessions?.[transactionID]?.db : undefined
  if (!transaction) {
    throw new APIError('Bootstrap registration requires a database transaction.', 500)
  }

  // Use the create operation's transaction so the lock survives through first-user login/commit.
  await transaction.execute(sql`SET LOCAL lock_timeout = '5s'`)
  await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtext('sineva.users.bootstrap'))`)
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    req,
  })
  if (totalDocs !== 0) {
    throw new APIError('The first user has already been registered.', 403)
  }
  return args
}
