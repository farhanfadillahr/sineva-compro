import { canonicalJson } from '../cms/fields'
import type { DocumentItem } from './configs'

/** Pure status projection shared by server-rendered lists and the client editor. */
export function documentStatus(local: DocumentItem['locales'][string]) {
  if (!local) return { label: 'Belum ada', tone: 'warning' as const }
  if (!local.published) return { label: 'Draf', tone: 'warning' as const }
  const changed =
    local.publishedSlug !== local.draftSlug ||
    canonicalJson(local.published) !== canonicalJson(local.draft)
  return changed
    ? { label: 'Terbit, ada draf baru', tone: 'brand' as const }
    : { label: 'Terbit', tone: 'success' as const }
}
