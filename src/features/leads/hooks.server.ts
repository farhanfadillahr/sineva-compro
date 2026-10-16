import 'server-only'
import { createHmac } from 'node:crypto'
import { and, count, eq, gt, lt } from 'drizzle-orm'
import { db } from '../../lib/db/client.server'
import { readServerEnv } from '../../env/server'
import { getClientIp } from '../../lib/http/client-ip'
import { intakeAttempt } from './attempt-schema'
import { turnstileSecret, verifyWithCloudflare, type TurnstileVerifier } from './turnstile'

/**
 * Extension points of the public intake. Anti-spam (CPR-49) decides before anything is stored;
 * the email step (CPR-50) runs after the lead is committed and never fails the submission.
 *
 * Anti-spam, in order:
 * 1. Honeypot: a hidden `website` field humans never fill. Filled means a bot: the submission is
 *    dropped silently and the visitor still sees success.
 * 2. Rate limit: at most 5 submissions per client per 10 minutes (keyed hash of the trusted client
 *    IP). Without a trusted IP (direct mode, no proxy), one shared bucket allows 30 per 10 minutes.
 * 3. Turnstile: the widget token is verified on the server.
 */
export type SpamVerdict = { ok: true } | { ok: false; reason: 'honeypot' | 'captcha' | 'rate' }
export type IntakeContext = Readonly<{
  kind: 'contact' | 'waitlist'
  input: Readonly<Record<string, unknown>>
  headers: Headers
}>

export const RATE_WINDOW_MS = 10 * 60 * 1000
export const RATE_LIMIT_PER_CLIENT = 5
export const RATE_LIMIT_UNKNOWN_CLIENT = 30

let verifier: TurnstileVerifier = verifyWithCloudflare
/** Tests replace Cloudflare with a stub; production never calls this. */
export function setTurnstileVerifierForTests(next: TurnstileVerifier | null) {
  verifier = next ?? verifyWithCloudflare
}

export async function checkSpam(context: IntakeContext): Promise<SpamVerdict> {
  const honeypot = context.input.website
  if (typeof honeypot === 'string' && honeypot.trim() !== '')
    return { ok: false, reason: 'honeypot' }

  const env = readServerEnv(process.env)
  const ip = getClientIp(context.headers, env.clientIp)
  const clientHash = createHmac('sha256', env.authSecret)
    .update(`intake:${ip ?? 'unknown'}`)
    .digest('base64url')
  const limit = ip ? RATE_LIMIT_PER_CLIENT : RATE_LIMIT_UNKNOWN_CLIENT
  const since = new Date(Date.now() - RATE_WINDOW_MS)
  await db
    .delete(intakeAttempt)
    .where(lt(intakeAttempt.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(intakeAttempt)
    .where(and(eq(intakeAttempt.clientHash, clientHash), gt(intakeAttempt.createdAt, since)))
  if (recent >= limit) return { ok: false, reason: 'rate' }
  await db.insert(intakeAttempt).values({ kind: context.kind, clientHash })

  const secret = turnstileSecret()
  const token = context.input.turnstileToken
  if (!secret || typeof token !== 'string' || !token || token.length > 2048)
    return { ok: false, reason: 'captcha' }
  if (!(await verifier(token, secret, ip))) return { ok: false, reason: 'captcha' }
  return { ok: true }
}

export async function afterLeadCreated(id: string): Promise<void> {
  void id
}
