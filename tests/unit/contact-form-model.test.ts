import { describe, expect, it } from 'vitest'
import {
  BUDGET_KEYS,
  CONTACT_RULES,
  interestFromServiceParam,
  toContactFields,
  validateContactForm,
  type ContactFormValues,
} from '@/components/pages/contact/contact-form-model'
import { CONTACT_INTERESTS, CONTACT_LIMITS, CONTACT_SEGMENTS } from '@/lib/contact-message'

const valid: ContactFormValues = {
  name: 'Rina Wijaya',
  company: '',
  segment: 'Small business',
  interest: 'AI Build',
  budget: '',
  message: 'We run a small bakery and want to answer customers faster.',
  consent: true,
}

const withValues = (patch: Partial<ContactFormValues>): ContactFormValues => ({
  ...valid,
  ...patch,
})

describe('validateContactForm', () => {
  it('accepts a complete form, with company and budget left empty', () => {
    expect(validateContactForm(valid)).toEqual({})
  })

  it('requires a name, and treats spaces only as empty', () => {
    expect(validateContactForm(withValues({ name: '' })).name).toBe('required')
    expect(validateContactForm(withValues({ name: '   ' })).name).toBe('required')
  })

  it('sets the name length bounds: at least 2 characters, at most the builder limit', () => {
    expect(CONTACT_RULES.nameMin).toBe(2)
    expect(CONTACT_RULES.nameMax).toBe(CONTACT_LIMITS.name)
    expect(validateContactForm(withValues({ name: 'R' })).name).toBe('tooShort')
    expect(validateContactForm(withValues({ name: 'Ri' })).name).toBeUndefined()
    expect(
      validateContactForm(withValues({ name: 'a'.repeat(CONTACT_LIMITS.name) })).name,
    ).toBeUndefined()
    expect(
      validateContactForm(withValues({ name: 'a'.repeat(CONTACT_LIMITS.name + 1) })).name,
    ).toBe('tooLong')
  })

  it('counts length in code points, so an emoji is one character, not two', () => {
    expect(validateContactForm(withValues({ name: '\u{1F600}\u{1F600}' })).name).toBeUndefined()
    expect(validateContactForm(withValues({ name: '\u{1F600}' })).name).toBe('tooShort')
  })

  it('limits the optional company to the builder limit', () => {
    expect(validateContactForm(withValues({ company: 'PT Maju' })).company).toBeUndefined()
    expect(
      validateContactForm(withValues({ company: 'a'.repeat(CONTACT_LIMITS.company + 1) })).company,
    ).toBe('tooLong')
  })

  it('requires a business type that is one of the offered values', () => {
    expect(validateContactForm(withValues({ segment: '' })).segment).toBe('required')
    for (const segment of CONTACT_SEGMENTS) {
      expect(validateContactForm(withValues({ segment })).segment).toBeUndefined()
    }
    expect(validateContactForm(withValues({ segment: 'Enterprise' as never })).segment).toBe(
      'invalid',
    )
  })

  it('requires what the visitor needs help with, from the offered values', () => {
    expect(validateContactForm(withValues({ interest: '' })).interest).toBe('required')
    for (const interest of CONTACT_INTERESTS) {
      expect(validateContactForm(withValues({ interest })).interest).toBeUndefined()
    }
    expect(validateContactForm(withValues({ interest: 'Hacking' as never })).interest).toBe(
      'invalid',
    )
  })

  it('keeps the budget optional but only accepts the offered ranges', () => {
    expect(validateContactForm(withValues({ budget: '' })).budget).toBeUndefined()
    for (const budget of BUDGET_KEYS) {
      expect(validateContactForm(withValues({ budget })).budget).toBeUndefined()
    }
    expect(validateContactForm(withValues({ budget: 'a lot' as never })).budget).toBe('invalid')
  })

  it('requires a message of at least 20 characters after trimming', () => {
    expect(CONTACT_RULES.messageMin).toBe(20)
    expect(validateContactForm(withValues({ message: '' })).message).toBe('required')
    expect(validateContactForm(withValues({ message: '  \n  ' })).message).toBe('required')
    expect(validateContactForm(withValues({ message: 'too short' })).message).toBe('tooShort')
    // 19 characters plus padding must not sneak past the minimum.
    expect(validateContactForm(withValues({ message: `   ${'a'.repeat(19)}   ` })).message).toBe(
      'tooShort',
    )
    expect(validateContactForm(withValues({ message: 'a'.repeat(20) })).message).toBeUndefined()
  })

  it('caps the message at the builder limit so the WhatsApp link stays short enough', () => {
    expect(CONTACT_RULES.messageMax).toBe(CONTACT_LIMITS.message)
    expect(
      validateContactForm(withValues({ message: 'a'.repeat(CONTACT_LIMITS.message) })).message,
    ).toBeUndefined()
    expect(
      validateContactForm(withValues({ message: 'a'.repeat(CONTACT_LIMITS.message + 1) })).message,
    ).toBe('tooLong')
  })

  it('requires the privacy consent', () => {
    expect(validateContactForm(withValues({ consent: false })).consent).toBe('required')
  })

  it('reports every broken field at once, in form order', () => {
    const errors = validateContactForm({
      name: '',
      company: '',
      segment: '',
      interest: '',
      budget: '',
      message: '',
      consent: false,
    })
    expect(Object.keys(errors)).toEqual(['name', 'segment', 'interest', 'message', 'consent'])
  })
})

describe('interestFromServiceParam', () => {
  it.each([
    ['ai-discovery', 'AI Discovery'],
    ['ai-build', 'AI Build'],
    ['ai-enablement', 'AI Enablement'],
    ['ai-agents', 'AI Agents product'],
    ['not-sure', 'Not sure yet'],
  ])('maps ?service=%s to %s', (slug, interest) => {
    expect(interestFromServiceParam(slug)).toBe(interest)
  })

  it('ignores unknown, empty and missing values', () => {
    expect(interestFromServiceParam('hacking')).toBe('')
    expect(interestFromServiceParam('')).toBe('')
    expect(interestFromServiceParam(null)).toBe('')
    expect(interestFromServiceParam(undefined)).toBe('')
  })

  it('does not match inherited object keys or other casing', () => {
    expect(interestFromServiceParam('constructor')).toBe('')
    expect(interestFromServiceParam('__proto__')).toBe('')
    expect(interestFromServiceParam('AI-BUILD')).toBe('')
  })
})

describe('toContactFields', () => {
  const labels = {
    under10m: 'Under IDR 10M',
    '10to50m': 'IDR 10M to 50M',
    '50to150m': 'IDR 50M to 150M',
    over150m: 'Over IDR 150M',
    notSure: 'Not sure yet',
  } as const

  it('trims the text and resolves the budget key to its label', () => {
    expect(
      toContactFields(
        withValues({ name: '  Rina  ', company: ' PT Maju ', budget: '10to50m' }),
        labels,
      ),
    ).toEqual({
      name: 'Rina',
      company: 'PT Maju',
      segment: 'Small business',
      interest: 'AI Build',
      budget: 'IDR 10M to 50M',
      message: 'We run a small bakery and want to answer customers faster.',
    })
  })

  it('omits an empty budget instead of sending an empty string', () => {
    expect(toContactFields(valid, labels)?.budget).toBeUndefined()
  })

  it('returns null while the form is not valid', () => {
    expect(toContactFields(withValues({ consent: false }), labels)).toBeNull()
    expect(toContactFields(withValues({ message: 'short' }), labels)).toBeNull()
  })
})
