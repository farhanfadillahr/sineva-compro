import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { Users } from './collections/Users'
import { readServerEnv } from './env/server'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const env = readServerEnv(process.env)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
  },
  collections: [Users],
  secret: env.payloadSecret,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: env.databaseUrl, connectionTimeoutMillis: 5000 },
    disableCreateDatabase: true,
    transactionOptions: { isolationLevel: 'read committed' },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
})
