type Label = 'DATABASE_URL' | 'TEST_DATABASE_URL'

export function readDatabaseUrl(value: string | undefined, label: Label = 'DATABASE_URL'): URL {
  if (!value?.trim()) throw new Error(`${label} is required`)
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error(`${label} must be a PostgreSQL connection URL`)
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname ||
    url.pathname === '/'
  )
    throw new Error(`${label} must include a PostgreSQL host and database`)

  // pg query parameters can override the URL authority or read local TLS files.
  // Keep the validated target authoritative; only explicit TLS mode is supported.
  if (
    url.hash ||
    [...url.searchParams.keys()].some((key) => key !== 'sslmode') ||
    url.searchParams.getAll('sslmode').length > 1 ||
    (url.searchParams.has('sslmode') &&
      !['disable', 'verify-full'].includes(url.searchParams.get('sslmode')!))
  )
    throw new Error(`${label} contains unsupported connection parameters`)
  return url
}
