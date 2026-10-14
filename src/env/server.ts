type Input = Record<string, string | undefined>

export function readServerEnv(input: Input): Readonly<{
  databaseUrl: string
  payloadSecret: string
}> {
  const databaseUrl = input.DATABASE_URL?.trim()
  if (!databaseUrl) throw new Error('DATABASE_URL is required')

  let parsed: URL
  try {
    parsed = new URL(databaseUrl)
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL')
  }
  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.pathname ||
    parsed.pathname === '/'
  ) {
    throw new Error('DATABASE_URL must include a PostgreSQL host and database')
  }

  const payloadSecret = input.PAYLOAD_SECRET
  if (!payloadSecret || payloadSecret.trim().length < 32) {
    throw new Error('PAYLOAD_SECRET must contain at least 32 nonblank characters')
  }
  return Object.freeze({ databaseUrl, payloadSecret })
}
