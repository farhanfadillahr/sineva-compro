import 'dotenv/config'
import { readTestEnv } from '../../src/env/test'
import { createAuthTestContext } from './auth-context'

/**
 * CMS services read their database and auth settings from `process.env` (the app's shared client).
 * Point that environment at the loopback test database before the services are imported, with the
 * same trusted-ingress fixture the auth context signs in through. Test files must also mock
 * `next/cache` (no request scope exists for `revalidateTag` here).
 */
export async function createCmsTestContext() {
  const testEnv = readTestEnv(process.env)
  Object.assign(process.env, {
    DATABASE_URL: testEnv.databaseUrl,
    BETTER_AUTH_URL: testEnv.authUrl,
    BETTER_AUTH_SECRET: testEnv.authSecret,
    CLIENT_IP_MODE: 'cloudflare',
    CLOUDFLARE_ORIGIN_LOCKED: 'true',
    CONTENT_SOURCE: 'static',
  })
  const ctx = await createAuthTestContext()
  const admin = await ctx.create('admin')
  const editor = await ctx.create('editor')
  return {
    ...ctx,
    adminHeaders: await ctx.headersFor(admin),
    editorHeaders: await ctx.headersFor(editor),
    anonymous: new Headers({ origin: ctx.env.authUrl }),
  }
}
