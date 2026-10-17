'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { TURNSTILE_TEST_SITE_KEY } from '@/features/leads/turnstile'

/**
 * Cloudflare Turnstile widget for the public intake forms (CPR-105). The server refuses a contact
 * or waitlist submission without a token (CPR-49), so every form that posts renders this.
 *
 * - Explicit rendering: the script loads once per page and each widget renders into its own box.
 * - The site key comes from `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Outside production, Cloudflare's
 *   always-pass test key is used, matching the server's test secret. Production without a key
 *   renders nothing (the server refuses submissions until both keys are set).
 * - A token is single use: forms call `reset()` after a failed submission to get a new one.
 * - The script origin is already allowed by the CSP (`src/lib/security/headers.mjs`).
 */

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileOptions = {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
  theme: 'auto'
  size: 'flexible'
  language: string
}
type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export function turnstileSiteKey(
  env: Readonly<{ key?: string; nodeEnv?: string }> = {
    key: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    nodeEnv: process.env.NODE_ENV,
  },
): string | null {
  if (env.key) return env.key
  return env.nodeEnv === 'production' ? null : TURNSTILE_TEST_SITE_KEY
}

let loading: Promise<TurnstileApi> | null = null
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error()))
    script.onerror = () => {
      loading = null
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(script)
  })
  return loading
}

export type TurnstileHandle = { reset: () => void }

export const TurnstileWidget = forwardRef<
  TurnstileHandle,
  { onToken: (token: string | null) => void; language: string }
>(function TurnstileWidget({ onToken, language }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  // The latest callback, so the widget is rendered once and never re-created on a new prop.
  const tokenSink = useRef(onToken)
  tokenSink.current = onToken
  const siteKey = turnstileSiteKey()

  useImperativeHandle(ref, () => ({
    reset() {
      tokenSink.current(null)
      if (widget.current && window.turnstile) window.turnstile.reset(widget.current)
    },
  }))

  useEffect(() => {
    if (!siteKey || !box.current) return
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !box.current) return
        widget.current = api.render(box.current, {
          sitekey: siteKey,
          callback: (token) => tokenSink.current(token),
          'expired-callback': () => tokenSink.current(null),
          'error-callback': () => tokenSink.current(null),
          theme: 'auto',
          size: 'flexible',
          language,
        })
      })
      .catch(() => tokenSink.current(null))
    return () => {
      cancelled = true
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
      widget.current = null
    }
  }, [siteKey, language])

  if (!siteKey) return null
  return <div ref={box} className="min-h-[65px]" data-testid="turnstile" />
})
