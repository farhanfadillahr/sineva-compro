import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { like } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { faqItem } from '../../src/features/collections/tables'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let service: typeof import('../../src/features/collections/service.server')
let reads: typeof import('../../src/features/faq/public.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  service = await import('../../src/features/collections/service.server')
  reads = await import('../../src/features/faq/public.server')
  await ctx.connection.db.delete(faqItem)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(like(auditLog.entityId, 'faq:%'))
  await ctx.cleanup()
})

it('serves the launch library per tag in the stored order, like the static source', async () => {
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=faq'], 'test')
  const { createStaticContentSource } = await import('../../src/content/static')
  const source = createStaticContentSource()
  for (const tag of ['home', 'product', 'services', 'service:ai-build'] as const)
    expect(await reads.faqReads.listFaq(tag, 'en')).toEqual(await source.listFaq(tag, 'en'))
})

it('tags one item with several tags and keeps order inside a tag', async () => {
  const doc = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Yes.' }] }],
  }
  await expect(
    service.saveCollectionItem(ctx.anonymous, 'faq', {
      key: 'anon',
      global: { tags: ['home'] },
      locales: { en: { question: 'Anon?', answer: doc } },
    }),
  ).rejects.toThrow()
  const id = await service.saveCollectionItem(ctx.editorHeaders, 'faq', {
    key: 'can-i-pay-later',
    global: { tags: ['product', 'service:ai-discovery'] },
    locales: { en: { question: 'Can I pay later?', answer: doc } },
  })
  expect(
    (await reads.faqReads.listFaq('service:ai-discovery', 'en')).map((i) => i.question),
  ).toContain('Can I pay later?')
  expect(
    (await reads.faqReads.listFaq('home', 'en')).some((i) => i.question === 'Can I pay later?'),
  ).toBe(false)
  const ids = (await service.readCollection(ctx.connection.db, 'faq')).map((i) => i.id)
  await service.reorderCollection(ctx.editorHeaders, 'faq', [id, ...ids.filter((x) => x !== id)])
  expect((await reads.faqReads.listFaq('product', 'en'))[0].question).toBe('Can I pay later?')
})
