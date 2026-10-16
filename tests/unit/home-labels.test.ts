import { describe, expect, it } from 'vitest'
import { homeLabelsFromMessages } from '../../src/components/pages/home/home-labels'
import { validatePublicCopy } from '../../src/lib/copy'
import en from '../../messages/en.json'

describe('Home UI labels in messages/en.json', () => {
  const labels = homeLabelsFromMessages(en)

  it('ships all three labels the Home page reads', () => {
    expect(Object.keys(labels).sort()).toEqual(['comingSoon', 'internalDemo', 'stickyBarLabel'])
  })

  it('follows the copy rules: sentence case, no dash, no trailing full stop on a label', () => {
    for (const [key, value] of Object.entries(labels)) {
      expect(validatePublicCopy(value!).ok, key).toBe(true)
      // Sentence case: the first word is capitalised, the other words are not (no Title Case).
      const [, ...rest] = value!.split(' ')
      for (const word of rest) expect(word, `${key}: "${value}"`).toBe(word.toLowerCase())
      expect(value, key).not.toMatch(/[.!]$/)
    }
  })

  it('names the demo badge as the design spec does (FR-PF-03)', () => {
    expect(labels.internalDemo).toBe('Internal demo project')
  })
})
