'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { markContactHandoff } from '@/components/mascot/sino-launch/launch-bus'
import { WhatsAppIcon } from '@/components/layout/icons'
import { Button, Checkbox, Field, Input, Select, Textarea } from '@/components/ui'
import type { ConsentLabel, SiteSettingsDTO } from '@/features/content/types'
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
  CONTACT_FIELD_ORDER,
  CONTACT_RULES,
  INTEREST_MESSAGE_KEYS,
  SEGMENT_MESSAGE_KEYS,
  interestFromServiceParam,
  toContactFields,
  validateContactField,
  validateContactForm,
  type BudgetKey,
  type ContactErrorCode,
  type ContactErrors,
  type ContactFieldKey,
  type ContactFormValues,
} from './contact-form-model'

// The form of /contact for the static launch. There is no backend: a valid submit composes a
// message from the answers and opens it in WhatsApp (or the visitor's mail app), in a new tab,
// then moves this tab to the thank-you page. Nothing is posted, stored or logged here, so the form
// has no `action`, no fetch, and gives no control a `name`: if the script ever failed to load, a
// native submit would otherwise put the visitor's answers into the address bar.

const THANK_YOU_PATH = '/contact/thank-you'
const PRIVACY_PATH = '/privacy-policy'

export type ContactFormProps = Readonly<{
  /** Page content: the line above the fields. */
  intro: string
  /** Page content: the consent sentence, split around the privacy link. */
  consentLabel: ConsentLabel
  settings: Pick<SiteSettingsDTO, 'contact' | 'whatsapp'>
  /** Preselected need, from `?service=`. */
  initialInterest?: '' | ContactInterest
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
} as const satisfies Record<ContactFieldKey, Partial<Record<ContactErrorCode, MessageKey>>>

const fieldId = (field: ContactFieldKey) => `contact-${field}`

const EMPTY_VALUES: ContactFormValues = {
  name: '',
  company: '',
  segment: '',
  interest: '',
  budget: '',
  message: '',
  consent: false,
}

type Fallback = Readonly<{ href: string | null; message: string }>
type CopyState = 'idle' | 'copied' | 'failed'

export function ContactForm({
  intro,
  consentLabel,
  settings,
  initialInterest = '',
}: ContactFormProps) {
  const t = useTranslations('Contact')
  const router = useRouter()
  const [values, setValues] = useState<ContactFormValues>({
    ...EMPTY_VALUES,
    interest: initialInterest,
  })
  const [errors, setErrors] = useState<ContactErrors>({})
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

  const errorText = (field: ContactFieldKey, code: ContactErrorCode) => {
    const keys: Partial<Record<ContactErrorCode, MessageKey>> = ERROR_KEYS[field]
    const key = keys[code]
    return key ? t(key) : t('summary.title')
  }
  const errorFor = (field: ContactFieldKey) => {
    const code = errors[field]
    return code ? errorText(field, code) : undefined
  }

  function update<K extends ContactFieldKey>(field: K, value: ContactFormValues[K]) {
    const next = { ...values, [field]: value }
    setValues(next)
    // Only a field that already shows an error is re-checked while typing, so a visitor is never
    // told off for a field they have not finished. The error disappears the moment it is fixed.
    if (!errors[field]) return
    const code = validateContactField(next, field)
    setErrors((previous) => {
      const rest = { ...previous }
      delete rest[field]
      return code ? { ...rest, [field]: code } : rest
    })
  }

  const budgetLabels = Object.fromEntries(
    BUDGET_KEYS.map((key) => [key, t(`budgets.${key}`)]),
  ) as Record<BudgetKey, string>

  function submit(channel: 'whatsapp' | 'email') {
    if (locked.current) return
    const found = validateContactForm(values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      setAttempt((count) => count + 1)
      return
    }
    const fields = toContactFields(values, budgetLabels)
    if (!fields) return
    setErrors({})
    setCopy('idle')

    const message = buildContactMessage(fields, settings.whatsapp.templates) ?? ''
    const href =
      channel === 'email'
        ? buildContactMailto(fields, settings)
        : buildContactWhatsAppUrl(fields, settings)
    if (!href) {
      setFallback({ href: null, message })
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
        setFallback({ href, message })
        return
      }
      opened.opener = null
    }
    locked.current = true
    setFallback(null)
    setSending(true)
    markContactHandoff()
    router.push(THANK_YOU_PATH)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit('whatsapp')
  }

  // A summary link jumps to its field with focus, not just scroll: the in-page anchor alone would
  // scroll and leave keyboard focus on the link.
  function focusField(event: MouseEvent<HTMLAnchorElement>, field: ContactFieldKey) {
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

  const failed = CONTACT_FIELD_ORDER.filter((field) => errors[field])
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
