import 'server-only'
import { and, eq } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import { encryptSecret, readEncryptionKey, SecretKeyError } from '../../lib/crypto/settings-secret'
import { writeAudit } from '../audit/service.server'
import { user } from '../auth/schema'
import { CmsError } from '../cms/errors'
import { isEmail } from '../cms/fields'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { environmentEmail, resolveEmailConfig } from './config.server'
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from './defaults'
import {
  EMAIL_TEMPLATE_KEYS,
  renderHtml,
  renderSubject,
  renderText,
  unknownPlaceholders,
  type EmailTemplateKey,
} from './render'
import { emailSettings, emailTemplate } from './schema'
import { sendEmail } from './transport.server'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export type EmailSettingsView = {
  mode: 'resend-api' | 'smtp'
  smtpHost: string
  smtpPort: number
  smtpSecurity: 'starttls' | 'tls'
  smtpUsername: string
  fromName: string
  fromEmail: string
  replyTo: string
  /** Only whether a secret is stored; the value never leaves the server. */
  hasSecret: boolean
  managedByEnvironment: false | 'resend-api' | 'smtp'
  templates: Record<string, Record<EmailTemplateKey, { subject: string; body: string }>>
}

export async function loadEmailSettings(headers: Headers): Promise<EmailSettingsView> {
  await cmsReader(headers, 'users:manage')
  const [row] = await db.select().from(emailSettings).where(eq(emailSettings.id, 'email'))
  const templates = await db.select().from(emailTemplate)
  const managed = environmentEmail()
  return {
    mode: (row?.mode as EmailSettingsView['mode']) ?? DEFAULT_SETTINGS.mode,
    smtpHost: row?.smtpHost ?? '',
    smtpPort: row?.smtpPort ?? 587,
    smtpSecurity: (row?.smtpSecurity as EmailSettingsView['smtpSecurity']) ?? 'starttls',
    smtpUsername: row?.smtpUsername ?? '',
    fromName: row?.fromName ?? DEFAULT_SETTINGS.fromName,
    fromEmail: row?.fromEmail ?? DEFAULT_SETTINGS.fromEmail,
    replyTo: row?.replyTo ?? '',
    hasSecret: !!row?.secret,
    managedByEnvironment: managed ? managed.mode : false,
    templates: Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        Object.fromEntries(
          EMAIL_TEMPLATE_KEYS.map((key) => {
            const stored = templates.find((t) => t.key === key && t.locale === locale)
            return [
              key,
              stored ? { subject: stored.subject, body: stored.body } : DEFAULT_TEMPLATES[key],
            ]
          }),
        ) as Record<EmailTemplateKey, { subject: string; body: string }>,
      ]),
    ),
  }
}

function parseSettings(input: unknown) {
  const data = isRecord(input) ? input : {}
  const errors: Record<string, string> = {}
  const text = (key: string, max: number) => {
    const value = typeof data[key] === 'string' ? (data[key] as string).trim() : ''
    if (value.length > max || /[\r\n\u0000-\u001f]/.test(value))
      errors[key] = `Maksimal ${max} karakter, satu baris.`
    return value
  }
  const mode = data.mode === 'smtp' ? 'smtp' : data.mode === 'resend-api' ? 'resend-api' : null
  if (!mode) errors.mode = 'Pilih Resend API atau SMTP.'
  const smtpHost = text('smtpHost', 253)
  const smtpUsername = text('smtpUsername', 254)
  const smtpPort = Number(data.smtpPort)
  const smtpSecurity = data.smtpSecurity === 'tls' ? 'tls' : 'starttls'
  if (mode === 'smtp') {
    if (!/^[a-z0-9.-]+$/i.test(smtpHost)) errors.smtpHost = 'Masukkan host SMTP yang valid.'
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535)
      errors.smtpPort = 'Port 1 sampai 65535.'
  }
  const fromName = text('fromName', 80)
  if (!fromName) errors.fromName = 'Nama pengirim wajib diisi.'
  const fromEmail = text('fromEmail', 254).toLowerCase()
  if (!isEmail(fromEmail)) errors.fromEmail = 'Masukkan email pengirim yang valid.'
  const replyTo = text('replyTo', 254).toLowerCase()
  if (replyTo && !isEmail(replyTo)) errors.replyTo = 'Masukkan email balasan yang valid.'
  const secret = typeof data.secret === 'string' ? data.secret : ''
  if (secret.length > 512) errors.secret = 'Rahasia terlalu panjang.'
  const templates: { key: EmailTemplateKey; locale: string; subject: string; body: string }[] = []
  const submitted = isRecord(data.templates) ? data.templates : {}
  for (const locale of routing.locales) {
    const perLocale = isRecord(submitted[locale])
      ? (submitted[locale] as Record<string, unknown>)
      : {}
    for (const key of EMAIL_TEMPLATE_KEYS) {
      const value = isRecord(perLocale[key]) ? (perLocale[key] as Record<string, unknown>) : null
      if (!value) continue
      const subject = typeof value.subject === 'string' ? value.subject.trim() : ''
      const body = typeof value.body === 'string' ? value.body.replace(/\r\n/g, '\n').trim() : ''
      const path = `templates.${locale}.${key}`
      if (!subject || subject.length > 200 || /[\r\n]/.test(subject))
        errors[`${path}.subject`] = 'Subjek 1 sampai 200 karakter, satu baris.'
      if (!body || body.length > 5000) errors[`${path}.body`] = 'Isi 1 sampai 5000 karakter.'
      const unknown = unknownPlaceholders(`${subject} ${body}`, key)
      if (unknown.length)
        errors[`${path}.body`] =
          `Placeholder tidak dikenal: ${unknown.map((n) => `{${n}}`).join(', ')}.`
      templates.push({ key, locale, subject, body })
    }
  }
  if (Object.keys(errors).length)
    throw new CmsError('INVALID', 'Periksa kembali pengaturan email.', errors)
  return {
    settings: {
      mode: mode!,
      smtpHost: mode === 'smtp' ? smtpHost : null,
      smtpPort: mode === 'smtp' ? smtpPort : null,
      smtpSecurity: mode === 'smtp' ? smtpSecurity : null,
      smtpUsername: mode === 'smtp' ? smtpUsername || null : null,
      fromName,
      fromEmail,
      replyTo: replyTo || null,
    },
    secret,
    clearSecret: data.clearSecret === true,
    templates,
  }
}

/** Admin only. A new secret is encrypted before it touches the database; audit records names only. */
export async function saveEmailSettings(headers: Headers, input: unknown) {
  const parsed = parseSettings(input)
  let encrypted: string | null = null
  if (parsed.secret) {
    try {
      encrypted = encryptSecret(parsed.secret, readEncryptionKey())
    } catch (error) {
      if (error instanceof SecretKeyError)
        throw new CmsError(
          'INVALID',
          'SETTINGS_ENCRYPTION_KEY belum diatur. Rahasia tidak disimpan.',
          {
            secret: 'Kunci enkripsi server belum diatur.',
          },
        )
      throw error
    }
  }
  await cmsMutation({
    headers,
    capability: 'users:manage',
    adminOnly: true,
    run: async (tx, actor) => {
      const [before] = await tx
        .select()
        .from(emailSettings)
        .where(eq(emailSettings.id, 'email'))
        .for('update')
      const secret = encrypted ?? (parsed.clearSecret ? null : (before?.secret ?? null))
      const values = { ...parsed.settings, secret, updatedBy: actor.id, updatedAt: new Date() }
      await tx
        .insert(emailSettings)
        .values({ id: 'email', ...values })
        .onConflictDoUpdate({ target: emailSettings.id, set: values })
      const changed: string[] = []
      const fields: [keyof typeof parsed.settings, string][] = [
        ['mode', 'mode'],
        ['smtpHost', 'smtpHost'],
        ['smtpPort', 'smtpPort'],
        ['smtpSecurity', 'smtpSecurity'],
        ['smtpUsername', 'smtpUsername'],
        ['fromName', 'fromName'],
        ['fromEmail', 'fromEmail'],
        ['replyTo', 'replyTo'],
      ]
      for (const [key, name] of fields)
        if (!before || before[key] !== parsed.settings[key]) changed.push(name)
      if (encrypted || (parsed.clearSecret && before?.secret))
        changed.push(parsed.settings.mode === 'smtp' ? 'smtpPassword' : 'apiKey')
      const stored = await tx.select().from(emailTemplate)
      let templatesChanged = false
      for (const t of parsed.templates) {
        const old = stored.find((s) => s.key === t.key && s.locale === t.locale)
        if (old && old.subject === t.subject && old.body === t.body) continue
        templatesChanged = true
        await tx
          .insert(emailTemplate)
          .values({ ...t, updatedBy: actor.id, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: [emailTemplate.key, emailTemplate.locale],
            set: { subject: t.subject, body: t.body, updatedBy: actor.id, updatedAt: new Date() },
          })
      }
      if (templatesChanged) changed.push('templates')
      if (changed.length)
        await writeAudit(tx, actor, {
          entity: 'email_settings',
          entityId: 'email',
          action: before ? 'update' : 'create',
          changedFields: changed,
        })
    },
  })
}

/** Renders a stored template (or its default) for sending (CPR-50). */
export async function renderTemplate(
  key: EmailTemplateKey,
  locale: string,
  values: Readonly<Record<string, string>>,
  brand: { siteName: string },
) {
  const [stored] = await db
    .select()
    .from(emailTemplate)
    .where(and(eq(emailTemplate.key, key), eq(emailTemplate.locale, locale)))
  const template = stored ?? DEFAULT_TEMPLATES[key]
  return {
    subject: renderSubject(template.subject, values),
    html: renderHtml(template.body, values, brand),
    text: renderText(template.body, values),
  }
}

/** Sends a test email to the signed-in Admin and returns the provider response, never secrets. */
export async function sendTestEmail(headers: Headers) {
  const actor = await cmsReader(headers, 'users:manage')
  const [me] = await db.select({ email: user.email }).from(user).where(eq(user.id, actor.id))
  let config
  try {
    config = await resolveEmailConfig()
  } catch (error) {
    if (error instanceof SecretKeyError)
      return { ok: false, provider: 'unknown', detail: 'SETTINGS_ENCRYPTION_KEY belum diatur.' }
    throw error
  }
  const body = 'This is a test email from the Sineva admin. If you can read it, delivery works.'
  return sendEmail(config, {
    to: me.email,
    subject: 'Sineva test email',
    html: renderHtml(body, {}, { siteName: config.from.name }),
    text: body,
  })
}
