import type { ReactNode } from 'react'
import type { ActionLinkComponent } from '@/components/ui'
import { cx, focusRing } from '@/components/ui/cx'
import type { RichTextDocument } from '@/features/content/types'
import {
  sanitizeRichText,
  type RichBlock,
  type RichHeadingLevel,
  type RichInline,
} from './rich-text-model'

export { extractHeadings, type TocHeading } from './rich-text-model'

export type RichTextProps = {
  document: RichTextDocument
  /** Ids already used on the page (`main-content`, section anchors): headings never take them. */
  reservedIds?: readonly string[]
  /** Localised link for root-relative links. External links and anchors stay plain anchors. */
  linkComponent?: ActionLinkComponent
  className?: string
}

const LINK_CLASS = cx(
  'rounded-xs text-(--color-link) underline underline-offset-4 hover:text-action-primary-hover',
  focusRing,
)

// Heading sizes step down from the section scale so a body heading never competes with the h1 of
// the page. The table of contents lists h2 and h3 only; h4 stays visual structure.
const HEADING_CLASS: Record<RichHeadingLevel, string> = {
  2: 'mt-6 text-h3 text-balance text-text',
  3: 'mt-4 text-h4 text-balance text-text',
  4: 'mt-2 text-label font-semibold text-text',
}

function renderInline(node: RichInline, key: number): ReactNode {
  if (node.type === 'break') return <br key={key} />
  let content: ReactNode = node.text
  // Order matters only for nesting: code is innermost so a link around code keeps the link look.
  if (node.marks.includes('code')) {
    content = (
      <code className="rounded-xs bg-canvas-alt px-1.5 py-0.5 font-mono text-[0.9em]">
        {content}
      </code>
    )
  }
  if (node.marks.includes('strike')) content = <s>{content}</s>
  if (node.marks.includes('italic')) content = <em>{content}</em>
  if (node.marks.includes('bold')) content = <strong>{content}</strong>
  return <span key={key}>{content}</span>
}

export function RichText({ document, reservedIds, linkComponent, className }: RichTextProps) {
  const blocks = sanitizeRichText(document, { reservedIds })

  // Links wrap the whole inline node (marks inside), so they are applied here where the link
  // component is known, not in `renderInline`.
  function inline(children: readonly RichInline[]): ReactNode {
    return children.map((child, index) => {
      const node = renderInline(child, index)
      if (child.type !== 'text' || !child.link) return node
      const { href, external } = child.link
      if (external) {
        return (
          <a key={index} href={href} target="_blank" rel="noopener" className={LINK_CLASS}>
            {node}
          </a>
        )
      }
      if (linkComponent && href.startsWith('/')) {
        const Localised = linkComponent
        return (
          <Localised key={index} href={href as never} className={LINK_CLASS}>
            {node}
          </Localised>
        )
      }
      return (
        <a key={index} href={href} className={LINK_CLASS}>
          {node}
        </a>
      )
    })
  }

  function block(item: RichBlock, key: number): ReactNode {
    switch (item.type) {
      case 'paragraph':
        return <p key={key}>{inline(item.children)}</p>
      case 'heading': {
        const Tag = `h${item.level}` as 'h2' | 'h3' | 'h4'
        return (
          <Tag key={key} id={item.id} className={HEADING_CLASS[item.level]}>
            {inline(item.children)}
          </Tag>
        )
      }
      case 'list': {
        const Tag = item.ordered ? 'ol' : 'ul'
        return (
          <Tag
            key={key}
            className={cx(
              'flex flex-col gap-2 ps-6 marker:text-text-brand',
              item.ordered ? 'list-decimal' : 'list-disc',
            )}
          >
            {item.items.map((blocks, index) => (
              // Paragraphs inside an item sit tight against each other: the list gap is enough.
              <li key={index} className="flex flex-col gap-2 ps-1">
                {blocks.map(block)}
              </li>
            ))}
          </Tag>
        )
      }
      case 'quote':
        return (
          <blockquote
            key={key}
            className="flex flex-col gap-3 border-s-4 border-text-brand ps-5 text-lead text-text-secondary"
          >
            {item.children.map(block)}
          </blockquote>
        )
      case 'code':
        return (
          // tabIndex 0: a scrollable region must be reachable by keyboard. Overflow scrolls inside
          // the block so a long line never widens a 360 px screen.
          <pre
            key={key}
            tabIndex={0}
            data-language={item.language ?? undefined}
            className={cx(
              'max-w-full overflow-x-auto rounded-md bg-canvas-alt p-4 font-mono text-micro text-text',
              focusRing,
            )}
          >
            <code>{item.text}</code>
          </pre>
        )
      case 'image':
        return (
          <figure key={key} className="flex flex-col gap-2">
            {/* A plain img, not next/image: editor media is served from a storage host that is not
                in the image remotePatterns (next/image would throw on it), and width and height
                from the content already reserve the box. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              width={item.width ?? undefined}
              height={item.height ?? undefined}
              loading="lazy"
              decoding="async"
              className="h-auto max-w-full rounded-lg [border:var(--border-hairline)]"
            />
            {item.caption ? (
              <figcaption className="text-body-sm text-text-secondary">{item.caption}</figcaption>
            ) : null}
          </figure>
        )
      case 'rule':
        return <hr key={key} className="border-0 [border-top:var(--border-hairline)]" />
    }
  }

  return (
    <div className={cx('flex min-w-0 flex-col gap-5 text-body text-text break-words', className)}>
      {blocks.map(block)}
    </div>
  )
}
