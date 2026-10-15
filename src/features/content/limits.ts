/**
 * Field limits for public content. Single source for the admin validators and the layout,
 * mirroring docs/design/copywriting.md (sections 3 and 7) and the admin CMS plan (section 2).
 *
 * Word limits are used for headlines and body copy because the design constrains reading load,
 * not bytes; character limits apply only where a search engine truncates (meta fields).
 */
export const FIELD_LIMITS = {
  metaTitleChars: 60,
  metaDescriptionChars: 160,
  eyebrowWords: 3,
  headlineWords: 8,
  /** Hero H1 may run two words longer than a section headline. */
  heroHeadlineWords: 10,
  bodyWords: 30,
  ctaLabelWordsMin: 2,
  ctaLabelWordsMax: 4,
  /** Chat lines shown in a capability mockup. */
  mockupLines: 4,
  /** Product page "Made for your business" tabs. */
  industries: 4,
  /** Contact page meta chips. */
  contactChips: 3,
  /** Product hero phone mockup: chat bubbles and floating ui-chip texts. */
  mockupBubbles: 4,
  mockupChips: 3,
} as const

/** Whitespace-separated word count, the unit the copywriting limits are written in. */
export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}
