import type { PublicContentSource } from '../features/content/public'
import { createStaticContentSource } from '../content/static'

/**
 * The landing site's one entry point to public content. Layouts and pages call this instead of
 * constructing a source themselves, so changing where content comes from is a change in this
 * function only.
 *
 * The launch is static: content lives in typed modules under `src/content/static` and implements
 * the same `PublicContentSource` contract the CMS will. When the CMS database source is ready,
 * return it here instead; no call site changes.
 */
export function getContentSource(): PublicContentSource {
  return createStaticContentSource()
}
