import { routing } from '../../src/i18n/routing'
import { staticContent } from '../../src/content/static/source'
import { settingsFromDto } from '../../src/features/settings/project'
import { siteSettings, siteSettingsTranslation } from '../../src/features/settings/schema'
import type { SeedModule } from './types'

/**
 * Base: the launch values from the static content, inserted only when missing so an edited
 * setting is never overwritten. Settings are a singleton, so there are no demo rows to flag or
 * purge: demo and purge-demo leave the table untouched.
 */
export const settingsSeed: SeedModule = {
  key: 'settings',
  async base(tx) {
    const { global, local } = settingsFromDto(staticContent.siteSettings)
    await tx.insert(siteSettings).values({ id: 'site', data: global }).onConflictDoNothing()
    // Only `en` has launch copy; another locale is created by an editor, never copied from `en`.
    for (const locale of routing.locales.filter((code) => code === 'en'))
      await tx.insert(siteSettingsTranslation).values({ locale, data: local }).onConflictDoNothing()
  },
  async demo() {},
  async purgeDemo() {},
}
