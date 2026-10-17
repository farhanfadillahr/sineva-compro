import { routing } from '../../src/i18n/routing'
import { PAGE_KEYS } from '../../src/features/content/types'
import { currentPageVersion } from '../../src/features/pages/migrations'
import { pageContent } from '../../src/features/pages/schema'
import { launchPage } from '../../src/features/pages/launch'
import type { SeedModule } from './types'

/**
 * Base: every page's launch copy for each locale that has one, inserted only when missing so an
 * edited page is never overwritten. Pages are fixed documents, not a collection, so there are no
 * demo rows to add or purge.
 */
export const pagesSeed: SeedModule = {
  key: 'pages',
  async base(tx) {
    for (const locale of routing.locales)
      for (const key of PAGE_KEYS) {
        const data = launchPage(key, locale)
        if (!data) continue
        await tx
          .insert(pageContent)
          .values({ pageKey: key, locale, version: currentPageVersion(key), data })
          .onConflictDoNothing()
      }
  },
  async demo() {},
  async purgeDemo() {},
}
