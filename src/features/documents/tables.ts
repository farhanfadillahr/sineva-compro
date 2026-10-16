import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

/**
 * Publishable documents (posts, work). Each locale keeps a draft and, once published, a separate
 * published snapshot: saving a draft never changes what the site shows (FR-ADM-02). The site only
 * reads `published`; preview reads `draft`. Slugs are unique per locale for drafts and for
 * published snapshots, enforced by the database.
 */
function documentTables(name: string) {
  const items = pgTable(
    name,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      sortOrder: integer('sort_order').default(0).notNull(),
      isDemo: boolean('is_demo').default(false).notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
      updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    },
    (t) => [index(`${name}_order_idx`).on(t.sortOrder, t.id)],
  )
  const translations = pgTable(
    `${name}_translation`,
    {
      itemId: uuid('item_id')
        .notNull()
        .references(() => items.id, { onDelete: 'cascade' }),
      locale: text('locale').notNull(),
      draftSlug: text('draft_slug').notNull(),
      draft: jsonb('draft').notNull(),
      draftUpdatedAt: timestamp('draft_updated_at', { withTimezone: true }).defaultNow().notNull(),
      publishedSlug: text('published_slug'),
      published: jsonb('published'),
      /** First publication; the public "published at" unless the snapshot sets a date. */
      firstPublishedAt: timestamp('first_published_at', { withTimezone: true }),
      /** Latest publication of a changed snapshot; the public "updated at". */
      lastPublishedAt: timestamp('last_published_at', { withTimezone: true }),
    },
    (t) => [
      primaryKey({ columns: [t.itemId, t.locale] }),
      uniqueIndex(`${name}_translation_draft_slug_unique`).on(t.locale, t.draftSlug),
      uniqueIndex(`${name}_translation_published_slug_unique`).on(t.locale, t.publishedSlug),
      index(`${name}_translation_published_idx`).on(t.locale, t.firstPublishedAt),
      check(`${name}_translation_locale`, sql`${t.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
      check(
        `${name}_translation_slugs`,
        sql`${t.draftSlug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(${t.draftSlug}) <= 100 AND (${t.publishedSlug} IS NULL OR ${t.publishedSlug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$')`,
      ),
      check(
        `${name}_translation_snapshot`,
        sql`(${t.published} IS NULL) = (${t.publishedSlug} IS NULL) AND (${t.published} IS NULL OR jsonb_typeof(${t.published}) = 'object') AND jsonb_typeof(${t.draft}) = 'object'`,
      ),
    ],
  )
  return { items, translations }
}

export const postTables = documentTables('post')
/** The data entity stays `Portfolio`; only UI strings and URLs say "Work". */
export const portfolioTables = documentTables('portfolio')

export const post = postTables.items
export const postTranslation = postTables.translations
export const portfolio = portfolioTables.items
export const portfolioTranslation = portfolioTables.translations

export type DocumentTables = ReturnType<typeof documentTables>
