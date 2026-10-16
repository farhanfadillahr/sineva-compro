import { sql } from 'drizzle-orm'
import { check, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

/**
 * Site settings singleton. Values that do not depend on the language live in `data`; per-locale
 * values (business hours, WhatsApp templates, SEO defaults) live in one translation row per locale,
 * so a second locale is a new row, never a schema change. Both JSON documents are validated by the
 * field descriptors in `fields.ts` on every write and projected to the public DTO on read.
 */
export const siteSettings = pgTable(
  'site_settings',
  {
    id: text('id').primaryKey().default('site'),
    data: jsonb('data').notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check('site_settings_singleton', sql`${t.id} = 'site'`),
    check('site_settings_data_object', sql`jsonb_typeof(${t.data}) = 'object'`),
  ],
)

export const siteSettingsTranslation = pgTable(
  'site_settings_translation',
  {
    locale: text('locale').primaryKey(),
    data: jsonb('data').notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check('site_settings_translation_locale', sql`${t.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
    check('site_settings_translation_object', sql`jsonb_typeof(${t.data}) = 'object'`),
  ],
)
