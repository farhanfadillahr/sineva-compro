import { readDatabaseUrl } from '../../src/env/database-url'

/** Registered seed modules, in run order. Keep in sync with `runner.ts`. */
export const SEED_MODULES = [
  'audit',
  'media',
  'settings',
  'pages',
  'capabilities',
  'business-types',
  'faq',
  'team',
  'categories',
  'services',
  'posts',
  'work',
  'redirects',
  'email',
  'leads',
  'waitlist',
] as const

export type SeedOptions = { mode: 'base' | 'demo' | 'purge-demo'; module?: string }
export function parseSeedOptions(
  args: string[],
  databaseUrl: string,
  nodeEnv: string | undefined,
): SeedOptions {
  const target = readDatabaseUrl(databaseUrl)
  const seen = new Set<string>()
  for (const arg of args) {
    const key = arg.split('=')[0]
    if (
      seen.has(key) ||
      ![
        '--demo',
        '--purge-demo',
        '--allow-demo-on-remote',
        '--confirm-database',
        '--module',
      ].includes(key)
    )
      throw new Error('Invalid seed arguments')
    if (['--demo', '--purge-demo', '--allow-demo-on-remote'].includes(key) && arg !== key)
      throw new Error('Invalid seed flag')
    seen.add(key)
  }
  if (seen.has('--demo') && seen.has('--purge-demo')) throw new Error('Choose demo or purge-demo')
  const moduleName = args.find((arg) => arg.startsWith('--module='))?.slice('--module='.length)
  if (
    (seen.has('--module') && !moduleName) ||
    (moduleName && !(SEED_MODULES as readonly string[]).includes(moduleName))
  )
    throw new Error('Unknown seed module')
  const mode = seen.has('--demo') ? 'demo' : seen.has('--purge-demo') ? 'purge-demo' : 'base'
  const confirmed = args
    .find((arg) => arg.startsWith('--confirm-database='))
    ?.slice('--confirm-database='.length)
  if (seen.has('--confirm-database') && !confirmed)
    throw new Error('Database confirmation is missing')
  if (
    mode !== 'base' &&
    (nodeEnv === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname))
  ) {
    if (
      !seen.has('--allow-demo-on-remote') ||
      confirmed !== decodeURIComponent(target.pathname.slice(1))
    )
      throw new Error(
        'Demo/purge requires --confirm-database=<name> --allow-demo-on-remote for remote or production targets',
      )
  }
  return { mode, ...(moduleName ? { module: moduleName } : {}) }
}
