import 'dotenv/config'
import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { readServerEnv } from '../src/env/server'
import { createDatabase } from '../src/lib/db/connection'

const connection = createDatabase(readServerEnv(process.env).databaseUrl)
try {
  await migrate(connection.db, { migrationsFolder: resolve('drizzle') })
  console.log('Database migrations applied; existing migrations are not reapplied.')
} catch {
  console.error('Migration failed. Check database readiness and the versioned migration files.')
  process.exitCode = 1
} finally {
  await connection.pool.end()
}
