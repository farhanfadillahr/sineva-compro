type Env = Readonly<Record<string, string | undefined>>

/**
 * Whether crawlers may index this deployment.
 *
 * Both conditions are required: the deployment must be production (or not on Vercel at all, for a
 * self-hosted build) and the launch flag `SITE_INDEXABLE` must be the literal string "true".
 * Either one alone is not enough: a preview with the flag copied over must stay hidden, and a
 * production deployment before launch must stay hidden. Any other flag value is "off", so a
 * mistyped value fails closed.
 */
export function isIndexable(env: Env = process.env): boolean {
  const vercelEnv = env.VERCEL_ENV?.trim()
  const productionLike = !vercelEnv || vercelEnv === 'production'
  return productionLike && env.SITE_INDEXABLE === 'true'
}

export function getRobots(env: Env = process.env): { index: boolean; follow: boolean } {
  const indexable = isIndexable(env)
  return { index: indexable, follow: indexable }
}

/**
 * Body of `robots.txt`, from the same decision as the `robots` meta tag so the two never
 * disagree.
 *
 * Not indexable: everything is disallowed and no sitemap is advertised. Gotcha: `Disallow: /`
 * stops crawlers from fetching a page, so they never see its `noindex` tag. That is fine while
 * nothing links to the site; a URL that does get linked can still show up in results as a bare
 * address. Removing an already indexed URL needs the opposite (crawlable plus `noindex`).
 *
 * Indexable: the site is open, the admin and the API stay out. Both are also answered with 404
 * by the proxy while the admin is off, so this is a second layer, not the protection.
 */
export function buildRobotsRules({ indexable, siteUrl }: { indexable: boolean; siteUrl: URL }): {
  rules: { userAgent: string; allow?: string; disallow: string | string[] }
  sitemap?: string
} {
  if (!indexable) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: new URL('/sitemap.xml', siteUrl).href,
  }
}
