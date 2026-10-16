import { act, fireEvent, render, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/button'
import { SinoLaunchOverlay } from '@/components/mascot/sino-launch/sino-launch-overlay'
import { installMatchMedia, removeMatchMedia, type MediaController } from './motion-test-utils'
let media: MediaController
beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  media = installMatchMedia(false)
  vi.spyOn(navigator, 'webdriver', 'get').mockReturnValue(false)
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Chrome/140 Safari/537.36')
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably')
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(4)
})
afterEach(() => {
  cleanup()
  removeMatchMedia()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
function mount() {
  return render(
    <>
      <Button href="#destination" launch="booking">
        Book a free consultation
      </Button>
      <SinoLaunchOverlay />
    </>,
  )
}
describe('decorative CTA launch', () => {
  it('loads nothing on mount and skips an unwarmed click', () => {
    const { container, getByRole } = mount()
    expect(container.querySelector('video')).toBeNull()
    fireEvent.click(getByRole('link'))
    expect(container.querySelector('video')).toBeNull()
  })
  it('does not cancel the link and cleans up on ended', () => {
    const { container, getByRole } = mount()
    const link = getByRole('link')
    fireEvent.pointerOver(link)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => link.dispatchEvent(event))
    expect(event.defaultPrevented).toBe(false)
    expect(link.getAttribute('href')).toBe('#destination')
    const video = container.querySelector('video')!
    expect(video).not.toBeNull()
    expect(video.closest('[aria-hidden="true"]')).not.toBeNull()
    fireEvent.ended(video)
    expect(container.querySelector('video')).toBeNull()
    fireEvent.click(link)
    expect(container.querySelector('video')).toBeNull()
  })
  it('removes a stalled video by the hard timeout', () => {
    const { container, getByRole } = mount()
    fireEvent.focusIn(getByRole('link'))
    fireEvent.click(getByRole('link'))
    expect(container.querySelector('video')).not.toBeNull()
    act(() => vi.advanceTimersByTime(1500))
    expect(container.querySelector('video')).toBeNull()
  })
  it('never mounts under reduced motion', () => {
    act(() => media.set(true))
    const { container, getByRole } = mount()
    fireEvent.pointerOver(getByRole('link'))
    fireEvent.click(getByRole('link'))
    expect(container.querySelector('video')).toBeNull()
  })
  it('preserves the target of external actions', () => {
    const { getByRole } = render(
      <Button href="https://wa.me/6285199368510" target="_blank" launch="whatsapp">
        Chat on WhatsApp
      </Button>,
    )
    expect(getByRole('link').getAttribute('target')).toBe('_blank')
  })
})
