'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { markContactHandoff } from '@/components/mascot/sino-launch/launch-bus'
import { WhatsAppIcon } from '@/components/layout/icons'
import { Honeypot } from '@/components/forms/honeypot'
import { TurnstileWidget, type TurnstileHandle } from '@/components/forms/turnstile'
import { Button, Checkbox, Field, Input, Select, Textarea } from '@/components/ui'
import type { ConsentLabel, SiteSettingsDTO } from '@/features/content/types'
import type { saveContact } from '@/features/leads/actions'
import { validateContactSubmission, type LeadErrors } from '@/lib/leads/contact-schema'
import { Link, useRouter } from '@/i18n/navigation'
import {
  buildContactMailto,
  buildContactMessage,
  buildContactWhatsAppUrl,
  CONTACT_INTERESTS,
  CONTACT_SEGMENTS,
  type ContactInterest,
} from '@/lib/contact-message'
import {
  BUDGET_KEYS,
  CONTACT_RULES,
  INTEREST_MESSAGE_KEYS,
  SEGMENT_MESSAGE_KEYS,
  interestFromServiceParam,
  toContactFields,
  type BudgetKey,
  type ContactErrorCode,
  type ContactFieldKey,
  type ContactFormValues,
} from './contact-form-model'

// The form of /contact. A valid submit opens the composed message in WhatsApp (or the visitor's
// mail app) inside the submit gesture, stores the lead through the `saveContact` server action
// (CPR-105, with the Turnstile token and the honeypot for the anti-spam check), and then moves
// this tab to the thank-you page. The answers go to the server as an explicit object, never as a
// native form post: the form has no `action` and gives no control a `name`, so if the script ever
// failed to load, a native submit could not put the visitor's answers into the address bar.

const THANK_YOU_PATH = '/contact/thank-you'
const SOURCE_PAGE = '/contact'

/** The visible fields plus the two contact channels the server needs, in reading order. */
type FormField = ContactFieldKey | 'email' | 'whatsapp'
const FORM_FIELD_ORDER = [
  'name',
  'email',
  'whatsapp',
  'company',
  'segment',
  'interest',
  'budget',
  'message',
  'consent',
] as const satisfies readonly FormField[]
type FormValues = ContactFormValues & { email: string; whatsapp: string }
const PRIVACY_PATH = '/privacy-policy'

export type ContactFormProps = Readonly<{
  /** Page content: the line above the fields. */
  intro: string
  /** Page content: the consent sentence, split around the privacy link. */
  consentLabel: ConsentLabel
  settings: Pick<SiteSettingsDTO, 'contact' | 'whatsapp'>
  /** Preselected need, from `?service=`. */
  initialInterest?: '' | ContactInterest
  /**
   * The `saveContact` server action, passed by the server page so this client module never
   * imports server code (CPR-105).
   */
  saveLead: typeof saveContact
}>

type MessageKey = Parameters<ReturnType<typeof useTranslations<'Contact'>>>[0]

// Every (field, code) pair the rules can produce. A lookup table instead of a template string so a
// renamed message key fails the type check instead of rendering a raw key to a visitor.
const ERROR_KEYS = {
  name: {
    required: 'errors.name.required',
    tooShort: 'errors.name.tooShort',
    tooLong: 'errors.name.tooLong',
  },
  company: { tooLong: 'errors.company.tooLong' },
  segment: { required: 'errors.segment.required', invalid: 'errors.segment.invalid' },
  interest: { required: 'errors.interest.required', invalid: 'errors.interest.invalid' },
  budget: { invalid: 'errors.budget.invalid' },
  message: {
    required: 'errors.message.required',
    tooShort: 'errors.message.tooShort',
    tooLong: 'errors.message.tooLong',
  },
  consent: { required: 'errors.consent.required' },
  email: { required: 'errors.email.required', invalid: 'errors.email.invalid' },
  whatsapp: { required: 'errors.whatsapp.required', invalid: 'errors.whatsapp.invalid' },
} as const satisfies Record<FormField, Partial<Record<ContactErrorCode, MessageKey>>>

const fieldId = (field: FormField) => `contact-${field}`

const EMPTY_VALUES: FormValues = {
  name: '',
  company: '',
  segment: '',
  interest: '',
  budget: '',
  message: '',
  consent: false,
  email: '',
  whatsapp: '',
}

/** Client and server share one rule set (`contact-schema`), so they can never disagree. */
const validate = (values: FormValues): LeadErrors => validateContactSubmission(values)

type Fallback = Readonly<{ href: string | null; message: string }>
type CopyState = 'idle' | 'copied' | 'failed'

export function ContactForm({
  intro,
  consentLabel,
  settings,
  initialInterest = '',
  saveLead,
}: ContactFormProps) {
  const t = useTranslations('Contact')
  const locale = useLocale()
  const router = useRouter()
  const [values, setValues] = useState<FormValues>({
    ...EMPTY_VALUES,
    interest: initialInterest,
  })
  const [errors, setErrors] = useState<LeadErrors>({})
  // Honeypot (CPR-49): hidden from people, filled only by bots. Kept in state, never named.
  const [website, setWebsite] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [serverError, setServerError] = useState<'failed' | 'check' | null>(null)
  const turnstile = useRef<TurnstileHandle>(null)
  // Set once the lead is stored (for example while the fallback panel is shown after a blocked
  // tab), so trying again only reopens the chat and never stores the same lead twice.
  const saved = useRef(false)
  const serverErrorRef = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [sending, setSending] = useState(false)
  const [fallback, setFallback] = useState<Fallback | null>(null)
  const [copy, setCopy] = useState<CopyState>('idle')
  const summaryRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  // A ref, not the state above: two submits in the same tick (Enter plus click) both read the
  // state before React re-renders it, and would open two tabs.
  const locked = useRef(false)

  // Focus follows the summary on every invalid submit, including a second one that shows the
  // same errors, which is why the trigger is a counter and not the errors object.
  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus()
  }, [attempt])
  useEffect(() => {
    if (fallback) fallbackRef.current?.focus()
  }, [fallback])
  useEffect(() => {
    if (serverError) serverErrorRef.current?.focus()
  }, [serverError])

  const errorText = (field: FormField, code: ContactErrorCode) => {
    const keys: Partial<Record<ContactErrorCode, MessageKey>> = ERROR_KEYS[field]
    const key = keys[code]
    return key ? t(key) : t('summary.title')
  }
  const errorFor = (field: FormField) => {
    const code = errors[field]
    return code ? errorText(field, code) : undefined
  }

  function update<K extends FormField>(field: K, value: FormValues[K]) {
    const next = { ...values, [field]: value }
    setValues(next)
    // Only a field that already shows an error is re-checked while typing, so a visitor is never
    // told off for a field they have not finished. The error disappears the moment it is fixed.
    if (!errors[field]) return
    const code = validate(next)[field]
    setErrors((previous) => {
      const rest = { ...previous }
      delete rest[field]
      return code ? { ...rest, [field]: code } : rest
    })
  }

  const budgetLabels = Object.fromEntries(
    BUDGET_KEYS.map((key) => [key, t(`budgets.${key}`)]),
  ) as Record<BudgetKey, string>

  /**
   * Stores the lead (CPR-105). On success the tab moves to the thank-you page; on a refusal the
   * answers stay, a calm message offers WhatsApp, and a new Turnstile token is requested because
   * a token is single use.
   */
  async function store(navigate: boolean): Promise<void> {
    const result = await saveLead(
      { ...values, website, turnstileToken: token ?? '' },
      { locale, sourcePage: SOURCE_PAGE },
    ).catch(() => null)
    if (result?.ok) {
      saved.current = true
      if (navigate) {
        markContactHandoff()
        router.push(THANK_YOU_PATH)
      }
      return
    }
    locked.current = false
    setSending(false)
    turnstile.current?.reset()
    const fieldErrors = validate(values)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      setAttempt((count) => count + 1)
      return
    }
    setServerError('failed')
  }

  function submit(channel: 'whatsapp' | 'email') {
    if (locked.current) return
    const found = validate(values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      setAttempt((count) => count + 1)
      return
    }
    const fields = toContactFields(values, budgetLabels)
    if (!fields) return
    setErrors({})
    setCopy('idle')
    // The security check usually finishes on its own while the visitor types.
    if (!token && !saved.current) {
      setServerError('check')
      return
    }
    setServerError(null)

    const message = buildContactMessage(fields, settings.whatsapp.templates) ?? ''
    const href =
      channel === 'email'
        ? buildContactMailto(fields, settings)
        : buildContactWhatsAppUrl(fields, settings)
    if (!href) {
      // No way to open a chat: the lead is still stored and the message offered to copy.
      setFallback({ href: null, message })
      if (!saved.current) void store(false)
      return
    }

    // `window.open` runs inside the submit event, so the browser still counts it as the visitor's
    // own action and allows the tab. The mail app opens in this tab (`_self`): a mailto link
    // leaves the page in place and needs no popup.
    //
    // Why not `window.open(url, '_blank', 'noopener')`: it always returns null, which looks
    // exactly like a blocked popup, so a successful open could not be told from a failure.
    // Opening normally and clearing `opener` straight away gives the same protection (the new
    // tab cannot script this page) and keeps the null check meaningful.
    if (channel === 'email') {
      window.open(href, '_self')
    } else {
      const opened = window.open(href, '_blank')
      if (!opened) {
        // Blocked tab: stay to offer the fallback, but the lead is stored either way.
        setFallback({ href, message })
        if (!saved.current) void store(false)
        return
      }
      opened.opener = null
    }
    locked.current = true
    setFallback(null)
    setSending(true)
    if (saved.current) {
      markContactHandoff()
      router.push(THANK_YOU_PATH)
      return
    }
    void store(true)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit('whatsapp')
  }

  // A summary link jumps to its field with focus, not just scroll: the in-page anchor alone would
  // scroll and leave keyboard focus on the link.
  function focusField(event: MouseEvent<HTMLAnchorElement>, field: FormField) {
    event.preventDefault()
    document.getElementById(fieldId(field))?.focus()
  }

  async function copyMessage() {
    if (!fallback) return
    try {
      await navigator.clipboard.writeText(fallback.message)
      setCopy('copied')
    } catch {
      // No clipboard permission (insecure context, old browser): say so instead of failing silently.
      setCopy('failed')
    }
  }

  function openFromFallback() {
    // The link itself opens WhatsApp; this tab follows to the thank-you page like the main path.
    locked.current = true
    setSending(true)
    markContactHandoff()
    router.push(THANK_YOU_PATH)
  }

  const failed = FORM_FIELD_ORDER.filter((field) => errors[field])
  const hasEmail = Boolean(settings.contact.email)

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby="contact-form-heading"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <h2 id="contact-form-heading" className="text-h3 text-text">
          {t('formHeading')}
        </h2>
        <p className="text-body-sm text-text-secondary">{intro}</p>
      </div>

      {failed.length > 0 ? (
        <div
          ref={summaryRef}
          role="region"
          aria-labelledby="contact-summary-title"
          tabIndex={-1}
          className="rounded-sm border border-danger bg-danger-surface p-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <p id="contact-summary-title" className="text-label text-danger">
            {t('summary.title')}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {failed.map((field) => (
              <li key={field}>
                <a
                  href={`#${fieldId(field)}`}
                  onClick={(event) => focusField(event, field)}
                  className="inline-flex min-h-11 items-center text-body-sm text-danger underline underline-offset-4"
                >
                  {errorFor(field)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Field
        id={fieldId('name')}
        label={t('fields.name.label')}
        required
        requiredLabel={t('requiredMarker')}
        error={errorFor('name')}
      >
        {(control) => (
          <Input
            {...control}
            autoComplete="name"
            maxLength={CONTACT_RULES.nameMax}
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
          />
        )}
      </Field>

      <Field
        id={fieldId('email')}
        label={t('fields.email.label')}
        helper={t('fields.email.helper')}
        required
        requiredLabel={t('requiredMarker')}
        error={errorFor('email')}
      >
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
          />
        )}
      </Field>

      <Field
        id={fieldId('whatsapp')}
        label={t('fields.whatsapp.label')}
        helper={t('fields.whatsapp.helper')}
        required
        requiredLabel={t('requiredMarker')}
        error={errorFor('whatsapp')}
      >
        {(control) => (
          <Input
            {...control}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={t('fields.whatsapp.placeholder')}
            maxLength={40}
            value={values.whatsapp}
            onChange={(event) => update('whatsapp', event.target.value)}
          />
        )}
      </Field>

      <Field id={fieldId('company')} label={t('fields.company.label')} error={errorFor('company')}>
        {(control) => (
          <Input
            {...control}
            autoComplete="organization"
            maxLength={CONTACT_RULES.companyMax}
            value={values.company}
            onChange={(event) => update('company', event.target.value)}
          />
        )}
      </Field>

      <Field
        id={fieldId('segment')}
        label={t('fields.segment.label')}
        required
        requiredLabel={t('requiredMarker')}
        error={errorFor('segment')}
      >
        {(control) => (
          <Select
            {...control}
            value={values.segment}
            onChange={(event) =>
              update('segment', event.target.value as ContactFormValues['segment'])
            }
          >
            <option value="">{t('fields.segment.placeholder')}</option>
            {CONTACT_SEGMENTS.map((segment) => (
              <option key={segment} value={segment}>
                {t(`segments.${SEGMENT_MESSAGE_KEYS[segment]}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        id={fieldId('interest')}
        label={t('fields.interest.label')}
        required
        requiredLabel={t('requiredMarker')}
        error={errorFor('interest')}
      >
        {(control) => (
          <Select
            {...control}
            value={values.interest}
            onChange={(event) =>
              update('interest', event.target.value as ContactFormValues['interest'])
            }
          >
            <option value="">{t('fields.interest.placeholder')}</option>
            {CONTACT_INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {t(`interests.${INTEREST_MESSAGE_KEYS[interest]}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        id={fieldId('budget')}
        label={t('fields.budget.label')}
        helper={t('fields.budget.helper')}
        error={errorFor('budget')}
      >
        {(control) => (
          <Select
            {...control}
            value={values.budget}
            onChange={(event) =>
              update('budget', event.target.value as ContactFormValues['budget'])
            }
          >
            <option value="">{t('fields.budget.placeholder')}</option>
            {BUDGET_KEYS.map((key) => (
              // The stored value is the key; the label is what the visitor reads and the team receives.
              <option key={key} value={key}>
                {budgetLabels[key]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        id={fieldId('message')}
        label={t('fields.message.label')}
        helper={t('fields.message.helper')}
        required
        requiredLabel={t('requiredMarker')}
        error={errorFor('message')}
      >
        {(control) => (
          <Textarea
            {...control}
            maxLength={CONTACT_RULES.messageMax}
            value={values.message}
            onChange={(event) => update('message', event.target.value)}
          />
        )}
      </Field>

      <Checkbox
        id={fieldId('consent')}
        aria-required="true"
        checked={values.consent}
        onChange={(event) => update('consent', event.target.checked)}
        error={errorFor('consent')}
        label={
          <>
            {consentLabel.before}
            {/* New tab: the visitor keeps what they typed while reading the policy. */}
            <Link
              href={PRIVACY_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-link) underline underline-offset-4"
            >
              {consentLabel.linkLabel}
            </Link>
            {consentLabel.after}
          </>
        }
      />
      <Honeypot value={website} onChange={setWebsite} />

      <TurnstileWidget ref={turnstile} onToken={setToken} language={locale} />

      {serverError ? (
        <div
          ref={serverErrorRef}
          role="alert"
          tabIndex={-1}
          className="flex flex-col gap-1 rounded-sm border border-danger bg-danger-surface p-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {serverError === 'check' ? (
            <p className="text-body-sm text-danger">{t('serverError.check')}</p>
          ) : (
            <>
              <p className="text-label text-danger">{t('serverError.title')}</p>
              <p className="text-body-sm text-text-secondary">{t('serverError.body')}</p>
            </>
          )}
        </div>
      ) : null}

      {fallback ? (
        <div
          ref={fallbackRef}
          role="region"
          aria-labelledby="contact-fallback-title"
          tabIndex={-1}
          className="flex flex-col gap-3 rounded-sm border border-border-strong bg-canvas-alt p-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <p id="contact-fallback-title" className="text-label text-text">
            {t('fallback.title')}
          </p>
          <p className="text-body-sm text-text-secondary">
            {fallback.href ? t('fallback.blocked') : t('fallback.noLink')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {fallback.href ? (
              <Button
                href={fallback.href}
                target="_blank"
                rel="noopener noreferrer"
                variant="whatsapp"
                size="lg"
                leadingIcon={<WhatsAppIcon className="text-success" />}
                onClick={openFromFallback}
              >
                {t('fallback.open')}
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="lg" onClick={copyMessage}>
              {t('fallback.copy')}
            </Button>
          </div>
          {/* Always mounted inside the panel, so the text appearing is announced. */}
          <p role="status" className="text-micro text-text-secondary">
            {copy === 'copied'
              ? t('fallback.copied')
              : copy === 'failed'
                ? t('fallback.copyFailed')
                : ''}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          size="lg"
          loading={sending}
          loadingLabel={t('submit.sending')}
          className="w-full"
        >
          {t('submit.label')}
        </Button>
        {hasEmail ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={sending}
            onClick={() => submit('email')}
            className="w-full"
          >
            {t('submit.emailInstead')}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function PrefilledContactForm(props: Omit<ContactFormProps, 'initialInterest'>) {
  const searchParams = useSearchParams()
  return (
    <ContactForm
      {...props}
      initialInterest={interestFromServiceParam(searchParams.get('service'))}
    />
  )
}

/**
 * The form with `?service=` applied. `useSearchParams` opts its subtree out of static rendering,
 * so it sits in a Suspense boundary: the fallback is the same form without a preselection, which
 * keeps the prerendered HTML complete (a visitor without script still sees every field) and the
 * layout stable until the real URL is known.
 */
export function ContactFormWithPrefill(props: Omit<ContactFormProps, 'initialInterest'>) {
  return (
    <Suspense fallback={<ContactForm {...props} />}>
      <PrefilledContactForm {...props} />
    </Suspense>
  )
}
