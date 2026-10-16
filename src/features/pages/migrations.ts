/**
 * Versioned page documents. `page_content.version` records the descriptor version a row was
 * written with; reading an older row runs the migrations in order and returns the current shape,
 * so a design change to a page never needs a data backfill before deploy.
 *
 * To change a page shape: append a migration to that page's list (the version increases by one)
 * and update the descriptor and the static content in the same change.
 */
import type { PageKey } from '../content/types'

export type DocumentMigration = (data: Record<string, unknown>) => Record<string, unknown>

/** `pageMigrations[key][n]` turns version n + 1 into version n + 2. */
export const pageMigrations: Readonly<Partial<Record<PageKey, readonly DocumentMigration[]>>> = {}

export function currentPageVersion(key: PageKey): number {
  return (pageMigrations[key]?.length ?? 0) + 1
}

export class FutureVersionError extends Error {
  constructor(version: number) {
    super(`Document version ${version} is newer than this code`)
  }
}

/** Applies the migrations after `version`. A version newer than the code is refused. */
export function migrateDocument(
  data: Record<string, unknown>,
  version: number,
  migrations: readonly DocumentMigration[],
): Record<string, unknown> {
  const current = migrations.length + 1
  if (!Number.isInteger(version) || version < 1) throw new RangeError('Invalid document version')
  if (version > current) throw new FutureVersionError(version)
  return migrations.slice(version - 1).reduce((doc, migrate) => migrate(doc), data)
}
