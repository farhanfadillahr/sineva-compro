import type {
  MediaAsset,
  RichTextDocument,
  RichTextNode,
  SeoFields,
  StepItem,
} from '../../features/content/types'

// Builders for the static content modules. They exist so a content file reads as copy, not as
// object plumbing. No logic that depends on the copy itself lives here.

/**
 * Media served from `public/`, produced by the assets lane. The paths and pixel sizes are agreed
 * contract: poses are 1200x1200, the hero poster 1600x1600, the OG card 1200x630. `blurDataUrl`
 * stays null because no placeholder has been generated for these files.
 */
export function asset(url: string, width: number, height: number, alt: string): MediaAsset {
  return { url, width, height, alt, blurDataUrl: null }
}

/** Metadata. Canonical and OG stay null so the route builds the URL and the generated card. */
export function seo(metaTitle: string, metaDescription: string, noindex = false): SeoFields {
  return { metaTitle, metaDescription, ogImage: null, canonicalUrl: null, noindex }
}

export const step = (title: string, body: string): StepItem => ({ title, body })

// Rich text. The node set is the one the shared renderer understands today: paragraph, heading,
// bulletList and listItem, plus plain text nodes. No marks or links, so nothing here depends on a
// renderer feature that has not shipped.

export const paragraph = (text: string): RichTextNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})

export const heading = (text: string, level = 2): RichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})

export const bulletList = (...items: string[]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
})

export const doc = (...content: RichTextNode[]): RichTextDocument => ({ type: 'doc', content })

/** A FAQ answer or short body: one paragraph per argument. */
export const paragraphs = (...texts: string[]): RichTextDocument => doc(...texts.map(paragraph))

/** Plain text of a rich text document, words separated by one space. */
export function plainText(node: RichTextNode | RichTextDocument): string {
  const own = 'text' in node && node.text ? [node.text] : []
  return [...own, ...(node.content ?? []).map(plainText)].join(' ')
}
