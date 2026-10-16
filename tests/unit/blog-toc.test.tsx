import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TableOfContents } from '@/components/pages/blog/table-of-contents'
import { pickActiveHeading } from '@/components/pages/blog/toc-active'
import { installIntersectionObserver, MockIntersectionObserver } from './motion-test-utils'

const HEADINGS = [
  { id: 'one', text: 'One', level: 2 as const },
  { id: 'two', text: 'Two', level: 3 as const },
  { id: 'three', text: 'Three', level: 2 as const },
]

describe('pickActiveHeading', () => {
  const order = ['one', 'two', 'three']

  it('takes the first heading in document order that is inside the reading band', () => {
    expect(pickActiveHeading(new Set(['two', 'three']), order, null)).toBe('two')
  })

  it('keeps the previous heading while none is inside the band (a long section)', () => {
    expect(pickActiveHeading(new Set(), order, 'two')).toBe('two')
  })

  it('is null before any heading was reached', () => {
    expect(pickActiveHeading(new Set(), order, null)).toBeNull()
  })

  it('ignores ids that are not in the list', () => {
    expect(pickActiveHeading(new Set(['ghost']), order, 'one')).toBe('one')
  })
})

describe('TableOfContents', () => {
  let IO: ReturnType<typeof installIntersectionObserver>

  beforeEach(() => {
    IO = installIntersectionObserver()
    for (const { id, text } of HEADINGS) {
      const element = document.createElement('h2')
      element.id = id
      element.textContent = text
      document.body.append(element)
    }
  })
  afterEach(() => {
    document.body.replaceChildren()
  })

  const renderToc = () =>
    render(<TableOfContents label="Table of contents" title="On this page" headings={HEADINGS} />)

  it('lists the headings as links to their ids, in order', () => {
    renderToc()
    const nav = screen.getByRole('navigation', { name: 'Table of contents' })
    const links = Array.from(nav.querySelectorAll('a'))
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['One', '#one'],
      ['Two', '#two'],
      ['Three', '#three'],
    ])
    expect(screen.getByText('On this page')).not.toBeNull()
  })

  it('works by keyboard: every entry is a focusable link', async () => {
    const user = userEvent.setup()
    renderToc()
    await user.tab()
    expect(document.activeElement?.getAttribute('href')).toBe('#one')
    await user.tab()
    expect(document.activeElement?.getAttribute('href')).toBe('#two')
  })

  it('indents h3 entries under their h2', () => {
    renderToc()
    expect(
      screen.getByRole('link', { name: 'Two' }).closest('li')?.getAttribute('data-level'),
    ).toBe('3')
    expect(
      screen.getByRole('link', { name: 'One' }).closest('li')?.getAttribute('data-level'),
    ).toBe('2')
  })

  it('highlights the heading in view and moves the highlight as the reader scrolls', () => {
    renderToc()
    const current = () =>
      screen
        .getAllByRole('link')
        .filter((a) => a.getAttribute('aria-current') === 'location')
        .map((a) => a.textContent)
    expect(current()).toEqual([])
    act(() => {
      MockIntersectionObserver.fire(document.getElementById('one')!, { isIntersecting: true })
    })
    expect(current()).toEqual(['One'])
    act(() => {
      MockIntersectionObserver.fire(document.getElementById('one')!, { isIntersecting: false })
      MockIntersectionObserver.fire(document.getElementById('two')!, { isIntersecting: true })
    })
    expect(current()).toEqual(['Two'])
  })

  it('keeps the last highlight while the reader is inside a long section', () => {
    renderToc()
    act(() => {
      MockIntersectionObserver.fire(document.getElementById('two')!, { isIntersecting: true })
    })
    act(() => {
      MockIntersectionObserver.fire(document.getElementById('two')!, { isIntersecting: false })
    })
    expect(screen.getByRole('link', { name: 'Two' }).getAttribute('aria-current')).toBe('location')
  })

  it('clears the highlight when the reader scrolls back above the first heading', () => {
    renderToc()
    act(() => {
      MockIntersectionObserver.fire(document.getElementById('one')!, { isIntersecting: true })
    })
    act(() => {
      MockIntersectionObserver.fire(document.getElementById('one')!, {
        isIntersecting: false,
        boundingClientRect: { top: 300 } as DOMRect,
      })
    })
    expect(screen.getAllByRole('link').every((a) => a.getAttribute('aria-current') === null)).toBe(
      true,
    )
  })

  it('stops observing when it unmounts', () => {
    const { unmount } = renderToc()
    expect(IO.liveObserverCount()).toBeGreaterThan(0)
    unmount()
    expect(IO.liveObserverCount()).toBe(0)
  })

  it('renders without IntersectionObserver (old browsers) and just shows the links', () => {
    // @ts-expect-error simulate a browser without the API
    delete globalThis.IntersectionObserver
    renderToc()
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })
})
