import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createCmsTestContext } from '../helpers/cms-context'
import { previewState } from '../../src/features/preview/schema'
import { pageContent } from '../../src/features/pages/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let preview: typeof import('../../src/features/preview/service.server')
let pages: typeof import('../../src/features/pages/service.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  preview = await import('../../src/features/preview/service.server')
  pages = await import('../../src/features/pages/service.server')
  await ctx.connection.db.delete(previewState)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(previewState)
  await ctx.cleanup()
})

it('stores unsaved state behind a signed link, without touching content or caches', async () => {
  const { locales } = await pages.loadPageForAdmin(ctx.editorHeaders, 'notFound')
  const before = await ctx.connection.db.select().from(pageContent)
  vi.mocked(revalidateTag).mockClear()
  vi.mocked(revalidatePath).mockClear()
  const input = {
    kind: 'page',
    target: 'notFound',
    locale: 'en',
    data: { ...locales.en.data, headline: 'Unsaved headline' },
  }
  await expect(preview.createPreview(ctx.anonymous, input)).rejects.toThrow()
  const { url } = await preview.createPreview(ctx.editorHeaders, input)
  const token = new URL(url, 'http://local').searchParams.get('token')
  expect(await preview.openPreview(token)).toMatchObject({ path: '/preview-not-found' })
  expect(await preview.openPreview(`${token}x`)).toBeNull()
  expect(revalidateTag).not.toHaveBeenCalled()
  expect(revalidatePath).not.toHaveBeenCalled()
  expect(await ctx.connection.db.select().from(pageContent)).toEqual(before)
})

it('rejects invalid state and removes expired rows', async () => {
  await expect(
    preview.createPreview(ctx.editorHeaders, {
      kind: 'page',
      target: 'notFound',
      locale: 'en',
      data: { headline: 'A — B' },
    }),
  ).rejects.toMatchObject({ code: 'INVALID' })
  const [user] = await ctx.connection.db.select().from(previewState).limit(1)
  await ctx.connection.db.insert(previewState).values({
    kind: 'page',
    target: 'home',
    locale: 'en',
    data: {},
    createdBy: user.createdBy,
    expiresAt: new Date(Date.now() - 1000),
  })
  const { locales } = await pages.loadPageForAdmin(ctx.editorHeaders, 'notFound')
  await preview.createPreview(ctx.editorHeaders, {
    kind: 'page',
    target: 'notFound',
    locale: 'en',
    data: locales.en.data,
  })
  const rows = await ctx.connection.db.select().from(previewState)
  expect(rows.every((row) => row.expiresAt.getTime() > Date.now())).toBe(true)
})
