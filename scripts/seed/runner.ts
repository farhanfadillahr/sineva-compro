import { sql } from 'drizzle-orm'
import type { Database } from '../../src/lib/db/connection'
import { auditSeed } from './audit'
import { mediaSeed } from './media'
import { settingsSeed } from './settings'
import { pagesSeed } from './pages'
import { collectionSeed } from './collections'
import { servicesSeed } from './services'
import { postsSeed } from './posts'
import { workSeed } from './work'
import { redirectsSeed } from './redirects'
import { parseSeedOptions } from './options'
import type { SeedModule } from './types'

// New CMS tickets register their own module here. No scanning/importing files
// supplied by a CLI argument; module names are an explicit registry.
const modules: readonly SeedModule[] = [
  auditSeed,
  mediaSeed,
  settingsSeed,
  pagesSeed,
  collectionSeed('capabilities', 'capabilities'),
  collectionSeed('businessTypes', 'business-types'),
  collectionSeed('faq', 'faq'),
  collectionSeed('team', 'team'),
  collectionSeed('categories', 'categories'),
  servicesSeed,
  postsSeed,
  workSeed,
  redirectsSeed,
]
export async function runSeeds(
  database: Database,
  databaseUrl: string,
  args: string[],
  nodeEnv: string | undefined,
) {
  const options = parseSeedOptions(args, databaseUrl, nodeEnv)
  const selected = options.module
    ? modules.filter((module) => module.key === options.module)
    : modules
  for (const seedModule of selected) {
    await database.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${`sineva:seed:${seedModule.key}`}, 0))`,
      )
      if (options.mode === 'purge-demo') await seedModule.purgeDemo(tx)
      else {
        await seedModule.base(tx)
        if (options.mode === 'demo') await seedModule.demo(tx)
      }
    })
  }
  return { mode: options.mode, modules: selected.map((module) => module.key) }
}
