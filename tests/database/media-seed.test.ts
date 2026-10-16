import { afterAll, beforeAll, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createAuthTestContext } from '../helpers/auth-context'
import { runSeeds } from '../../scripts/seed/runner'
import { mediaDemoId } from '../../scripts/seed/media'
import { media } from '../../src/features/media/schema'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
beforeAll(async () => {
  ctx = await createAuthTestContext()
})
afterAll(async () => {
  if (ctx) {
    await ctx.connection.db.delete(media).where(eq(media.id, mediaDemoId))
    await ctx.cleanup()
  }
})
it('seeds metadata fixtures idempotently without publishing fake binary, and purges only untouched demo rows', async () => {
  const run = (args: string[]) =>
    runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=media', ...args], 'test')
  await run([])
  await run(['--demo'])
  await run(['--demo'])
  const rows = await ctx.connection.db.select().from(media).where(eq(media.id, mediaDemoId))
  expect(rows).toHaveLength(1)
  expect(rows[0]).toMatchObject({ isDemo: true, publicAssetId: null })
  await run(['--purge-demo'])
  await run(['--purge-demo'])
  expect(
    await ctx.connection.db.select().from(media).where(eq(media.id, mediaDemoId)),
  ).toHaveLength(0)
  await run(['--demo'])
  await ctx.connection.db.update(media).set({ focalX: 0.25 }).where(eq(media.id, mediaDemoId))
  await run(['--purge-demo'])
  expect(
    (await ctx.connection.db.select().from(media).where(eq(media.id, mediaDemoId)))[0]?.focalX,
  ).toBe(0.25)
  await ctx.connection.db
    .update(media)
    .set({ credit: 'Edited by an operator', updatedAt: new Date(Date.now() + 1000) })
    .where(eq(media.id, mediaDemoId))
  await run(['--purge-demo'])
  expect(
    (await ctx.connection.db.select().from(media).where(eq(media.id, mediaDemoId)))[0]?.credit,
  ).toBe('Edited by an operator')
})
