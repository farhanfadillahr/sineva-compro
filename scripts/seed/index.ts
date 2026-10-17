import 'dotenv/config'
import { readDatabaseUrl } from '../../src/env/database-url'
import { createDatabase } from '../../src/lib/db/connection'
import { parseSeedOptions } from './options'
import { runSeeds } from './runner'

async function main() {
  const databaseUrl = readDatabaseUrl(process.env.DATABASE_URL).href
  const args = process.argv.slice(2)
  // Refuse unsafe targets before opening any connection.
  parseSeedOptions(args, databaseUrl, process.env.NODE_ENV)
  const connection = createDatabase(databaseUrl)
  try {
    const result = await runSeeds(connection.db, databaseUrl, args, process.env.NODE_ENV)
    console.log(`Seed ${result.mode} selesai: ${result.modules.join(', ')}.`)
  } finally {
    await connection.pool.end()
  }
}
main().catch(() => {
  console.error(
    'Seed gagal. Periksa argumen, izin target database, konflik ID demo, dan migration. Kredensial tidak dicetak.',
  )
  process.exitCode = 1
})
