import type { RichTextDocument, RichTextNode } from '@/features/content/types'

export type OutlineHeading = Readonly<{
  /** Stable, unique anchor. Derived from the text, not from the position. */
  id: string
  /** 2 to 6. The page title owns the h1. */
  level: 2 | 3 | 4 | 5 | 6
  text: string
}>

export type PrivacyBlock =
  | Readonly<{ kind: 'heading'; heading: OutlineHeading }>
  | Readonly<{ kind: 'node'; node: RichTextNode }>

export type PrivacyOutline = Readonly<{
  /** The document in reading order, headings replaced by their normalised form. */
  blocks: readonly PrivacyBlock[]
  /** The same headings, for the table of contents. */
  headings: readonly OutlineHeading[]
}>

// Ids the page already uses. A heading that slugs to one of these would give two elements the same
// id, so the skip link or the title's aria-labelledby would resolve to the wrong one.
const RESERVED_IDS = ['main-content', 'privacy-title', 'privacy-toc']

function textOf(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(textOf).join('')
}

function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    // Drop the accent marks NFKD splits off, so "Résumé" becomes "resume" and not "r-sum".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // An id that starts with a digit is valid HTML but awkward in a CSS selector, and an empty one
  // is useless: both get a prefix.
  if (slug === '') return 'section'
  return /^[a-z]/.test(slug) ? slug : `section-${slug}`
}

/**
 * Turns the privacy rich text into what the page needs: blocks in reading order and the list of
 * headings with ids.
 *
 * Why ids come from the text and are deduplicated with a counter: the table of contents links to
 * them, and people bookmark and share those links. A position based id ("section-3") would point
 * somewhere else after an editor inserts a section above it. Duplicates (two "Contact" headings)
 * get "-2", "-3" in document order, so the first keeps the clean id.
 *
 * Why levels are clamped: the page title is the h1 and the editor may produce any level. A heading
 * deeper than the previous one plus one would skip a level, which breaks the outline for screen
 * reader users, so it is lifted to the next level down instead of rejected.
 */
export function buildPrivacyOutline(document: RichTextDocument): PrivacyOutline {
  const used = new Set(RESERVED_IDS)
  const blocks: PrivacyBlock[] = []
  const headings: OutlineHeading[] = []
  // Starts at 1 (the h1), so the first heading can be at most an h2.
  let previousLevel = 1

  for (const node of document.content) {
    if (node.type !== 'heading') {
      blocks.push({ kind: 'node', node })
      continue
    }
    const text = textOf(node).replace(/\s+/g, ' ').trim()
    const requested = Number(node.attrs?.level ?? 2)
    const level = Math.min(Math.max(requested, 2), previousLevel + 1, 6) as OutlineHeading['level']
    previousLevel = level

    const base = slugify(text)
    let id = base
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)

    const heading: OutlineHeading = { id, level, text }
    headings.push(heading)
    blocks.push({ kind: 'heading', heading })
  }
  return { blocks, headings }
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * "2026-10-16" to "16 October 2026". Built by hand from the date parts on purpose: `new Date`
 * parses the ISO date as UTC midnight and `toLocaleDateString` then formats in the server's zone,
 * which prints the previous day west of UTC. A calendar date has no zone. Anything that is not an
 * ISO date comes back unchanged rather than as "Invalid Date".
 */
export function formatLegalDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso
  const [, year, month, day] = match
  const name = MONTHS[Number(month) - 1]
  if (!name) return iso
  return `${Number(day)} ${name} ${year}`
}
