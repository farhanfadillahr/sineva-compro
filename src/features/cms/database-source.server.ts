import 'server-only'
import { unstable_cache } from 'next/cache'
import { createStaticContentSource } from '../../content/static'
import type { PublicContentSource } from '../content/public'
import { settingsReads } from '../settings/public.server'

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

/**
 * The CMS database source. Each CMS feature contributes the reads it backs with tables; any read
 * not listed here stays on the static launch content, so the site keeps the same copy while the
 * CMS grows feature by feature. Add a feature's reads here, explicitly, when its tables ship.
 */
export function createDatabaseContentSource(): PublicContentSource {
  return { ...createStaticContentSource(), ...settingsReads }
}
