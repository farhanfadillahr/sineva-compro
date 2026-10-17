import { describe, expect, it } from 'vitest'
import { parseAuditEntry, parseAuditList, auditPageHref } from '../../src/features/audit/input'
import { parseSeedOptions } from '../../scripts/seed/options'

describe('audit metadata boundary', () => {
  const entry = {
    entity: 'users',
    entityId: 'internal-123',
    action: 'update',
    changedFields: ['name', 'email', 'name'],
  }
  it('normalizes field names without accepting record values', () => {
    expect(parseAuditEntry(entry)).toEqual({ ...entry, changedFields: ['email', 'name'] })
    for (const extra of [
      { values: { password: 'secret' } },
      { before: 'lead@example.com' },
      { actorId: 'forged' },
    ]) {
      expect(() => parseAuditEntry({ ...entry, ...extra })).toThrow()
    }
  })
  it('rejects values disguised as fields, entities, actions or record identifiers', () => {
    for (const change of [
      { changedFields: ['lead@example.com'] },
      { changedFields: ['secretValue'] },
      { changedFields: { email: 'lead@example.com' } },
      { entity: 'lead@example.com' },
      { action: 'secret-value' },
      { entityId: 'lead@example.com' },
      { changedFields: [] },
    ])
      expect(() => parseAuditEntry({ ...entry, ...change })).toThrow()
    expect(
      parseAuditEntry({
        entity: 'leads',
        entityId: 'opaque-id',
        action: 'update',
        changedFields: ['status', 'notes'],
      }).changedFields,
    ).toEqual(['notes', 'status'])
    expect(
      parseAuditEntry({
        entity: 'email_settings',
        entityId: 'singleton',
        action: 'update',
        changedFields: ['smtpPassword', 'apiKey'],
      }).changedFields,
    ).toEqual(['apiKey', 'smtpPassword'])
  })
  it('bounds URL pagination and preserves actor/entity filters in links', () => {
    expect(parseAuditList({})).toEqual({ actor: '', entity: '', page: 1, pageSize: 20 })
    expect(
      parseAuditList({ actor: 'staff-id', entity: 'users', page: '2', pageSize: '50' }),
    ).toEqual({ actor: 'staff-id', entity: 'users', page: 2, pageSize: 50 })
    for (const invalid of [
      { page: '1.5' },
      { page: '-1' },
      { page: '100001' },
      { page: ['2'] },
      { actor: ['x'] },
      { entity: 'invalid' },
      { pageSize: '10000' },
    ])
      expect(() => parseAuditList(invalid)).toThrow()
    expect(auditPageHref({ actor: 'staff-id', entity: 'users', page: 3, pageSize: 50 })).toBe(
      '/admin/audit?actor=staff-id&entity=users&page=3&pageSize=50',
    )
  })
})

describe('seed guards', () => {
  const local = 'postgresql://localhost/sineva_compro_app_test'
  const remote = 'postgresql://remote.example.com/demo'
  it('allows structural base seeds everywhere and local demo/purge', () => {
    expect(parseSeedOptions([], remote, 'production').mode).toBe('base')
    expect(parseSeedOptions(['--demo'], local, 'development').mode).toBe('demo')
    expect(parseSeedOptions(['--purge-demo'], local, 'test').mode).toBe('purge-demo')
  })
  it('requires both explicit target confirmation and remote allowance for remote/production demo or purge', () => {
    for (const mode of ['--demo', '--purge-demo']) {
      expect(() => parseSeedOptions([mode], remote, 'development')).toThrow()
      expect(() =>
        parseSeedOptions([mode, '--allow-demo-on-remote'], remote, 'development'),
      ).toThrow()
      expect(() =>
        parseSeedOptions(
          [mode, '--confirm-database=wrong', '--allow-demo-on-remote'],
          remote,
          'development',
        ),
      ).toThrow()
      expect(() => parseSeedOptions([mode], local, 'production')).toThrow()
      expect(
        parseSeedOptions(
          [mode, '--confirm-database=demo', '--allow-demo-on-remote'],
          remote,
          'production',
        ).mode,
      ).toBe(mode.slice(2))
    }
  })
  it('rejects conflicting, duplicate or unknown arguments and URL target overrides', () => {
    for (const args of [
      ['--demo', '--purge-demo'],
      ['--demo', '--demo'],
      ['--demoo'],
      ['--module=unknown'],
    ])
      expect(() => parseSeedOptions(args, local, 'test')).toThrow()
    expect(() => parseSeedOptions(['--demo'], `${local}?host=remote.example.com`, 'test')).toThrow()
  })
})
