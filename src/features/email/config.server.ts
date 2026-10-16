import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '../../lib/db/client.server'
import { decryptSecret, readEncryptionKey } from '../../lib/crypto/settings-secret'
import { DEFAULT_SETTINGS } from './defaults'
import { emailSettings } from './schema'

type Env = Readonly<Record<string, string | undefined>>

export type EmailConfig = Readonly<{
  mode: 'resend-api' | 'smtp'
  smtp: { host: string; port: number; security: 'starttls' | 'tls'; username: string } | null
  /** Plaintext secret, server memory only. */
  secret: string | null
  from: { name: string; email: string; replyTo: string | null }
  managedByEnvironment: boolean
}>

/** Which settings the environment manages. Environment values always win (production secrets). */
export function environmentEmail(env: Env = process.env) {
  if (env.RESEND_API_KEY)
    return { mode: 'resend-api' as const, secret: env.RESEND_API_KEY, smtp: null }
  if (env.SMTP_HOST && env.SMTP_PASSWORD)
    return {
      mode: 'smtp' as const,
      secret: env.SMTP_PASSWORD,
      smtp: {
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT ?? 587),
        security: (env.SMTP_SECURITY === 'tls' ? 'tls' : 'starttls') as 'starttls' | 'tls',
        username: env.SMTP_USERNAME ?? '',
      },
    }
  return null
}

/** The configuration the sender uses: environment first, then the database (decrypted here). */
export async function resolveEmailConfig(env: Env = process.env): Promise<EmailConfig> {
  const [row] = await db.select().from(emailSettings).where(eq(emailSettings.id, 'email'))
  const from = {
    name: row?.fromName ?? DEFAULT_SETTINGS.fromName,
    email: row?.fromEmail ?? DEFAULT_SETTINGS.fromEmail,
    replyTo: row?.replyTo ?? null,
  }
  const managed = environmentEmail(env)
  if (managed) return { ...managed, from, managedByEnvironment: true }
  const mode = (row?.mode as EmailConfig['mode']) ?? DEFAULT_SETTINGS.mode
  return {
    mode,
    smtp:
      mode === 'smtp' && row?.smtpHost && row.smtpPort
        ? {
            host: row.smtpHost,
            port: row.smtpPort,
            security: (row.smtpSecurity as 'starttls' | 'tls') ?? 'starttls',
            username: row.smtpUsername ?? '',
          }
        : null,
    // No key, no secret: a missing SETTINGS_ENCRYPTION_KEY throws instead of sending plaintext.
    secret: row?.secret ? decryptSecret(row.secret, readEncryptionKey(env)) : null,
    from,
    managedByEnvironment: false,
  }
}
