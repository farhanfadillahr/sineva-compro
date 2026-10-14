import { describe, expect, it } from 'vitest'
import { readServerEnv } from '../../src/env/server'

const valid = {
  DATABASE_URL: 'postgresql://local:local@127.0.0.1:5432/sineva_compro',
  PAYLOAD_SECRET: 'a'.repeat(48),
}

describe('server environment', () => {
  it('accepts a configured PostgreSQL URL and secret', () => {
    expect(readServerEnv(valid)).toEqual({
      databaseUrl: valid.DATABASE_URL,
      payloadSecret: valid.PAYLOAD_SECRET,
    })
  })

  it.each([undefined, '', ' '])('rejects a missing database URL: %s', (DATABASE_URL) => {
    expect(() => readServerEnv({ ...valid, DATABASE_URL })).toThrow('DATABASE_URL')
  })

  it.each(['invalid', 'https://example.com/db', 'postgresql://localhost'])(
    'rejects an unusable database URL: %s',
    (DATABASE_URL) => {
      expect(() => readServerEnv({ ...valid, DATABASE_URL })).toThrow('DATABASE_URL')
    },
  )

  it.each([undefined, '', 'short', ' '.repeat(48)])(
    'rejects a weak/missing secret',
    (PAYLOAD_SECRET) => {
      expect(() => readServerEnv({ ...valid, PAYLOAD_SECRET })).toThrow('PAYLOAD_SECRET')
    },
  )

  it('does not include connection credentials in errors', () => {
    const value = 'https://private-user:private-password@example.com/private-db'
    expect(() => readServerEnv({ ...valid, DATABASE_URL: value })).toThrow('DATABASE_URL')
    try {
      readServerEnv({ ...valid, DATABASE_URL: value })
    } catch (error) {
      expect(String(error)).not.toContain('private-password')
      expect(String(error)).not.toContain(value)
    }
  })

  it('does not include weak secret values in errors', () => {
    expect(() => readServerEnv({ ...valid, PAYLOAD_SECRET: 'private-short-secret' })).toThrow(
      /^PAYLOAD_SECRET /,
    )
  })

  it('does not mutate the supplied environment and returns immutable configuration', () => {
    const input = Object.freeze({ ...valid })
    expect(Object.isFrozen(readServerEnv(input))).toBe(true)
    expect(input).toEqual(valid)
  })
})
