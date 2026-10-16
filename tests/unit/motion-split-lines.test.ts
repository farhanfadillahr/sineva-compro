// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { groupByLine, splitIntoLines } from '../../src/lib/motion/split-lines'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('groupByLine', () => {
  it('starts a new line when a word sits lower than the previous one', () => {
    expect(groupByLine([0, 0, 0, 40, 40, 80], 20)).toEqual([[0, 1, 2], [3, 4], [5]])
  })

  it('treats sub-pixel and small differences as the same line (inline-box rounding)', () => {
    expect(groupByLine([0, 0.4, 1.2, 40, 40.6], 20)).toEqual([
      [0, 1, 2],
      [3, 4],
    ])
  })

  it('does not start a new line for a word that sits higher (superscript, odd glyph boxes)', () => {
    expect(groupByLine([40, 38, 40, 80], 20)).toEqual([[0, 1, 2], [3]])
  })

  it('returns no lines for no words', () => {
    expect(groupByLine([], 20)).toEqual([])
  })
})

/**
 * jsdom does no layout. Make every word span report the top of the line it would land on, taken
 * from a table keyed by word, which is how a browser would have wrapped the heading.
 */
function wrapAs(lines: string[][]) {
  const lineOf = new Map<string, number>()
  lines.forEach((words, i) => words.forEach((w) => lineOf.set(w, i)))
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const top = this.hasAttribute('data-word') ? (lineOf.get(this.textContent ?? '') ?? 0) * 40 : 0
    return {
      top,
      height: 32,
      bottom: top + 32,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: top,
    } as DOMRect
  })
}

function heading(text: string, attrs = '') {
  document.body.innerHTML = `<h2 ${attrs}>${text}</h2>`
  return document.querySelector('h2')!
}

describe('splitIntoLines', () => {
  it('wraps every rendered line in a mask with an inner span, in order', () => {
    wrapAs([['Make', 'work', 'feel'], ['lighter']])
    const el = heading('Make work feel lighter')
    const split = splitIntoLines(el)
    expect(split?.lineCount).toBe(2)
    const lines = [...el.querySelectorAll('[data-line]')]
    expect(lines.map((l) => l.textContent)).toEqual(['Make work feel', 'lighter'])
    for (const l of lines) expect(l.querySelector(':scope > [data-line-inner]')).not.toBeNull()
    expect(lines.map((l) => (l as HTMLElement).style.getPropertyValue('--line'))).toEqual([
      '0',
      '1',
    ])
  })

  it('keeps the heading readable as one string: aria-label on it, lines hidden from the tree', () => {
    wrapAs([['A', 'B'], ['C']])
    const el = heading('A B C')
    splitIntoLines(el)
    expect(el.getAttribute('aria-label')).toBe('A B C')
    expect(el.hasAttribute('data-split')).toBe(true)
    for (const l of el.querySelectorAll('[data-line]')) {
      expect(l.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('revert puts the original text node back and removes everything it added', () => {
    wrapAs([['A'], ['B']])
    const el = heading('A B')
    const original = el.firstChild
    const split = splitIntoLines(el)!
    split.revert()
    expect(el.childNodes).toHaveLength(1)
    expect(el.firstChild).toBe(original)
    expect(el.textContent).toBe('A B')
    expect(el.hasAttribute('aria-label')).toBe(false)
    expect(el.hasAttribute('data-split')).toBe(false)
  })

  it('revert restores an aria-label the heading already had', () => {
    wrapAs([['A'], ['B']])
    const el = heading('A B', 'aria-label="Custom"')
    const split = splitIntoLines(el)!
    expect(el.getAttribute('aria-label')).toBe('Custom')
    split.revert()
    expect(el.getAttribute('aria-label')).toBe('Custom')
  })

  it('splitting twice in a row is safe: the second call reverts first', () => {
    wrapAs([['A'], ['B']])
    const el = heading('A B')
    const first = splitIntoLines(el)!
    first.revert()
    const second = splitIntoLines(el)!
    expect(second.lineCount).toBe(2)
    expect(el.querySelectorAll('[data-line]')).toHaveLength(2)
  })

  it('refuses a heading with element children (links, em, br): it cannot be re-flowed safely', () => {
    const el = heading('A <em>B</em> C')
    expect(splitIntoLines(el)).toBeNull()
    expect(el.innerHTML).toBe('A <em>B</em> C')
  })

  it('refuses an empty heading', () => {
    expect(splitIntoLines(heading('   '))).toBeNull()
    expect(splitIntoLines(heading(''))).toBeNull()
  })

  it('keeps non-breaking spaces inside their word', () => {
    wrapAs([['10 000', 'users']])
    const el = heading('10 000 users')
    splitIntoLines(el)
    expect(el.querySelector('[data-line-inner]')?.textContent).toBe('10 000 users')
  })

  it('reports a single line for a short heading', () => {
    wrapAs([['Hi', 'there']])
    const el = heading('Hi there')
    expect(splitIntoLines(el)?.lineCount).toBe(1)
  })
})
