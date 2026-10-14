import { inspect } from 'node:util'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'
import { makeSignature } from 'better-auth/crypto'
import { expect, it, vi } from 'vitest'
import { readServerEnv } from '../../src/env/server'
import { createAuth } from '../../src/lib/auth/options'
import * as schema from '../../src/lib/db/schema'

it('fails closed and never logs a session token or raw query error when the database fails', async () => {
  const token = 'private-synthetic-session-token'
  const privateError = 'private-synthetic-database-details'
  const env = readServerEnv({
    DATABASE_URL: 'postgresql://fixture:private-fixture-password@127.0.0.1/app',
    BETTER_AUTH_SECRET: 'private-synthetic-auth-secret-'.repeat(3),
    BETTER_AUTH_URL: 'http://127.0.0.1:3000',
  })
  const query = vi.fn().mockRejectedValue(new Error(privateError))
  const database = drizzle({ client: { query } as unknown as Pool, schema })
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
  const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const infoLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  try {
    const auth = createAuth(database, env)
    const cookie = `sineva.session_token=${encodeURIComponent(`${token}.${await makeSignature(token, env.authSecret)}`)}`
    await expect(auth.api.getSession({ headers: new Headers({ cookie }) })).rejects.toMatchObject({
      statusCode: 500,
    })
    expect(query).toHaveBeenCalled()
    expect(errorLog).toHaveBeenCalled()
    const output = inspect([errorLog.mock.calls, warnLog.mock.calls, infoLog.mock.calls], {
      depth: 20,
    })
    for (const value of [token, privateError, env.authSecret, 'private-fixture-password'])
      expect(output).not.toContain(value)
  } finally {
    errorLog.mockRestore()
    warnLog.mockRestore()
    infoLog.mockRestore()
  }
})
