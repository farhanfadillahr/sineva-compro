import { describe, expect, it } from 'vitest'
import {
  collectRichTextNodes,
  collectStringLeaves,
  findDashViolationsInRichText,
  findDashViolationsInTree,
} from '../../src/lib/copy/walk'

const EM = '—'
const EN = '–'

describe('collectStringLeaves', () => {
  it('returns dotted paths for nested objects and bracket paths for arrays', () => {
    const tree = {
      Home: { hero: { title: 'Hi', tags: ['a', { label: 'b' }, ['c', 'd']] } },
      top: 'x',
    }
    expect(collectStringLeaves(tree)).toEqual([
      { path: 'Home.hero.title', value: 'Hi' },
      { path: 'Home.hero.tags[0]', value: 'a' },
      { path: 'Home.hero.tags[1].label', value: 'b' },
      { path: 'Home.hero.tags[2][0]', value: 'c' },
      { path: 'Home.hero.tags[2][1]', value: 'd' },
      { path: 'top', value: 'x' },
    ])
  })

  it('skips numbers, booleans and null, and keeps empty strings', () => {
    expect(collectStringLeaves({ n: 1, b: true, z: null, u: undefined, e: '' })).toEqual([
      { path: 'e', value: '' },
    ])
  })

  it('uses an empty path for a root string and returns nothing for a root null', () => {
    expect(collectStringLeaves('solo')).toEqual([{ path: '', value: 'solo' }])
    expect(collectStringLeaves(null)).toEqual([])
  })
})

describe('findDashViolationsInTree', () => {
  it('reports nested key, array item and entity form with path and character', () => {
    const tree = {
      Home: { hero: { title: `Fast ${EM} simple` } },
      list: ['ok', `Mon${EN}Fri`],
      html: 'a &mdash; b',
      clean: 'range 10-50',
    }
    const found = findDashViolationsInTree(tree)
    expect(found.map((f) => [f.path, f.violation.char])).toEqual([
      ['Home.hero.title', EM],
      ['list[1]', EN],
      ['html', '&mdash;'],
    ])
  })

  it('returns an empty list for a clean tree', () => {
    expect(findDashViolationsInTree({ a: { b: ['c'] } })).toEqual([])
  })
})

describe('rich text helpers', () => {
  const doc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Fine text' },
          {
            type: 'text',
            text: `Bad ${EM} text`,
            marks: [{ type: 'link', attrs: { href: `https://example.com/a${EN}b` } }],
          },
        ],
      },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
    ],
  }

  it('collects only text node strings, not attrs such as hrefs', () => {
    expect(collectRichTextNodes(doc)).toEqual([
      { path: 'content[0].content[0].text', value: 'Fine text' },
      { path: 'content[0].content[1].text', value: `Bad ${EM} text` },
    ])
  })

  it('finds dashes in text nodes only', () => {
    const found = findDashViolationsInRichText(doc)
    expect(found.map((f) => [f.path, f.violation.char])).toEqual([
      ['content[0].content[1].text', EM],
    ])
  })

  it('tolerates empty or malformed documents', () => {
    expect(collectRichTextNodes(null)).toEqual([])
    expect(collectRichTextNodes({ type: 'doc' })).toEqual([])
    expect(collectRichTextNodes('nope')).toEqual([])
  })
})
