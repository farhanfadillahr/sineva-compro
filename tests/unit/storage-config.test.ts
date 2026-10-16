import { describe, expect, it } from 'vitest'
import { readStorageConfig } from '../../src/lib/storage/config'

describe('storage mutation target guard', () => {
  it('selects an explicit loopback path-style S3 endpoint by default', () => {
    expect(readStorageConfig({})).toMatchObject({
      endpoint: 'http://127.0.0.1:8333',
      region: 'us-east-1',
      forcePathStyle: true,
      buckets: ['media-public', 'media-private', 'backups'],
    })
  })
  it.each(['https://s3.example.test', 'http://192.168.1.8:8333', 'http://127.0.0.2:8333'])(
    'refuses unconfirmed remote target %s',
    (endpoint) => {
      expect(() => readStorageConfig({ STORAGE_ENDPOINT: endpoint })).toThrow(/confirm/i)
    },
  )
  it.each(['production', 'preview'])('refuses %s mutations even on loopback', (environment) => {
    expect(() => readStorageConfig({ STORAGE_ENV: environment })).toThrow(/confirm/i)
  })
  it('also guards NODE_ENV=production', () => {
    expect(() => readStorageConfig({ NODE_ENV: 'production' })).toThrow(/confirm/i)
  })
  it('requires the exact canonical origin, not a boolean or prefix match', () => {
    for (const confirmation of [
      'true',
      'https://s3.example.test.evil',
      'https://s3.example.test/',
    ]) {
      expect(() =>
        readStorageConfig({
          STORAGE_ENDPOINT: 'https://s3.example.test',
          STORAGE_CONFIRM_ORIGIN: confirmation,
        }),
      ).toThrow(/confirm/i)
    }
    expect(
      readStorageConfig({
        STORAGE_ENDPOINT: 'https://s3.example.test',
        STORAGE_CONFIRM_ORIGIN: 'https://s3.example.test',
      }).endpoint,
    ).toBe('https://s3.example.test')
  })
  it.each([
    'http://user:sensitive@example.test',
    'http://127.0.0.1:8333/private',
    'http://127.0.0.1:8333?host=evil',
    'http://127.0.0.1:8333#fragment',
    'ftp://127.0.0.1',
  ])('rejects ambiguous endpoint without echoing credentials: %s', (endpoint) => {
    expect(() => readStorageConfig({ STORAGE_ENDPOINT: endpoint })).toThrow(
      /^Invalid STORAGE_ENDPOINT$/,
    )
  })
  it('refuses confirmed remote cleartext transport', () => {
    expect(() =>
      readStorageConfig({
        STORAGE_ENDPOINT: 'http://remote.example.test',
        STORAGE_CONFIRM_ORIGIN: 'http://remote.example.test',
      }),
    ).toThrow(/HTTPS/i)
  })
})
