import type { PublicContentSource } from '../features/content/public'
import { createStaticContentSource } from '../content/static'

type Env = Readonly<Record<string, string | undefined>>

/**
 * `static` (default) serves the typed launch content in `src/content/static`. `database` serves
 * what editors publish in the custom admin. Only the exact string "database" switches, so a typo
 * keeps the static site instead of failing the build on a missing database.
 */
export function readContentSourceMode(env: Env = process.env): 'static' | 'database' {
  return env.CONTENT_SOURCE === 'database' ? 'database' : 'static'
}

const methods = [
  'getSiteSettings',
  'getPage',
  'listServices',
  'getService',
  'listCapabilities',
  'listIndustries',
  'listFaq',
  'listWork',
  'getWork',
  'listPosts',
  'getPost',
  'listCategories',
  'listTeam',
] as const satisfies readonly (keyof PublicContentSource)[]

/**
 * The database source is imported on first use, never at module load: the static deployment and
 * unit tests that import this file must not load the database client or `server-only` code.
 */
function lazyDatabaseSource(): PublicContentSource {
  let source: Promise<PublicContentSource> | undefined
  const load = () =>
    (source ??= import('../features/cms/database-source.server').then((module) =>
      module.createDatabaseContentSource(),
    ))
  return Object.fromEntries(
    methods.map((name) => [
      name,
      async (...args: unknown[]) => {
        const resolved = await load()
        return (resolved[name] as (...input: unknown[]) => Promise<unknown>)(...args)
      },
    ]),
  ) as unknown as PublicContentSource
}

/**
 * The landing site's one entry point to public content. Layouts and pages call this instead of
 * constructing a source themselves, so changing where content comes from is a change in this
 * function only. Both sources implement the same `PublicContentSource` contract, so pages render
 * the same components either way.
 */
export function getContentSource(env: Env = process.env): PublicContentSource {
  return readContentSourceMode(env) === 'database'
    ? lazyDatabaseSource()
    : createStaticContentSource()
}
