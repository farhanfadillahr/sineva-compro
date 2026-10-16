import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ShareButtons } from '@/components/pages/blog/share-buttons'
import { criticalAxeViolations, REDUCED, stubMedia } from './sections-test-utils'

const labels = {
  groupLabel: 'Share this article',
  whatsapp: 'Share on WhatsApp',
  linkedin: 'Share on LinkedIn',
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  copyFailed: 'Could not copy the link.',
}
const URL_TO_SHARE = 'https://sineva.example/blog/a-post?x=1&y=2'

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

const renderButtons = () =>
  render(<ShareButtons title="A post & more" url={URL_TO_SHARE} labels={labels} />)
const copyButton = () => screen.getByRole('button', { name: labels.copyLink })
const status = () => screen.getByRole('status')

async function click(element: Element) {
  await act(async () => {
    fireEvent.click(element)
  })
}

beforeEach(() => {
  stubMedia({})
})
afterEach(() => {
  vi.useRealTimers()
  setClipboard(undefined)
})

describe('ShareButtons', () => {
  it('links to WhatsApp and LinkedIn with encoded urls, opening in a new tab safely', () => {
    renderButtons()
    const group = screen.getByRole('group', { name: labels.groupLabel })
    const whatsapp = screen.getByRole('link', { name: labels.whatsapp })
    expect(group.contains(whatsapp)).toBe(true)
    const wa = new URL(whatsapp.getAttribute('href')!)
    expect(wa.searchParams.get('text')).toBe(`A post & more ${URL_TO_SHARE}`)
    const li = new URL(screen.getByRole('link', { name: labels.linkedin }).getAttribute('href')!)
    expect(li.searchParams.get('url')).toBe(URL_TO_SHARE)
    for (const link of [whatsapp, screen.getByRole('link', { name: labels.linkedin })]) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('has an empty live region until something happens', () => {
    renderButtons()
    expect(status().textContent).toBe('')
  })

  it('copies the article url with the clipboard API and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    renderButtons()
    await click(copyButton())
    expect(writeText).toHaveBeenCalledWith(URL_TO_SHARE)
    expect(status().textContent).toBe(labels.linkCopied)
    expect(copyButton().getAttribute('data-state')).toBe('copied')
  })

  it('swaps the link icon for a static check, with no animation', async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    const { container } = renderButtons()
    expect(container.querySelector('[data-icon="link"]')).not.toBeNull()
    await click(copyButton())
    expect(container.querySelector('[data-icon="check"]')).not.toBeNull()
    expect(container.querySelector('[data-icon="link"]')).toBeNull()
    // No Lottie and no keyframe animation: the state change is the swap itself.
    expect(container.querySelector('[data-lottie-state]')).toBeNull()
    expect(container.innerHTML).not.toMatch(/animate-/)
  })

  it('behaves the same under reduced motion', async () => {
    stubMedia({ [REDUCED]: true })
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    const { container } = renderButtons()
    await click(copyButton())
    expect(status().textContent).toBe(labels.linkCopied)
    expect(container.querySelector('[data-icon="check"]')).not.toBeNull()
    expect(container.innerHTML).not.toMatch(/animate-/)
  })

  it('returns to the idle state after a moment', async () => {
    vi.useFakeTimers()
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    renderButtons()
    await click(copyButton())
    expect(status().textContent).toBe(labels.linkCopied)
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(status().textContent).toBe('')
    expect(copyButton().getAttribute('data-state')).toBe('idle')
  })

  it('shows the fallback message when the clipboard API rejects', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    renderButtons()
    await click(copyButton())
    expect(status().textContent).toBe(labels.copyFailed)
    expect(copyButton().getAttribute('data-state')).toBe('idle')
  })

  it('shows the fallback message when there is no clipboard (insecure context)', async () => {
    setClipboard(undefined)
    renderButtons()
    await click(copyButton())
    expect(status().textContent).toBe(labels.copyFailed)
  })

  it('has no critical accessibility violations', async () => {
    const { container } = renderButtons()
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})
