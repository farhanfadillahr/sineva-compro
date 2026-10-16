import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { PublicContentSource } from '../content/public'
import type { AuthorSummary, ContentLocale, TeamMember } from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { resolveMedia } from '../cms/media.server'
import { publicCollection } from '../collections/service.server'

/** Members shown on About, in display order. Names and photos only; never an email or id. */
async function listTeam(locale: ContentLocale): Promise<readonly TeamMember[]> {
  const rows = (await publicCollection(db, 'team', locale)).filter(
    ({ global }) => global.showOnAbout === true,
  )
  return Promise.all(
    rows.map(async ({ global, local }) => ({
      name: global.name as string,
      role: local.role as string,
      bio: (local.bio as string | null) ?? null,
      photo: await resolveMedia(db, global.photo, locale),
      socialUrl: (global.socialUrl as string | null) ?? null,
    })),
  )
}

/** Author projection for articles: any team member, listed on About or not. */
export async function authorSummary(
  id: string,
  locale: ContentLocale,
): Promise<AuthorSummary | null> {
  const row = (await publicCollection(db, 'team', locale)).find((r) => r.id === id)
  if (!row) return null
  return {
    name: row.global.name as string,
    role: (row.local.role as string) ?? null,
    photo: await resolveMedia(db, row.global.photo, locale),
  }
}

export const teamReads = {
  listTeam: cachedRead('team', listTeam, (l) => [cacheTags.team(l)]),
} satisfies Partial<PublicContentSource>
