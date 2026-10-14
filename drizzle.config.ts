import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { readServerEnv } from './src/env/server'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: readServerEnv(process.env).databaseUrl },
  strict: true,
})
