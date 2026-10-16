import { sql } from 'drizzle-orm'
import { check, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

/**
 * Email delivery settings (singleton, CPR-86). `secret` holds the SMTP password or the Resend API
 * key encrypted with AES-256-GCM (`src/lib/crypto/settings-secret.ts`); it is never returned to
 * the client. Environment variables override these values when set.
 */
export const emailSettings = pgTable(
  'email_settings',
  {
    id: text('id').primaryKey().default('email'),
    mode: text('mode').notNull(),
    smtpHost: text('smtp_host'),
    smtpPort: integer('smtp_port'),
    smtpSecurity: text('smtp_security'),
    smtpUsername: text('smtp_username'),
    secret: text('secret'),
    fromName: text('from_name').notNull(),
    fromEmail: text('from_email').notNull(),
    replyTo: text('reply_to'),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check('email_settings_singleton', sql`${t.id} = 'email'`),
    check('email_settings_mode', sql`${t.mode} IN ('resend-api', 'smtp')`),
    check(
      'email_settings_security',
      sql`${t.smtpSecurity} IS NULL OR ${t.smtpSecurity} IN ('starttls', 'tls')`,
    ),
    check('email_settings_port', sql`${t.smtpPort} IS NULL OR ${t.smtpPort} BETWEEN 1 AND 65535`),
    check('email_settings_secret_format', sql`${t.secret} IS NULL OR ${t.secret} LIKE 'v1:%'`),
  ],
)

/** Subject and body per template and locale, with placeholders; the layout lives in code. */
export const emailTemplate = pgTable(
  'email_template',
  {
    key: text('key').notNull(),
    locale: text('locale').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.key, t.locale] }),
    check(
      'email_template_key',
      sql`${t.key} IN ('lead-notification', 'lead-auto-reply', 'waitlist-confirmation')`,
    ),
    check('email_template_lengths', sql`length(${t.subject}) <= 200 AND length(${t.body}) <= 5000`),
  ],
)
