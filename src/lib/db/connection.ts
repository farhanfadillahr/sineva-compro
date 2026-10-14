import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
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
  pool.on('error', () => console.error('An idle database connection failed.'))
  return { pool, db: drizzle({ client: pool, schema }) }
}

export type Database = ReturnType<typeof createDatabase>['db']
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]
