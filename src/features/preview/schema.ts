import { sql } from 'drizzle-orm'
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

/**
 * Unsaved editor state for a short-lived preview (CPR-88). Never read by the public site except
 * through an authorised preview request carrying the matching signed token.
 */
export const previewState = pgTable(
  'preview_state',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: text('kind').notNull(),
    target: text('target').notNull(),
    locale: text('locale').notNull(),
    data: jsonb('data').notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('preview_state_expires_idx').on(t.expiresAt),
    check('preview_state_kind_check', sql`${t.kind} IN ('page', 'service')`),
    check('preview_state_object', sql`jsonb_typeof(${t.data}) = 'object'`),
  ],
)
