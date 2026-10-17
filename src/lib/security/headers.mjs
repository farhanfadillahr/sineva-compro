// Security headers for every response (CPR-53). Plain ESM so next.config.mjs can import it.
//
// Why no nonce: nonces force dynamic rendering for every page, which the static launch and its
// SEO goal (FR-SEO-05) avoid. The policy therefore allows inline scripts ('unsafe-inline', needed
// by Next's bootstrap and the logo-intro gate) but never 'unsafe-eval'. 'wasm-unsafe-eval' is for
// the self-hosted draco decoder of the 3D mascot; DRACOLoader starts its workers from blob: URLs.

/** @param {string | undefined} value */
function origin(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null
  } catch {
    return null
  }
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {string}
 */
export function buildContentSecurityPolicy(env) {
  const media = origin(env.MEDIA_PUBLIC_ORIGIN)
  // Admin previews of private media are redirects to presigned storage URLs.
  const storage = origin(env.STORAGE_ENDPOINT)
  const blob = origin(env.MEDIA_BLOB_ORIGIN)
  const umami = origin(env.UMAMI_HOST)
  const sentry = origin(env.SENTRY_INGEST_ORIGIN)
  const turnstile = 'https://challenges.cloudflare.com'
  const googleTagManager = 'https://www.googletagmanager.com'
  const googleAnalytics = 'https://*.google-analytics.com'
  const google = 'https://*.google.com'
  const list = (/** @type {(string | null)[]} */ ...items) => items.filter(Boolean).join(' ')
  const directives = {
    'default-src': "'self'",
    'script-src': list(
      "'self'",
      "'unsafe-inline'",
      "'wasm-unsafe-eval'",
      turnstile,
      umami,
      googleTagManager,
    ),
    'style-src': "'self' 'unsafe-inline'",
    'img-src': list(
      "'self'",
      'data:',
      'blob:',
      media,
      storage,
      blob,
      googleTagManager,
      googleAnalytics,
    ),
    'media-src': list("'self'", 'blob:', media, storage, blob),
    'font-src': "'self'",
    'connect-src': list(
      "'self'",
      media,
      umami,
      sentry,
      turnstile,
      googleTagManager,
      googleAnalytics,
      google,
    ),
    'worker-src': "'self' blob:",
    'frame-src': list(turnstile, googleTagManager),
    'frame-ancestors': "'none'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'manifest-src': "'self'",
    'report-uri': '/api/csp-report',
  }
  const policy = Object.entries(directives).map(([key, value]) => `${key} ${value}`)
  if (env.NODE_ENV === 'production') policy.push('upgrade-insecure-requests')
  return policy.join('; ')
}

/**
 * `CSP_MODE=enforce` sends the enforcing header; anything else (default) sends report-only, so a
 * preview can collect violations before the policy is enforced. `off` sends none.
 * @param {Record<string, string | undefined>} env
 */
export function securityHeaders(env) {
  const headers = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
    // Nothing embeds this site; CSP frame-ancestors says the same for modern browsers.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ]
  if (env.NODE_ENV === 'production')
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    })
  const mode = env.CSP_MODE ?? 'report-only'
  if (mode !== 'off')
    headers.push({
      key: mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
      value: buildContentSecurityPolicy(env),
    })
  return headers
}
