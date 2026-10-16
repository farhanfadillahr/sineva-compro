import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { createCmsTestContext } from '../helpers/cms-context'
import { faqItem } from '../../src/features/collections/tables'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let collections: typeof import('../../src/features/collections/service.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  collections = await import('../../src/features/collections/service.server')
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(faqItem).where(eq(faqItem.key, 'cache-check'))
  await ctx.connection.db.delete(auditLog).where(like(auditLog.entityId, 'faq:%'))
  await ctx.cleanup()
})

const doc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Yes.' }] }],
}

it('refreshes the public tags only after a committed change', async () => {
  vi.mocked(revalidateTag).mockClear()
  await expect(
    collections.saveCollectionItem(ctx.editorHeaders, 'faq', {
      key: 'cache-check',
      global: { tags: ['home'] },
      locales: { en: { question: 'Bad — dash?', answer: doc } },
    }),
  ).rejects.toMatchObject({ code: 'INVALID' })
  await expect(
    collections.saveCollectionItem(ctx.anonymous, 'faq', {
      key: 'cache-check',
      global: { tags: ['home'] },
      locales: { en: { question: 'Anonymous?', answer: doc } },
    }),
  ).rejects.toThrow()
  expect(revalidateTag).not.toHaveBeenCalled()
  await collections.saveCollectionItem(ctx.editorHeaders, 'faq', {
    key: 'cache-check',
    global: { tags: ['home'] },
    locales: { en: { question: 'Does the cache refresh?', answer: doc } },
  })
  expect(revalidateTag).toHaveBeenCalledWith('faq:en', { expire: 0 })
})
