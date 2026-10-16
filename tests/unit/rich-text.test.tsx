import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { RichText } from '@/components/content/rich-text'
import { extractHeadings } from '@/components/content/rich-text-model'
import type { RichTextDocument } from '@/features/content/types'
import { criticalAxeViolations } from './sections-test-utils'

const doc = (...content: unknown[]) => ({ type: 'doc', content }) as unknown as RichTextDocument
const text = (value: string, marks?: unknown[]) => ({ type: 'text', text: value, marks })
const paragraph = (...inline: unknown[]) => ({ type: 'paragraph', content: inline })
const heading = (value: string, level = 2) => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
})
const link = (label: string, href: unknown) =>
  text(label, [{ type: 'link', attrs: { href, onclick: 'alert(1)' } }])

type RenderProps = Partial<Omit<React.ComponentProps<typeof RichText>, 'document'>>
const renderDoc = (document: RichTextDocument, props: RenderProps = {}) =>
  render(<RichText document={document} {...props} />)

describe('RichText elements', () => {
  it('renders headings, paragraphs, lists, quote, code, image and rule as designed', () => {
    const { container } = renderDoc(
      doc(
        heading('Start here'),
        paragraph(text('Body text.')),
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('one'))] }] },
        {
          type: 'orderedList',
          content: [{ type: 'listItem', content: [paragraph(text('first'))] }],
        },
        { type: 'blockquote', content: [paragraph(text('A quote.'))] },
        {
          type: 'codeBlock',
          attrs: { language: 'ts' },
          content: [text('const a = 1\nconst b = 2')],
        },
        {
          type: 'image',
          attrs: {
            src: '/uploads/a.png',
            alt: 'Chart of tasks',
            width: 800,
            height: 450,
            caption: 'Figure 1',
          },
        },
        { type: 'horizontalRule' },
      ),
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Start here' }).id).toBe('start-here')
    expect(container.querySelectorAll('ul > li')).toHaveLength(1)
    expect(container.querySelectorAll('ol > li')).toHaveLength(1)
    expect(container.querySelector('blockquote')?.textContent).toBe('A quote.')
    const pre = container.querySelector('pre')!
    expect(pre.querySelector('code')?.textContent).toBe('const a = 1\nconst b = 2')
    // A scrollable code block must be reachable with the keyboard.
    expect(pre.getAttribute('tabindex')).toBe('0')
    const image = screen.getByRole('img', { name: 'Chart of tasks' })
    expect(image.getAttribute('src')).toBe('/uploads/a.png')
    expect(image.getAttribute('width')).toBe('800')
    expect(image.getAttribute('height')).toBe('450')
    expect(image.getAttribute('loading')).toBe('lazy')
    expect(container.querySelector('figure figcaption')?.textContent).toBe('Figure 1')
    expect(container.querySelector('hr')).not.toBeNull()
  })

  it('renders bold, italic, strike and inline code marks', () => {
    const { container } = renderDoc(
      doc(
        paragraph(
          text('b', [{ type: 'bold' }]),
          text('s', [{ type: 'strong' }]),
          text('i', [{ type: 'italic' }]),
          text('c', [{ type: 'code' }]),
          text('x', [{ type: 'strike' }]),
          text('u', [{ type: 'sparkle' }]),
          { type: 'hardBreak' },
        ),
      ),
    )
    expect(container.querySelectorAll('strong')).toHaveLength(2)
    expect(container.querySelector('em')?.textContent).toBe('i')
    expect(container.querySelector('p code')?.textContent).toBe('c')
    expect(container.querySelector('s')?.textContent).toBe('x')
    expect(container.querySelector('br')).not.toBeNull()
    // An unknown mark never loses the text.
    expect(container.textContent).toContain('u')
  })

  it('never renders an h1: the article page owns the single h1', () => {
    const { container } = renderDoc(doc(heading('Top', 1), heading('Deep', 6)))
    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelectorAll('h2')).toHaveLength(1)
    expect(container.querySelectorAll('h4')).toHaveLength(1)
  })

  it('has no critical accessibility violations', async () => {
    const { container } = renderDoc(
      doc(
        heading('Section'),
        paragraph(link('Read more', 'https://example.com')),
        { type: 'codeBlock', content: [text('x = 1')] },
        { type: 'image', attrs: { src: '/a.png', alt: 'A diagram' } },
      ),
    )
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('RichText safety', () => {
  it('escapes markup inside text instead of injecting it', () => {
    const payload = '<script>alert(1)</script><img src=x onerror=alert(1)>'
    const { container } = renderDoc(doc(paragraph(text(payload)), heading(payload)))
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.innerHTML).toContain('&lt;script&gt;')
    expect(container.textContent).toContain(payload)
  })

  it('keeps hostile alt and caption text inside their attribute and element', () => {
    const { container } = renderDoc(
      doc({
        type: 'image',
        attrs: { src: '/a.png', alt: '"><script>alert(1)</script>', caption: '<b>x</b>' },
      }),
    )
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('figcaption b')).toBeNull()
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('"><script>alert(1)</script>')
  })

  it('drops node types outside the allowed set, children included', () => {
    const { container } = renderDoc(
      doc(
        paragraph(text('safe')),
        { type: 'html', attrs: { html: '<img src=x onerror=alert(1)>' }, text: '<b>raw</b>' },
        {
          type: 'iframe',
          attrs: { src: 'https://evil.example' },
          content: [paragraph(text('hidden'))],
        },
        { type: 'script', content: [text('alert(1)')] },
        { type: 'table', content: [paragraph(text('cell'))] },
      ),
    )
    expect(container.textContent).toBe('safe')
    expect(container.querySelector('iframe, script, img, b, table')).toBeNull()
  })

  it('opens external links in a new tab with rel noopener and leaves internal links alone', () => {
    renderDoc(
      doc(
        paragraph(
          link('outside', 'https://example.com/page'),
          link('inside', '/contact'),
          link('mail', 'mailto:hi@example.com'),
          link('jump', '#section'),
        ),
      ),
    )
    const outside = screen.getByRole('link', { name: 'outside' })
    expect(outside.getAttribute('href')).toBe('https://example.com/page')
    expect(outside.getAttribute('target')).toBe('_blank')
    expect(outside.getAttribute('rel')).toContain('noopener')
    const inside = screen.getByRole('link', { name: 'inside' })
    expect(inside.getAttribute('target')).toBeNull()
    expect(inside.getAttribute('rel')).toBeNull()
    expect(screen.getByRole('link', { name: 'mail' }).getAttribute('target')).toBeNull()
    expect(screen.getByRole('link', { name: 'jump' }).getAttribute('href')).toBe('#section')
    // Only href is read from a link mark: the stray onclick never reaches the DOM.
    expect(outside.getAttribute('onclick')).toBeNull()
  })

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:x',
    '//evil.example',
    '/\\evil.example',
  ])('renders a link with href %j as plain text', (href) => {
    const { container } = renderDoc(doc(paragraph(link('click me', href))))
    expect(container.querySelector('a')).toBeNull()
    expect(container.textContent).toBe('click me')
  })

  it('does not render an image whose source is not http(s) or a root path', () => {
    const { container } = renderDoc(
      doc(
        { type: 'image', attrs: { src: 'javascript:alert(1)', alt: 'x' } },
        { type: 'image', attrs: { src: 'data:image/svg+xml,<svg onload=alert(1)>', alt: 'y' } },
        { type: 'image', attrs: { alt: 'no source' } },
      ),
    )
    expect(container.querySelector('img')).toBeNull()
  })

  it('uses an empty alt for an image without one, and ignores bad dimensions', () => {
    const { container } = renderDoc(
      doc({ type: 'image', attrs: { src: '/a.png', width: -3, height: 'tall' } }),
    )
    const image = container.querySelector('img')!
    expect(image.getAttribute('alt')).toBe('')
    expect(image.hasAttribute('width')).toBe(false)
    expect(image.hasAttribute('height')).toBe(false)
  })

  it('sends internal links through the localised link component when given one', () => {
    const Localised = ({ href, children, ...rest }: { href: never; children?: ReactNode }) => (
      <a {...rest} href={href} data-localised="">
        {children}
      </a>
    )
    renderDoc(doc(paragraph(link('inside', '/contact'), link('outside', 'https://example.com'))), {
      linkComponent: Localised,
    })
    expect(screen.getByRole('link', { name: 'inside' }).hasAttribute('data-localised')).toBe(true)
    expect(screen.getByRole('link', { name: 'outside' }).hasAttribute('data-localised')).toBe(false)
  })
})

describe('RichText heading ids', () => {
  const document = doc(
    heading('Intro'),
    paragraph(text('a')),
    heading('Intro'),
    heading('Details', 3),
    { type: 'blockquote', content: [heading('Quoted')] },
    heading('Intro'),
  )

  it('are unique across the rendered body', () => {
    const { container } = renderDoc(document)
    const ids = Array.from(container.querySelectorAll('h2, h3, h4')).map((el) => el.id)
    expect(ids).toEqual(['intro', 'intro-2', 'details', 'quoted', 'intro-3'])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('match the ids extractHeadings gives the table of contents, element by element', () => {
    const { container } = renderDoc(document)
    for (const { id, text: label } of extractHeadings(document)) {
      const element = container.querySelector(`#${id}`)
      expect(element, id).not.toBeNull()
      expect(element?.textContent).toBe(label)
    }
  })

  it('are the same on every render of the same document', () => {
    const first = renderDoc(document).container.innerHTML
    const second = renderDoc(document).container.innerHTML
    expect(second).toBe(first)
  })

  it('skip ids reserved by the surrounding page', () => {
    const { container } = renderDoc(doc(heading('Main content')), { reservedIds: ['main-content'] })
    expect(container.querySelector('h2')?.id).toBe('main-content-2')
  })
})
