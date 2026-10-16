/** Node/CLI configuration only. Never pass credentials to client components. */
export function readStorageConfig(env: Record<string, string | undefined> = process.env) {
  let url: URL
  try {
    url = new URL(env.STORAGE_ENDPOINT ?? 'http://127.0.0.1:8333')
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error()
  } catch {
    throw new Error('Invalid STORAGE_ENDPOINT')
  }
  const local = ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)
  const guarded =
    !local ||
    env.NODE_ENV === 'production' ||
    (env.STORAGE_ENV !== undefined && env.STORAGE_ENV !== 'local' && env.STORAGE_ENV !== 'test')
  if (guarded && env.STORAGE_CONFIRM_ORIGIN !== url.origin) {
    throw new Error(
      'Storage mutation requires explicit exact-origin confirmation in STORAGE_CONFIRM_ORIGIN',
    )
  }
  if (!local && url.protocol !== 'https:') throw new Error('Remote storage requires HTTPS')
  return {
    endpoint: url.origin,
    region: 'us-east-1',
    forcePathStyle: true as const,
    buckets: ['media-public', 'media-private', 'backups'] as const,
  }
}
export type StorageConfig = ReturnType<typeof readStorageConfig>
