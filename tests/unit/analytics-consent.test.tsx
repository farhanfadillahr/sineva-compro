import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  AnalyticsConsent,
  ConsentSettingsButton,
} from '../../src/components/consent/analytics-consent'
import { CONSENT_STORAGE_KEY, GA_MEASUREMENT_ID } from '../../src/lib/consent/analytics-consent'

// next/script injects tags itself; here it renders a marker so the test can see what would load.
vi.mock('next/script', () => ({
  default: ({ id, src }: { id: string; src?: string }) => (
    <script data-testid="next-script" data-id={id} data-src={src} />
  ),
}))

const labels = {
  title: 'Cookies for analytics',
  body: 'We would like to use Google Analytics cookies.',
  accept: 'Accept analytics',
  decline: 'Decline',
}
const renderConsent = () =>
  render(
    <>
      <AnalyticsConsent labels={labels} privacyLink={<a href="#privacy">Privacy</a>} />
      <ConsentSettingsButton label="Cookie settings" />
    </>,
  )
const scripts = () => screen.queryAllByTestId('next-script').map((s) => s.getAttribute('data-id'))
const banner = () => screen.queryByRole('region', { name: labels.title })
const flag = () => (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`]

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  localStorage.clear()
  delete (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`]
})

describe('analytics consent (CPR-109)', () => {
  it('loads nothing from Google before a choice, and shows the banner', () => {
    renderConsent()
    expect(scripts()).toEqual([])
    expect(banner()).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeTruthy()
  })

  it('loads Google Analytics after accepting and remembers the choice', () => {
    renderConsent()
    fireEvent.click(screen.getByRole('button', { name: labels.accept }))
    expect(scripts()).toEqual(['google-tag-init', 'google-tag'])
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted')
    expect(banner()).toBeNull()
    cleanup()
    renderConsent()
    expect(scripts()).toEqual(['google-tag-init', 'google-tag'])
    expect(banner()).toBeNull()
  })

  it('keeps Google Analytics off after declining, without asking again', () => {
    renderConsent()
    fireEvent.click(screen.getByRole('button', { name: labels.decline }))
    expect(scripts()).toEqual([])
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
    cleanup()
    renderConsent()
    expect(banner()).toBeNull()
    expect(scripts()).toEqual([])
  })

  it('reopens from the footer, focuses the banner, and withdrawing turns GA off and clears _ga', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    document.cookie = '_ga=GA1.1.123; path=/'
    document.cookie = '_ga_SD295J8222=GS1.1.456; path=/'
    renderConsent()
    expect(banner()).toBeNull()
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' })))
    expect(banner()).not.toBeNull()
    expect(document.activeElement?.textContent).toBe(labels.title)
    fireEvent.click(screen.getByRole('button', { name: labels.decline }))
    expect(flag()).toBe(true)
    expect(document.cookie).not.toMatch(/_ga/)
    expect(scripts()).toEqual([])
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
  })

  it('accepting again clears the opt-out flag', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied')
    ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true
    renderConsent()
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' })))
    fireEvent.click(screen.getByRole('button', { name: labels.accept }))
    expect(flag()).toBeUndefined()
    expect(scripts()).toEqual(['google-tag-init', 'google-tag'])
  })
})
