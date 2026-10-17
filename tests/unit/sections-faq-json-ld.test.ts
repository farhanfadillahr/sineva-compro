import { describe, expect, it } from 'vitest'
import {
  buildFaqPageJsonLd,
  faqEntriesFromDto,
  richTextToPlainText,
  serializeJsonLd,
} from '@/components/sections/_internal/faq'
import { faq } from '../fixtures/public/faq'
import { doc, paragraph } from '../fixtures/public/helpers'

describe('richTextToPlainText', () => {
  it('joins paragraphs with a space and trims', () => {
    expect(richTextToPlainText(doc(paragraph('One.'), paragraph('Two.')))).toBe('One. Two.')
  })

  it('walks nested nodes and ignores marks', () => {
    const nested = doc({
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [paragraph('First')] },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Second', marks: [{ type: 'bold' }] }],
            },
          ],
        },
      ],
    })
    expect(richTextToPlainText(nested)).toBe('First Second')
  })
})

describe('FAQPage JSON-LD', () => {
  const entries = faqEntriesFromDto(faq.slice(0, 3).map((f) => f.item))

  it('maps DTO items to entries with plain-text answers', () => {
    expect(entries).toHaveLength(3)
    expect(entries[0]?.question).toBe('What is the Sineva Product Suite?')
    expect(entries[0]?.answerText).toMatch(/focused AI products.*business insights/)
  })

  it('has the schema.org FAQPage shape', () => {
    const data = buildFaqPageJsonLd(entries)
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('FAQPage')
    expect(data.mainEntity).toHaveLength(3)
    expect(data.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'What is the Sineva Product Suite?',
      acceptedAnswer: { '@type': 'Answer', text: entries[0]?.answerText },
    })
  })

  it('serialises to valid JSON that cannot close the script element', () => {
    const hostile = buildFaqPageJsonLd([
      { question: 'Why </script><script>alert(1)</script>?', answerText: 'A & B <b>' },
    ])
    const json = serializeJsonLd(hostile)
    expect(json).not.toContain('</script')
    expect(json).not.toContain('<')
    expect(JSON.parse(json)).toEqual(hostile)
  })
})
