/**
 * The contact lead schema shared by the contact form and the `submitContact` server action
 * (CPR-78). The visible form fields reuse the form's own rules (`contact-form-model`), so client
 * and server can never disagree; the two contact channels the server needs (work email and
 * WhatsApp number) are defined here for the form to add (CPR-47).
 *
 * Pure module: no React, no server-only code.
 */
import {
  validateContactForm,
  type ContactErrors,
  type ContactFormValues,
} from '../../components/pages/contact/contact-form-model'
import type { ContactInterest, ContactSegment } from '../contact-message'

export type ContactSubmission = ContactFormValues &
  Readonly<{
    email: string
    whatsapp: string
  }>

export type LeadErrorCode = 'required' | 'tooShort' | 'tooLong' | 'invalid'
export type LeadErrors = ContactErrors & Partial<Record<'email' | 'whatsapp', LeadErrorCode>>

const EMAIL =
  /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

/**
 * WhatsApp numbers are stored as digits with the country code (what `wa.me` needs):
 * - Indonesian formats `0812…`, `+62812…`, `62812…` become `62812…`;
 * - any other number written with `+` and a country code is accepted as its digits;
 * - everything else (no country code, letters, wrong length) is rejected.
 */
export function normalizeWhatsApp(input: string): string | null {
  const compact = input.trim().replace(/[\s().-]/g, '')
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact.slice(1)
  if (/^0[1-9]\d{7,12}$/.test(compact)) return `62${compact.slice(1)}`
  if (/^62[1-9]\d{7,12}$/.test(compact)) return compact
  return null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.slice(0, max * 4) : ''

/**
 * Reads untrusted input into the submission shape. Unknown keys (status, notes, ids) are dropped:
 * public input can never set internal fields.
 */
export function readContactSubmission(input: unknown): ContactSubmission {
  const data = isRecord(input) ? input : {}
  return {
    name: text(data.name, 200),
    company: text(data.company, 200),
    segment: text(data.segment, 40) as ContactSubmission['segment'],
    interest: text(data.interest, 40) as ContactSubmission['interest'],
    budget: text(data.budget, 40) as ContactSubmission['budget'],
    message: text(data.message, 2000),
    consent: data.consent === true || data.consent === 'on' || data.consent === 'true',
    email: text(data.email, 254),
    whatsapp: text(data.whatsapp, 40),
  }
}

export function validateContactSubmission(values: ContactSubmission): LeadErrors {
  const errors: LeadErrors = { ...validateContactForm(values) }
  const email = values.email.trim()
  if (!email) errors.email = 'required'
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = 'invalid'
  if (!values.whatsapp.trim()) errors.whatsapp = 'required'
  else if (!normalizeWhatsApp(values.whatsapp)) errors.whatsapp = 'invalid'
  return errors
}

/** English messages for the server's failure contract (the form shows its own copy when wired). */
export const LEAD_ERROR_MESSAGES: Record<string, string> = {
  required: 'This field is required.',
  tooShort: 'Please write a little more.',
  tooLong: 'This is too long.',
  invalid: 'Please check this value.',
}

export type CleanLead = Readonly<{
  name: string
  email: string
  phone: string
  company: string | null
  segment: ContactSegment
  interest: ContactInterest
  budget: string | null
  message: string
}>

export function cleanLead(values: ContactSubmission): CleanLead {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: normalizeWhatsApp(values.whatsapp)!,
    company: values.company.trim() || null,
    segment: values.segment as ContactSegment,
    interest: values.interest as ContactInterest,
    budget: values.budget || null,
    message: values.message.trim(),
  }
}
