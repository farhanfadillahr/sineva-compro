import { eq, max } from 'drizzle-orm'
import { routing } from '../../src/i18n/routing'
import { launchServices } from '../../src/features/services/launch'
import { service, serviceTranslation } from '../../src/features/services/schema'
import type { SeedModule } from './types'

const demo = {
  slug: 'demo-service',
  global: { icon: 'calendar', pose: 'whiteboard', tools: ['Demo tool'] },
  local: {
    title: '[Demo] Service',
    summary: 'For development and tests only. Not a real service.',
    problems: [
      { title: 'Demo one', body: 'Demo problem.' },
      { title: 'Demo two', body: 'Demo problem.' },
      { title: 'Demo three', body: 'Demo problem.' },
    ],
    deliverables: ['Demo deliverable'],
    process: [{ title: 'Demo step', body: 'Demo process step.' }],
    ctaLabel: 'Book a demo',
    seo: {
      metaTitle: '[Demo] Service',
      metaDescription: 'Demo service for development and tests.',
      ogImage: null,
      canonicalUrl: null,
      noindex: true,
    },
  },
}

async function slugTaken(tx: Parameters<SeedModule['base']>[0], slug: string) {
  const [row] = await tx
    .select({ id: serviceTranslation.serviceId, isDemo: service.isDemo })
    .from(serviceTranslation)
    .innerJoin(service, eq(service.id, serviceTranslation.serviceId))
    .where(eq(serviceTranslation.slug, slug))
  return row
}

async function insert(
  tx: Parameters<SeedModule['base']>[0],
  row: { slug: string; global: object; local: object; translations?: Record<string, object> },
  isDemo: boolean,
) {
  const [{ last }] = await tx.select({ last: max(service.sortOrder) }).from(service)
  const [created] = await tx
    .insert(service)
    .values({ sortOrder: (last ?? -1) + 1, published: !isDemo, data: row.global, isDemo })
    .returning({ id: service.id })
  await addTranslations(tx, created.id, row)
}

/** One translation per locale with launch copy; a locale that already has a row is left alone. */
async function addTranslations(
  tx: Parameters<SeedModule['base']>[0],
  serviceId: string,
  row: { slug: string; local: object; translations?: Record<string, object> },
) {
  const byLocale = row.translations ?? { [routing.defaultLocale]: row.local }
  for (const [locale, data] of Object.entries(byLocale))
    await tx
      .insert(serviceTranslation)
      .values({ serviceId, locale, slug: row.slug, data })
      .onConflictDoNothing()
}

/**
 * Base: the three launch services (published) in every locale with launch copy, inserted when
 * their slug or a locale's translation is missing. Demo: one
 * unpublished, noindex `demo-service` flagged `is_demo`; purge removes only that flagged row.
 */
export const servicesSeed: SeedModule = {
  key: 'services',
  async base(tx) {
    for (const row of launchServices()) {
      const taken = await slugTaken(tx, row.slug)
      if (!taken) await insert(tx, row, false)
      // A locale enabled after the first seed (CPR-101) gets its launch copy on the next run.
      else if (!taken.isDemo) await addTranslations(tx, taken.id, row)
    }
  },
  async demo(tx) {
    const taken = await slugTaken(tx, demo.slug)
    if (taken && !taken.isDemo) throw new Error('Reserved demo slug belongs to a real service')
    if (!taken) await insert(tx, demo, true)
  },
  async purgeDemo(tx) {
    const taken = await slugTaken(tx, demo.slug)
    if (taken?.isDemo) await tx.delete(service).where(eq(service.id, taken.id))
  },
}
