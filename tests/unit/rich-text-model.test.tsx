import { describe, expect, it } from 'vitest'
import type { RichTextDocument } from '@/features/content/types'
import {
  extractHeadings,
  richTextWordCount,
  sanitizeRichText,
  sanitizeUrl,
  slugifyHeading,
} from '@/components/content/rich-text-model'

// The DTO's mark type carries no attrs yet, but a link needs its href. Tests build documents the
// way the editor will, so they go through one loose cast.
const doc = (...content: unknown[]) => ({ type: 'doc', content }) as unknown as RichTextDocument
const text = (value: string) => ({ type: 'text', text: value })
const heading = (value: string, level: unknown = 2) => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
})
const paragraph = (value: string) => ({ type: 'paragraph', content: [text(value)] })

describe('slugifyHeading', () => {
  it('lowercases, drops diacritics and joins words with hyphens', () => {
    expect(slugifyHeading('Start with the work, not the tool')).toBe(
      'start-with-the-work-not-the-tool',
    )
    expect(slugifyHeading('  Café  Ünïcode!! ')).toBe('cafe-unicode')
  })

  it('keeps letters and digits of other scripts', () => {
    expect(slugifyHeading('Langkah 1: 準備')).toBe('langkah-1-準備')
  })

  it('falls back to "section" when nothing usable is left', () => {
    expect(slugifyHeading('???')).toBe('section')
    expect(slugifyHeading('')).toBe('section')
  })
})

describe('sanitizeUrl', () => {
  it.each([
    ['https://example.com/a?b=1#c', 'https://example.com/a?b=1#c', true],
    ['http://example.com', 'http://example.com', true],
    ['mailto:hi@example.com', 'mailto:hi@example.com', false],
    ['tel:+6281234567890', 'tel:+6281234567890', false],
    ['/contact', '/contact', false],
    ['/blog?category=ai-basics', '/blog?category=ai-basics', false],
    ['#section', '#section', false],
  ])('accepts %s', (input, href, external) => {
    expect(sanitizeUrl(input, 'link')).toEqual({ href, external })
  })

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'evil.example/path',
    '',
    '   ',
  ])('rejects %j', (input) => {
    expect(sanitizeUrl(input, 'link')).toBeNull()
  })

  it('rejects non-string input', () => {
    expect(sanitizeUrl(undefined, 'link')).toBeNull()
    expect(sanitizeUrl(42, 'link')).toBeNull()
  })

  it('allows only http(s) and root-relative paths for images', () => {
    expect(sanitizeUrl('https://cdn.example.com/a.png', 'image')?.href).toBe(
      'https://cdn.example.com/a.png',
    )
    expect(sanitizeUrl('/uploads/a.png', 'image')?.href).toBe('/uploads/a.png')
    expect(sanitizeUrl('mailto:a@b.co', 'image')).toBeNull()
    expect(sanitizeUrl('#x', 'image')).toBeNull()
    expect(sanitizeUrl('data:image/png;base64,AAAA', 'image')).toBeNull()
  })
})

describe('sanitizeRichText', () => {
  it('keeps only the allowed node types and drops unknown nodes with their children', () => {
    const blocks = sanitizeRichText(
      doc(
        paragraph('kept'),
        { type: 'html', text: '<b>raw</b>' },
        { type: 'iframe', attrs: { src: 'https://evil.example' }, content: [paragraph('inside')] },
        { type: 'script', content: [text('alert(1)')] },
      ),
    )
    expect(blocks).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'kept', marks: [], link: null }] },
    ])
  })

  it('maps heading levels into 2 to 4 because the page owns the single h1', () => {
    const levels = sanitizeRichText(
      doc(
        heading('a', 1),
        heading('b', 2),
        heading('c', 3),
        heading('d', 4),
        heading('e', 6),
        heading('f', 'x'),
      ),
    ).map((block) => (block.type === 'heading' ? block.level : null))
    expect(levels).toEqual([2, 2, 3, 4, 4, 2])
  })

  it('assigns unique, stable ids in document order, also for duplicates', () => {
    const input = doc(heading('Intro'), heading('Intro'), heading('Intro 2'), heading('Intro'))
    const ids = (blocks: ReturnType<typeof sanitizeRichText>) =>
      blocks.map((block) => (block.type === 'heading' ? block.id : null))
    const first = ids(sanitizeRichText(input))
    expect(first).toEqual(['intro', 'intro-2', 'intro-2-2', 'intro-3'])
    expect(new Set(first).size).toBe(first.length)
    expect(ids(sanitizeRichText(input))).toEqual(first)
  })

  it('avoids reserved ids of the surrounding page', () => {
    const [block] = sanitizeRichText(doc(heading('Main content')), {
      reservedIds: ['main-content'],
    })
    expect(block).toMatchObject({ type: 'heading', id: 'main-content-2' })
  })

  it('turns an invalid link mark into plain text instead of a link', () => {
    const [block] = sanitizeRichText(
      doc({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'click',
            marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
          },
        ],
      }),
    )
    expect(block).toEqual({
      type: 'paragraph',
      children: [{ type: 'text', text: 'click', marks: [], link: null }],
    })
  })

  it('stops descending at a fixed depth instead of overflowing the stack', () => {
    let nested: unknown = paragraph('deep')
    for (let i = 0; i < 500; i += 1) nested = { type: 'blockquote', content: [nested] }
    expect(() => sanitizeRichText(doc(nested))).not.toThrow()
  })
})

describe('extractHeadings', () => {
  it('lists h2 and h3 only, with the ids the renderer will use', () => {
    const headings = extractHeadings(
      doc(heading('One'), paragraph('x'), heading('Two', 3), heading('Three', 4), heading('One')),
    )
    expect(headings).toEqual([
      { id: 'one', text: 'One', level: 2 },
      { id: 'two', text: 'Two', level: 3 },
      { id: 'one-2', text: 'One', level: 2 },
    ])
  })

  it('finds headings nested in quotes and lists', () => {
    const headings = extractHeadings(doc({ type: 'blockquote', content: [heading('Inside')] }))
    expect(headings.map((h) => h.id)).toEqual(['inside'])
  })
})

describe('richTextWordCount', () => {
  it('counts words across blocks without gluing neighbours together', () => {
    expect(richTextWordCount(doc(paragraph('one two'), paragraph('three')))).toBe(3)
  })

  it('counts adjacent marked runs of one paragraph as written', () => {
    const count = richTextWordCount(
      doc({
        type: 'paragraph',
        content: [
          text('hel'),
          { type: 'text', text: 'lo', marks: [{ type: 'bold' }] },
          text(' world'),
        ],
      }),
    )
    expect(count).toBe(2)
  })

  it('is 0 for an empty document', () => {
    expect(richTextWordCount(doc())).toBe(0)
  })
})
