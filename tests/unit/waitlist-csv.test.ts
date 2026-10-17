import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { csvCell, toCsv } from '../../src/features/waitlist/csv'
import {
  normalizeEmail,
  readWaitlistSubmission,
  validateWaitlist,
} from '../../src/lib/leads/waitlist-schema'

describe('waitlist CSV', () => {
  it.each(['=SUM(A1)', '+1', '-2', '@cmd', '\tx', '\rx'])(
    'neutralises a cell starting with %j',
    (value) => {
      expect(csvCell(value).startsWith(`"'`)).toBe(true)
    },
  )
  it('quotes cells and escapes quotes', () => {
    expect(toCsv(['a'], [['say "hi"'], [null]])).toBe('"a"\r\n"say ""hi"""\r\n""\r\n')
  })
})

describe('waitlist schema', () => {
  it('normalises the email and validates consent and segment', () => {
    expect(normalizeEmail('  Ayu@Example.COM ')).toBe('ayu@example.com')
    expect(
      validateWaitlist(readWaitlistSubmission({ email: 'ayu@example.com', consent: true })),
    ).toEqual({})
    expect(validateWaitlist(readWaitlistSubmission({ email: 'nope', segment: 'Agency' }))).toEqual({
      email: 'invalid',
      segment: 'invalid',
      consent: 'required',
    })
  })
  it('has no public CRUD route', () => {
    expect(existsSync('src/app/api/waitlist')).toBe(false)
  })
})
