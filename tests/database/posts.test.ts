import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq, like } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { post, postTranslation } from '../../src/features/documents/tables'
import { category } from '../../src/features/collections/tables'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let documents: typeof import('../../src/features/documents/service.server')
let collections: typeof import('../../src/features/collections/service.server')
let reads: typeof import('../../src/features/posts/public.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  documents = await import('../../src/features/documents/service.server')
  collections = await import('../../src/features/collections/service.server')
  reads = await import('../../src/features/posts/public.server')
  await ctx.connection.db.delete(post)
  await ctx.connection.db.delete(category)
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=categories'], 'test')
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=posts'], 'test')
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=posts'], 'test')
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(like(auditLog.entityId, 'posts:%'))
  await ctx.cleanup()
})

it('serves the launch articles exactly like the static source', async () => {
  const { createStaticContentSource } = await import('../../src/content/static')
  const source = createStaticContentSource()
  const input = { locale: 'en' as const, page: 1, pageSize: 10 }
  expect(await reads.postReads.listPosts(input)).toEqual(await source.listPosts(input))
  expect(await reads.postReads.listPosts({ ...input, category: 'ai-basics' })).toEqual(
    await source.listPosts({ ...input, category: 'ai-basics' }),
  )
  expect(await reads.postReads.listCategories('en')).toEqual(await source.listCategories('en'))
  const [first] = (await source.listPosts(input)).posts
  expect(await reads.postReads.getPost(first.slug, 'en')).toEqual(
    await source.getPost(first.slug, 'en'),
  )
  await expect(reads.postReads.listPosts({ ...input, page: 0 })).rejects.toThrow(RangeError)
})

it('keeps drafts out of the site until published, and unpublishes', async () => {
  const before = await reads.postReads.listPosts({ locale: 'en', page: 1, pageSize: 10 })
  const draft = {
    locale: 'en',
    slug: 'first-steps',
    data: {
      title: 'First steps',
      excerpt: '',
      cover: { kind: 'none', media: null, pose: 'wave', gradient: 'teal' },
      categorySlug: 'ai-basics',
      authorId: null,
      bylineName: 'Sineva team',
      publishDate: null,
      body: { type: 'doc', content: [] },
      seo: {
        metaTitle: '',
        metaDescription: '',
        ogImage: null,
        canonicalUrl: null,
        noindex: false,
      },
    },
  }
  await expect(documents.saveDraft(ctx.anonymous, 'posts', draft)).rejects.toThrow()
  const id = await documents.saveDraft(ctx.editorHeaders, 'posts', draft)
  expect(await reads.postReads.listPosts({ locale: 'en', page: 1, pageSize: 10 })).toEqual(before)
  expect(await reads.postReads.getPost('first-steps', 'en')).toBeNull()
  await expect(
    documents.publishDocument(ctx.editorHeaders, 'posts', id, 'en'),
  ).rejects.toMatchObject({
    code: 'INVALID',
  })
  const complete = {
    ...draft,
    id,
    data: {
      ...draft.data,
      excerpt: 'A short start.',
      body: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello.' }] }],
      },
      seo: {
        ...draft.data.seo,
        metaTitle: 'First steps | Sineva',
        metaDescription: 'A short start.',
      },
    },
  }
  await documents.saveDraft(ctx.editorHeaders, 'posts', complete)
  await documents.publishDocument(ctx.editorHeaders, 'posts', id, 'en')
  expect((await reads.postReads.getPost('first-steps', 'en'))?.title).toBe('First steps')
  // A later draft does not change the published article.
  await documents.saveDraft(ctx.editorHeaders, 'posts', {
    ...complete,
    data: { ...complete.data, title: 'Changed draft title' },
  })
  expect((await reads.postReads.getPost('first-steps', 'en'))?.title).toBe('First steps')
  await documents.unpublishDocument(ctx.editorHeaders, 'posts', id, 'en')
  expect(await reads.postReads.getPost('first-steps', 'en')).toBeNull()
  await documents.deleteDocument(ctx.editorHeaders, 'posts', id)
})

it('does not show an article in a locale where it is not published', async () => {
  const [row] = await ctx.connection.db.select().from(postTranslation).limit(1)
  await ctx.connection.db.insert(postTranslation).values({
    itemId: row.itemId,
    locale: 'id',
    draftSlug: 'draf-saja',
    draft: row.draft,
  })
  const items = await documents.readDocuments(ctx.connection.db, 'posts', ['id'])
  expect(items.find((i) => i.id === row.itemId)?.locales.id?.published).toBeNull()
  expect(await documents.publicDocuments(ctx.connection.db, 'posts', 'id' as 'en')).toEqual([])
  await ctx.connection.db.delete(postTranslation).where(eq(postTranslation.locale, 'id'))
})

it('refuses to delete a category still used by an article', async () => {
  const items = await collections.readCollection(ctx.connection.db, 'categories')
  const used = items.find((c) => c.key === 'ai-basics')!
  await expect(
    collections.deleteCollectionItem(ctx.editorHeaders, 'categories', used.id),
  ).rejects.toMatchObject({ code: 'CONFLICT' })
})
