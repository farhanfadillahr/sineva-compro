import 'server-only'
import { unstable_cache } from 'next/cache'

/**
 * Caches a public read with the tags from `src/lib/cache/tags.ts`. Invalidation after an admin
 * save uses the same tags (`revalidateContent`). Arguments are part of the cache key.
 */
export function cachedRead<A extends unknown[], R>(
  name: string,
  read: (...args: A) => Promise<R>,
  tags: (...args: A) => string[],
): (...args: A) => Promise<R> {
  return (...args: A) =>
    unstable_cache(() => read(...args), ['public-content', name, JSON.stringify(args)], {
      tags: tags(...args),
    })()
}
