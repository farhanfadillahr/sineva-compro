import { describe, expect, it } from 'vitest'
import { getContentSource } from '../../src/lib/content-source'

// While no public email is confirmed, the contact copy must not offer email as a channel:
// the form can only open WhatsApp, so promising email would mislead visitors.
describe('contact copy matches the available channels', () => {
  it('does not mention email while the public email is null', async () => {
    const source = getContentSource()
    const settings = await source.getSiteSettings('en')
    const contact = await source.getPage('contact', 'en')
    if (settings?.contact.email !== null) return
    expect(JSON.stringify(contact)).not.toMatch(/\bemail\b/i)
  })
})
