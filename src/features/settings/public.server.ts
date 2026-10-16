import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { PublicContentSource } from '../content/public'
import type { ContentLocale, SiteSettingsDTO } from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { resolveMedia } from '../cms/media.server'
import { projectSiteSettings } from './project'
import { readStoredSettings } from './service.server'

/**
 * Settings for one locale. No cross-locale fallback: a locale without its translation row returns
 * `null`, exactly like the contract's "settings not created for the locale".
 */
async function getSiteSettings(locale: ContentLocale): Promise<SiteSettingsDTO | null> {
  const stored = await readStoredSettings(db, [locale])
  const local = stored.locales[locale]
  if (!stored.global || !local) return null
  // Service titles come from the same source the site renders, so templates match the nav.
  const { createDatabaseContentSource } = await import('../cms/database-source.server')
  const services = await createDatabaseContentSource().listServices(locale)
  const [defaultOgImage, logo] = await Promise.all([
    resolveMedia(db, stored.global.brand.defaultOgImage, locale),
    resolveMedia(db, stored.global.brand.logo, locale),
  ])
  return projectSiteSettings({
    locale,
    global: stored.global,
    local,
    services,
    media: { defaultOgImage, logo },
  })
}

export const settingsReads = {
  getSiteSettings: cachedRead('settings', getSiteSettings, (locale) => [
    cacheTags.settings,
    cacheTags.services(locale),
  ]),
} satisfies Partial<PublicContentSource>
