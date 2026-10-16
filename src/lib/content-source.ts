import type { PublicContentSource } from '../features/content/public'
import { createFixtureContentSource } from '../features/content/fixture-source'

/**
 * The landing site's one entry point to public content. Layouts and pages call this instead of
 * constructing a source themselves, so switching from the fixture source to the database source
 * is a change in this function only. Server-side use: the database source will be server-only.
 */
export function getContentSource(): PublicContentSource {
  return createFixtureContentSource()
}
