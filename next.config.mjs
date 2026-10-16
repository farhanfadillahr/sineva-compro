import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Folders under public/ whose files never change under the same URL. Immutable for a year means
// a replaced file must get a new name (for example `sino-v2.glb`), or returning visitors and
// social crawlers keep the old copy until the cache expires.
const immutableFolders = ['mascot', 'draco', 'lottie', 'og']

// No Content-Security-Policy here: a CSP that does not break the inline logo-intro gate script,
// the Lottie runtime and the 3D viewer needs its own pass.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Nothing embeds this site; revisit if a frame use case appears (and then prefer CSP
  // `frame-ancestors`).
  { key: 'X-Frame-Options', value: 'DENY' },
]

/** @type {import('next').NextConfig} */
const mediaOrigin = process.env.MEDIA_PUBLIC_ORIGIN
  ? new URL(process.env.MEDIA_PUBLIC_ORIGIN)
  : null
if (
  mediaOrigin &&
  (mediaOrigin.username ||
    mediaOrigin.password ||
    mediaOrigin.pathname !== '/' ||
    mediaOrigin.search ||
    mediaOrigin.hash ||
    !['https:', 'http:'].includes(mediaOrigin.protocol) ||
    (mediaOrigin.protocol !== 'https:' &&
      !['127.0.0.1', 'localhost'].includes(mediaOrigin.hostname)))
)
  throw new Error('Invalid MEDIA_PUBLIC_ORIGIN')

const nextConfig = {
  images: { remotePatterns: mediaOrigin ? [new URL('/api/media/public/**', mediaOrigin)] : [] },
  poweredByHeader: false,
  // Preserve the request origin for internal rewrites, including loopback IPs.
  skipProxyUrlNormalize: true,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      ...immutableFolders.map((folder) => ({
        source: `/${folder}/:path*`,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      })),
    ]
  },
}
export default withNextIntl(nextConfig)
