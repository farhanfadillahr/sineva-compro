import {
  CONTACT_INTERESTS,
  CONTACT_LIMITS,
  CONTACT_SEGMENTS,
  type ContactFields,
  type ContactInterest,
  type ContactSegment,
} from '@/lib/contact-message'

// Pure rules of the contact form, free of React and copy: validation answers with a code, and the
// form maps the code to a sentence from the `Contact` messages. Nothing here reads the network or
// storage; the form only ever builds a message the visitor sends from their own app.

/** Budget ranges are proposed and need copy approval, so only keys live here; labels are messages. */
export const BUDGET_KEYS = ['under10m', '10to50m', '50to150m', 'over150m', 'notSure'] as const
export type BudgetKey = (typeof BUDGET_KEYS)[number]

export type ContactFormValues = Readonly<{
  name: string
  company: string
  /** Empty until chosen. The builder's own union is the only set of accepted values. */
  segment: '' | ContactSegment
  interest: '' | ContactInterest
  /** A `BudgetKey`, or empty (the field is optional). */
  budget: '' | BudgetKey
  message: string
  consent: boolean
}>

export type ContactFieldKey = keyof ContactFormValues
export type ContactErrorCode = 'required' | 'tooShort' | 'tooLong' | 'invalid'
export type ContactErrors = Partial<Record<ContactFieldKey, ContactErrorCode>>

/**
 * Bounds of the text fields. The maximums are the builder's, so the form never accepts text the
 * WhatsApp link would silently cut. The minimums are product rules (message: PRD 8.2).
 */
export const CONTACT_RULES = {
  nameMin: 2,
  nameMax: CONTACT_LIMITS.name,
  companyMax: CONTACT_LIMITS.company,
  messageMin: 20,
  messageMax: CONTACT_LIMITS.message,
} as const

/** Field order of the form, which is also the order of the error summary. */
export const CONTACT_FIELD_ORDER = [
  'name',
  'company',
  'segment',
  'interest',
  'budget',
  'message',
  'consent',
] as const satisfies readonly ContactFieldKey[]

/** Code points, not UTF-16 units, so an emoji counts once and matches the builder's own cut. */
const length = (text: string) => Array.from(text).length

type Bounds = Readonly<{ min?: number; max: number }>

function checkText(value: string, { min = 0, max }: Bounds, required: boolean) {
  const text = value.trim()
  if (text === '') return required ? ('required' as const) : undefined
  const size = length(text)
  if (size < min) return 'tooShort' as const
  if (size > max) return 'tooLong' as const
  return undefined
}

const isOneOf = <T extends string>(options: readonly T[], value: string): value is T =>
  (options as readonly string[]).includes(value)

function checkChoice(value: string, options: readonly string[], required: boolean) {
  if (value === '') return required ? ('required' as const) : undefined
  return isOneOf(options, value) ? undefined : ('invalid' as const)
}

const RULES: Record<ContactFieldKey, (values: ContactFormValues) => ContactErrorCode | undefined> =
  {
    name: ({ name }) =>
      checkText(name, { min: CONTACT_RULES.nameMin, max: CONTACT_RULES.nameMax }, true),
    company: ({ company }) => checkText(company, { max: CONTACT_RULES.companyMax }, false),
    segment: ({ segment }) => checkChoice(segment, CONTACT_SEGMENTS, true),
    interest: ({ interest }) => checkChoice(interest, CONTACT_INTERESTS, true),
    budget: ({ budget }) => checkChoice(budget, BUDGET_KEYS, false),
    message: ({ message }) =>
      checkText(message, { min: CONTACT_RULES.messageMin, max: CONTACT_RULES.messageMax }, true),
    consent: ({ consent }) => (consent ? undefined : 'required'),
  }

export function validateContactField(
  values: ContactFormValues,
  field: ContactFieldKey,
): ContactErrorCode | undefined {
  return RULES[field](values)
}

/** Only broken fields appear in the result, in form order. */
export function validateContactForm(values: ContactFormValues): ContactErrors {
  const errors: ContactErrors = {}
  for (const field of CONTACT_FIELD_ORDER) {
    const code = RULES[field](values)
    if (code) errors[field] = code
  }
  return errors
}

// A plain object lookup would also answer for 'constructor' or '__proto__'; a Map cannot.
const SERVICE_PARAM = new Map<string, ContactInterest>([
  ['ai-discovery', 'AI Discovery'],
  ['ai-build', 'AI Build'],
  ['ai-enablement', 'AI Enablement'],
  ['ai-agents', 'Sineva Product Suite'],
  ['not-sure', 'Not sure yet'],
])

/** `?service=` to the preselected need. Anything unknown leaves the field empty. */
export function interestFromServiceParam(value: string | null | undefined): '' | ContactInterest {
  return (value && SERVICE_PARAM.get(value)) || ''
}

/**
 * The fields the message builder takes, or `null` while the form is invalid. `budgetLabels` turns
 * the stored key into the sentence the team will read in the message.
 */
export function toContactFields(
  values: ContactFormValues,
  budgetLabels: Readonly<Record<BudgetKey, string>>,
): ContactFields | null {
  if (Object.keys(validateContactForm(values)).length > 0) return null
  // Validation above guarantees the two unions are not empty.
  if (values.segment === '' || values.interest === '') return null
  return {
    name: values.name.trim(),
    company: values.company.trim() || undefined,
    segment: values.segment,
    interest: values.interest,
    budget: values.budget ? budgetLabels[values.budget] : undefined,
    message: values.message.trim(),
  }
}

/** Message keys of the option labels. The stored value stays the builder's own constant. */
export const SEGMENT_MESSAGE_KEYS = {
  'Small business': 'smallBusiness',
  Company: 'company',
  Startup: 'startup',
  Other: 'other',
} as const satisfies Record<ContactSegment, string>

export const INTEREST_MESSAGE_KEYS = {
  'AI Discovery': 'aiDiscovery',
  'AI Build': 'aiBuild',
  'AI Enablement': 'aiEnablement',
  'Sineva Product Suite': 'aiAgents',
  'Not sure yet': 'notSure',
} as const satisfies Record<ContactInterest, string>
