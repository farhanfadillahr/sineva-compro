import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { PublicPageShell } from '@/components/public/page-shell'

// Keys come back as their own text; the landmark is what matters here.
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))

// jsdom replaces the global URL, so paths are built from the working directory.
const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

// One skip-link target per page. The id used to sit on a layout wrapper as well as on the Home
// <main>, which left two elements with the same id and made the target ambiguous.
describe('skip-link target', () => {
  it('is main-content', () => {
    expect(MAIN_CONTENT_ID).toBe('main-content')
  })

  it('the public layout wrapper no longer carries the id', () => {
    const layout = read('src/app/(public)/[locale]/layout.tsx')
    expect(layout).not.toMatch(/id=\{MAIN_CONTENT_ID\}/)
    expect(layout).not.toContain('main-content')
  })

  it('a placeholder page shell renders one main landmark with the id', async () => {
    const { container } = render(await PublicPageShell({ page: 'about' }))
    const mains = container.querySelectorAll('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]!.id).toBe(MAIN_CONTENT_ID)
    expect(container.querySelectorAll(`#${MAIN_CONTENT_ID}`)).toHaveLength(1)
  })

  it('the shell main can take focus from the skip link', async () => {
    const { container } = render(await PublicPageShell({ page: 'about' }))
    expect(container.querySelector('main')!.getAttribute('tabindex')).toBe('-1')
  })

  it('the 404 page is a target too', async () => {
    const { default: NotFound } = await import('../../src/app/(public)/[locale]/not-found')
    const { container } = render(await NotFound())
    expect(container.querySelector('main')!.id).toBe(MAIN_CONTENT_ID)
  })
})
