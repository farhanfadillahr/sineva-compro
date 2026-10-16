import 'server-only'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import { readCollection } from '../collections/service.server'

/** Category and author choices for the post editor. */
export async function postFieldOptions() {
  const [categories, team] = await Promise.all([
    readCollection(db, 'categories'),
    readCollection(db, 'team'),
  ])
  return {
    categories: categories.map((c) => ({
      value: c.key,
      label: String(c.locales[routing.defaultLocale]?.name ?? c.key),
    })),
    authors: team.map((m) => ({ value: m.id, label: String(m.global.name ?? m.key) })),
  }
}
