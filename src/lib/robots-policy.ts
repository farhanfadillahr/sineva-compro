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
