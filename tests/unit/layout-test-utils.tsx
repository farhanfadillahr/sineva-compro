import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { vi } from 'vitest'
import en from '../../messages/en.json'
import { siteSettings } from '../fixtures/public/site-settings'
import { services as serviceFixtures } from '../fixtures/public/services'

// Shared by tests/unit/layout-*.test.tsx. Not named *.test.tsx, so vitest does not run it.

/** Mutable on purpose: a test sets `navigationState.pathname` before rendering. */
export const navigationState = { pathname: '/' }

/**
 * Stand-in for '@/i18n/navigation'. The real next-intl Link needs the Next.js router context,
 * which does not exist under jsdom. Use it as
 * `vi.mock('@/i18n/navigation', async () => (await import('./layout-test-utils')).navigationMock)`.
 */
export const navigationMock = {
  // jsdom cannot navigate, so a real click on an href would log "not implemented: navigation".
  // The caller's onClick still runs first, which is what the tests observe.
  Link: ({ href, onClick, ...rest }: ComponentProps<'a'>) => (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event)
        event.preventDefault()
      }}
      {...rest}
    />
  ),
  usePathname: () => navigationState.pathname,
}

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * jsdom has no matchMedia. Queries are matched by exact string. `set` flips a query and notifies
 * its listeners, like a real viewport resize or OS setting change.
 */
export function installMatchMedia(initial: Record<string, boolean> = {}) {
  const state = new Map(Object.entries(initial))
  const listeners = new Map<string, Set<() => void>>()
  window.matchMedia = vi.fn((query: string) => ({
    get matches() {
      return state.get(query) ?? false
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => {
      const set = listeners.get(query) ?? new Set()
      set.add(listener)
      listeners.set(query, set)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.get(query)?.delete(listener)
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  return {
    set(query: string, value: boolean) {
      state.set(query, value)
      listeners.get(query)?.forEach((listener) => listener())
    },
  }
}

export function removeMatchMedia() {
  // jsdom does not define it, so deleting restores the default environment.
  Reflect.deleteProperty(window, 'matchMedia')
}

/** Sets the scroll offset and fires one scroll event, like a browser scroll step. */
export function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
  window.dispatchEvent(new Event('scroll'))
}

export function resetScroll() {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
}

function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale="en"
      messages={en}
      // A missing key must fail the test, not render the production fallback text.
      onError={(error) => {
        throw error
      }}
    >
      {children}
    </NextIntlClientProvider>
  )
}

/** A wrapper (not a nested render) so `rerender` keeps the provider. */
export function renderWithIntl(ui: ReactElement) {
  return render(ui, { wrapper: IntlWrapper })
}

/** The props the layout passes down: serialisable projections of the fixture content. */
export const navServices = serviceFixtures.map(({ slug, title, summary, icon }) => ({
  slug,
  title,
  summary,
  icon,
}))
export const whatsappSettings = siteSettings.whatsapp
export const fixtureSiteSettings = siteSettings
