import { describe, expect, it } from 'vitest'
import { randomBytes } from 'node:crypto'
import {
  decryptSecret,
  encryptSecret,
  readEncryptionKey,
  SecretKeyError,
} from '../../src/lib/crypto/settings-secret'
import { renderHtml, renderSubject, unknownPlaceholders } from '../../src/features/email/render'

describe('settings secrets', () => {
  const key = randomBytes(32)
  it('round-trips a secret and never stores it in plain text', () => {
    const encrypted = encryptSecret('re_live_secret_value', key)
    expect(encrypted).toMatch(/^v1:/)
    expect(encrypted).not.toContain('re_live_secret_value')
    expect(decryptSecret(encrypted, key)).toBe('re_live_secret_value')
    expect(encryptSecret('same', key)).not.toBe(encryptSecret('same', key))
  })
  it('fails to decrypt a modified ciphertext or with another key', () => {
    const [v, iv, tag, data] = encryptSecret('value', key).split(':')
    const flipped = Buffer.from(data, 'base64url')
    flipped[0] ^= 1
    expect(() =>
      decryptSecret([v, iv, tag, flipped.toString('base64url')].join(':'), key),
    ).toThrow()
    expect(() => decryptSecret(encryptSecret('value', key), randomBytes(32))).toThrow()
  })
  it('refuses a missing or short key instead of falling back to plain text', () => {
    expect(() => readEncryptionKey({})).toThrow(SecretKeyError)
    expect(() => readEncryptionKey({ SETTINGS_ENCRYPTION_KEY: 'short' })).toThrow(SecretKeyError)
    expect(readEncryptionKey({ SETTINGS_ENCRYPTION_KEY: 'ab'.repeat(32) })).toHaveLength(32)
    expect(readEncryptionKey({ SETTINGS_ENCRYPTION_KEY: key.toString('base64') })).toEqual(key)
  })
})

describe('email templates', () => {
  it('escapes markup from values and the template itself', () => {
    const html = renderHtml(
      'Hello {name}, <b>bold</b>',
      { name: '<script>alert(1)</script>' },
      { siteName: 'Sineva' },
    )
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>bold</b>')
    expect(html).toContain('&lt;script&gt;')
  })
  it('keeps the subject on one line so values cannot inject headers', () => {
    expect(renderSubject('New lead from {name}', { name: 'Eve\r\nBcc: victim@example.com' })).toBe(
      'New lead from Eve Bcc: victim@example.com',
    )
  })
  it('lists placeholders a template does not support', () => {
    expect(unknownPlaceholders('Hi {name} about {service} {price}', 'lead-auto-reply')).toEqual([
      'price',
    ])
  })
})
