/**
 * Waitlist schema shared by the Product page form (CPR-79) and `joinWaitlist` (CPR-48).
 * Pure module. The segment list is the same fixed list as the contact form.
 */
import { CONTACT_SEGMENTS, type ContactSegment } from '../contact-message'

export type WaitlistSubmission = Readonly<{
  email: string
  segment: '' | ContactSegment
  consent: boolean
}>
export type WaitlistErrors = Partial<
  Record<'email' | 'segment' | 'consent', 'required' | 'invalid'>
>

const EMAIL =
  /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

/** Trimmed and lowercased: one person, one row (the unique constraint is on this form). */
export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function readWaitlistSubmission(input: unknown): WaitlistSubmission {
  const data = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  return {
    email: typeof data.email === 'string' ? data.email.slice(0, 1000) : '',
    segment: (typeof data.segment === 'string'
      ? data.segment
      : '') as WaitlistSubmission['segment'],
    consent: data.consent === true || data.consent === 'on' || data.consent === 'true',
  }
}

export function validateWaitlist(values: WaitlistSubmission): WaitlistErrors {
  const errors: WaitlistErrors = {}
  const email = normalizeEmail(values.email)
  if (!email) errors.email = 'required'
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = 'invalid'
  if (values.segment && !(CONTACT_SEGMENTS as readonly string[]).includes(values.segment))
    errors.segment = 'invalid'
  if (!values.consent) errors.consent = 'required'
  return errors
}
