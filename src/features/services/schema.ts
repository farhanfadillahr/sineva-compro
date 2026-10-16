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
 * Services with one translation row per locale. The slug is per locale and unique within it (a
 * database constraint, so two concurrent saves cannot both take it). Language-independent fields
 * (icon, pose, tools) live in `service.data`; the rest in `service_translation.data`, both
 * validated by `fields.ts`.
 */
export const service = pgTable(
  'service',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sortOrder: integer('sort_order').notNull(),
    published: boolean('published').default(false).notNull(),
    data: jsonb('data').notNull(),
    isDemo: boolean('is_demo').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (t) => [
    index('service_order_idx').on(t.sortOrder, t.id),
    check('service_data_object', sql`jsonb_typeof(${t.data}) = 'object'`),
  ],
)

export const serviceTranslation = pgTable(
  'service_translation',
  {
    serviceId: uuid('service_id')
      .notNull()
      .references(() => service.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    slug: text('slug').notNull(),
    data: jsonb('data').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.serviceId, t.locale] }),
    uniqueIndex('service_translation_locale_slug_unique').on(t.locale, t.slug),
    check('service_translation_locale', sql`${t.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
    check(
      'service_translation_slug',
      sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(${t.slug}) <= 80`,
    ),
    check('service_translation_object', sql`jsonb_typeof(${t.data}) = 'object'`),
  ],
)
