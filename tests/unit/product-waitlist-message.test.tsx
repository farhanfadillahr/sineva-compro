import { describe, expect, it } from 'vitest'
import {
  buildWaitlistMailto,
  buildWaitlistMessage,
  buildWaitlistWhatsAppUrl,
  WAITLIST_LIMITS,
  type WaitlistChannels,
  type WaitlistMessageCopy,
} from '@/components/pages/product/waitlist-message'

const copy: WaitlistMessageCopy = {
  notify: 'Please let me know when Sino is ready.',
  name: 'Name',
  businessType: 'Business type',
  emailSubject: 'Notify me about Sino',
}

const channels: WaitlistChannels = {
  whatsappNumber: '+6285199368510',
  email: null,
  greeting: "Hi Sineva, I'd like to know more about the Sineva Product Suite.",
}

describe('buildWaitlistMessage', () => {
  it('opens with the editable product greeting, then the request, then the details', () => {
    expect(
      buildWaitlistMessage({ name: 'Rina', businessType: 'Online shop' }, copy, channels.greeting),
    ).toBe(
      [
        "Hi Sineva, I'd like to know more about the Sineva Product Suite.",
        'Please let me know when Sino is ready.',
        '',
        'Name: Rina',
        'Business type: Online shop',
      ].join('\n'),
    )
  })

  it('leaves out the name and business type lines when they are empty (both are optional)', () => {
    expect(buildWaitlistMessage({ name: '', businessType: '' }, copy, channels.greeting)).toBe(
      [
        "Hi Sineva, I'd like to know more about the Sineva Product Suite.",
        'Please let me know when Sino is ready.',
      ].join('\n'),
    )
    expect(buildWaitlistMessage({ name: '  ', businessType: 'Online shop' }, copy, 'Hi')).toBe(
      'Hi\nPlease let me know when Sino is ready.\n\nBusiness type: Online shop',
    )
  })

  it('collapses newlines in the name so a visitor cannot forge another line', () => {
    const message = buildWaitlistMessage(
      { name: 'Rina\nBusiness type: Admin', businessType: '' },
      copy,
      'Hi',
    )
    expect(message.split('\n').filter((line) => line.startsWith('Business type'))).toHaveLength(0)
    expect(message).toContain('Name: Rina Business type: Admin')
  })

  it('strips control characters and lone surrogates, which would break the link', () => {
    const message = buildWaitlistMessage({ name: 'Ri\u0000na\ud800', businessType: '' }, copy, 'Hi')
    expect(message).toContain('Name: Rina')
    expect(() => encodeURIComponent(message)).not.toThrow()
  })

  it('cuts the name by code points, so an emoji is never split', () => {
    const name = '\u{1F600}'.repeat(WAITLIST_LIMITS.name + 20)
    const line = buildWaitlistMessage({ name, businessType: '' }, copy, 'Hi')
      .split('\n')
      .find((l) => l.startsWith('Name: '))!
    expect(Array.from(line.slice('Name: '.length))).toHaveLength(WAITLIST_LIMITS.name)
  })

  it('replaces an en or em dash typed into the name (copywriting rule 1)', () => {
    const message = buildWaitlistMessage({ name: 'Ana – Toko', businessType: '' }, copy, 'Hi')
    expect(message).not.toMatch(/[–—]/)
  })
})

describe('buildWaitlistWhatsAppUrl', () => {
  it('builds a wa.me link whose text decodes to the composed message', () => {
    const url = buildWaitlistWhatsAppUrl(
      { name: 'Rina & Co', businessType: 'Cafe and restaurant' },
      copy,
      channels,
    )!
    expect(url.startsWith('https://wa.me/6285199368510?text=')).toBe(true)
    expect(decodeURIComponent(url.split('?text=')[1]!)).toBe(
      buildWaitlistMessage(
        { name: 'Rina & Co', businessType: 'Cafe and restaurant' },
        copy,
        channels.greeting,
      ),
    )
    // The ampersand is encoded, so it cannot end the query string early.
    expect(url).not.toMatch(/text=[^#]*&/)
  })

  it('is null when the number is not a usable international number', () => {
    expect(
      buildWaitlistWhatsAppUrl({ name: '', businessType: '' }, copy, {
        ...channels,
        whatsappNumber: '0812345',
      }),
    ).toBeNull()
    expect(
      buildWaitlistWhatsAppUrl({ name: '', businessType: '' }, copy, {
        ...channels,
        whatsappNumber: null,
      }),
    ).toBeNull()
  })
})

describe('buildWaitlistMailto', () => {
  it('is null while no public email is confirmed', () => {
    expect(buildWaitlistMailto({ name: 'Rina', businessType: '' }, copy, channels)).toBeNull()
  })

  it('builds a mailto with an encoded subject and body when an email exists', () => {
    const url = buildWaitlistMailto({ name: 'Rina', businessType: 'Online shop' }, copy, {
      ...channels,
      email: 'hello@example.com',
    })!
    expect(url.startsWith('mailto:hello@example.com?subject=')).toBe(true)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('subject')).toBe(copy.emailSubject)
    expect(params.get('body')).toContain('Name: Rina')
    // Spaces are %20, not +, which mail apps would show literally.
    expect(url).not.toContain('+')
  })

  it('refuses an address that could add a recipient or a header', () => {
    for (const email of ['a@b.co,evil@x.co', 'a@b.co?cc=evil@x.co', 'not an email']) {
      expect(
        buildWaitlistMailto({ name: '', businessType: '' }, copy, { ...channels, email }),
      ).toBeNull()
    }
  })
})
