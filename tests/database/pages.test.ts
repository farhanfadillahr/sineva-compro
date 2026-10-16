import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { pageContent } from '../../src/features/pages/schema'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let service: typeof import('../../src/features/pages/service.server')
let reads: typeof import('../../src/features/pages/public.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  service = await import('../../src/features/pages/service.server')
  reads = await import('../../src/features/pages/public.server')
  await ctx.connection.db.delete(pageContent)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(eq(auditLog.entity, 'pages'))
  await ctx.cleanup()
})

it('seeds every launch page once and serves the same public DTO as the static content', async () => {
  const run = () => runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=pages'], 'test')
  await run()
  await run()
  expect(await ctx.connection.db.select().from(pageContent)).toHaveLength(10)
  const { staticContent } = await import('../../src/content/static/source')
  expect(await reads.pageReads.getPage('notFound', 'en')).toEqual(staticContent.pages.notFound)
  expect(await reads.pageReads.getPage('home', 'en')).toEqual(staticContent.pages.home)
})

it('rejects anonymous saves and em dashes, and saves an Editor change', async () => {
  const page = await service.loadPageForAdmin(ctx.editorHeaders, 'notFound')
  const data = page.locales.en.data!
  await expect(
    service.savePage(ctx.anonymous, 'notFound', { locale: 'en', data }),
  ).rejects.toThrow()
  await expect(
    service.savePage(ctx.editorHeaders, 'notFound', {
      locale: 'en',
      data: { ...data, body: 'Back — now' },
    }),
  ).rejects.toMatchObject({ code: 'INVALID' })
  await service.savePage(ctx.editorHeaders, 'notFound', {
    locale: 'en',
    data: { ...data, body: 'Let us help you find your way.' },
  })
  expect((await reads.pageReads.getPage('notFound', 'en'))?.body).toBe(
    'Let us help you find your way.',
  )
  const [entry] = await ctx.connection.db
    .select()
    .from(auditLog)
    .where(eq(auditLog.entityId, 'notFound:en'))
  expect(entry.changedFields).toEqual(['data'])
})

it('returns an optional section switched off as hidden', async () => {
  const page = await service.loadPageForAdmin(ctx.adminHeaders, 'home')
  const data = page.locales.en.data!
  await service.savePage(ctx.adminHeaders, 'home', {
    locale: 'en',
    data: { ...data, fromBlog: { visible: false, title: 'From the blog' } },
  })
  expect((await reads.pageReads.getPage('home', 'en'))?.fromBlog.visible).toBe(false)
})
