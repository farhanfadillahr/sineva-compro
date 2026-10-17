import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'
export const media = pgTable(
  'media',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    environment: text('environment').notNull(),
    filename: text('filename').notNull(),
    kind: text('kind').notNull(),
    contentType: text('content_type').notNull(),
    extension: text('extension').notNull(),
    size: integer('size').notNull(),
    privateKey: text('private_key').notNull(),
    hash: text('content_hash').notNull(),
    width: integer('width'),
    height: integer('height'),
    dominantColor: text('dominant_color'),
    focalX: doublePrecision('focal_x').default(0.5).notNull(),
    focalY: doublePrecision('focal_y').default(0.5).notNull(),
    credit: text('credit').default('').notNull(),
    publicAssetId: uuid('public_asset_id').references((): AnyPgColumn => mediaDelivery.id),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    cleanupPending: boolean('cleanup_pending').default(false).notNull(),
    isDemo: boolean('is_demo').default(false).notNull(),
  },
  (t) => [
    index('media_environment_created_idx').on(t.environment, t.createdAt.desc(), t.id.desc()),
    index('media_kind_idx').on(t.environment, t.kind),
    index('media_creator_idx').on(t.createdBy),
    index('media_public_asset_idx').on(t.publicAssetId),
    uniqueIndex('media_private_key_unique').on(t.privateKey),
    check('media_size_check', sql`${t.size} > 0 AND ${t.size} <= 20971520`),
    check('media_kind_check', sql`${t.kind} IN ('image','video','document')`),
    check('media_hash_check', sql`${t.hash} ~ '^[a-f0-9]{64}$'`),
    check('media_focal_check', sql`${t.focalX} BETWEEN 0 AND 1 AND ${t.focalY} BETWEEN 0 AND 1`),
    check(
      'media_dimensions_check',
      sql`(${t.kind} = 'image' AND ${t.width} IS NOT NULL AND ${t.height} IS NOT NULL AND ${t.width} BETWEEN 1 AND 6000 AND ${t.height} BETWEEN 1 AND 6000) OR (${t.kind} <> 'image' AND ${t.width} IS NULL AND ${t.height} IS NULL)`,
    ),
    check('media_credit_check', sql`length(${t.credit}) <= 160`),
  ],
)
export const mediaTranslation = pgTable(
  'media_translation',
  {
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    alt: text('alt').default('').notNull(),
    caption: text('caption').default('').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.mediaId, t.locale] }),
    check(
      'media_translation_lengths',
      sql`length(${t.alt}) <= 200 AND length(${t.caption}) <= 1000`,
    ),
    check('media_locale_check', sql`${t.locale} ~ '^[a-z]{2}(-[A-Z]{2})?$'`),
  ],
)
export const mediaUsage = pgTable(
  'media_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    field: text('field').notNull(),
    label: text('label').notNull(),
    published: boolean('published').default(false).notNull(),
  },
  (t) => [
    uniqueIndex('media_usage_owner_field_unique').on(t.entity, t.entityId, t.field),
    index('media_usage_media_idx').on(t.mediaId),
    check(
      'media_usage_owner_check',
      sql`${t.entity} IN ('pages','services','posts','portfolio','team','settings','product')`,
    ),
    check('media_usage_label_check', sql`length(${t.label}) BETWEEN 1 AND 160`),
  ],
)
export const mediaDelivery = pgTable(
  'media_delivery',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mediaId: uuid('media_id')
      .notNull()
      .references((): AnyPgColumn => media.id, { onDelete: 'restrict' }),
    hash: text('content_hash').notNull(),
    key: text('object_key').notNull(),
    contentType: text('content_type').notNull(),
    extension: text('extension').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('media_delivery_hash_unique').on(t.mediaId, t.hash),
    uniqueIndex('media_delivery_key_unique').on(t.key),
  ],
)
