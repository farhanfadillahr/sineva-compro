import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SectionsGalleryPage from '../../src/app/(public)/[locale]/dev-ui/sections/page'
import { stubMedia } from './sections-test-utils'

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
)
vi.mock('next/navigation', () => ({ notFound }))

// Same contract as /dev-ui: a developer aid that must not exist in production. The page module
// is imported statically for the same reason as in ui-dev-gallery.test.tsx (React picks its jsx
// runtime when first loaded).
describe('dev-ui sections gallery', () => {
  beforeEach(() => stubMedia({}))
  afterEach(() => vi.unstubAllEnvs())

  it('returns 404 in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => SectionsGalleryPage()).toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(1)
  })

  it('renders every block from fixture data outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { container } = render(SectionsGalleryPage())
    expect(notFound).not.toHaveBeenCalled()
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBeGreaterThan(0)
    for (const variant of ['sino-canvas', 'sino-still', 'mockup', 'scene']) {
      expect(container.querySelector(`[data-variant="${variant}"]`), variant).toBeTruthy()
    }
    expect(container.querySelectorAll('[data-variant="path"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-variant="task"]').length).toBeGreaterThan(0)
    expect(container.querySelector('[data-slot="sticky-steps"]')).toBeTruthy()
    expect(container.querySelector('[data-slot="faq-accordion"]')).toBeTruthy()
    expect(container.querySelector('#final-cta')).toBeTruthy()
    expect(container.querySelectorAll('script[type="application/ld+json"]').length).toBe(1)
  })

  it('keeps one inverse section on the gallery page', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { container } = render(SectionsGalleryPage())
    expect(container.querySelectorAll('[data-tone="inverse"]')).toHaveLength(1)
  })
})
