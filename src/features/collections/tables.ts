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
 * Small ordered collections (capabilities, business types, FAQ, team, categories) share one table
 * shape: an item row with a stable key, display order and language-independent `data`, plus one
 * translation row per locale. Both JSON documents are validated by the collection's descriptors
 * (`configs.ts`) on write and on read. A second locale is a new row, never a schema change.
 */
function collectionTables(name: string) {
  const items = pgTable(
    name,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      key: text('key').notNull(),
      sortOrder: integer('sort_order').notNull(),
      data: jsonb('data').notNull(),
      isDemo: boolean('is_demo').default(false).notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
      updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    },
    (t) => [
      uniqueIndex(`${name}_key_unique`).on(t.key),
      index(`${name}_order_idx`).on(t.sortOrder, t.id),
      check(
        `${name}_key_check`,
        sql`${t.key} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(${t.key}) <= 80`,
      ),
      check(`${name}_data_object`, sql`jsonb_typeof(${t.data}) = 'object'`),
    ],
  )
  const translations = pgTable(
    `${name}_translation`,
    {
      itemId: uuid('item_id')
        .notNull()
        .references(() => items.id, { onDelete: 'cascade' }),
      locale: text('locale').notNull(),
      data: jsonb('data').notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.itemId, t.locale] }),
      check(`${name}_translation_locale`, sql`${t.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
      check(`${name}_translation_object`, sql`jsonb_typeof(${t.data}) = 'object'`),
    ],
  )
  return { items, translations }
}

export const productCapabilityTables = collectionTables('product_capability')
export const businessTypeTables = collectionTables('business_type')
export const faqItemTables = collectionTables('faq_item')
export const teamMemberTables = collectionTables('team_member')

export const productCapability = productCapabilityTables.items
export const productCapabilityTranslation = productCapabilityTables.translations
export const businessType = businessTypeTables.items
export const businessTypeTranslation = businessTypeTables.translations
export const faqItem = faqItemTables.items
export const faqItemTranslation = faqItemTables.translations
export const teamMember = teamMemberTables.items
export const teamMemberTranslation = teamMemberTables.translations

export type CollectionTables = ReturnType<typeof collectionTables>
