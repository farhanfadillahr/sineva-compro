import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeToggle } from '../../src/components/theme/theme-toggle'
import { THEME_SCRIPT, THEME_STORAGE_KEY } from '../../src/lib/theme/theme'

const labels = { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' }
const setSystem = (dark: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
afterEach(() => localStorage.clear())

describe('theme', () => {
  it('follows the system on the first visit, before paint', () => {
    setSystem(true)
    new Function(THEME_SCRIPT)()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    setSystem(false)
    new Function(THEME_SCRIPT)()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('lets a stored choice win over the system', () => {
    setSystem(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    new Function(THEME_SCRIPT)()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('toggles, stores the choice and names the action for screen readers', () => {
    setSystem(false)
    document.documentElement.setAttribute('data-theme', 'light')
    render(<ThemeToggle labels={labels} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})
