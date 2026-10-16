import type { RichTextDocument, RichTextNode } from '@/features/content/types'

/**
 * Turns the editor's rich text document into a small tree the renderer can trust.
 *
 * Why a separate sanitising pass instead of rendering the DTO directly: the DTO is "whatever the
 * editor saved", and this pass is the one place that decides what may reach the page. The
 * renderer only ever sees the output types below, so a new unsafe node type cannot be rendered by
 * forgetting a case. Headings, the table of contents and the word count all read the same tree,
 * which is what keeps their ids and numbers from drifting apart.
 *
 * Allow-list, not deny-list: a node type that is not listed is dropped together with its
 * children (an `iframe` or `html` node never reaches the DOM, and its text is not shown either).
 */

/** `href` is exactly what the author wrote (trimmed); `external` means a new-tab http(s) link. */
export type SafeUrl = Readonly<{ href: string; external: boolean }>

export type RichMark = 'bold' | 'italic' | 'code' | 'strike'

export type RichInline =
  | Readonly<{ type: 'text'; text: string; marks: readonly RichMark[]; link: SafeUrl | null }>
  | Readonly<{ type: 'break' }>

export type RichHeadingLevel = 2 | 3 | 4

export type RichBlock =
  | Readonly<{ type: 'paragraph'; children: readonly RichInline[] }>
  | Readonly<{
      type: 'heading'
      level: RichHeadingLevel
      id: string
      text: string
      children: readonly RichInline[]
    }>
  | Readonly<{ type: 'list'; ordered: boolean; items: readonly (readonly RichBlock[])[] }>
  | Readonly<{ type: 'quote'; children: readonly RichBlock[] }>
  | Readonly<{ type: 'code'; language: string | null; text: string }>
  | Readonly<{
      type: 'image'
      src: string
      alt: string
      width: number | null
      height: number | null
      caption: string | null
    }>
  | Readonly<{ type: 'rule' }>

export type TocHeading = Readonly<{ id: string; text: string; level: 2 | 3 }>

export type SanitizeOptions = Readonly<{
  /** Ids that already exist on the surrounding page; a heading never takes one of them. */
  reservedIds?: readonly string[]
}>

/**
 * Nesting is capped so a hostile or broken document (thousands of nested quotes) cannot overflow
 * the stack. Real articles nest two or three levels (a list inside a quote).
 */
const MAX_DEPTH = 12

/** The mark type in the DTO carries no `attrs` yet; links need their href. */
type RawMark = Readonly<{ type: string; attrs?: Readonly<Record<string, unknown>> }>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const childrenOf = (node: RichTextNode): readonly RichTextNode[] =>
  Array.isArray(node.content) ? node.content : []

// ---------------------------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------------------------

// Checked per character instead of with a control-character regex: lint forbids those, and a code
// point loop is clearer anyway. Whitespace and control characters are refused anywhere in the
// value because browsers silently strip tabs and newlines inside a scheme ("java\tscript:").
// A backslash is refused because browsers read "/\evil.example" as "//evil.example".
function hasUnsafeCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code <= 0x20 || code === 0x7f || code === 0x5c) return true
  }
  return false
}

const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const IMAGE_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * The only door a URL from content walks through. Accepts http(s), `mailto:` and `tel:` links,
 * root-relative paths and in-page anchors; images only http(s) and root-relative paths. Anything
 * else (`javascript:`, `data:`, `vbscript:`, `file:`, protocol-relative `//host`, bare hosts) is
 * `null`, and the caller renders the text without a link.
 */
export function sanitizeUrl(raw: unknown, kind: 'link' | 'image'): SafeUrl | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (value === '' || hasUnsafeCharacter(value)) return null

  if (value.startsWith('#')) return kind === 'link' ? { href: value, external: false } : null
  if (value.startsWith('/')) {
    // "//host" is a protocol-relative URL: it leaves the site while looking like a path.
    return value.startsWith('//') ? null : { href: value, external: false }
  }

  let protocol: string
  try {
    protocol = new URL(value).protocol
  } catch {
    // No scheme and no leading slash: "evil.example/path" is not something we can place.
    return null
  }
  if (!(kind === 'link' ? LINK_PROTOCOLS : IMAGE_PROTOCOLS).has(protocol)) return null
  return { href: value, external: protocol === 'http:' || protocol === 'https:' }
}

// ---------------------------------------------------------------------------------------------
// Heading ids
// ---------------------------------------------------------------------------------------------

/**
 * Lowercase letters and digits of any script joined by hyphens, diacritics removed. An
 * all-symbol heading becomes "section", so an id is never empty.
 */
export function slugifyHeading(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug === '' ? 'section' : slug
}

/**
 * First free id for `base`: `base`, then `base-2`, `base-3`. Checking against every id handed out
 * so far (not just counting duplicates of one title) is what keeps "Intro", "Intro", "Intro 2"
 * unique: the second "Intro" must not take the id the third heading would slug to.
 */
function uniqueId(base: string, used: Set<string>): string {
  let candidate = base
  for (let suffix = 2; used.has(candidate); suffix += 1) candidate = `${base}-${suffix}`
  used.add(candidate)
  return candidate
}

// ---------------------------------------------------------------------------------------------
// Sanitising
// ---------------------------------------------------------------------------------------------

type Context = { used: Set<string> }

const MARK_BY_TYPE: Readonly<Record<string, RichMark>> = {
  bold: 'bold',
  strong: 'bold',
  italic: 'italic',
  em: 'italic',
  code: 'code',
  strike: 'strike',
}

function inlineOf(nodes: readonly RichTextNode[]): RichInline[] {
  const out: RichInline[] = []
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      out.push({ type: 'break' })
    } else if (node.type === 'text' && typeof node.text === 'string' && node.text !== '') {
      const marks: RichMark[] = []
      let link: SafeUrl | null = null
      const rawMarks: readonly RawMark[] = Array.isArray(node.marks) ? node.marks : []
      for (const mark of rawMarks) {
        if (!isRecord(mark)) continue
        if (mark.type === 'link') {
          // Only `href` is read from a link mark: any other attribute (an `onclick`, a `style`)
          // is ignored by construction, not filtered.
          link = sanitizeUrl(mark.attrs?.href, 'link')
          continue
        }
        const known = MARK_BY_TYPE[mark.type]
        if (known && !marks.includes(known)) marks.push(known)
      }
      out.push({ type: 'text', text: node.text, marks, link })
    }
    // Anything else in an inline position (an image inside a paragraph, a nested block) is
    // dropped: it has no safe inline rendering.
  }
  return out
}

const isInlineNode = (node: RichTextNode) => node.type === 'text' || node.type === 'hardBreak'

function inlineText(children: readonly RichInline[]): string {
  return children.map((child) => (child.type === 'text' ? child.text : ' ')).join('')
}

function headingLevel(attrs: RichTextNode['attrs']): RichHeadingLevel {
  const level = attrs?.level
  if (typeof level !== 'number' || !Number.isFinite(level)) return 2
  // The page has one h1 (the article title). A body "h1" is shown as a section heading, and
  // anything deeper than h3 is folded into h4 (not listed in the table of contents).
  if (level <= 2) return 2
  return level === 3 ? 3 : 4
}

const positiveInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null

const LANGUAGE = /^[a-z0-9+#-]{1,20}$/i

function blockOf(node: RichTextNode, context: Context, depth: number): RichBlock[] {
  switch (node.type) {
    case 'paragraph': {
      const children = inlineOf(childrenOf(node))
      return children.length > 0 ? [{ type: 'paragraph', children }] : []
    }
    case 'heading': {
      const children = inlineOf(childrenOf(node))
      if (children.length === 0) return []
      const text = inlineText(children).trim()
      return [
        {
          type: 'heading',
          level: headingLevel(node.attrs),
          id: uniqueId(slugifyHeading(text), context.used),
          text,
          children,
        },
      ]
    }
    case 'bulletList':
    case 'orderedList': {
      if (depth >= MAX_DEPTH) return []
      const items = childrenOf(node)
        .filter((item) => item.type === 'listItem')
        .map((item) => blocksOf(childrenOf(item), context, depth + 1))
        .filter((blocks) => blocks.length > 0)
      return items.length > 0 ? [{ type: 'list', ordered: node.type === 'orderedList', items }] : []
    }
    case 'blockquote': {
      if (depth >= MAX_DEPTH) return []
      const children = blocksOf(childrenOf(node), context, depth + 1)
      return children.length > 0 ? [{ type: 'quote', children }] : []
    }
    case 'codeBlock': {
      const text = childrenOf(node)
        .map((child) => (child.type === 'text' ? (child.text ?? '') : ''))
        .join('')
      if (text === '') return []
      const language = node.attrs?.language
      return [
        {
          type: 'code',
          language: typeof language === 'string' && LANGUAGE.test(language) ? language : null,
          text,
        },
      ]
    }
    case 'image': {
      const source = sanitizeUrl(node.attrs?.src, 'image')
      if (!source) return []
      const { alt, caption } = node.attrs ?? {}
      return [
        {
          type: 'image',
          src: source.href,
          // An image without alt text is decorative until the editor says otherwise.
          alt: typeof alt === 'string' ? alt : '',
          width: positiveInteger(node.attrs?.width),
          height: positiveInteger(node.attrs?.height),
          caption: typeof caption === 'string' && caption.trim() !== '' ? caption.trim() : null,
        },
      ]
    }
    case 'horizontalRule':
      return [{ type: 'rule' }]
    default:
      return []
  }
}

/** Blocks of a container. Loose text (a list item without a paragraph) becomes a paragraph. */
function blocksOf(nodes: readonly RichTextNode[], context: Context, depth: number): RichBlock[] {
  const out: RichBlock[] = []
  let run: RichTextNode[] = []
  const flush = () => {
    const children = inlineOf(run)
    if (children.length > 0) out.push({ type: 'paragraph', children })
    run = []
  }
  for (const node of nodes) {
    if (isInlineNode(node)) {
      run.push(node)
      continue
    }
    flush()
    out.push(...blockOf(node, context, depth))
  }
  flush()
  return out
}

export function sanitizeRichText(
  document: RichTextDocument,
  options: SanitizeOptions = {},
): RichBlock[] {
  const context: Context = { used: new Set(options.reservedIds ?? []) }
  return blocksOf(Array.isArray(document?.content) ? document.content : [], context, 0)
}

// ---------------------------------------------------------------------------------------------
// Reads over the sanitised tree
// ---------------------------------------------------------------------------------------------

function* walk(blocks: readonly RichBlock[]): Generator<RichBlock> {
  for (const block of blocks) {
    yield block
    if (block.type === 'quote') yield* walk(block.children)
    else if (block.type === 'list') for (const item of block.items) yield* walk(item)
  }
}

/**
 * Headings for a table of contents: h2 and h3, in document order, with the same ids the renderer
 * puts on the elements (both run `sanitizeRichText` with the same `reservedIds`).
 */
export function extractHeadings(
  document: RichTextDocument,
  options: SanitizeOptions = {},
): TocHeading[] {
  const out: TocHeading[] = []
  for (const block of walk(sanitizeRichText(document, options))) {
    if (block.type === 'heading' && block.level !== 4) {
      out.push({ id: block.id, text: block.text, level: block.level })
    }
  }
  return out
}

function textOf(block: RichBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return inlineText(block.children)
    case 'code':
      return block.text
    default:
      return ''
  }
}

/**
 * Words a reader reads: paragraphs, headings, list items, quotes and code. Blocks are separated
 * by a space, runs inside one paragraph are not, so "hel" + bold "lo" counts as one word.
 */
export function richTextWordCount(document: RichTextDocument): number {
  const text = Array.from(walk(sanitizeRichText(document)), textOf).join(' ')
  return text.split(/\s+/).filter(Boolean).length
}
