/**
 * Dash rule for public copy: no em dash or en dash (docs/design/copywriting.md, rule 1).
 *
 * Pure functions, no dependencies, safe to import from server code, client code and tests.
 *
 * Blocked code points:
 * - U+2014 em dash and U+2013 en dash: the written rule.
 * - U+2012 figure dash and U+2015 horizontal bar: look-alikes that say the same thing to a
 *   reader. Leaving them out would turn the rule into a loophole that a paste from a word
 *   processor walks straight through, so they are blocked with the same message.
 * - NOT blocked: U+2212 minus sign. It appears in legitimate content (temperatures, math)
 *   and is not a punctuation dash.
 * - HTML entity forms (`&mdash;`, `&ndash;`, `&horbar;` and numeric `&#8212;` / `&#x2014;`
 *   style references) are blocked too: rich text and metadata can reach the page through an
 *   HTML path where the entity would render as the dash.
 *
 * Strings are scanned raw. ICU message syntax (braces, plural branches) is not parsed because
 * none of it can contain these characters by accident and parsing would add a failure mode.
 */

export type DashViolation = {
  /** UTF-16 code unit index of the match, so `text.slice(index, index + char.length)` works. */
  index: number
  /** The matched text: the literal dash, or the entity text such as `&mdash;`. */
  char: string
  /** Code point of the dash the match stands for (an entity resolves to its dash). */
  codePoint: number
  source: 'literal' | 'entity'
}

/** Admin UI language is Indonesian (PRD FR-ADM-05). */
export const FORBIDDEN_DASH_MESSAGE = 'Gunakan koma atau titik, bukan em dash atau en dash.'

/** U+2012 figure dash through U+2015 horizontal bar; the range holds only the four dashes. */
const DASH_CLASS = '\\u2012-\\u2015'

// Literal dash, or an entity. Surrogate pairs cannot collide: every blocked code point is in
// the BMP and a surrogate half (U+D800 to U+DFFF) never falls inside the class, so astral
// characters such as emoji next to a dash neither match nor shift the reported UTF-16 index.
// Entity names are case-sensitive in HTML; the `x` of a hex reference may be either case.
// 2012 to 2015 and 8210 to 8213 are the same four code points in hex and decimal.
const FORBIDDEN_PATTERN = new RegExp(
  `[${DASH_CLASS}]|&(?:mdash|ndash|horbar);|&#(?:[xX]0*(?:2012|2013|2014|2015)|0*(?:8210|8211|8212|8213));`,
  'g',
)

const NAMED_ENTITY_CODE_POINTS: Record<string, number> = {
  '&mdash;': 0x2014,
  '&ndash;': 0x2013,
  '&horbar;': 0x2015,
}

function entityCodePoint(entity: string): number {
  const named = NAMED_ENTITY_CODE_POINTS[entity]
  if (named !== undefined) return named
  // Numeric reference: `&#x2014;` (hex) or `&#8212;` (decimal), leading zeros allowed.
  const body = entity.slice(2, -1)
  return body[0] === 'x' || body[0] === 'X' ? parseInt(body.slice(1), 16) : parseInt(body, 10)
}

/** All forbidden dashes in `text`, sorted by index. Nullish input yields no violations. */
export function findForbiddenDashes(text: string | null | undefined): DashViolation[] {
  if (!text) return []
  const found: DashViolation[] = []
  for (const match of text.matchAll(FORBIDDEN_PATTERN)) {
    const char = match[0]
    const isEntity = char.startsWith('&')
    found.push({
      index: match.index,
      char,
      codePoint: isEntity ? entityCodePoint(char) : char.codePointAt(0)!,
      source: isEntity ? 'entity' : 'literal',
    })
  }
  return found
}

const DASH_RUN = new RegExp(`[ \\t]*[${DASH_CLASS}]+[ \\t]*`, 'g')
// En dash or figure dash between digits is a number range. An em dash between digits is
// punctuation, not a range, so it goes through the comma path.
const DIGIT_RANGE = /(?<=\d)[ \t]*[‒–][ \t]*(?=\d)/g

/**
 * Deterministic suggestion for replacing forbidden dashes. It is a starting point for an
 * editor, not a grammar guarantee: the comma keeps the original capitalisation.
 *
 * Rules, applied in order:
 * 1. Entity forms are resolved to the dash they stand for.
 * 2. En dash or figure dash between digits becomes a plain hyphen, spaces removed:
 *    `10 – 50` becomes `10-50`.
 * 3. Any other run of dashes, with the spaces around it, becomes `, `. A plain spaced hyphen
 *    (` - `) is not used because it is the same pause with a lookalike glyph.
 *    Exceptions where a comma would be wrong: at the start or end of the text or next to a
 *    line break the dash is dropped; after `,;:(` or before `.,;:!?)` no extra comma is added.
 *
 * The result never contains a forbidden dash, and fixing a fixed string changes nothing.
 */
export function suggestDashFix(text: string): string {
  if (!text) return text
  const resolved = text.replace(FORBIDDEN_PATTERN, (match) =>
    match.startsWith('&') ? String.fromCodePoint(entityCodePoint(match)) : match,
  )
  const ranged = resolved.replace(DIGIT_RANGE, '-')
  return ranged.replace(DASH_RUN, (match, offset: number, whole: string) => {
    const before = whole[offset - 1]
    const after = whole[offset + match.length]
    if (before === undefined || after === undefined) return ''
    if (before === '\n' || after === '\n') return ''
    if (before === '(' || after === ')') return ''
    if (',;:'.includes(before)) return after && '.,;:!?'.includes(after) ? '' : ' '
    if ('.,;:!?'.includes(after)) return ''
    return ', '
  })
}

/** Thrown by `assertNoForbiddenDashes`; carries the JSON path so tests and logs can pinpoint it. */
export class CopyDashError extends Error {
  readonly path: string
  readonly violations: DashViolation[]

  constructor(path: string, violations: DashViolation[]) {
    const detail = violations
      .map(
        (v) => `U+${v.codePoint.toString(16).toUpperCase().padStart(4, '0')} at index ${v.index}`,
      )
      .join(', ')
    super(`Forbidden dash in "${path}": ${detail}`)
    this.name = 'CopyDashError'
    this.path = path
    this.violations = violations
  }
}

/** Throws `CopyDashError` when `value` contains a forbidden dash. `path` is a JSON path. */
export function assertNoForbiddenDashes(value: string | null | undefined, path: string): void {
  const violations = findForbiddenDashes(value)
  if (violations.length > 0) throw new CopyDashError(path, violations)
}

export type CopyFieldResult = { ok: true } | { ok: false; message: string; fix: string }

/** Validator for admin form fields: Indonesian message plus a one-click replacement. */
export function validateCopyField(value: string | null | undefined): CopyFieldResult {
  if (findForbiddenDashes(value).length === 0) return { ok: true }
  return { ok: false, message: FORBIDDEN_DASH_MESSAGE, fix: suggestDashFix(value ?? '') }
}
