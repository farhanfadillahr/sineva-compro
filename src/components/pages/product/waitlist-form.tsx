'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Honeypot } from '@/components/forms/honeypot'
import { TurnstileWidget, type TurnstileHandle } from '@/components/forms/turnstile'
import { signalLaunch } from '@/components/mascot/sino-launch/launch-bus'
import { Button, Checkbox, Field, Input, Select } from '@/components/ui'
import { focusRing } from '@/components/ui/cx'
import type { joinWaitlist } from '@/features/waitlist/actions'
import { validateWaitlist } from '@/lib/leads/waitlist-schema'
import type { ProductLabels } from './product-labels'
import {
  WAITLIST_LIMITS,
  buildWaitlistMailto,
  buildWaitlistWhatsAppUrl,
  type WaitlistChannels,
  type WaitlistMessageCopy,
} from './waitlist-message'

export type WaitlistFormProps = {
  labels: ProductLabels['waitlist']
  /** Label of the submit button: the page content's main CTA ("Get notified"). */
  submitLabel: string
  /** Options of the optional business type select. An empty list leaves the field out. */
  businessTypes: readonly { key: string; label: string }[]
  channels: WaitlistChannels
  /**
   * Ready, localised href of the privacy page. This is a client component, so it cannot take the
   * link component a server page passes to its blocks.
   */
  privacyHref: string
  /** The `joinWaitlist` server action, passed down from the server page (CPR-105). */
  join: typeof joinWaitlist
  /** Page locale: stored with the entry and used for the Turnstile widget language. */
  locale: string
}

/**
 * Inline "Get notified" form of the Product hero.
 *
 * The email joins the waitlist through the `joinWaitlist` server action (CPR-105) with the
 * Turnstile token and the honeypot for the anti-spam check, and the handler still opens the
 * visitor's own WhatsApp (or mail app) with a composed message. The answers go to the server as
 * an explicit object; the form has no `action` and the controls carry no `name`, so even a native
 * submit with JavaScript off would put nothing in the URL. A new and an already registered email
 * get the same success, so the form never reveals who is on the list.
 *
 * Gotchas:
 * - `window.open` runs inside the submit handler so it counts as a user gesture and is not
 *   blocked. With `noopener` it returns `null` whether or not a tab opened, so a blocked pop-up
 *   cannot be detected. A plain link to the same URL therefore appears after every submit.
 * - Consent is validated by hand (`noValidate`) so the error is an inline, described message that
 *   gets focus, not a browser bubble that the page cannot style or translate.
 * - With no WhatsApp number but an email, the form still works: submit (Enter included) goes to
 *   the mail route. With neither, the form renders nothing.
 */
export function WaitlistForm({
  labels,
  submitLabel,
  businessTypes,
  channels,
  privacyHref,
  join,
  locale,
}: WaitlistFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<'required' | 'invalid' | null>(null)
  // Honeypot (CPR-49): hidden from people, filled only by bots.
  const [website, setWebsite] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'joined' | 'failed' | 'check'>('idle')
  const turnstile = useRef<TurnstileHandle>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const [businessType, setBusinessType] = useState('')
  const [consent, setConsent] = useState(false)
  const [consentMissing, setConsentMissing] = useState(false)
  const [openedUrl, setOpenedUrl] = useState<string | null>(null)
  const consentRef = useRef<HTMLInputElement>(null)

  const hasWhatsApp = channels.whatsappNumber !== null
  const hasEmail = channels.email !== null
  if (!hasWhatsApp && !hasEmail) return null

  const copy: WaitlistMessageCopy = {
    notify: labels.messageNotify,
    name: labels.messageName,
    businessType: labels.messageBusinessType,
    emailSubject: labels.emailSubject,
  }

  async function joinList() {
    setStatus('sending')
    // The business type options are the Product page's industries, not the waitlist segments,
    // so no segment is sent (it is optional); the type still reaches us in the message.
    const result = await join(
      { email, segment: '', consent, website, turnstileToken: token ?? '' },
      { locale },
    ).catch(() => null)
    if (result?.ok) {
      setStatus('joined')
      return
    }
    turnstile.current?.reset()
    setStatus('failed')
  }

  function send(route: 'whatsapp' | 'email') {
    if (status === 'sending') return
    const problems = validateWaitlist({ email, segment: '', consent })
    setEmailError(problems.email ?? null)
    if (problems.email) {
      emailRef.current?.focus()
      return
    }
    if (!consent) {
      setConsentMissing(true)
      consentRef.current?.focus()
      return
    }
    if (status !== 'joined' && !token) {
      setStatus('check')
      return
    }
    if (status !== 'joined') void joinList()
    const fields = { name, businessType }
    if (route === 'whatsapp') {
      const url = buildWaitlistWhatsAppUrl(fields, copy, channels)
      if (!url) return
      window.open(url, '_blank', 'noopener,noreferrer')
      const trigger = consentRef.current?.form?.querySelector<HTMLElement>('[data-sino-launch]')
      if (trigger) signalLaunch('waitlist', trigger)
      setOpenedUrl(url)
      return
    }
    const url = buildWaitlistMailto(fields, copy, channels)
    if (url) window.open(url, '_self')
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    send(hasWhatsApp ? 'whatsapp' : 'email')
  }

  return (
    <form
      noValidate
      aria-label={labels.formLabel}
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-4"
    >
      <Field
        label={labels.emailLabel}
        required
        error={
          emailError === 'required'
            ? labels.emailRequired
            : emailError === 'invalid'
              ? labels.emailInvalid
              : undefined
        }
      >
        {(control) => (
          <Input
            {...control}
            ref={emailRef}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (emailError) setEmailError(null)
            }}
          />
        )}
      </Field>
      <Field label={labels.nameLabel}>
        {(control) => (
          <Input
            {...control}
            autoComplete="name"
            maxLength={WAITLIST_LIMITS.name}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>
      {businessTypes.length > 0 ? (
        <Field label={labels.businessTypeLabel}>
          {(control) => (
            <Select
              {...control}
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
            >
              <option value="">{labels.businessTypePlaceholder}</option>
              {businessTypes.map((type) => (
                <option key={type.key} value={type.label}>
                  {type.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}
      <Checkbox
        ref={consentRef}
        aria-required={true}
        checked={consent}
        onChange={(event) => {
          setConsent(event.target.checked)
          if (event.target.checked) setConsentMissing(false)
        }}
        error={consentMissing ? labels.consentError : undefined}
        label={
          <>
            {labels.consentBefore}{' '}
            <a
              href={privacyHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-xs text-(--color-link) underline underline-offset-2 ${focusRing}`}
            >
              {labels.consentLink}
            </a>
            {labels.consentAfter}
          </>
        }
      />
      <Honeypot value={website} onChange={setWebsite} />
      <TurnstileWidget ref={turnstile} onToken={setToken} language={locale} />
      <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap">
        {hasWhatsApp ? (
          <Button launch="waitlist" type="submit" size="lg" className="w-full min-[400px]:w-auto">
            {submitLabel}
          </Button>
        ) : null}
        {hasEmail ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full min-[400px]:w-auto"
            onClick={() => send('email')}
          >
            {labels.emailButton}
          </Button>
        ) : null}
      </div>
      <p className="text-micro text-text-tertiary">{labels.helper}</p>
      {/* A live region must exist before its text does, or the first message is not announced. */}
      <div role="status" className="flex flex-col gap-1 text-body-sm text-text-secondary">
        {status === 'joined' ? <p className="text-label text-text">{labels.joined}</p> : null}
        {status === 'failed' ? <p className="text-danger">{labels.joinFailed}</p> : null}
        {status === 'check' ? <p className="text-danger">{labels.checkPending}</p> : null}
        {openedUrl ? (
          <>
            {labels.openedMessage}{' '}
            <Button href={openedUrl} target="_blank" variant="link" size="md">
              {labels.openedLink}
            </Button>
          </>
        ) : null}
      </div>
    </form>
  )
}
