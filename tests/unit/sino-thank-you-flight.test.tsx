import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThankYouFlight } from '@/components/mascot/sino-launch/thank-you-flight'
import { installMatchMedia, removeMatchMedia } from './motion-test-utils'

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  installMatchMedia(false)
  Object.defineProperty(navigator, 'webdriver', { configurable: true, value: false })
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Chrome/140 Safari/537.36')
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably')
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  removeMatchMedia()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const mount = () =>
  render(
    <StrictMode>
      <ThankYouFlight>
        <span>Thumbs up</span>
      </ThankYouFlight>
    </StrictMode>,
  )

describe('thank-you flyby', () => {
  it('plays after a recent handoff, releases the video and skips a refresh', async () => {
    sessionStorage.setItem('sineva:contact-handoff', String(Date.now()))
    const view = mount()
    await act(() => vi.runAllTicks())
    const video = view.container.querySelector('video')!
    expect(video.getAttribute('src')).toBe('/mascot/launch/sino-flyby-mail.webm')
    expect(sessionStorage.getItem('sineva:contact-handoff')).toBeNull()
    expect(video.closest('[aria-hidden="true"]')).not.toBeNull()
    fireEvent.playing(video)
    expect(view.getByText('Thumbs up').parentElement?.style.opacity).toBe('0')
    fireEvent.ended(video)
    expect(view.container.querySelector('video')).toBeNull()
    expect(video.getAttribute('src')).toBeNull()
    expect(view.getByText('Thumbs up').parentElement?.style.opacity).toBe('1')
    view.unmount()
    const refresh = mount()
    await act(() => vi.runAllTicks())
    expect(refresh.container.querySelector('video')).toBeNull()
  })

  it.each([null, 'invalid', String(Date.now() - 120000), String(Date.now() + 120000)])(
    'skips a direct, stale or malformed handoff (%s)',
    async (flag) => {
      if (flag) sessionStorage.setItem('sineva:contact-handoff', flag)
      const view = mount()
      await act(() => vi.runAllTicks())
      expect(view.container.querySelector('video')).toBeNull()
    },
  )

  it('keeps the fallback and removes a stalled video by 1.5 seconds', async () => {
    sessionStorage.setItem('sineva:contact-handoff', String(Date.now()))
    const view = mount()
    await act(() => vi.runAllTicks())
    expect(view.container.querySelector('video')).not.toBeNull()
    expect(view.getByText('Thumbs up').parentElement?.style.opacity).toBe('1')
    act(() => vi.advanceTimersByTime(1500))
    expect(view.container.querySelector('video')).toBeNull()
  })

  it('consumes the handoff without a video under reduced motion', async () => {
    removeMatchMedia()
    installMatchMedia(true)
    sessionStorage.setItem('sineva:contact-handoff', String(Date.now()))
    const view = mount()
    await act(() => vi.runAllTicks())
    expect(view.container.querySelector('video')).toBeNull()
    expect(sessionStorage.getItem('sineva:contact-handoff')).toBeNull()
  })
})
