import { describe, expect, it } from 'vitest'
import { readServerEnv } from '../../src/env/server'

const valid = {
  DATABASE_URL: 'postgresql://local:local@127.0.0.1:5434/sineva_compro_app',
  BETTER_AUTH_SECRET: 'a'.repeat(48),
  BETTER_AUTH_URL: 'http://127.0.0.1:3000',
}

describe('custom-admin environment', () => {
  it('accepts app database and auth configuration without a CMS secret', () => {
    expect(readServerEnv(valid)).toEqual({
      databaseUrl: valid.DATABASE_URL,
      authSecret: valid.BETTER_AUTH_SECRET,
      authUrl: 'http://127.0.0.1:3000',
      clientIp: { mode: 'direct' },
    })
  })

  it.each([
    undefined,
    '',
    ' ',
    'invalid',
    'https://private:credential@host/db',
    'postgresql://localhost',
  ])('rejects an unusable database URL without exposing credentials', (DATABASE_URL) => {
    expect(() => readServerEnv({ ...valid, DATABASE_URL })).toThrow(/^DATABASE_URL /)
    try {
      readServerEnv({ ...valid, DATABASE_URL })
    } catch (error) {
      expect(String(error)).not.toContain('credential')
    }
  })

  it.each([undefined, '', 'short', ' '.repeat(48)])(
    'rejects weak auth secret',
    (BETTER_AUTH_SECRET) => {
      expect(() => readServerEnv({ ...valid, BETTER_AUTH_SECRET })).toThrow(/^BETTER_AUTH_SECRET /)
    },
  )

  it.each([
    undefined,
    '',
    'not-a-url',
    'ftp://host',
    'https://host/path',
    'https://host?key=secret',
    'https://user:secret@host',
  ])('requires an HTTP(S) auth origin without credentials, path or query', (BETTER_AUTH_URL) => {
    expect(() => readServerEnv({ ...valid, BETTER_AUTH_URL })).toThrow(/^BETTER_AUTH_URL /)
  })

  it('normalizes a trailing origin slash and keeps the config immutable', () => {
    const input = Object.freeze({ ...valid, BETTER_AUTH_URL: 'https://compro.example.com/' })
    const output = readServerEnv(input)
    expect(output.authUrl).toBe('https://compro.example.com')
    expect(Object.isFrozen(output)).toBe(true)
    expect(input.BETTER_AUTH_URL).toBe('https://compro.example.com/')
  })
})
