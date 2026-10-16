type Env = Readonly<Record<string, string | undefined>>

const LOCAL_FALLBACK = 'http://127.0.0.1:3000'

function filled(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

// Vercel exposes these two as a bare host name (`my-site.vercel.app`), without the scheme.
// Deployments are always served over HTTPS, so the scheme is added here.
function originFromHost(host: string | undefined): URL | undefined {
  const value = filled(host)
  if (!value) return undefined
  try {
    return new URL(`https://${value}`)
  } catch {
    return undefined
  }
}

function parseSiteUrl(value: string): URL {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('SITE_URL must be an absolute http(s) origin such as https://example.com')
  }
  // A path, query or credentials would silently change what every canonical and Open Graph URL
  // resolves to, so they are rejected rather than trimmed.
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('SITE_URL must be an http(s) origin without credentials, path or query')
  }
  return new URL(url.origin)
}

/**
 * The public origin of the site, used as `metadataBase` so canonical, Open Graph and JSON-LD
 * URLs become absolute.
 *
 * Order: an explicit `SITE_URL`, then the production domain on a Vercel production deployment,
 * then the deployment URL (preview), then loopback for local work. A malformed `SITE_URL` throws
 * instead of falling through: a typo that quietly produced `*.vercel.app` canonicals on the
 * production site would be far harder to notice than a failed build.
 *
 * Preview deployments deliberately do not use the production domain even though Vercel sets
 * `VERCEL_PROJECT_PRODUCTION_URL` there too: previews are noindex, and their share links and
 * canonicals should point back at the preview that was reviewed.
 */
export function getSiteUrl(env: Env = process.env): URL {
  const explicit = filled(env.SITE_URL)
  if (explicit) return parseSiteUrl(explicit)

  if (filled(env.VERCEL_ENV) === 'production') {
    const production = originFromHost(env.VERCEL_PROJECT_PRODUCTION_URL)
    if (production) return production
  }
  return originFromHost(env.VERCEL_URL) ?? new URL(LOCAL_FALLBACK)
}
