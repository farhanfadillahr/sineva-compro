import { and, eq } from 'drizzle-orm'
import { routing } from '../../src/i18n/routing'
import { postTables } from '../../src/features/documents/tables'
import { launchPosts } from '../../src/features/posts/launch'
import type { SeedModule } from './types'

const { items, translations } = postTables
const DEMO_SLUG = 'demo-post'

async function bySlug(tx: Parameters<SeedModule['base']>[0], slug: string) {
  const [row] = await tx
    .select({ id: items.id, isDemo: items.isDemo })
    .from(translations)
    .innerJoin(items, eq(items.id, translations.itemId))
    .where(and(eq(translations.locale, routing.defaultLocale), eq(translations.draftSlug, slug)))
  return row
}

/**
 * Base: the launch articles as published snapshots (draft equals published), inserted when their
 * slug is missing, with their original publication dates. Demo: one unpublished draft flagged
 * `is_demo`; purge removes only that row.
 */
export const postsSeed: SeedModule = {
  key: 'posts',
  async base(tx) {
    for (const post of launchPosts()) {
      if (await bySlug(tx, post.slug)) continue
      const at = new Date(post.publishedAt)
      const [created] = await tx
        .insert(items)
        .values({ createdAt: at, updatedAt: at })
        .returning({ id: items.id })
      await tx.insert(translations).values({
        itemId: created.id,
        locale: routing.defaultLocale,
        draftSlug: post.slug,
        draft: post.data,
        draftUpdatedAt: at,
        publishedSlug: post.slug,
        published: post.data,
        firstPublishedAt: at,
        lastPublishedAt: at,
      })
    }
  },
  async demo(tx) {
    const existing = await bySlug(tx, DEMO_SLUG)
    if (existing && !existing.isDemo) throw new Error('Reserved demo slug belongs to a real post')
    if (existing) return
    const [created] = await tx.insert(items).values({ isDemo: true }).returning({ id: items.id })
    await tx.insert(translations).values({
      itemId: created.id,
      locale: routing.defaultLocale,
      draftSlug: DEMO_SLUG,
      draft: {
        title: '[Demo] Draft article',
        excerpt: 'Demo draft for development and tests. Never published.',
        cover: { kind: 'none', media: null, pose: 'wave', gradient: 'teal' },
        categorySlug: null,
        authorId: null,
        bylineName: 'Sineva team',
        publishDate: null,
        body: { type: 'doc', content: [] },
        seo: {
          metaTitle: '[Demo] Draft article | Sineva',
          metaDescription: 'Demo draft.',
          ogImage: null,
          canonicalUrl: null,
          noindex: true,
        },
      },
    })
  },
  async purgeDemo(tx) {
    const existing = await bySlug(tx, DEMO_SLUG)
    if (existing?.isDemo) await tx.delete(items).where(eq(items.id, existing.id))
  },
}
