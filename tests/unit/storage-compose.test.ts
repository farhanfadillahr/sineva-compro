import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { parse } from 'yaml'

// Protect network and persistence boundaries in the runnable Compose artifact.
const path = new URL('../../compose.storage.yaml', import.meta.url)
const compose = parse(existsSync(path) ? readFileSync(path, 'utf8') : '{}', { merge: true })
it('exposes only S3 on a loopback host binding and keeps component networking internal', () => {
  expect(Object.keys(compose.services ?? {})).toEqual(['master', 'volume', 'filer', 's3'])
  for (const [name, service] of Object.entries(compose.services ?? {}) as [
    string,
    { ports?: string[]; networks: string[]; image: string; restart: string; healthcheck: unknown },
  ][]) {
    expect(service.ports ?? []).toEqual(name === 's3' ? ['127.0.0.1:8333:8333'] : [])
    expect(service.networks).toEqual(['storage'])
    expect(service.image).toBe('chrislusf/seaweedfs:4.48')
    expect(service.restart).toBe('unless-stopped')
    expect(service.healthcheck).toBeDefined()
  }
  expect(compose.networks?.storage?.internal).toBe(true)
})
it('retains master, volume and filer state separately across container recreation', () => {
  expect(compose.services?.master?.volumes).toContain('master-data:/data')
  expect(compose.services?.volume?.volumes).toContain('volume-data:/data')
  expect(compose.services?.filer?.volumes).toContain('filer-data:/data')
  expect(Object.keys(compose.volumes ?? {})).toEqual(['master-data', 'volume-data', 'filer-data'])
})
