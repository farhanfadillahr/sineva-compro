import 'server-only'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import { readServices } from '../services/service.server'

/** Related-service choices for the work editor (every service, published or not). */
export async function workFieldOptions() {
  const services = await readServices(db)
  return {
    services: services.flatMap((s) => {
      const local = s.locales[routing.defaultLocale]
      return local ? [{ value: local.slug, label: String(local.data.title ?? local.slug) }] : []
    }),
  }
}
