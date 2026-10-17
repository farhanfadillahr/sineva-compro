// @vitest-environment jsdom
import React, { createRef } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import {
  TurnstileWidget,
  turnstileSiteKey,
  type TurnstileHandle,
} from '@/components/forms/turnstile'
import { TURNSTILE_TEST_SITE_KEY } from '@/features/leads/turnstile'

afterEach(() => {
  cleanup()
  delete window.turnstile
})

function fakeTurnstile() {
  const options: Record<string, unknown>[] = []
  const api = {
    render: vi.fn((_box: HTMLElement, o: Record<string, unknown>) => {
      options.push(o)
      return 'widget-1'
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  }
  window.turnstile = api as unknown as NonNullable<Window['turnstile']>
  return { api, options }
}

it('uses the configured key, the test key outside production, and none in production', () => {
  expect(turnstileSiteKey({ key: 'site-key', nodeEnv: 'production' })).toBe('site-key')
  expect(turnstileSiteKey({ nodeEnv: 'development' })).toBe(TURNSTILE_TEST_SITE_KEY)
  expect(turnstileSiteKey({ nodeEnv: 'production' })).toBeNull()
})

it('renders the widget and passes its token, then clears it on expiry and reset', async () => {
  const { api, options } = fakeTurnstile()
  const onToken = vi.fn()
  const ref = createRef<TurnstileHandle>()
  render(<TurnstileWidget ref={ref} onToken={onToken} language="id" />)

  await waitFor(() => expect(api.render).toHaveBeenCalledTimes(1))
  expect(options[0]).toMatchObject({ sitekey: TURNSTILE_TEST_SITE_KEY, language: 'id' })

  act(() => (options[0].callback as (t: string) => void)('token-1'))
  expect(onToken).toHaveBeenLastCalledWith('token-1')
  act(() => (options[0]['expired-callback'] as () => void)())
  expect(onToken).toHaveBeenLastCalledWith(null)

  act(() => ref.current!.reset())
  expect(api.reset).toHaveBeenCalledWith('widget-1')
})

it('removes the widget on unmount', async () => {
  const { api } = fakeTurnstile()
  const { unmount } = render(<TurnstileWidget onToken={() => {}} language="en" />)
  await waitFor(() => expect(api.render).toHaveBeenCalled())
  unmount()
  expect(api.remove).toHaveBeenCalledWith('widget-1')
})
