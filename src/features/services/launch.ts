import { staticContent, staticContentFor } from '../../content/static/source'
import { routing } from '../../i18n/routing'
import type { ContentLocale, ServiceDetail } from '../content/types'
import { storedFromDto } from '../cms/fields'
import { serviceLocaleSchema } from './fields'

const localData = (detail: ServiceDetail) => {
  const { slug, locale, icon, pose, tools, ...content } = detail
  void slug
  void locale
  void icon
  void pose
  void tools
  return storedFromDto(serviceLocaleSchema, content) as Record<string, unknown>
}

/**
 * Stored form of the launch services, for the base seed and tests. `local` is the default locale;
 * `translations` holds every locale with launch copy (paired by slug, which is the same in each).
 */
export function launchServices() {
  return staticContent.serviceDetails.map((detail) => {
    const translations: Partial<Record<ContentLocale, Record<string, unknown>>> = {}
    for (const locale of routing.locales) {
      const found = staticContentFor(locale)?.serviceDetails.find((s) => s.slug === detail.slug)
      if (found) translations[locale] = localData(found)
    }
    return {
      slug: detail.slug,
      global: { icon: detail.icon, pose: detail.pose, tools: [...detail.tools] },
      local: localData(detail),
      translations,
    }
  })
}
