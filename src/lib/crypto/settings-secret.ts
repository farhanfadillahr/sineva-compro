import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Secrets stored in the database (SMTP password, Resend API key) are encrypted with AES-256-GCM.
 * The key comes from `SETTINGS_ENCRYPTION_KEY` (32 bytes, base64 or 64 hex characters). Without a
 * valid key nothing is encrypted or decrypted: there is no plaintext fallback.
 *
 * Format: `v1:<iv base64url>:<tag base64url>:<ciphertext base64url>`. The auth tag makes any change
 * to the ciphertext, IV or tag fail decryption.
 */
export class SecretKeyError extends Error {
  constructor() {
    super('SETTINGS_ENCRYPTION_KEY is missing or invalid')
  }
}

export function readEncryptionKey(env: Record<string, string | undefined> = process.env): Buffer {
  const raw = env.SETTINGS_ENCRYPTION_KEY?.trim() ?? ''
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new SecretKeyError()
  return key
}

export function encryptSecret(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return ['v1', iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join(':')
}

export function decryptSecret(payload: string, key: Buffer): string {
  const [version, iv, tag, ciphertext, ...rest] = payload.split(':')
  if (version !== 'v1' || !iv || !tag || !ciphertext || rest.length)
    throw new Error('Invalid secret format')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
