import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Public form submissions per client, for the rate limit (CPR-49). The IP is never stored: only a
 * keyed hash, and rows older than a day are deleted on the next submission.
 */
export const intakeAttempt = pgTable(
  'intake_attempt',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: text('kind').notNull(),
    clientHash: text('client_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('intake_attempt_client_idx').on(t.clientHash, t.createdAt.desc()),
    check('intake_attempt_kind', sql`${t.kind} IN ('contact', 'waitlist')`),
  ],
)
