import { describe, expect, it } from 'vitest'
import { parseFields } from '../../src/features/cms/fields'
import { faqConfig } from '../../src/features/collections/configs'
import { collectionSeedData } from '../../src/features/collections/seed-data'
import {
  buildFaqPageJsonLd,
  faqEntriesFromDto,
  serializeJsonLd,
} from '../../src/components/sections/_internal/faq'
import type { FaqItem } from '../../src/features/content/types'

const answer = (content: unknown[]) => ({ type: 'doc', content })
const text = (value: string, marks?: unknown[]) => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
})

describe('FAQ answers', () => {
  const ok = (doc: unknown) =>
    parseFields(faqConfig.localeSchema, { question: 'Why?', answer: doc }).ok

  it('accepts paragraphs and lists with bold, italic and links', () => {
    expect(
      ok(
        answer([
          { type: 'paragraph', content: [text('Plain '), text('bold', [{ type: 'bold' }])] },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [text('See', [{ type: 'link', attrs: { href: '/contact' } }])],
                  },
                ],
              },
            ],
          },
        ]),
      ),
    ).toBe(true)
  })

  it.each([
    ['a heading', answer([{ type: 'heading', attrs: { level: 2 }, content: [text('H')] }])],
    ['a code mark', answer([{ type: 'paragraph', content: [text('x', [{ type: 'code' }])] }])],
    [
      'a quote',
      answer([{ type: 'blockquote', content: [{ type: 'paragraph', content: [text('q')] }] }]),
    ],
    ['an image', answer([{ type: 'image', attrs: { src: '/a.png', alt: 'a' } }])],
    ['an em dash', answer([{ type: 'paragraph', content: [text('a — b')] }])],
  ])('rejects %s', (_, doc) => {
    expect(ok(doc)).toBe(false)
  })

  it('accepts only known tags or service tags', () => {
    const tags = (value: string[]) => parseFields(faqConfig.globalSchema, { tags: value }).ok
    expect(tags(['home', 'service:ai-build'])).toBe(true)
    expect(tags(['footer'])).toBe(false)
    expect(tags(['service:AI Build'])).toBe(false)
    expect(tags([])).toBe(false)
  })
})

describe('FAQPage JSON-LD from the library', () => {
  it('builds a valid FAQPage with plain-text answers and no raw markup', () => {
    const items: FaqItem[] = collectionSeedData.faq.launch().map((row) => {
      const local = row.local as FaqItem
      return { question: local.question, answer: local.answer }
    })
    items.push({
      question: 'Is <script> safe?',
      answer: answer([
        { type: 'paragraph', content: [text('</script><b>x</b>')] },
      ]) as FaqItem['answer'],
    })
    const jsonLd = buildFaqPageJsonLd(faqEntriesFromDto(items))
    expect(jsonLd['@type']).toBe('FAQPage')
    expect(jsonLd.mainEntity).toHaveLength(items.length)
    for (const entry of jsonLd.mainEntity) {
      expect(entry['@type']).toBe('Question')
      expect(entry.name).toBeTruthy()
      expect(entry.acceptedAnswer['@type']).toBe('Answer')
      expect(entry.acceptedAnswer.text).toBeTruthy()
    }
    expect(serializeJsonLd(jsonLd)).not.toMatch(/<\/?script|<b>/i)
  })
})
