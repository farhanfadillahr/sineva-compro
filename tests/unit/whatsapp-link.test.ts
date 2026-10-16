import { describe, expect, it } from 'vitest'
import { siteSettings } from '../fixtures/public/site-settings'
import {
  buildWhatsAppHref,
  normalizeWhatsAppNumber,
  resolveWhatsAppMessage,
  whatsappContextFromPathname,
  whatsappHrefFor,
} from '../../src/lib/whatsapp'

const { whatsapp } = siteSettings

describe('normalizeWhatsAppNumber', () => {
  it('strips the plus sign and keeps the digits of an E.164 number', () => {
    expect(normalizeWhatsAppNumber('+6281234567890')).toBe('6281234567890')
  })

  it('ignores the separators people type into a settings form', () => {
    expect(normalizeWhatsAppNumber('+62 812-3456-7890')).toBe('6281234567890')
    expect(normalizeWhatsAppNumber('+62 (812) 3456.7890')).toBe('6281234567890')
  })

  it.each([
    ['empty', ''],
    ['only whitespace', '   '],
    // A national number has no country code, wa.me would open the wrong chat or none at all.
    ['a national number without a plus', '081234567890'],
    ['a number without a plus', '6281234567890'],
    ['a leading zero after the plus', '+0123456789'],
    ['letters', '+62abc1234567'],
    ['too short', '+62123'],
    ['longer than 15 digits', '+6281234567890123'],
  ])('rejects %s', (_label, value) => {
    expect(normalizeWhatsAppNumber(value)).toBeNull()
  })

  it('rejects a missing value', () => {
    expect(normalizeWhatsAppNumber(null)).toBeNull()
    expect(normalizeWhatsAppNumber(undefined)).toBeNull()
  })
})

describe('buildWhatsAppHref', () => {
  it('builds a wa.me link with the plus stripped and the message URL-encoded', () => {
    expect(buildWhatsAppHref({ number: '+6281234567890', message: 'Hi Sineva, me & you' })).toBe(
      'https://wa.me/6281234567890?text=Hi%20Sineva%2C%20me%20%26%20you',
    )
  })

  it('encodes characters that would otherwise end the query string early', () => {
    const href = buildWhatsAppHref({ number: '+6281234567890', message: 'a&b=c#d?e' })
    expect(href).toBe('https://wa.me/6281234567890?text=a%26b%3Dc%23d%3Fe')
  })

  it('omits the text parameter when there is no message', () => {
    expect(buildWhatsAppHref({ number: '+6281234567890' })).toBe('https://wa.me/6281234567890')
    expect(buildWhatsAppHref({ number: '+6281234567890', message: '   ' })).toBe(
      'https://wa.me/6281234567890',
    )
  })

  it('returns null without a usable number so callers render no button', () => {
    expect(buildWhatsAppHref({ number: '', message: 'Hi' })).toBeNull()
    expect(buildWhatsAppHref({ number: null, message: 'Hi' })).toBeNull()
    expect(buildWhatsAppHref({ number: '0812', message: 'Hi' })).toBeNull()
  })
})

describe('resolveWhatsAppMessage', () => {
  const { templates } = whatsapp

  it('uses the general template by default', () => {
    expect(resolveWhatsAppMessage(templates, { kind: 'general' })).toBe(templates.general)
  })

  it('picks the product and thank-you templates', () => {
    expect(resolveWhatsAppMessage(templates, { kind: 'product' })).toBe(templates.product)
    expect(resolveWhatsAppMessage(templates, { kind: 'thankYou' })).toBe(templates.thankYou)
  })

  it('picks the message of the matching service', () => {
    expect(resolveWhatsAppMessage(templates, { kind: 'service', slug: 'ai-build' })).toBe(
      "Hi Sineva, I'm interested in AI Build. Can we talk?",
    )
  })

  it('substitutes {service name} with the service title', () => {
    const withPlaceholder = {
      ...templates,
      services: [
        {
          serviceSlug: 'ai-build',
          message: "Hi Sineva, I'm interested in {service name}. Can we talk?",
        },
      ],
    }
    expect(
      resolveWhatsAppMessage(withPlaceholder, {
        kind: 'service',
        slug: 'ai-build',
        name: 'AI Build',
      }),
    ).toBe("Hi Sineva, I'm interested in AI Build. Can we talk?")
  })

  it('falls back to the general template when a service has no message', () => {
    expect(resolveWhatsAppMessage(templates, { kind: 'service', slug: 'unknown' })).toBe(
      templates.general,
    )
  })

  it('falls back to general instead of sending a raw {service name} placeholder', () => {
    const withPlaceholder = {
      ...templates,
      services: [{ serviceSlug: 'ai-build', message: 'Hi, I want {service name}.' }],
    }
    expect(resolveWhatsAppMessage(withPlaceholder, { kind: 'service', slug: 'ai-build' })).toBe(
      templates.general,
    )
  })
})

describe('whatsappHrefFor', () => {
  it('builds the link for a context from the site settings', () => {
    expect(whatsappHrefFor(whatsapp, { kind: 'product' })).toBe(
      `https://wa.me/6280000000000?text=${encodeURIComponent(whatsapp.templates.product)}`,
    )
  })

  it('defaults to the general context', () => {
    expect(whatsappHrefFor(whatsapp)).toBe(
      `https://wa.me/6280000000000?text=${encodeURIComponent(whatsapp.templates.general)}`,
    )
  })

  it('returns null when settings are missing or have no number', () => {
    expect(whatsappHrefFor(null)).toBeNull()
    expect(whatsappHrefFor(undefined)).toBeNull()
    expect(whatsappHrefFor({ ...whatsapp, number: '' })).toBeNull()
  })
})

describe('whatsappContextFromPathname', () => {
  it.each([
    ['/', { kind: 'general' }],
    ['/about', { kind: 'general' }],
    ['/blog/some-post', { kind: 'general' }],
    ['/products/ai-agents', { kind: 'product' }],
    ['/services/ai-discovery', { kind: 'service', slug: 'ai-discovery' }],
    ['/contact/thank-you', { kind: 'thankYou' }],
  ])('maps %s to its context', (pathname, expected) => {
    expect(whatsappContextFromPathname(pathname)).toEqual(expected)
  })

  it('keeps the services overview general because no service is chosen yet', () => {
    expect(whatsappContextFromPathname('/services')).toEqual({ kind: 'general' })
  })

  it('treats a missing pathname as general', () => {
    expect(whatsappContextFromPathname(null)).toEqual({ kind: 'general' })
    expect(whatsappContextFromPathname(undefined)).toEqual({ kind: 'general' })
  })
})
