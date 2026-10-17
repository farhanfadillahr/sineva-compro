import { describe, expect, it } from 'vitest'
import {
  CONTACT_INTERESTS,
  CONTACT_LIMITS,
  CONTACT_SEGMENTS,
  buildContactMailto,
  buildContactMessage,
  buildContactWhatsAppUrl,
  type ContactFields,
} from '../../src/lib/contact-message'
import { createStaticContentSource } from '../../src/content/static'
import { findForbiddenDashes } from '../../src/lib/copy'

const settings = {
  whatsapp: {
    number: '+6285199368510',
    templates: {
      general: "Hi Sineva, I'd like to talk about using AI in my business.",
      product: "Hi Sineva, I'd like to know more about the Sineva Product Suite.",
      thankYou: 'Hi Sineva, I just sent the contact form and would like a faster reply.',
      services: [
        {
          serviceSlug: 'ai-discovery',
          message: "Hi Sineva, I'm interested in AI Discovery. Can we talk?",
        },
        { serviceSlug: 'ai-build', message: "Hi Sineva, I'm interested in AI Build. Can we talk?" },
        {
          serviceSlug: 'ai-enablement',
          message: "Hi Sineva, I'm interested in AI Enablement. Can we talk?",
        },
      ],
    },
  },
  contact: {
    email: 'hello@sineva.test' as string | null,
    businessHours: null,
    address: null,
    legalEntity: null,
  },
}

const fields: ContactFields = {
  name: 'Rina',
  company: 'Toko Rina',
  segment: 'Small business',
  interest: 'AI Build',
  budget: 'Not sure yet',
  message: 'I want to answer customer questions faster.',
}

/** The decoded text of a wa.me link. */
function textOf(url: string | null): string {
  expect(url).not.toBeNull()
  const parsed = new URL(url!)
  return parsed.searchParams.get('text') ?? ''
}

describe('contact option lists', () => {
  it('match the form fields', () => {
    expect([...CONTACT_SEGMENTS]).toEqual(['Small business', 'Company', 'Startup', 'Other'])
    expect([...CONTACT_INTERESTS]).toEqual([
      'AI Discovery',
      'AI Build',
      'AI Enablement',
      'Sineva Product Suite',
      'Not sure yet',
    ])
  })
})

describe('buildContactMessage', () => {
  it('opens with the template for the chosen interest and lists every field', () => {
    const text = buildContactMessage(fields, settings.whatsapp.templates)!
    expect(text.split('\n')[0]).toBe("Hi Sineva, I'm interested in AI Build. Can we talk?")
    expect(text).toContain('Name: Rina')
    expect(text).toContain('Company: Toko Rina')
    expect(text).toContain('Business type: Small business')
    expect(text).toContain('Interested in: AI Build')
    expect(text).toContain('Budget: Not sure yet')
    expect(text).toContain('Message: I want to answer customer questions faster.')
  })

  it('uses the product and general templates for the other interests', () => {
    const product = buildContactMessage(
      { ...fields, interest: 'Sineva Product Suite' },
      settings.whatsapp.templates,
    )!
    expect(product.split('\n')[0]).toBe("Hi Sineva, I'd like to know more about the Sineva Product Suite.")
    const unsure = buildContactMessage(
      { ...fields, interest: 'Not sure yet' },
      settings.whatsapp.templates,
    )!
    expect(unsure.split('\n')[0]).toBe("Hi Sineva, I'd like to talk about using AI in my business.")
  })

  it('leaves out optional fields that are empty or only spaces', () => {
    const text = buildContactMessage(
      { ...fields, company: '   ', budget: undefined },
      settings.whatsapp.templates,
    )!
    expect(text).not.toContain('Company:')
    expect(text).not.toContain('Budget:')
  })

  it('returns null when a required field is empty after trimming', () => {
    expect(buildContactMessage({ ...fields, name: '  ' }, settings.whatsapp.templates)).toBeNull()
    expect(
      buildContactMessage({ ...fields, message: '\n\t ' }, settings.whatsapp.templates),
    ).toBeNull()
  })

  it('returns null for a segment or interest outside the form options', () => {
    expect(
      buildContactMessage(
        { ...fields, segment: 'Government' as ContactFields['segment'] },
        settings.whatsapp.templates,
      ),
    ).toBeNull()
    expect(
      buildContactMessage(
        { ...fields, interest: 'Web design' as ContactFields['interest'] },
        settings.whatsapp.templates,
      ),
    ).toBeNull()
  })

  it('trims fields and collapses whitespace in single-line fields', () => {
    const text = buildContactMessage(
      { ...fields, name: '  Rina \t Putri  ', company: ' Toko\n\nRina ' },
      settings.whatsapp.templates,
    )!
    expect(text).toContain('Name: Rina Putri\n')
    expect(text).toContain('Company: Toko Rina\n')
  })

  it('cannot be tricked into adding a fake field through a newline in a single-line field', () => {
    const text = buildContactMessage(
      { ...fields, name: 'Rina\nBudget: Rp1 billion' },
      settings.whatsapp.templates,
    )!
    expect(text.match(/^Budget:/gm)).toHaveLength(1)
    expect(text).toContain('Name: Rina Budget: Rp1 billion')
  })

  it('keeps paragraph breaks in the message but not runs of blank lines', () => {
    const text = buildContactMessage(
      { ...fields, message: 'First line.\r\nSecond line.\n\n\n\n\nThird.' },
      settings.whatsapp.templates,
    )!
    expect(text).toContain('Message: First line.\nSecond line.\n\nThird.')
  })

  it('strips control characters', () => {
    const text = buildContactMessage(
      { ...fields, message: 'Hello\u0000 there\u0007\u001b[31m' },
      settings.whatsapp.templates,
    )!
    expect(text).not.toMatch(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/)
    expect(text).toContain('Hello there')
  })

  it('limits the length of every field without cutting an emoji in half', () => {
    const long = 'a'.repeat(5000)
    const text = buildContactMessage(
      { ...fields, name: long, company: long, budget: long, message: long },
      settings.whatsapp.templates,
    )!
    const value = (label: string) => text.split('\n').find((line) => line.startsWith(`${label}: `))!
    expect(value('Name').length - 'Name: '.length).toBeLessThanOrEqual(CONTACT_LIMITS.name)
    expect(value('Company').length - 'Company: '.length).toBeLessThanOrEqual(CONTACT_LIMITS.company)
    expect(value('Budget').length - 'Budget: '.length).toBeLessThanOrEqual(CONTACT_LIMITS.budget)
    expect(text.slice(text.indexOf('Message: ') + 'Message: '.length).length).toBeLessThanOrEqual(
      CONTACT_LIMITS.message,
    )

    const emoji = buildContactMessage(
      { ...fields, message: '😀'.repeat(CONTACT_LIMITS.message + 10) },
      settings.whatsapp.templates,
    )!
    // A lone surrogate would break encodeURIComponent.
    expect(() => encodeURIComponent(emoji)).not.toThrow()
  })

  it('never outputs an em dash or en dash, even if the visitor typed one', () => {
    const text = buildContactMessage(
      {
        ...fields,
        name: 'Rina — Putri',
        company: 'Toko – Rina',
        budget: '10–50 million',
        message: 'We sell online — mostly on weekends. Range 5–10.',
      },
      settings.whatsapp.templates,
    )!
    expect(findForbiddenDashes(text)).toEqual([])
    expect(text).toContain('Budget: 10-50 million')
  })
})

describe('buildContactWhatsAppUrl', () => {
  it('builds a wa.me link to the confirmed number with the encoded message', () => {
    const url = buildContactWhatsAppUrl(fields, settings)!
    expect(url.startsWith('https://wa.me/6285199368510?text=')).toBe(true)
    expect(textOf(url)).toBe(buildContactMessage(fields, settings.whatsapp.templates))
  })

  it('percent-encodes characters that would end or corrupt the query', () => {
    const url = buildContactWhatsAppUrl(
      { ...fields, message: 'Q&A #1? yes=no 100% sure + more' },
      settings,
    )!
    const query = url.slice(url.indexOf('?') + 1)
    // Exactly what encodeURIComponent leaves raw: no &, #, =, ?, +, space or newline survives.
    expect(query).toMatch(/^text=[A-Za-z0-9%._~!*'()-]*$/)
    expect([...new URLSearchParams(query).keys()]).toEqual(['text'])
    expect(textOf(url)).toContain('Q&A #1? yes=no 100% sure + more')
  })

  it('round-trips non-ASCII text', () => {
    const url = buildContactWhatsAppUrl(
      { ...fields, message: 'Halo, saya mau tanya soal AI 🙂' },
      settings,
    )
    expect(textOf(url)).toContain('Halo, saya mau tanya soal AI 🙂')
  })

  it('returns null when the number is unusable, so no dead button is shown', () => {
    expect(
      buildContactWhatsAppUrl(fields, {
        whatsapp: { ...settings.whatsapp, number: '085199368510' },
      }),
    ).toBeNull()
  })

  it('returns null when the fields are not sendable', () => {
    expect(buildContactWhatsAppUrl({ ...fields, name: '' }, settings)).toBeNull()
  })

  it('has no em dash or en dash in the final URL either', () => {
    const url = buildContactWhatsAppUrl({ ...fields, message: 'Hello — there' }, settings)!
    expect(decodeURIComponent(url)).not.toMatch(/[‒-―]/)
    expect(url).not.toMatch(/%E2%80%9[3-5]/i)
  })

  it('works with the real static settings', async () => {
    const real = (await createStaticContentSource().getSiteSettings('en'))!
    const url = buildContactWhatsAppUrl(fields, real)
    expect(url?.startsWith('https://wa.me/6285199368510?text=')).toBe(true)
  })
})

describe('buildContactMailto', () => {
  it('returns null while the public email is not confirmed', () => {
    expect(
      buildContactMailto(fields, { ...settings, contact: { ...settings.contact, email: null } }),
    ).toBeNull()
  })

  it('returns null for an email that is not a plain address', () => {
    for (const email of [
      'not-an-email',
      'a@b',
      'a@b.com?cc=evil@x.com',
      'a b@c.com',
      'a@b.com,c@d.com',
    ]) {
      const withEmail = { ...settings, contact: { ...settings.contact, email } }
      expect(buildContactMailto(fields, withEmail), email).toBeNull()
    }
  })

  it('builds a mailto with a subject and the same message body', () => {
    const href = buildContactMailto(fields, settings)!
    expect(href.startsWith('mailto:hello@sineva.test?')).toBe(true)
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1))
    expect(params.get('subject')).toBe('Enquiry from Rina: AI Build')
    expect(params.get('body')).toBe(buildContactMessage(fields, settings.whatsapp.templates))
  })

  it('encodes spaces as %20, which mail apps show correctly (a plus sign would show literally)', () => {
    const href = buildContactMailto(fields, settings)!
    expect(href).not.toMatch(/\+/)
    expect(href).toContain('subject=Enquiry%20from%20Rina')
  })

  it('has no dash in the subject or body, and no header injection through a newline', () => {
    const href = buildContactMailto(
      { ...fields, name: 'Rina\r\nBcc: evil@x.com \u2014 hi' },
      settings,
    )!
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1))
    expect(params.get('subject')).not.toMatch(/[\r\n]/)
    expect(
      params
        .get('body')!
        .split('\n')
        .some((line) => /^bcc:/i.test(line)),
    ).toBe(false)
    expect(decodeURIComponent(href)).not.toMatch(/[‒-―]/)
  })

  it('returns null when the fields are not sendable', () => {
    expect(buildContactMailto({ ...fields, message: '' }, settings)).toBeNull()
  })
})
