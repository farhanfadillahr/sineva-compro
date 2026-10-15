import type {
  MediaAsset,
  RichTextDocument,
  RichTextNode,
  SeoFields,
} from '../../../src/features/content/types'

// Smallest valid GIF, enough to exercise the blur placeholder path without shipping an image.
const BLUR_PLACEHOLDER =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** Demo media. The host is a placeholder: the demo seed uploads real files to local SeaweedFS. */
export function media(
  name: string,
  width: number,
  height: number,
  alt: string,
  withBlur = false,
): MediaAsset {
  return {
    url: `https://media.example.com/demo/${name}.webp`,
    width,
    height,
    alt,
    blurDataUrl: withBlur ? BLUR_PLACEHOLDER : null,
  }
}

export function seo(metaTitle: string, metaDescription: string): SeoFields {
  return { metaTitle, metaDescription, ogImage: null, canonicalUrl: null, noindex: false }
}

export const paragraph = (text: string): RichTextNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})

export const heading = (text: string, level = 2): RichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})

export const doc = (...content: RichTextNode[]): RichTextDocument => ({ type: 'doc', content })
