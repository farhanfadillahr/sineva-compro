import { and, eq, isNull } from 'drizzle-orm'
import { isDeepStrictEqual } from 'node:util'
import { routing } from '../../src/i18n/routing'
import { PAGE_KEYS } from '../../src/features/content/types'
import { currentPageVersion } from '../../src/features/pages/migrations'
import { pageContent } from '../../src/features/pages/schema'
import { launchPage } from '../../src/features/pages/launch'
import type { SeedModule } from './types'

/**
 * Base: every page's launch copy for each locale that has one, inserted when missing. A page that
 * no person has saved yet (`updated_by` is null) follows the launch copy, so a correction to it,
 * such as the privacy policy and contact consent of CPR-17, reaches databases seeded before. A page
 * saved from the admin is never overwritten. Pages are fixed documents, not a collection, so there
 * are no demo rows to add or purge.
 */
export const pagesSeed: SeedModule = {
  key: 'pages',
  async base(tx) {
    for (const locale of routing.locales)
      for (const key of PAGE_KEYS) {
        const data = launchPage(key, locale)
        if (!data) continue
        const version = currentPageVersion(key)
        const [inserted] = await tx
          .insert(pageContent)
          .values({ pageKey: key, locale, version, data })
          .onConflictDoNothing()
          .returning({ pageKey: pageContent.pageKey })
        if (inserted) continue
        const where = and(
          eq(pageContent.pageKey, key),
          eq(pageContent.locale, locale),
          isNull(pageContent.updatedBy),
        )
        const [untouched] = await tx
          .select({ data: pageContent.data })
          .from(pageContent)
          .where(where)
        if (!untouched || isDeepStrictEqual(untouched.data, data)) continue
        await tx.update(pageContent).set({ data, version, updatedAt: new Date() }).where(where)
        console.log(`Seed pages: halaman ${key} (${locale}) diperbarui ke salinan peluncuran.`)
      }
  },
  async demo() {},
  async purgeDemo() {},
}
