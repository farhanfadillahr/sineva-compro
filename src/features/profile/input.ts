import { CmsError } from '../cms/errors'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseName(input: unknown): string {
  const name = isRecord(input) && typeof input.name === 'string' ? input.name.trim() : ''
  if (name.length < 2 || name.length > 80 || /[\u0000-\u001f\u007f]/.test(name))
    throw new CmsError('INVALID', 'Nama harus 2 sampai 80 karakter.', {
      name: 'Nama harus 2 sampai 80 karakter.',
    })
  return name
}

export function parsePasswordChange(input: unknown) {
  const data = isRecord(input) ? input : {}
  const current = typeof data.currentPassword === 'string' ? data.currentPassword : ''
  const next = typeof data.newPassword === 'string' ? data.newPassword : ''
  const confirm = typeof data.confirmPassword === 'string' ? data.confirmPassword : ''
  const errors: Record<string, string> = {}
  if (!current) errors.currentPassword = 'Masukkan password saat ini.'
  if (next.length < 12 || next.length > 128) errors.newPassword = 'Gunakan 12 sampai 128 karakter.'
  else if (next === current) errors.newPassword = 'Password baru harus berbeda.'
  if (confirm !== next) errors.confirmPassword = 'Konfirmasi tidak sama dengan password baru.'
  if (Object.keys(errors).length) throw new CmsError('INVALID', 'Periksa kembali password.', errors)
  return { currentPassword: current, newPassword: next }
}

export function parsePreferences(input: unknown) {
  const data = isRecord(input) ? input : {}
  if (
    !['comfortable', 'compact'].includes(data.density as string) ||
    typeof data.sidebarCollapsed !== 'boolean'
  )
    throw new CmsError('INVALID', 'Preferensi tidak valid.')
  return {
    density: data.density as 'comfortable' | 'compact',
    sidebarCollapsed: data.sidebarCollapsed,
  }
}

/** Short device label from a user agent, never the raw string. */
export function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return 'Perangkat tidak dikenal'
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser lain'
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /iPhone|iPad/.test(userAgent)
      ? 'iOS'
      : /Mac OS X/.test(userAgent)
        ? 'macOS'
        : /Android/.test(userAgent)
          ? 'Android'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'OS lain'
  return `${browser} di ${os}`
}
