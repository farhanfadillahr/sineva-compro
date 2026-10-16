import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq, like, or, sql } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { redirect } from '../../src/features/redirects/schema'
import { post } from '../../src/features/documents/tables'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let redirects: typeof import('../../src/features/redirects/service.server')
let documents: typeof import('../../src/features/documents/service.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  redirects = await import('../../src/features/redirects/service.server')
  documents = await import('../../src/features/documents/service.server')
  await ctx.connection.db.delete(redirect)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(redirect)
  await ctx.connection.db
    .delete(auditLog)
    .where(or(eq(auditLog.entity, 'redirects'), like(auditLog.entityId, 'posts:%')))
  await ctx.cleanup()
})

it('lets only Admins manage redirects and rejects duplicates and loops', async () => {
  await expect(
    redirects.createRedirect(ctx.editorHeaders, { fromPath: '/old', toPath: '/new' }),
  ).rejects.toThrow()
  await redirects.createRedirect(ctx.adminHeaders, { fromPath: '/old', toPath: '/new' })
  await expect(
    redirects.createRedirect(ctx.adminHeaders, { fromPath: '/old', toPath: '/other' }),
  ).rejects.toMatchObject({ code: 'CONFLICT' })
  await expect(
    redirects.createRedirect(ctx.adminHeaders, { fromPath: '/new', toPath: '/old' }),
  ).rejects.toMatchObject({ code: 'INVALID' })
  await expect(
    redirects.createRedirect(ctx.adminHeaders, { fromPath: '/admin/x', toPath: '/' }),
  ).rejects.toMatchObject({ code: 'INVALID' })
  expect(await redirects.resolveRedirect('/old/')).toMatchObject({ toPath: '/new', status: 301 })
  expect(await redirects.resolveRedirect('/admin/x')).toBeNull()
})

const article = (slug: string) => ({
  locale: 'en',
  slug,
  data: {
    title: 'Renamed article',
    excerpt: 'Short.',
    cover: { kind: 'none', media: null, pose: 'wave', gradient: 'teal' },
    categorySlug: null,
    authorId: null,
    bylineName: 'Sineva team',
    publishDate: null,
    body: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi.' }] }],
    },
    seo: {
      metaTitle: 'Renamed | Sineva',
      metaDescription: 'Short.',
      ogImage: null,
      canonicalUrl: null,
      noindex: false,
    },
  },
})

it('creates the redirect with a published slug change, atomically', async () => {
  const id = await documents.saveDraft(ctx.editorHeaders, 'posts', article('first-name'))
  await documents.publishDocument(ctx.editorHeaders, 'posts', id, 'en')
  await documents.saveDraft(ctx.editorHeaders, 'posts', { ...article('second-name'), id })
  await documents.publishDocument(ctx.editorHeaders, 'posts', id, 'en')
  redirects.invalidateRedirectCache()
  expect(await redirects.resolveRedirect('/blog/first-name')).toMatchObject({
    toPath: '/blog/second-name',
  })

  // Make the redirect insert fail: the slug change must roll back with it.
  await ctx.connection.db.execute(
    sql`ALTER TABLE redirect ADD CONSTRAINT test_block CHECK (to_path NOT LIKE '%third-name%')`,
  )
  try {
    await documents.saveDraft(ctx.editorHeaders, 'posts', { ...article('third-name'), id })
    await expect(documents.publishDocument(ctx.editorHeaders, 'posts', id, 'en')).rejects.toThrow()
    const [item] = await documents.readDocuments(ctx.connection.db, 'posts', ['en'], { ids: [id] })
    expect(item.locales.en?.publishedSlug).toBe('second-name')
  } finally {
    await ctx.connection.db.execute(sql`ALTER TABLE redirect DROP CONSTRAINT test_block`)
  }
  await documents.unpublishDocument(ctx.editorHeaders, 'posts', id, 'en')
  await ctx.connection.db.delete(post).where(eq(post.id, id))
})
