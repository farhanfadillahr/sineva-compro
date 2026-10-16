import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/** Product waitlist (CPR-48). One row per normalised email. */
export const waitlist = pgTable(
  'waitlist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    segment: text('segment'),
    locale: text('locale').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    isDemo: boolean('is_demo').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('waitlist_email_unique').on(t.email),
    index('waitlist_created_idx').on(t.createdAt.desc(), t.id.desc()),
    check(
      'waitlist_email_normalised',
      sql`${t.email} = lower(btrim(${t.email})) AND length(${t.email}) <= 254`,
    ),
    check(
      'waitlist_segment_check',
      sql`${t.segment} IS NULL OR ${t.segment} IN ('Small business','Company','Startup','Other')`,
    ),
  ],
)
