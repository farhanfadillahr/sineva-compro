import { describe, expect, it } from 'vitest'
import {
  buildPrivacyOutline,
  formatLegalDate,
} from '../../src/components/pages/legal/privacy-outline'
import { bulletList, doc, heading, paragraph } from '../../src/content/static/helpers'
import { privacyBody } from '../../src/content/static/privacy'

describe('buildPrivacyOutline', () => {
  it('lists every heading of the real privacy content, in order', () => {
    const { headings } = buildPrivacyOutline(privacyBody)
    const expected = privacyBody.content
      .filter((node) => node.type === 'heading')
      .map((node) => node.content?.[0]?.text)
    expect(expected.length).toBeGreaterThan(5)
    expect(headings.map((h) => h.text)).toEqual(expected)
  })

  it('gives every heading a unique, URL-safe id', () => {
    const { headings } = buildPrivacyOutline(privacyBody)
    const ids = headings.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('derives ids from the text, so they stay stable when sections are added elsewhere', () => {
    const before = buildPrivacyOutline(doc(heading('Retention'), heading('Who can access')))
    const after = buildPrivacyOutline(
      doc(heading('Brand new first section'), heading('Retention'), heading('Who can access')),
    )
    expect(after.headings.find((h) => h.text === 'Retention')!.id).toBe(before.headings[0]!.id)
    expect(after.headings.find((h) => h.text === 'Who can access')!.id).toBe(before.headings[1]!.id)
  })

  it('does not let duplicate headings collide', () => {
    const { headings } = buildPrivacyOutline(
      doc(heading('Contact'), paragraph('a'), heading('Contact'), heading('Contact')),
    )
    expect(headings.map((h) => h.id)).toEqual(['contact', 'contact-2', 'contact-3'])
  })

  it('does not collide with ids the page itself owns', () => {
    const { headings } = buildPrivacyOutline(
      doc(heading('Main content'), heading('Privacy title'), heading('Privacy toc')),
    )
    for (const h of headings) {
      expect(h.id).not.toBe('main-content')
      expect(h.id).not.toBe('privacy-title')
      expect(h.id).not.toBe('privacy-toc')
    }
  })

  it('falls back to a usable id for a heading with no letters', () => {
    const { headings } = buildPrivacyOutline(doc(heading('???'), heading('2026')))
    expect(headings.map((h) => h.id)).toEqual(['section', 'section-2026'])
  })

  it('never emits an h1 and never skips a level', () => {
    const { headings } = buildPrivacyOutline(
      doc(
        heading('Top', 1),
        heading('Deep jump', 4),
        heading('Back up', 2),
        heading('Child', 3),
        heading('Skip again', 6),
      ),
    )
    expect(headings.map((h) => h.level)).toEqual([2, 3, 2, 3, 4])
  })

  it('keeps the text before the first heading as intro blocks, and every node exactly once', () => {
    const { blocks } = buildPrivacyOutline(
      doc(paragraph('intro'), heading('One'), paragraph('body'), bulletList('x', 'y')),
    )
    expect(blocks.map((b) => (b.kind === 'heading' ? `h:${b.heading.text}` : b.node.type))).toEqual(
      ['paragraph', 'h:One', 'paragraph', 'bulletList'],
    )
  })

  it('handles a document with no headings', () => {
    const outline = buildPrivacyOutline(doc(paragraph('only text')))
    expect(outline.headings).toEqual([])
    expect(outline.blocks).toHaveLength(1)
  })
})

describe('formatLegalDate', () => {
  it('formats an ISO date as a long English date', () => {
    expect(formatLegalDate('2026-10-16')).toBe('16 October 2026')
  })

  it('is timezone independent (a date, not an instant)', () => {
    expect(formatLegalDate('2026-01-01')).toBe('1 January 2026')
    expect(formatLegalDate('2026-12-31')).toBe('31 December 2026')
  })

  it('returns the input for a value that is not a date, instead of "Invalid Date"', () => {
    expect(formatLegalDate('soon')).toBe('soon')
  })
})
