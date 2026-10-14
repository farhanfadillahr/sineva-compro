import 'server-only'
import { readServerEnv } from '../../env/server'
import { createDatabase } from './connection'

const runtime = globalThis as typeof globalThis & {
  sinevaDatabase?: ReturnType<typeof createDatabase>
}
const connection = (runtime.sinevaDatabase ??= createDatabase(
  readServerEnv(process.env).databaseUrl,
))

export const db = connection.db
