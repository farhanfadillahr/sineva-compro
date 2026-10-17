import { sql } from 'drizzle-orm'
import { boolean, check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'] as const

/** Outcome of one lead email (CPR-112). `detail` is the provider's answer, never a secret. */
export type LeadEmailResult = {
  status: 'sent' | 'failed' | 'mock' | 'skipped'
  at: string
  detail: string
}
export type LeadEmailStatus = { notification: LeadEmailResult; autoReply: LeadEmailResult }

/**
 * Leads from the contact form (CPR-78; managed in the admin by CPR-46). `status` and `notes` are
 * set by the server or by staff, never by public input. Interest is a validated string key from
 * code, not a database enum, because service names may still change (Q10).
 */
export const lead = pgTable(
  'lead',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    company: text('company'),
    segment: text('segment').notNull(),
    interest: text('interest').notNull(),
    budget: text('budget'),
    message: text('message').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    locale: text('locale').notNull(),
    sourcePage: text('source_page').notNull(),
    status: text('status').default('new').notNull(),
    notes: text('notes').default('').notNull(),
    isDemo: boolean('is_demo').default(false).notNull(),
    /** Null until the email step has run (and for leads stored before CPR-112). */
    emailStatus: jsonb('email_status').$type<LeadEmailStatus>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (t) => [
    index('lead_created_idx').on(t.createdAt.desc(), t.id.desc()),
    index('lead_status_idx').on(t.status, t.createdAt.desc()),
    check('lead_status_check', sql`${t.status} IN ('new','contacted','qualified','won','lost')`),
    check('lead_phone_check', sql`${t.phone} ~ '^[1-9][0-9]{7,14}$'`),
    check(
      'lead_lengths',
      sql`length(${t.name}) <= 80 AND length(${t.email}) <= 254 AND length(${t.message}) <= 1000 AND length(${t.notes}) <= 5000`,
    ),
  ],
)
