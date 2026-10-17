/**
 * Which public content to refresh when a media file or its metadata changes (CPR-103). Media usage
 * stores the owner as `entity` plus an `entity_id` whose first segment names the page or
 * collection (`thankYou:en`, `faq:<id>`, `categories:<id>`, `capabilities:<id>`). Pure, so the
 * mapping is unit tested; the HTTP layer applies it after the media transaction has committed.
 *
 * Document and service changes refresh the list tag only: item reads are tagged with the list tag
 * as well, so the detail pages follow without knowing the slug.
 */
import { PAGE_KEYS, type PageKey } from '../content/types'
import type { ContentChange } from '../cms/invalidation'

export type MediaUsageOwner = Readonly<{ entity: string; entityId: string }>

function changeFor({ entity, entityId }: MediaUsageOwner): ContentChange | null {
  const prefix = entityId.split(':')[0] ?? ''
  switch (entity) {
    case 'pages':
      if (prefix === 'faq') return { entity: 'faq' }
      return (PAGE_KEYS as readonly string[]).includes(prefix)
        ? { entity: 'page', key: prefix as PageKey }
        : null
    case 'services':
      return { entity: 'service', slugs: [] }
    case 'posts':
      return prefix === 'categories' ? { entity: 'categories' } : { entity: 'post', slugs: [] }
    case 'portfolio':
      return { entity: 'work', slugs: [] }
    case 'team':
      return { entity: 'team' }
    case 'product':
      if (prefix === 'capabilities') return { entity: 'capabilities' }
      if (prefix === 'businessTypes') return { entity: 'industries' }
      return null
    case 'settings':
      return { entity: 'settings' }
    default:
      return null
  }
}

export function mediaUsageChanges(owners: readonly MediaUsageOwner[]): ContentChange[] {
  const seen = new Set<string>()
  const changes: ContentChange[] = []
  for (const owner of owners) {
    const change = changeFor(owner)
    if (!change) continue
    const key = JSON.stringify(change)
    if (seen.has(key)) continue
    seen.add(key)
    changes.push(change)
  }
  return changes
}
