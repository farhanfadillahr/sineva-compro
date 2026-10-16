import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { like } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { portfolio } from '../../src/features/documents/tables'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let documents: typeof import('../../src/features/documents/service.server')
let reads: typeof import('../../src/features/work/public.server')
let preview: typeof import('../../src/features/cms/preview.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  documents = await import('../../src/features/documents/service.server')
  reads = await import('../../src/features/work/public.server')
  preview = await import('../../src/features/cms/preview.server')
  await ctx.connection.db.delete(portfolio)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(like(auditLog.entityId, 'work:%'))
  await ctx.cleanup()
})

const item = (slug: string, title: string) => ({
  locale: 'en',
  slug,
  data: {
    title,
    projectType: 'internal-demo',
    summary: 'An order dashboard for a fictional food business.',
    cover: null,
    challenge: 'Orders arrive in many places.',
    solution: 'One simple dashboard.',
    result: 'Built as an internal demo.',
    stack: ['Next.js'],
    gallery: [],
    demoUrl: null,
    serviceSlug: null,
    featured: true,
    seo: {
      metaTitle: `${title} | Sineva`,
      metaDescription: 'Internal demo project.',
      ogImage: null,
      canonicalUrl: null,
      noindex: false,
    },
  },
})

it('starts empty, and demo projects are flagged and purgeable', async () => {
  expect(await reads.workReads.listWork({ locale: 'en' })).toEqual([])
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=work', '--demo'], 'test')
  expect(await reads.workReads.listWork({ locale: 'en', featured: true })).toHaveLength(1)
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=work', '--purge-demo'], 'test')
  expect(await reads.workReads.listWork({ locale: 'en' })).toEqual([])
})

it('never leaks a draft: list, item, sitemap data and preview without a session', async () => {
  await expect(
    documents.saveDraft(ctx.anonymous, 'work', item('order-dashboard', 'Order dashboard')),
  ).rejects.toThrow()
  const id = await documents.saveDraft(
    ctx.editorHeaders,
    'work',
    item('order-dashboard', 'Order dashboard'),
  )
  expect(await reads.workReads.listWork({ locale: 'en' })).toEqual([])
  expect(await reads.workReads.getWork('order-dashboard', 'en')).toBeNull()
  // The sitemap and Home read these same functions, so the draft cannot reach them either.
  expect(await preview.isPreviewRequest()).toBe(false)
  await documents.publishDocument(ctx.adminHeaders, 'work', id, 'en')
  expect(await reads.workReads.getWork('order-dashboard', 'en')).toMatchObject({
    title: 'Order dashboard',
    projectType: 'internal-demo',
  })
  await expect(
    documents.saveDraft(ctx.editorHeaders, 'work', item('order-dashboard', 'Another')),
  ).rejects.toMatchObject({ code: 'CONFLICT' })
  await documents.unpublishDocument(ctx.editorHeaders, 'work', id, 'en')
  expect(await reads.workReads.listWork({ locale: 'en' })).toEqual([])
})
