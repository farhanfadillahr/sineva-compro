import { describe, expect, it } from 'vitest'
import { findForbiddenDashes } from '../../src/lib/copy/dash-rule'
import { DEFAULT_TEMPLATES } from '../../src/features/email/defaults'
import { emailDeliveryIsLive } from '../../src/features/email/delivery'

describe('default email templates', () => {
  it.each(Object.entries(DEFAULT_TEMPLATES))(
    '%s has no dashes and no old brand name',
    (_, template) => {
      for (const text of [template.subject, template.body]) {
        expect(findForbiddenDashes(text)).toEqual([])
        expect(text).not.toMatch(/Sineva Tech/i)
      }
    },
  )
})

describe('email delivery mode', () => {
  it('sends real email only when live (preview and production)', () => {
    expect(emailDeliveryIsLive({ NODE_ENV: 'development' })).toBe(false)
    expect(emailDeliveryIsLive({ NODE_ENV: 'test', EMAIL_DELIVERY: 'mock' })).toBe(false)
    expect(emailDeliveryIsLive({ NODE_ENV: 'development', EMAIL_DELIVERY: 'live' })).toBe(true)
    expect(emailDeliveryIsLive({ NODE_ENV: 'production' })).toBe(true)
    expect(emailDeliveryIsLive({ NODE_ENV: 'production', EMAIL_DELIVERY: 'mock' })).toBe(false)
  })
})
