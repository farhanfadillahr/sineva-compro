import { describe, expect, it } from 'vitest'
import { signPreviewToken, verifyPreviewToken } from '../../src/features/preview/token'

const secret = 'x'.repeat(40)
const id = '0f8fad5b-d9cb-469f-a165-70867728950e'

describe('preview tokens', () => {
  it('accepts an authentic, unexpired token', () => {
    const expires = Date.now() + 60_000
    expect(verifyPreviewToken(secret, signPreviewToken(secret, id, expires))).toBe(id)
  })
  it('rejects an expired, tampered or foreign token', () => {
    const expires = Date.now() + 60_000
    const token = signPreviewToken(secret, id, expires)
    expect(verifyPreviewToken(secret, token, expires + 1)).toBeNull()
    expect(
      verifyPreviewToken(secret, token.replace(id, '1f8fad5b-d9cb-469f-a165-70867728950e')),
    ).toBeNull()
    expect(
      verifyPreviewToken(secret, token.replace(String(expires), String(expires + 1000))),
    ).toBeNull()
    expect(verifyPreviewToken('y'.repeat(40), token)).toBeNull()
    expect(verifyPreviewToken(secret, `${token}.extra`)).toBeNull()
    expect(verifyPreviewToken(secret, undefined)).toBeNull()
  })
})
