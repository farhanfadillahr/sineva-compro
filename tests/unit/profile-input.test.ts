import { describe, expect, it } from 'vitest'
import {
  deviceLabel,
  parseName,
  parsePasswordChange,
  parsePreferences,
} from '../../src/features/profile/input'

describe('profile input', () => {
  it('validates names', () => {
    expect(parseName({ name: '  Farhan  ' })).toBe('Farhan')
    expect(() => parseName({ name: 'F' })).toThrow()
    expect(() => parseName({ name: 'x'.repeat(81) })).toThrow()
  })
  it('validates password changes', () => {
    const ok = {
      currentPassword: 'old-password-1',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    }
    expect(parsePasswordChange(ok)).toEqual({
      currentPassword: 'old-password-1',
      newPassword: 'new-password-123',
    })
    expect(() =>
      parsePasswordChange({ ...ok, newPassword: 'short', confirmPassword: 'short' }),
    ).toThrow()
    expect(() => parsePasswordChange({ ...ok, confirmPassword: 'different-password' })).toThrow()
    expect(() =>
      parsePasswordChange({
        ...ok,
        newPassword: ok.currentPassword,
        confirmPassword: ok.currentPassword,
      }),
    ).toThrow()
  })
  it('validates preferences', () => {
    expect(parsePreferences({ density: 'compact', sidebarCollapsed: true })).toEqual({
      density: 'compact',
      sidebarCollapsed: true,
    })
    expect(() => parsePreferences({ density: 'tiny', sidebarCollapsed: true })).toThrow()
  })
  it('summarises user agents without exposing them', () => {
    expect(
      deviceLabel(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      ),
    ).toBe('Chrome di macOS')
    expect(deviceLabel(null)).toBe('Perangkat tidak dikenal')
  })
})
