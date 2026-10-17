import { sql } from 'drizzle-orm'
import { check, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

/**
 * One document per page and locale. Sections are fixed in code; `data` holds the text inside them,
 * validated by the page descriptor on write and on read, and migrated from `version` on read.
 */
export const pageContent = pgTable(
  'page_content',
  {
    pageKey: text('page_key').notNull(),
    locale: text('locale').notNull(),
    version: integer('version').notNull(),
    data: jsonb('data').notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.pageKey, t.locale] }),
    check(
      'page_content_key_check',
      sql`${t.pageKey} IN ('home','product','servicesOverview','about','contact','thankYou','notFound','privacy','blogIndex','workIndex')`,
    ),
    check('page_content_locale_check', sql`${t.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
    check('page_content_version_check', sql`${t.version} >= 1`),
    check('page_content_data_object', sql`jsonb_typeof(${t.data}) = 'object'`),
  ],
)
