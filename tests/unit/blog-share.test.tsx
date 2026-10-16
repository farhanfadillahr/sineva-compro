import { describe, expect, it, vi } from 'vitest'
import { buildShareLinks, copyText } from '@/components/pages/blog/blog-share'

const URL_WITH_QUERY = 'https://sineva.example/blog/a-post?utm_source=x&ref=a b#top'

describe('buildShareLinks', () => {
  it('builds a WhatsApp share link with the title and the url in one encoded text', () => {
    const { whatsapp } = buildShareLinks({
      title: 'Where to start with AI & more? #1',
      url: URL_WITH_QUERY,
    })
    const link = new URL(whatsapp)
    expect(link.origin + link.pathname).toBe('https://wa.me/')
    // Decoding the single parameter must give back exactly what was shared.
    expect(link.searchParams.get('text')).toBe(
      `Where to start with AI & more? #1 ${URL_WITH_QUERY}`,
    )
    expect([...link.searchParams.keys()]).toEqual(['text'])
  })

  it('builds a LinkedIn share link with the url as one encoded parameter', () => {
    const { linkedin } = buildShareLinks({ title: 'Title', url: URL_WITH_QUERY })
    const link = new URL(linkedin)
    expect(link.origin + link.pathname).toBe('https://www.linkedin.com/sharing/share-offsite/')
    expect(link.searchParams.get('url')).toBe(URL_WITH_QUERY)
    expect([...link.searchParams.keys()]).toEqual(['url'])
  })

  it('leaves no raw separator of the article url in the share links', () => {
    const { whatsapp, linkedin } = buildShareLinks({ title: 'T', url: URL_WITH_QUERY })
    for (const link of [whatsapp, linkedin]) {
      const query = link.slice(link.indexOf('?') + 1)
      expect(query).not.toMatch(/[ #]/)
      expect(query.split('&')).toHaveLength(1)
    }
  })

  it('encodes non-ASCII titles', () => {
    const { whatsapp } = buildShareLinks({
      title: 'Panduan cepat: mulai dari nol',
      url: 'https://a.co/',
    })
    expect(whatsapp).toContain('Panduan%20cepat%3A%20mulai%20dari%20nol')
    expect(new URL(whatsapp).searchParams.get('text')).toContain('mulai dari nol')
  })
})

describe('copyText', () => {
  it('writes the text with the clipboard API and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await copyText('https://a.co/x', { writeText })).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://a.co/x')
  })

  it('reports failure when the clipboard API rejects (permission, focus)', async () => {
    const writeText = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    expect(await copyText('x', { writeText })).toBe('failed')
  })

  it('reports failure when there is no clipboard, as in an insecure context', async () => {
    expect(await copyText('x', undefined)).toBe('failed')
  })

  it('reports failure when the API throws synchronously', async () => {
    const writeText = vi.fn(() => {
      throw new Error('boom')
    })
    expect(await copyText('x', { writeText })).toBe('failed')
  })
})
