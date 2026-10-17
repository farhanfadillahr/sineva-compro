import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { countOverlappingQueries } from '../helpers/pg-overlap'
import { runSeeds } from '../../scripts/seed/runner'
import { siteSettings, siteSettingsTranslation } from '../../src/features/settings/schema'
import { auditLog } from '../../src/features/audit/schema'
import type { SettingsGlobal, SettingsLocale } from '../../src/features/settings/fields'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let service: typeof import('../../src/features/settings/service.server')
const groups = {
  global: ['brand', 'contact', 'social', 'leadRouting', 'features', 'analytics', 'verification'],
  locale: ['contact', 'whatsapp'],
}

beforeAll(async () => {
  ctx = await createCmsTestContext()
  service = await import('../../src/features/settings/service.server')
  await ctx.connection.db.delete(siteSettingsTranslation)
  await ctx.connection.db.delete(siteSettings)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(eq(auditLog.entity, 'settings'))
  await ctx.cleanup()
})

async function stored() {
  const [row] = await ctx.connection.db.select().from(siteSettings)
  const [local] = await ctx.connection.db
    .select()
    .from(siteSettingsTranslation)
    .where(eq(siteSettingsTranslation.locale, 'en'))
  return { global: row?.data as SettingsGlobal, local: local?.data as SettingsLocale }
}

it('seeds the launch settings once and never overwrites an edit', async () => {
  const run = (args: string[] = []) =>
    runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=settings', ...args], 'test')
  await run()
  const first = await stored()
  expect(first.global.brand.siteName).toBe('Sineva')
  expect(first.local.whatsapp.general).toMatch(/Sineva/)
  await ctx.connection.db
    .update(siteSettings)
    .set({ data: { ...first.global, brand: { ...first.global.brand, siteName: 'Edited' } } })
  await run()
  await run(['--demo'])
  await run(['--purge-demo'])
  expect((await stored()).global.brand.siteName).toBe('Edited')
  await ctx.connection.db.update(siteSettings).set({ data: first.global })
})

it('rejects anonymous saves', async () => {
  await expect(service.saveSiteSettings(ctx.anonymous, {}, groups)).rejects.toThrow()
})

it('lets an Editor change contact and templates but never Admin-only groups', async () => {
  const before = await stored()
  await service.saveSiteSettings(
    ctx.editorHeaders,
    {
      global: {
        contact: { ...before.global.contact, address: 'Jl. Contoh 1, Jakarta' },
        features: { ...before.global.features, enableRealtimeSino: false },
        brand: { ...before.global.brand, siteName: 'Hacked' },
      },
      locales: {
        en: { whatsapp: { ...before.local.whatsapp, general: 'Hello {site}, quick question.' } },
      },
    },
    groups,
  )
  const after = await stored()
  expect(after.global.contact.address).toBe('Jl. Contoh 1, Jakarta')
  expect(after.global.features.enableRealtimeSino).toBe(before.global.features.enableRealtimeSino)
  expect(after.global.brand.siteName).toBe(before.global.brand.siteName)
  expect(after.local.whatsapp.general).toBe('Hello {site}, quick question.')
  const entries = await ctx.connection.db
    .select()
    .from(auditLog)
    .where(eq(auditLog.entity, 'settings'))
  expect(entries.map((e) => e.changedFields).flat()).toEqual(
    expect.arrayContaining(['contact', 'whatsappTemplates']),
  )
})

it('lets an Admin change feature toggles and rejects bad input atomically', async () => {
  const before = await stored()
  await service.saveSiteSettings(
    ctx.adminHeaders,
    { global: { features: { ...before.global.features, showTeam: true } } },
    groups,
  )
  expect((await stored()).global.features.showTeam).toBe(true)
  await expect(
    service.saveSiteSettings(
      ctx.adminHeaders,
      {
        global: {
          contact: { ...before.global.contact, whatsappNumber: '0851' },
          features: { ...before.global.features, showTeam: false },
        },
      },
      groups,
    ),
  ).rejects.toMatchObject({ code: 'INVALID' })
  expect((await stored()).global.features.showTeam).toBe(true)
  await expect(
    service.saveSiteSettings(
      ctx.adminHeaders,
      { locales: { en: { contact: { businessHours: 'Mon – Fri' } } } },
      groups,
    ),
  ).rejects.toMatchObject({ code: 'INVALID' })
})

// A transaction is one connection: Promise.all over its queries made pg warn that
// `client.query()` was called while the client was still busy (removed in pg 9).
it('saves without running concurrent queries on the transaction client', async () => {
  const before = await stored()
  const overlapping = await countOverlappingQueries(() =>
    service.saveSiteSettings(
      ctx.adminHeaders,
      { global: { features: { ...before.global.features } } },
      groups,
    ),
  )
  expect(overlapping).toBe(0)
})
