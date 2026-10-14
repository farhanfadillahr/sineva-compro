import { afterAll, beforeAll, expect, it } from 'vitest'
import { createAuthTestContext } from '../helpers/auth-context'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
beforeAll(async () => {
  ctx = await createAuthTestContext()
})
afterAll(async () => {
  await ctx.cleanup()
})
it('stores timezone lock expiry, rejects impossible attempts, and cascades only the deleted fixture', async () => {
  const identity = await ctx.create('editor')
  const timestamp = '2026-10-15T00:15:00.000Z'
  await ctx.connection.pool.query(
    'INSERT INTO auth_lockout(user_id, failed_attempts, locked_until) VALUES ($1, 5, $2)',
    [identity.id, timestamp],
  )
  const row = await ctx.connection.pool.query(
    'SELECT locked_until FROM auth_lockout WHERE user_id = $1',
    [identity.id],
  )
  expect(row.rows[0].locked_until.toISOString()).toBe(timestamp)
  for (const count of [-1, 6])
    await expect(
      ctx.connection.pool.query('UPDATE auth_lockout SET failed_attempts = $1 WHERE user_id = $2', [
        count,
        identity.id,
      ]),
    ).rejects.toThrow()
  await ctx.connection.pool.query('DELETE FROM "user" WHERE id = $1', [identity.id])
  expect(
    (
      await ctx.connection.pool.query('SELECT user_id FROM auth_lockout WHERE user_id = $1', [
        identity.id,
      ])
    ).rows,
  ).toEqual([])
})
