'use client'

import { useRef, useState, type FormEvent } from 'react'
import { signalLaunch } from '@/components/mascot/sino-launch/launch-bus'
import { Button, Checkbox, Field, Input, Select } from '@/components/ui'
import { focusRing } from '@/components/ui/cx'
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
}

/**
 * Inline "Get notified" form of the Product hero (static phase 1).
 *
 * Nothing is stored and nothing is sent to a server: no `action`, no `fetch`, no server action,
 * and the controls carry no `name`, so even a native submit with JavaScript off would put nothing
 * in the URL. The handler composes a message from the answers and opens the visitor's own
 * WhatsApp (or mail app) with it, so the visitor presses "send" themselves.
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
}: WaitlistFormProps) {
  const [name, setName] = useState('')
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

  function send(route: 'whatsapp' | 'email') {
    if (!consent) {
      setConsentMissing(true)
      consentRef.current?.focus()
      return
    }
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
      <div role="status" className="text-body-sm text-text-secondary">
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
