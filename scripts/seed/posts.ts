import { and, eq } from 'drizzle-orm'
import { routing } from '../../src/i18n/routing'
import { postTables } from '../../src/features/documents/tables'
import { launchPosts } from '../../src/features/posts/launch'
import { EN_SLUG_BY_ID_SLUG } from '../../src/content/static/id/posts'
import type { SeedModule } from './types'

const { items, translations } = postTables
const DEMO_SLUG = 'demo-post'

type Tx = Parameters<SeedModule['base']>[0]

async function bySlug(tx: Tx, slug: string, locale: string = routing.defaultLocale) {
  const [row] = await tx
    .select({ id: items.id, isDemo: items.isDemo })
    .from(translations)
    .innerJoin(items, eq(items.id, translations.itemId))
    .where(and(eq(translations.locale, locale), eq(translations.draftSlug, slug)))
  return row
}

async function hasTranslation(tx: Tx, itemId: string, locale: string) {
  const [row] = await tx
    .select({ itemId: translations.itemId })
    .from(translations)
    .where(and(eq(translations.itemId, itemId), eq(translations.locale, locale)))
  return Boolean(row)
}

/**
 * The Indonesian launch articles (CPR-107), added as the `id` translation of the English article
 * they translate, found by its English slug. Skipped when that article is gone, when it already
 * has an Indonesian translation (an editor's copy is never overwritten), or when the Indonesian
 * slug is taken by another article.
 */
async function seedIndonesian(tx: Tx) {
  for (const post of launchPosts('id')) {
    const enSlug = EN_SLUG_BY_ID_SLUG[post.slug]
    const en = enSlug ? await bySlug(tx, enSlug) : undefined
    if (!en || (await hasTranslation(tx, en.id, 'id')) || (await bySlug(tx, post.slug, 'id')))
      continue
    const at = new Date(post.publishedAt)
    await tx.insert(translations).values({
      itemId: en.id,
      locale: 'id',
      draftSlug: post.slug,
      draft: post.data,
      draftUpdatedAt: at,
      publishedSlug: post.slug,
      published: post.data,
      firstPublishedAt: at,
      lastPublishedAt: at,
    })
  }
}

/**
 * Base: the launch articles as published snapshots (draft equals published), inserted when their
 * slug is missing, with their original publication dates, then their Indonesian translations. Demo: one unpublished draft flagged
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
    await seedIndonesian(tx)
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
          metaTitle: '[Demo] Draft article',
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
