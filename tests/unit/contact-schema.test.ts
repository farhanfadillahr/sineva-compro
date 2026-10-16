import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { validateContactForm } from '../../src/components/pages/contact/contact-form-model'
import {
  normalizeWhatsApp,
  readContactSubmission,
  validateContactSubmission,
} from '../../src/lib/leads/contact-schema'

const valid = {
  name: 'Ayu Lestari',
  company: '',
  segment: 'Small business',
  interest: 'AI Build',
  budget: '',
  message: 'We answer the same customer questions every day.',
  consent: true,
  email: 'ayu@example.com',
  whatsapp: '0812-3456-7890',
}

describe('normalizeWhatsApp', () => {
  it.each([
    ['0812 3456 7890', '6281234567890'],
    ['+62 812-3456-7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['+44 20 7946 0958', '442079460958'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeWhatsApp(input)).toBe(expected)
  })
  it.each(['812345678', '+0812345678', 'abc', '+12', '12345678901234567'])(
    'rejects %s',
    (input) => {
      expect(normalizeWhatsApp(input)).toBeNull()
    },
  )
})

describe('contact submission', () => {
  const read = (patch: Record<string, unknown>) => readContactSubmission({ ...valid, ...patch })
  it('accepts a complete submission', () => {
    expect(validateContactSubmission(read({}))).toEqual({})
  })
  it.each([
    ['missing name', { name: '' }, 'name', 'required'],
    ['bad email', { email: 'not-an-email' }, 'email', 'invalid'],
    ['missing email', { email: '' }, 'email', 'required'],
    ['short message', { message: 'Too short' }, 'message', 'tooShort'],
    ['missing consent', { consent: false }, 'consent', 'required'],
    ['unknown interest', { interest: 'Web development' }, 'interest', 'invalid'],
    ['bad whatsapp', { whatsapp: '12' }, 'whatsapp', 'invalid'],
  ])('rejects %s', (_, patch, field, code) => {
    expect(validateContactSubmission(read(patch))).toMatchObject({ [field]: code })
  })
  it('uses the contact form rules for the shared fields (one source)', () => {
    const values = read({ name: 'A', message: 'short', consent: false })
    const { email, whatsapp, ...shared } = validateContactSubmission(values)
    void email
    void whatsapp
    expect(shared).toEqual(validateContactForm(values))
  })
  it('drops fields the public must not set', () => {
    const values = readContactSubmission({ ...valid, status: 'won', notes: 'vip', id: 'x' })
    expect(Object.keys(values)).not.toEqual(expect.arrayContaining(['status', 'notes', 'id']))
  })
  it('has no public CRUD route for leads', () => {
    expect(existsSync('src/app/api/leads')).toBe(false)
  })
})
