import 'server-only'
import { unstable_cache } from 'next/cache'

/**
 * Bump when a migration rewrites stored public content. Migrations change the database without an
 * admin save, so no tag is revalidated, and the data cache (which can outlive a deploy) would keep
 * serving the old rows. A new version gives every read a new key.
 *
 * 2: CPR-104 migration 0019 removed " | Sineva" from stored meta titles.
 */
export const CONTENT_CACHE_VERSION = 2

/**
 * Caches a public read with the tags from `src/lib/cache/tags.ts`. Invalidation after an admin
 * save uses the same tags (`revalidateContent`). Arguments are part of the cache key.
 */
export function cachedRead<A extends unknown[], R>(
  name: string,
  read: (...args: A) => Promise<R>,
  tags: (...args: A) => string[],
): (...args: A) => Promise<R> {
  const keyPrefix = `public-content-v${CONTENT_CACHE_VERSION}`
  return (...args: A) =>
    unstable_cache(() => read(...args), [keyPrefix, name, JSON.stringify(args)], {
      tags: tags(...args),
    })()
}
