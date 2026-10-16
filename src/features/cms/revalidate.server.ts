import 'server-only'
import { revalidatePath, revalidateTag } from 'next/cache'
import { invalidationTags, type ContentChange } from './invalidation'

/**
 * Invalidates public caches after a committed change. Called only after the transaction returns,
 * so a rolled-back save never refreshes anything. `expire: 0` makes the next request read fresh
 * data: an editor who saves and opens the site sees the change, not a stale copy.
 */
export function revalidateContent(tags: readonly string[]): void {
  for (const tag of new Set(tags)) revalidateTag(tag, { expire: 0 })
}

/** For admin list pages rendered on the server. */
export function revalidateAdmin(...paths: string[]): void {
  for (const path of paths) revalidatePath(path)
}

/** Refreshes everything a committed change affects (`invalidation.ts`). */
export function revalidateChange(change: ContentChange): void {
  revalidateContent(invalidationTags(change))
}
