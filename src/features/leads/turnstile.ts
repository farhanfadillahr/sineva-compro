/**
 * Cloudflare Turnstile verification (CPR-49). Local development and tests use Cloudflare's
 * official test keys; production must set its own secret or every submission is refused.
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_TEST_SECRET_PASS = '1x0000000000000000000000000000000AA'
export const TURNSTILE_TEST_SECRET_FAIL = '2x0000000000000000000000000000000AA'
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'

export function turnstileSecret(env: Readonly<Record<string, string | undefined>> = process.env) {
  if (env.TURNSTILE_SECRET_KEY) return env.TURNSTILE_SECRET_KEY
  return env.NODE_ENV === 'production' ? null : TURNSTILE_TEST_SECRET_PASS
}

export type TurnstileVerifier = (
  token: string,
  secret: string,
  ip: string | null,
) => Promise<boolean>

export const verifyWithCloudflare: TurnstileVerifier = async (token, secret, ip) => {
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(10_000),
    })
    const result = (await response.json()) as { success?: boolean }
    return response.ok && result.success === true
  } catch {
    // An unreachable verifier is a failed verification, never a pass.
    return false
  }
}
