import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
)
vi.mock('next/navigation', () => ({ notFound }))

// The gallery is a developer aid. In production it must not exist, not merely be hidden.
async function loadPage() {
  const mod = await import('../../src/app/(public)/[locale]/dev-ui/page')
  return mod.default
}

describe('dev-ui gallery', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 404 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const Page = await loadPage()
    expect(() => Page()).toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(1)
  })

  it('renders the component gallery outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const Page = await loadPage()
    render(Page())
    expect(notFound).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    // One live example of each primitive family.
    expect(screen.getAllByRole('button').length).toBeGreaterThan(5)
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
  })
})
