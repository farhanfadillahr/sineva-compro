import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { Container, Section } from '@/components/ui'
import type { PrivacyPageContent, RichTextNode } from '@/features/content/types'
import {
  buildPrivacyOutline,
  formatLegalDate,
  type OutlineHeading,
  type PrivacyBlock,
} from './privacy-outline'
import { PrivacyToc } from './privacy-toc'

const HEADING_CLASSES: Record<OutlineHeading['level'], string> = {
  2: 'mt-12 text-h3 text-text',
  3: 'mt-8 text-h4 text-text',
  4: 'mt-6 text-label font-semibold text-text',
  5: 'mt-6 text-label font-semibold text-text',
  6: 'mt-6 text-label font-semibold text-text',
}

function renderInline(node: RichTextNode, key: number): ReactNode {
  if (node.type === 'hardBreak') return <br key={key} />
  let content: ReactNode = node.text ?? ''
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold' || mark.type === 'strong') content = <strong>{content}</strong>
    else if (mark.type === 'italic' || mark.type === 'em') content = <em>{content}</em>
    // Links are not rendered: the editor has not fixed its node set, and an href that came from
    // content and was never validated would allow a javascript: URL.
  }
  return <span key={key}>{content}</span>
}

function renderNode(node: RichTextNode, key: number): ReactNode {
  const children = (node.content ?? []).map((child, index) =>
    child.type === 'text' || child.type === 'hardBreak'
      ? renderInline(child, index)
      : renderNode(child, index),
  )
  switch (node.type) {
    case 'paragraph':
      return (
        <p key={key} className="mt-4">
          {children}
        </p>
      )
    case 'bulletList':
      return (
        <ul key={key} className="mt-4 flex list-disc flex-col gap-2 ps-6">
          {children}
        </ul>
      )
    case 'orderedList':
      return (
        <ol key={key} className="mt-4 flex list-decimal flex-col gap-2 ps-6">
          {children}
        </ol>
      )
    case 'listItem':
      // A list item wraps a paragraph; the list already spaces its items, so the paragraph's own
      // top margin would double the gap.
      return (
        <li key={key} className="[&>p]:mt-0">
          {children}
        </li>
      )
    default:
      return <span key={key}>{children}</span>
  }
}

function renderBlock(block: PrivacyBlock, index: number): ReactNode {
  if (block.kind === 'node') return renderNode(block.node, index)
  const { heading } = block
  const Tag = `h${heading.level}` as 'h2'
  return (
    <Tag key={heading.id} id={heading.id} className={HEADING_CLASSES[heading.level]}>
      {heading.text}
    </Tag>
  )
}

export type PrivacyViewProps = Readonly<{ page: PrivacyPageContent }>

/**
 * /privacy-policy (page-patterns.md 2.9): a text page with a 720 px reading column, a sticky table
 * of contents from 1024 px up and the last updated date.
 *
 * Why this renders the rich text itself: the shared rich text renderer does not exist yet, and the
 * policy only uses paragraphs, headings and lists. Swapping in the shared renderer later means
 * replacing `renderNode` here; the outline (ids, levels, table of contents) does not depend on it.
 *
 * The DOM order is title, contents, text. On a phone the contents is a short list before the text;
 * from `lg` it moves to a left column through grid placement, so keyboard order and reading order
 * match what a visitor sees.
 */
export function PrivacyView({ page }: PrivacyViewProps) {
  const t = useTranslations('Privacy')
  const { blocks, headings } = buildPrivacyOutline(page.body)

  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      <Section tone="canvas">
        <Container
          // The grid only exists from lg: below it everything stacks in document order. The text
          // column is fixed to the 720 px reading width; the contents takes the rest of the row.
          className="flex flex-col gap-8 lg:grid lg:grid-cols-[15rem_minmax(0,var(--container-text))] lg:justify-center lg:gap-x-16 lg:gap-y-10"
        >
          <header className="lg:col-start-2 lg:row-start-1">
            <h1 id="privacy-title" className="text-h1 text-balance text-text">
              {t('title')}
            </h1>
            <p className="mt-4 text-label text-text-secondary">
              {t('lastUpdated')}:{' '}
              <time dateTime={page.effectiveDate}>{formatLegalDate(page.effectiveDate)}</time>
            </p>
          </header>

          <PrivacyToc
            headings={headings}
            label={t('tocLabel')}
            className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
          />

          <article className="max-w-(--container-text) text-body text-text-secondary lg:col-start-2 lg:row-start-2">
            {/* The first block carries no top margin of its own: the grid gap spaces it. */}
            <div className="[&>:first-child]:mt-0">{blocks.map(renderBlock)}</div>
          </article>
        </Container>
      </Section>
    </main>
  )
}
