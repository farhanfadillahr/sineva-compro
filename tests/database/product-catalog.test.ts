import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { businessType, productCapability } from '../../src/features/collections/tables'
import { pageContent } from '../../src/features/pages/schema'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let service: typeof import('../../src/features/collections/service.server')
let product: typeof import('../../src/features/product/service.server')
let reads: typeof import('../../src/features/product/public.server')
let pages: typeof import('../../src/features/pages/public.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  service = await import('../../src/features/collections/service.server')
  product = await import('../../src/features/product/service.server')
  reads = await import('../../src/features/product/public.server')
  pages = await import('../../src/features/pages/public.server')
  await ctx.connection.db.delete(productCapability)
  await ctx.connection.db.delete(businessType)
  await ctx.connection.db.delete(pageContent)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(like(auditLog.entityId, 'capabilities:%'))
  await ctx.cleanup()
})

it('seeds launch rows once, adds and purges flagged demo rows', async () => {
  const run = (args: string[] = []) =>
    runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=capabilities', ...args], 'test')
  await run()
  await run()
  const { staticContent } = await import('../../src/content/static/source')
  expect(await reads.productReads.listCapabilities('en')).toEqual(staticContent.capabilities)
  await run(['--demo'])
  expect(await ctx.connection.db.select().from(productCapability)).toHaveLength(
    staticContent.capabilities.length + 1,
  )
  await run(['--purge-demo'])
  expect(
    await ctx.connection.db
      .select()
      .from(productCapability)
      .where(eq(productCapability.isDemo, true)),
  ).toHaveLength(0)
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=business-types'], 'test')
  expect(await reads.productReads.listIndustries('en')).toEqual(staticContent.industries)
})

it('lets an Editor create, edit, reorder and remove; rejects anonymous writes', async () => {
  const item = {
    key: 'weekly-plan',
    global: { tint: 'mint', pose: 'whiteboard', featured: false },
    locales: { en: { title: 'Sino, plan my week', body: 'A short plan.', mockupLines: ['Plan'] } },
  }
  await expect(service.saveCollectionItem(ctx.anonymous, 'capabilities', item)).rejects.toThrow()
  const id = await service.saveCollectionItem(ctx.editorHeaders, 'capabilities', item)
  await expect(
    service.saveCollectionItem(ctx.editorHeaders, 'capabilities', item),
  ).rejects.toMatchObject({
    code: 'CONFLICT',
  })
  await service.saveCollectionItem(ctx.editorHeaders, 'capabilities', {
    ...item,
    id,
    locales: { en: { ...item.locales.en, title: 'Sino, plan next week' } },
  })
  const listed = await reads.productReads.listCapabilities('en')
  expect(listed.at(-1)).toMatchObject({ key: 'weekly-plan', title: 'Sino, plan next week' })
  const ids = (await service.readCollection(ctx.connection.db, 'capabilities')).map((i) => i.id)
  await service.reorderCollection(ctx.editorHeaders, 'capabilities', [
    id,
    ...ids.filter((x) => x !== id),
  ])
  expect((await reads.productReads.listCapabilities('en'))[0].key).toBe('weekly-plan')
  await expect(
    service.reorderCollection(ctx.editorHeaders, 'capabilities', [id]),
  ).rejects.toMatchObject({ code: 'CONFLICT' })
  await service.deleteCollectionItem(ctx.editorHeaders, 'capabilities', id)
  expect(
    (await reads.productReads.listCapabilities('en')).some((c) => c.key === 'weekly-plan'),
  ).toBe(false)
})

it('stores the product status once and the Product DTO follows it', async () => {
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=pages'], 'test')
  await product.saveProductStatus(ctx.editorHeaders, 'live')
  expect((await pages.pageReads.getPage('product', 'en'))?.productStatus).toBe('live')
  await product.saveProductStatus(ctx.editorHeaders, 'coming_soon')
  expect(await product.readProductStatus()).toBe('coming_soon')
  await expect(product.saveProductStatus(ctx.editorHeaders, 'beta')).rejects.toMatchObject({
    code: 'INVALID',
  })
})
