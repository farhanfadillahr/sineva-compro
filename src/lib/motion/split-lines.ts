// Runtime line splitting for the `lines` reveal (docs/design/motion.md section 4.1). Browsers do
// not expose where a paragraph wrapped, so the words are measured: every word goes into its own
// span, the rendered tops are read, and words that share a top become one line.
//
// Why wrap lines instead of words or letters: a line mask (`overflow: clip` per line, the text
// rising from below it) is the premium-site look, and one mask per line costs a handful of nodes
// where per-word spans cost dozens.
//
// Why only plain text: a heading with a link, `<em>` or `<br>` inside cannot be rebuilt from its
// words without losing that markup, so `splitIntoLines` refuses it and the caller falls back to a
// plain fade. Section titles are plain strings in the content model, so this is the rare case.

const LINE_ATTR = 'data-line'
const INNER_ATTR = 'data-line-inner'
const WORD_ATTR = 'data-word'
const SPLIT_ATTR = 'data-split'

/**
 * Group word indexes by rendered line. A word starts a new line only when it sits clearly lower
 * than the one before it (more than `tolerance` px): inline boxes of the same line differ by
 * sub-pixels, and a word that sits higher (an odd glyph box) never starts a line.
 */
export function groupByLine(tops: readonly number[], tolerance: number): number[][] {
  const lines: number[][] = []
  let lineTop = Number.NEGATIVE_INFINITY
  tops.forEach((top, i) => {
    if (lines.length === 0 || top - lineTop > tolerance) {
      lines.push([])
      lineTop = top
    }
    lines[lines.length - 1]!.push(i)
  })
  return lines
}

export type LineSplit = {
  readonly lineCount: number
  /** Put the original text node back and remove everything the split added. Idempotent. */
  revert: () => void
}

// Splits on ASCII whitespace only: `\s` also matches the non-breaking space, which must stay
// glued to its word ("10 000", "Rp 5") so a line can never break there.
const BREAKABLE = /[ \t\n\r\f]+/

const splits = new WeakMap<HTMLElement, LineSplit>()

/**
 * Split the text of `el` into one masked line per rendered line, or return null when it cannot be
 * done safely (element children, no text).
 *
 * Accessibility: the lines are `aria-hidden` and the element gets an `aria-label` with the full
 * text, so a screen reader reads the heading once, as a heading, in one piece. The original text
 * node is kept (detached) and put back by `revert`, so the DOM React rendered is restored exactly.
 *
 * Gotcha: React still owns the detached text node. If the component re-renders the heading with
 * different text while a split is active the change is not shown until the next split; headings
 * here are static per page, and callers revert as soon as the animation is over.
 */
export function splitIntoLines(el: HTMLElement): LineSplit | null {
  // A second call must not nest a split inside a split.
  splits.get(el)?.revert()

  const original = el.firstChild
  if (el.childNodes.length !== 1 || !original || original.nodeType !== Node.TEXT_NODE) return null
  const text = original.textContent ?? ''
  const words = text.split(BREAKABLE).filter(Boolean)
  if (words.length === 0) return null

  // Measure: one span per word, separated by plain spaces so the browser wraps exactly as it did
  // for the original text.
  const measure = document.createDocumentFragment()
  const spans = words.map((word, i) => {
    const span = document.createElement('span')
    span.setAttribute(WORD_ATTR, '')
    span.textContent = word
    if (i > 0) measure.append(' ')
    measure.append(span)
    return span
  })
  el.replaceChildren(measure)
  const rects = spans.map((s) => s.getBoundingClientRect())
  // Half a word's height separates two lines at any line-height of 1 or more.
  const tolerance = Math.max(2, (rects[0]?.height ?? 0) / 2)
  const lines = groupByLine(
    rects.map((r) => r.top),
    tolerance,
  )

  const previousLabel = el.getAttribute('aria-label')
  const built = document.createDocumentFragment()
  lines.forEach((indexes, lineIndex) => {
    const line = document.createElement('span')
    line.setAttribute(LINE_ATTR, '')
    line.setAttribute('aria-hidden', 'true')
    line.style.setProperty('--line', String(lineIndex))
    const inner = document.createElement('span')
    inner.setAttribute(INNER_ATTR, '')
    inner.textContent = indexes.map((i) => words[i]).join(' ')
    line.append(inner)
    built.append(line)
  })
  el.replaceChildren(built)
  // An existing label wins: someone chose it on purpose.
  if (previousLabel === null) el.setAttribute('aria-label', text.trim().replace(/\s+/g, ' '))
  el.setAttribute(SPLIT_ATTR, '')

  let active = true
  const split: LineSplit = {
    lineCount: lines.length,
    revert() {
      if (!active) return
      active = false
      splits.delete(el)
      el.replaceChildren(original)
      if (previousLabel === null) el.removeAttribute('aria-label')
      el.removeAttribute(SPLIT_ATTR)
    },
  }
  splits.set(el, split)
  return split
}
