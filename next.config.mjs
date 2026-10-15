import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Preserve the request origin for internal rewrites, including loopback IPs.
  skipProxyUrlNormalize: true,
}
export default withNextIntl(nextConfig)
