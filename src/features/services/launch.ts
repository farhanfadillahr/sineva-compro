import { staticContent } from '../../content/static/source'
import { storedFromDto } from '../cms/fields'
import { serviceLocaleSchema } from './fields'

/** Stored form of the launch services (English), for the base seed and tests. */
export function launchServices() {
  return staticContent.serviceDetails.map((detail) => {
    const { slug, locale, icon, pose, tools, ...content } = detail
    void locale
    return {
      slug,
      global: { icon, pose, tools: [...tools] },
      local: storedFromDto(serviceLocaleSchema, content) as Record<string, unknown>,
    }
  })
}
