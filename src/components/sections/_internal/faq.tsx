import type { ReactNode } from 'react'
import type { FaqItem, RichTextDocument, RichTextNode } from '@/features/content/types'

// What the FAQ block needs per question. `answer` is what is shown; `answerText` is the same
// answer as plain text for the FAQPage JSON-LD, which must not contain markup. Pages with
// DB-backed FAQ items get both from `faqEntriesFromDto`; pages with message strings can pass a
// string for `answer` and `answerText` directly.
export type FaqEntry = Readonly<{
  question: string
  answer: ReactNode
  answerText: string
}>

const INLINE = new Set(['text', 'hardBreak'])

function plain(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return ' '
  const children = node.content ?? []
  // Inline children (text runs with marks) must be glued; block children are separated by a
  // space so two paragraphs do not run together.
  const glue = children.every((child) => INLINE.has(child.type)) ? '' : ' '
  return children.map(plain).join(glue)
}

/** Plain text of a rich text document: paragraphs joined by one space, marks dropped. */
export function richTextToPlainText(document: RichTextDocument): string {
  return document.content.map(plain).join(' ').replace(/\s+/g, ' ').trim()
}

function renderInline(node: RichTextNode, key: number): ReactNode {
  if (node.type === 'hardBreak') return <br key={key} />
  let content: ReactNode = node.text ?? ''
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold' || mark.type === 'strong') content = <strong>{content}</strong>
    else if (mark.type === 'italic' || mark.type === 'em') content = <em>{content}</em>
    // Links are deliberately not rendered: the node set is not final (the editor ticket decides
    // it) and an unvalidated href from content would be an XSS vector (javascript: URLs).
  }
  return <span key={key}>{content}</span>
}

function renderNode(node: RichTextNode, key: number): ReactNode {
  const children = (node.content ?? []).map((child, i) =>
    INLINE.has(child.type) ? renderInline(child, i) : renderNode(child, i),
  )
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{children}</p>
    case 'heading':
      // A heading inside an answer would break the page outline; it reads as a bold line.
      return (
        <p key={key} className="font-semibold">
          {children}
        </p>
      )
    case 'bulletList':
      return (
        <ul key={key} className="list-disc ps-5">
          {children}
        </ul>
      )
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal ps-5">
          {children}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{children}</li>
    default:
      return <span key={key}>{children}</span>
  }
}

/**
 * Minimal renderer for the rich text DTO (paragraphs, lists, bold, italic). The content layer
 * says consumers should render rich text through one shared renderer; none exists yet, so this
 * covers what FAQ answers need and degrades unknown nodes to their children. Replace it when the
 * shared renderer lands.
 */
export function RichTextBlocks({ document }: { document: RichTextDocument }) {
  return <div className="flex flex-col gap-3">{document.content.map(renderNode)}</div>
}

/** Map FAQ DTO items (answers as rich text) to entries the FAQ block can render. */
export function faqEntriesFromDto(items: readonly FaqItem[]): FaqEntry[] {
  return items.map((item) => ({
    question: item.question,
    answer: <RichTextBlocks document={item.answer} />,
    answerText: richTextToPlainText(item.answer),
  }))
}

type JsonLdQuestion = Readonly<{
  '@type': 'Question'
  name: string
  acceptedAnswer: Readonly<{ '@type': 'Answer'; text: string }>
}>

export type FaqPageJsonLd = Readonly<{
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: readonly JsonLdQuestion[]
}>

/** schema.org FAQPage. The answer text must match what the page shows (Google policy). */
export function buildFaqPageJsonLd(
  entries: readonly Pick<FaqEntry, 'question' | 'answerText'>[],
): FaqPageJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answerText },
    })),
  }
}

// Built from char codes: a literal U+2028 inside a regex or string literal is itself a line
// terminator in some tools and would break the file.
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g')
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g')

/**
 * JSON for an inline `<script type="application/ld+json">`. The text goes into the HTML
 * unescaped, so `<` must never appear raw: "</script>" inside a question would end the element
 * and let the rest run as markup. The \u escapes are valid JSON, so `JSON.parse` still returns
 * the original strings. U+2028/2029 are escaped because older parsers treat them as newlines.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR, '\\u2029')
}
