import { routing } from '../../src/i18n/routing'
import { staticContent, staticContentFor } from '../../src/content/static/source'
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
    // Each locale with launch copy gets its own row; a locale without one is created by an editor,
    // never copied from `en`. An existing row is never replaced.
    for (const locale of routing.locales) {
      const bundle = staticContentFor(locale)
      if (!bundle) continue
      const data =
        locale === routing.defaultLocale ? local : settingsFromDto(bundle.siteSettings).local
      await tx.insert(siteSettingsTranslation).values({ locale, data }).onConflictDoNothing()
    }
  },
  async demo() {},
  async purgeDemo() {},
}
