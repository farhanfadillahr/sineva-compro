'use client'

import Script from 'next/script'
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cx } from '@/components/ui/cx'
import {
  CONSENT_OPEN_EVENT,
  disableAnalytics,
  enableAnalytics,
  GA_MEASUREMENT_ID,
  openConsentSettings,
  storeConsent,
  storedConsent,
  subscribeToConsent,
  type ConsentChoice,
} from '@/lib/consent/analytics-consent'

// `server` during server rendering and hydration: no banner and no script, so the first client
// render matches the HTML and returning visitors never see the banner flash.
const readChoice = () => storedConsent() ?? 'unset'
const serverChoice = () => 'server' as const

export type ConsentLabels = {
  title: string
  body: string
  accept: string
  decline: string
}

/**
 * Cookie consent for Google Analytics (CPR-109). Nothing from Google loads until the visitor
 * accepts. The banner shows on the first visit and again when the footer "Cookie settings" button
 * asks for it; a choice is stored on the device.
 *
 * It is not a modal: the page stays usable, and it does not take focus on the first visit. When
 * opened from the footer it moves focus to its heading, so keyboard users land on it.
 */
export function AnalyticsConsent({
  labels,
  privacyLink,
  measurementId = GA_MEASUREMENT_ID,
}: {
  labels: ConsentLabels
  /** The localized link to the privacy policy, rendered by the server layout. */
  privacyLink: ReactNode
  measurementId?: string
}) {
  const choice = useSyncExternalStore(subscribeToConsent, readChoice, serverChoice)
  // Set by the footer button; the banner also shows while no choice is stored.
  const [reopened, setReopened] = useState(false)
  const open = choice === 'unset' || reopened
  const heading = useRef<HTMLHeadingElement>(null)
  const titleId = useId()

  useEffect(() => {
    const onOpen = () => setReopened(true)
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  }, [])

  // Only a reopen moves focus; the first-visit banner leaves the visitor where they are.
  useEffect(() => {
    if (reopened) heading.current?.focus()
  }, [reopened])

  const decide = (next: ConsentChoice) => {
    if (next === 'granted') enableAnalytics(measurementId)
    else disableAnalytics(measurementId)
    storeConsent(next)
    setReopened(false)
  }

  return (
    <>
      {choice === 'granted' ? (
        <>
          <Script
            id="google-tag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];\nfunction gtag(){window.dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${measurementId}');`,
            }}
          />
          <Script
            id="google-tag"
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}
      {open ? (
        <section
          data-slot="consent-banner"
          aria-labelledby={titleId}
          className={cx(
            'fixed inset-x-4 bottom-4 z-40 rounded-lg border border-border bg-surface p-5 text-text shadow-lg',
            'md:right-auto md:left-6 md:bottom-6 md:max-w-md',
          )}
        >
          <h2
            ref={heading}
            id={titleId}
            tabIndex={-1}
            className="m-0 text-body font-semibold focus:outline-none"
          >
            {labels.title}
          </h2>
          <p className="mt-2 mb-0 text-body-sm text-text-secondary">
            {labels.body} {privacyLink}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button size="sm" onClick={() => decide('granted')}>
              {labels.accept}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => decide('denied')}>
              {labels.decline}
            </Button>
          </div>
        </section>
      ) : null}
    </>
  )
}

/** Footer button that shows the banner again, so a choice can be changed or withdrawn. */
export function ConsentSettingsButton({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      className={cx('cursor-pointer border-0 bg-transparent p-0', className)}
      onClick={openConsentSettings}
    >
      {label}
    </button>
  )
}
