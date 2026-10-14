import { sql } from 'drizzle-orm'
import { check, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './schema'
export const authLockout = pgTable(
  'auth_lockout',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
  },
  (table) => [check('auth_lockout_attempts_range', sql`${table.failedAttempts} between 0 and 5`)],
)
