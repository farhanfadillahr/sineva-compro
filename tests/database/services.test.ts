import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { and, eq, like } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { service, serviceTranslation } from '../../src/features/services/schema'
import { auditLog } from '../../src/features/audit/schema'
import { withTopicTitle } from '../../src/features/cms/seo-title'

// Stored meta titles hold the topic only; the site adds the brand (CPR-104).
const topicSeo = <T extends { seo: { metaTitle: string } }>(dto: T): T => ({
  ...dto,
  seo: withTopicTitle(dto.seo),
})

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let services: typeof import('../../src/features/services/service.server')
let reads: typeof import('../../src/features/services/public.server')

const content = (title: string) => ({
  title,
  summary: 'For teams that want to try.',
  problems: [
    { title: 'One', body: 'Body.' },
    { title: 'Two', body: 'Body.' },
    { title: 'Three', body: 'Body.' },
  ],
  deliverables: ['A plan'],
  process: [{ title: 'Talk', body: 'We talk.' }],
  ctaLabel: 'Book a call',
  seo: {
    metaTitle: `${title} | Sineva`,
    metaDescription: 'A test service.',
    ogImage: null,
    canonicalUrl: null,
    noindex: false,
  },
})
const input = (slug: string, title: string, published = true) => ({
  published,
  global: { icon: 'calendar', pose: 'whiteboard', tools: ['Tool'] },
  locales: { en: { slug, ...content(title) } },
})

beforeAll(async () => {
  ctx = await createCmsTestContext()
  services = await import('../../src/features/services/service.server')
  reads = await import('../../src/features/services/public.server')
  await ctx.connection.db.delete(service)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(like(auditLog.entityId, 'services%'))
  await ctx.cleanup()
})

it('seeds exactly the three launch services, safe to run twice, equal to the static DTOs', async () => {
  const run = (args: string[] = []) =>
    runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=services', ...args], 'test')
  await run()
  await run()
  const { staticContent } = await import('../../src/content/static/source')
  expect(await reads.serviceReads.listServices('en')).toEqual(staticContent.services)
  for (const detail of staticContent.serviceDetails)
    expect(await reads.serviceReads.getService(detail.slug, 'en')).toEqual(topicSeo(detail))
  await run(['--demo'])
  expect((await reads.serviceReads.listServices('en')).map((s) => s.slug)).not.toContain(
    'demo-service',
  )
  await run(['--purge-demo'])
  expect(await ctx.connection.db.select().from(service)).toHaveLength(3)
})

it('rejects anonymous writes and duplicate slugs, including concurrent saves', async () => {
  await expect(services.saveService(ctx.anonymous, input('x-anon', 'Anon'))).rejects.toThrow()
  await expect(
    services.saveService(ctx.editorHeaders, input('ai-build', 'Copy')),
  ).rejects.toMatchObject({ code: 'CONFLICT' })
  const results = await Promise.allSettled([
    services.saveService(ctx.editorHeaders, input('ai-race', 'Race A')),
    services.saveService(ctx.adminHeaders, input('ai-race', 'Race B')),
  ])
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
  expect(
    await ctx.connection.db
      .select()
      .from(serviceTranslation)
      .where(eq(serviceTranslation.slug, 'ai-race')),
  ).toHaveLength(1)
})

it('publishes, unpublishes and reorders; public reads only published in order', async () => {
  const id = await services.saveService(
    ctx.editorHeaders,
    input('ai-coaching', 'AI Coaching', false),
  )
  expect((await reads.serviceReads.listServices('en')).some((s) => s.slug === 'ai-coaching')).toBe(
    false,
  )
  await services.setServicePublished(ctx.editorHeaders, id, true)
  const ids = (await services.readServices(ctx.connection.db)).map((s) => s.id)
  await services.reorderServices(ctx.editorHeaders, [id, ...ids.filter((x) => x !== id)])
  expect((await reads.serviceReads.listServices('en'))[0].slug).toBe('ai-coaching')
  await expect(services.deleteService(ctx.editorHeaders, id)).rejects.toMatchObject({
    code: 'CONFLICT',
  })
  await services.setServicePublished(ctx.editorHeaders, id, false)
  await services.deleteService(ctx.editorHeaders, id)
  expect(await reads.serviceReads.getService('ai-coaching', 'en')).toBeNull()
})

it('seeds the Indonesian translation of each launch service, with its own per-locale slug', async () => {
  const [first] = await services.readServices(ctx.connection.db)
  const both = await services.readServices(ctx.connection.db, ['en', 'id'])
  // The seed gives every launch service an `id` row with the English slug (CPR-101).
  expect(both.find((s) => s.id === first.id)?.locales.id?.slug).toBe(first.locales.en?.slug)
  await ctx.connection.db
    .update(serviceTranslation)
    .set({ slug: 'ai-penemuan', data: content('AI Penemuan') })
    .where(and(eq(serviceTranslation.serviceId, first.id), eq(serviceTranslation.locale, 'id')))
  const renamed = await services.readServices(ctx.connection.db, ['en', 'id'])
  expect(renamed.find((s) => s.id === first.id)?.locales.id?.slug).toBe('ai-penemuan')
  expect(renamed.find((s) => s.id === first.id)?.locales.en?.slug).toBe(first.locales.en?.slug)
})
