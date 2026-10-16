import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { buildPrivacyMetadata } from '@/components/pages/legal/privacy-metadata'
import { PrivacyView } from '@/components/pages/legal/privacy-view'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import type { PrivacyPageContent } from '@/features/content/types'
import { createStaticContentSource } from '../../src/content/static'
import { bulletList, doc, heading, paragraph } from '../../src/content/static/helpers'
import en from '../../messages/en.json'
import { criticalAxeViolations } from './sections-test-utils'

const intl = (ui: ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  )

async function realPage(): Promise<PrivacyPageContent> {
  return (await createStaticContentSource().getPage('privacy', 'en'))!
}

const withBody = (page: PrivacyPageContent, body: PrivacyPageContent['body']) => ({
  ...page,
  body,
})

describe('PrivacyView page structure', () => {
  it('renders one main landmark that the skip link can focus', async () => {
    const { container } = intl(<PrivacyView page={await realPage()} />)
    const mains = container.querySelectorAll('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]!.id).toBe(MAIN_CONTENT_ID)
    expect(mains[0]!.getAttribute('tabindex')).toBe('-1')
  })

  it('has exactly one h1, the page title', async () => {
    intl(<PrivacyView page={await realPage()} />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]!.textContent).toBe(en.Privacy.title)
  })

  it('never skips a heading level (h1, then h2, no jump past the next level)', async () => {
    const page = withBody(
      await realPage(),
      doc(heading('A'), heading('A1', 3), heading('Deep', 5), heading('B')),
    )
    const { container } = intl(<PrivacyView page={page} />)
    const levels = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
      Number(h.tagName[1]),
    )
    expect(levels[0]).toBe(1)
    levels.reduce((previous, level) => {
      expect(level).toBeLessThanOrEqual(previous + 1)
      return level
    })
  })

  it('renders every heading of the content as a heading with its id', async () => {
    const page = await realPage()
    const { container } = intl(<PrivacyView page={page} />)
    const expected = page.body.content
      .filter((node) => node.type === 'heading')
      .map((node) => node.content![0]!.text)
    const rendered = [...container.querySelectorAll('article h2')].map((h) => h.textContent)
    expect(rendered).toEqual(expected)
    for (const h of container.querySelectorAll('article h2')) expect(h.id).not.toBe('')
  })

  it('renders paragraphs and lists from the rich text', async () => {
    const { container } = intl(
      <PrivacyView
        page={withBody(
          await realPage(),
          doc(paragraph('Intro text'), heading('One'), paragraph('Body'), bulletList('x', 'y')),
        )}
      />,
    )
    expect(screen.getByText('Intro text')).toBeTruthy()
    expect(container.querySelectorAll('article ul li')).toHaveLength(2)
  })

  it('shows the last updated date in a <time> element with the machine-readable value', async () => {
    const page = await realPage()
    const { container } = intl(<PrivacyView page={page} />)
    const time = container.querySelector('time')!
    expect(time.getAttribute('datetime')).toBe(page.effectiveDate)
    expect(time.textContent).toBe('16 October 2026')
    expect(container.textContent).toContain(en.Privacy.lastUpdated)
  })

  it('uses a 720 px reading column', async () => {
    const { container } = intl(<PrivacyView page={await realPage()} />)
    const article = container.querySelector('article')!
    expect(article.className).toMatch(/max-w-\(--container-text\)|max-w-\[45rem\]|max-w-\[720px\]/)
  })

  it('writes no em or en dash in anything it renders', async () => {
    const { container } = intl(<PrivacyView page={await realPage()} />)
    expect(container.textContent).not.toMatch(/[–—]/)
  })

  it('has no critical accessibility violations', async () => {
    const { container } = intl(<PrivacyView page={await realPage()} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('PrivacyView table of contents', () => {
  it('is a labelled navigation landmark placed before the article', async () => {
    const { container } = intl(<PrivacyView page={await realPage()} />)
    const nav = screen.getByRole('navigation', { name: en.Privacy.tocLabel })
    const article = container.querySelector('article')!
    // Document order: a keyboard user meets the contents first and can jump from there.
    expect(nav.compareDocumentPosition(article) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('lists every heading, each link pointing at a real heading id', async () => {
    const page = await realPage()
    const { container } = intl(<PrivacyView page={page} />)
    const nav = screen.getByRole('navigation', { name: en.Privacy.tocLabel })
    const links = within(nav).getAllByRole('link')
    const headings = [...container.querySelectorAll('article h2, article h3, article h4')]
    expect(links).toHaveLength(headings.length)
    links.forEach((link, index) => {
      const target = link.getAttribute('href')!
      expect(target.startsWith('#')).toBe(true)
      const heading = container.querySelector(`[id="${target.slice(1)}"]`)
      expect(heading, target).toBe(headings[index])
      expect(link.textContent).toBe(headings[index]!.textContent)
    })
  })

  it('keeps duplicate headings apart so both entries reach their own section', async () => {
    const { container } = intl(
      <PrivacyView
        page={withBody(
          await realPage(),
          doc(heading('Contact'), paragraph('a'), heading('Contact'), paragraph('b')),
        )}
      />,
    )
    const nav = screen.getByRole('navigation', { name: en.Privacy.tocLabel })
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(new Set(hrefs).size).toBe(2)
    for (const href of hrefs)
      expect(container.querySelectorAll(`[id="${href!.slice(1)}"]`)).toHaveLength(1)
  })

  it('is reachable by keyboard: plain links, no tabindex tricks, no click-only handlers', async () => {
    intl(<PrivacyView page={await realPage()} />)
    const nav = screen.getByRole('navigation', { name: en.Privacy.tocLabel })
    for (const link of within(nav).getAllByRole('link')) {
      expect(link.tagName).toBe('A')
      expect(link.getAttribute('tabindex')).toBeNull()
    }
  })

  it('sticks only from 1024 px up (lg) and stays out of the flow below it', async () => {
    intl(<PrivacyView page={await realPage()} />)
    const nav = screen.getByRole('navigation', { name: en.Privacy.tocLabel })
    const sticky = nav.closest('[data-slot="privacy-toc"]') as HTMLElement
    expect(sticky.className).toMatch(/lg:sticky/)
    expect(sticky.className).toMatch(/lg:top-/)
    expect(sticky.className).not.toMatch(/(^|\s)sticky(\s|$)/)
  })

  it('is omitted when the policy has no headings', async () => {
    intl(<PrivacyView page={withBody(await realPage(), doc(paragraph('Just text.')))} />)
    expect(screen.queryByRole('navigation', { name: en.Privacy.tocLabel })).toBeNull()
  })
})

describe('privacy route', () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
  const route = read('src/app/(public)/[locale]/privacy-policy/page.tsx')

  it('is no longer the placeholder shell', () => {
    expect(route).not.toMatch(/PublicPageShell/)
    expect(route).toMatch(/PrivacyView/)
  })

  it('reads the privacy page through the content contract and 404s without it', () => {
    expect(route).toMatch(/getPage\(\s*['"]privacy['"]/)
    expect(route).toMatch(/notFound\(\)/)
  })

  it('exports metadata built from the content SEO fields', () => {
    expect(route).toMatch(/export (async )?function generateMetadata/)
    expect(route).toMatch(/buildPrivacyMetadata/)
  })
})

describe('buildPrivacyMetadata', () => {
  it('uses the SEO fields as given, with an absolute title and the canonical path', async () => {
    const page = await realPage()
    const metadata = buildPrivacyMetadata(page, null)
    expect(metadata.title).toEqual({ absolute: page.seo.metaTitle })
    expect(metadata.description).toBe(page.seo.metaDescription)
    expect(metadata.alternates?.canonical).toBe('/privacy-policy')
  })

  it('leaves robots to the layout for an indexable page, and sets noindex when the content says so', async () => {
    const page = await realPage()
    expect(page.seo.noindex).toBe(false)
    expect(buildPrivacyMetadata(page, null).robots).toBeUndefined()
    const hidden = { ...page, seo: { ...page.seo, noindex: true } }
    expect(buildPrivacyMetadata(hidden, null).robots).toEqual({ index: false, follow: false })
  })
})
