import 'server-only'
import type { EmailConfig } from './config.server'
import { emailDeliveryIsLive } from './delivery'

export type OutgoingEmail = Readonly<{
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string | null
}>
export type SendResult = Readonly<{ ok: boolean; provider: 'resend-api' | 'smtp'; detail: string }>
export type EmailTransport = (config: EmailConfig, email: OutgoingEmail) => Promise<SendResult>

const sanitizeDetail = (detail: string, secret: string | null) =>
  (secret ? detail.split(secret).join('[rahasia]') : detail).slice(0, 300)

const resend: EmailTransport = async (config, email) => {
  if (!config.secret)
    return { ok: false, provider: 'resend-api', detail: 'API key Resend belum diatur.' }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.secret}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: `${config.from.name} <${config.from.email}>`,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...((email.replyTo ?? config.from.replyTo)
        ? { reply_to: email.replyTo ?? config.from.replyTo }
        : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
  return {
    ok: response.ok,
    provider: 'resend-api',
    detail: sanitizeDetail(
      response.ok
        ? `Terkirim, id ${body.id ?? '-'}`
        : `HTTP ${response.status}: ${body.message ?? 'gagal'}`,
      config.secret,
    ),
  }
}

const smtp: EmailTransport = async (config, email) => {
  if (!config.smtp || !config.secret)
    return { ok: false, provider: 'smtp', detail: 'SMTP belum lengkap.' }
  const { createTransport } = await import('nodemailer')
  const transporter = createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.security === 'tls',
    requireTLS: config.smtp.security === 'starttls',
    auth: { user: config.smtp.username, pass: config.secret },
    connectionTimeout: 15_000,
  })
  try {
    const info = await transporter.sendMail({
      from: { name: config.from.name, address: config.from.email },
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.replyTo ?? config.from.replyTo ?? undefined,
    })
    return {
      ok: true,
      provider: 'smtp',
      detail: sanitizeDetail(`Terkirim: ${info.response ?? info.messageId}`, config.secret),
    }
  } catch (error) {
    return {
      ok: false,
      provider: 'smtp',
      detail: sanitizeDetail(
        error instanceof Error ? error.message : 'Gagal mengirim.',
        config.secret,
      ),
    }
  }
}

/**
 * Local development and CI never send real email: unless `EMAIL_DELIVERY=live` (preview and
 * production set it), messages go to an in-memory outbox and a one-line log without content.
 */
export const mockOutbox: {
  to: string
  subject: string
  text: string
  html: string
  replyTo: string | null
}[] = []
const mock: EmailTransport = async (config, email) => {
  mockOutbox.push({
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    replyTo: email.replyTo ?? config.from.replyTo,
  })
  if (mockOutbox.length > 100) mockOutbox.shift()
  console.info(`[email:mock] ${config.mode} message queued (${mockOutbox.length} in outbox).`)
  return {
    ok: true,
    provider: config.mode,
    detail: 'Mode uji: email tidak benar-benar dikirim (EMAIL_DELIVERY bukan live).',
  }
}

let override: EmailTransport | null = null
/** Tests replace the provider with a mock; production never calls this. */
export function setEmailTransportForTests(transport: EmailTransport | null) {
  override = transport
}

export function sendEmail(config: EmailConfig, email: OutgoingEmail): Promise<SendResult> {
  if (override) return override(config, email)
  if (!emailDeliveryIsLive()) return mock(config, email)
  return config.mode === 'smtp' ? smtp(config, email) : resend(config, email)
}
