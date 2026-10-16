import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

/**
 * Public path redirects. Created automatically when a published slug changes, or by an Admin.
 * Resolved by the proxy for public paths only (never `/admin` or `/api`).
 */
export const redirect = pgTable(
  'redirect',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fromPath: text('from_path').notNull(),
    toPath: text('to_path').notNull(),
    status: integer('status').default(301).notNull(),
    source: text('source').default('manual').notNull(),
    isDemo: boolean('is_demo').default(false).notNull(),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('redirect_from_path_unique').on(t.fromPath),
    check('redirect_status_check', sql`${t.status} IN (301, 308)`),
    check('redirect_source_check', sql`${t.source} IN ('manual', 'auto')`),
    check(
      'redirect_paths_check',
      sql`${t.fromPath} ~ '^/[^/]' AND ${t.toPath} ~ '^/' AND ${t.fromPath} <> ${t.toPath} AND length(${t.fromPath}) <= 300 AND length(${t.toPath}) <= 300`,
    ),
  ],
)
