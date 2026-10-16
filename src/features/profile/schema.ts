import { sql } from 'drizzle-orm'
import { boolean, check, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

/** Per-user admin preferences (CPR-90): table density and the sidebar default. */
export const userPreference = pgTable(
  'user_preference',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    density: text('density').default('comfortable').notNull(),
    sidebarCollapsed: boolean('sidebar_collapsed').default(false).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [check('user_preference_density', sql`${t.density} IN ('comfortable', 'compact')`)],
)
