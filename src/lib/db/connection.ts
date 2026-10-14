import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, type PoolClient } from 'pg'
import * as schema from './schema'
import { readDatabaseUrl } from '../../env/database-url'

export function createDatabase(databaseUrl: string) {
  const target = readDatabaseUrl(databaseUrl)
  const pool = new Pool({
    connectionString: target.href,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
    query_timeout: 30000,
  })
  const failedClients = new WeakSet<PoolClient>()
  // Pool listeners cover idle clients only; retain a safe listener during checkout.
  pool.on('connect', (client) =>
    client.on('error', () => {
      failedClients.add(client)
      console.error('A database connection failed.')
    }),
  )
  pool.on('error', () => console.error('An idle database connection failed.'))
  const db = drizzle({ client: pool, schema })
  // Drizzle's pool transaction starts BEGIN before its release-protected finally.
  // Own acquisition here, then bind Drizzle to the client so nested savepoints,
  // BEGIN/COMMIT/ROLLBACK and adapter writes still share one connection.
  db.transaction = async (run, config) => {
    const client = await pool.connect()
    let failed = true
    try {
      if (failedClients.has(client)) throw new Error('Database connection failed.')
      const scoped = drizzle({ client, schema })
      const result = await scoped.transaction(async (tx) => {
        const value = await run(tx)
        if (failedClients.has(client)) throw new Error('Database connection failed.')
        return value
      }, config)
      if (failedClients.has(client)) throw new Error('Database connection failed.')
      failed = false
      return result
    } finally {
      // Discard after any transaction failure: BEGIN/rollback/commit may have
      // failed, so returning an uncertain transaction to the pool is unsafe.
      client.release(failed || failedClients.has(client))
    }
  }
  return { pool, db }
}

export type Database = ReturnType<typeof createDatabase>['db']
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]
