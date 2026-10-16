import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { NotFoundView } from '@/components/pages/not-found/not-found-view'
import {
  buildNotFoundMetadata,
  loadNotFoundPage,
} from '@/components/pages/not-found/not-found-model'
import type { NotFoundPageContent } from '@/features/content/types'
import { createStaticContentSource } from '../../src/content/static'
import en from '../../messages/en.json'
import { criticalAxeViolations } from './sections-test-utils'

const intl = (ui: ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  )

async function realPage(): Promise<NotFoundPageContent> {
  return (await createStaticContentSource().getPage('notFound', 'en'))!
}

describe('NotFoundView', () => {
  it('renders one main landmark that the skip link can focus', async () => {
    const { container } = intl(<NotFoundView page={await realPage()} />)
    const mains = container.querySelectorAll('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]!.id).toBe(MAIN_CONTENT_ID)
    expect(mains[0]!.getAttribute('tabindex')).toBe('-1')
  })

  it('has exactly one h1 with the headline from the content', async () => {
    const page = await realPage()
    intl(<NotFoundView page={page} />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]!.textContent).toBe(page.headline)
  })

  it('shows the body line from the content', async () => {
    const page = await realPage()
    intl(<NotFoundView page={page} />)
    expect(screen.getByText(page.body)).toBeTruthy()
  })

  it('links to Home, Services and Contact with the labels from the content', async () => {
    const page = await realPage()
    intl(<NotFoundView page={page} />)
    const hrefByLabel = Object.fromEntries(
      screen.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')]),
    )
    const expected = { home: '/', services: '/services', contact: '/contact' } as const
    expect(page.links.map((link) => link.target)).toEqual(['home', 'services', 'contact'])
    for (const link of page.links) {
      expect(hrefByLabel[link.label], link.label).toBe(
        expected[link.target as keyof typeof expected],
      )
    }
  })

  it('draws Sino confused as a decorative image (empty alt) through AnimatedPose', async () => {
    const { container } = intl(<NotFoundView page={await realPage()} />)
    const pose = container.querySelector('[data-animated-pose]')!
    expect(pose).not.toBeNull()
    const img = pose.querySelector('img')!
    expect(img.getAttribute('alt')).toBe('')
    expect(decodeURIComponent(img.getAttribute('src')!)).toContain(
      '/mascot/loops/sino-loop-confused',
    )
  })

  it('has exactly one image, so Sino is the only large mascot on the page', async () => {
    const { container } = intl(<NotFoundView page={await realPage()} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('writes no em or en dash in anything it renders', async () => {
    const { container } = intl(<NotFoundView page={await realPage()} />)
    expect(container.textContent).not.toMatch(/[–—]/)
  })

  it('keeps the links inside a labelled navigation', async () => {
    intl(<NotFoundView page={await realPage()} />)
    const nav = screen.getByRole('navigation', { name: en.NotFound.linksLabel })
    expect(within(nav).getAllByRole('link')).toHaveLength(3)
  })

  it('has no critical accessibility violations', async () => {
    const { container } = intl(<NotFoundView page={await realPage()} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('loadNotFoundPage', () => {
  it('returns the content page when the source has one', async () => {
    const page = await loadNotFoundPage(createStaticContentSource(), 'en', en.NotFound)
    expect(page.key).toBe('notFound')
    expect(page.headline).toBe((await realPage()).headline)
  })

  it('falls back to the messages instead of throwing when the source has no page, so a 404 never 500s', async () => {
    const empty = { getPage: async () => null } as unknown as Parameters<typeof loadNotFoundPage>[0]
    const page = await loadNotFoundPage(empty, 'en', en.NotFound)
    expect(page.headline).toBe(en.NotFound.title)
    expect(page.links.map((link) => link.target)).toContain('home')
  })
})

describe('buildNotFoundMetadata', () => {
  it('uses the content title and description and asks crawlers to skip the page', async () => {
    const page = await realPage()
    const metadata = buildNotFoundMetadata(page)
    expect(metadata.title).toEqual({ absolute: page.seo.metaTitle })
    expect(metadata.description).toBe(page.seo.metaDescription)
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})

describe('404 routes', () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
  const notFoundFile = read('src/app/(public)/[locale]/not-found.tsx')
  const catchAll = read('src/app/(public)/[locale]/[...rest]/page.tsx')

  it('not-found.tsx renders NotFoundView from the notFound content page', () => {
    expect(notFoundFile).toMatch(/NotFoundView/)
    expect(notFoundFile).toMatch(/loadNotFoundPage/)
  })

  it('not-found.tsx exports metadata with noindex', () => {
    expect(notFoundFile).toMatch(/export (async )?function generateMetadata/)
    expect(notFoundFile).toMatch(/buildNotFoundMetadata/)
  })

  it('an unmatched URL goes through notFound(), which is what sets the HTTP 404', () => {
    expect(catchAll).toMatch(/notFound\(\)/)
  })

  it('no longer carries the bare placeholder markup', () => {
    expect(notFoundFile).not.toMatch(/>404</)
  })
})
