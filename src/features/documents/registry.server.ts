import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { DatabaseTransaction } from '../../lib/db/connection'
import type { Principal } from '../auth/types'
import { CmsError } from '../cms/errors'
import { category, teamMember } from '../collections/tables'
import type { DocumentName } from './configs'
import { portfolioTables, postTables, type DocumentTables } from './tables'
import { serviceTranslation } from '../services/schema'
import { localizedPath } from '../cms/paths'
import { recordSlugChange } from '../redirects/service.server'
import { documentConfigs } from './configs'

type Entry = Readonly<{
  tables: DocumentTables
  /** Invalidation entity (`invalidation.ts`). */
  entity: 'post' | 'work'
  /** Audit field names for changed snapshot keys. */
  auditFields: (keys: readonly string[]) => string[]
  /** Checks that referenced records exist (category, author, service). */
  validateRefs?: (
    tx: DatabaseTransaction,
    data: Record<string, unknown>,
    locale: string,
    draft: boolean,
  ) => Promise<void>
  /** Runs inside the publish transaction (redirects on slug change, CPR-85). */
  afterPublish?: (
    tx: DatabaseTransaction,
    actor: Principal,
    change: { locale: string; oldSlug: string | null; newSlug: string },
  ) => Promise<void>
}>

/** A published slug that changes gets a 301 from the old path, in the publish transaction. */
function redirectOnSlugChange(name: DocumentName): Entry['afterPublish'] {
  return async (tx, actor, { locale, oldSlug, newSlug }) => {
    if (!oldSlug || oldSlug === newSlug) return
    const prefix = documentConfigs[name].publicPrefix
    await recordSlugChange(
      tx,
      actor,
      localizedPath(locale, `${prefix}${oldSlug}`),
      localizedPath(locale, `${prefix}${newSlug}`),
    )
  }
}

const postAudit: Record<string, string> = {
  categorySlug: 'category',
  authorId: 'author',
  bylineName: 'author',
  publishDate: 'publishedAt',
}

export const documentRegistry: Record<DocumentName, Entry> = {
  posts: {
    tables: postTables,
    entity: 'post',
    auditFields: (keys) => [...new Set(keys.map((key) => postAudit[key] ?? key))],
    afterPublish: redirectOnSlugChange('posts'),
    async validateRefs(tx, data) {
      const errors: Record<string, string> = {}
      if (typeof data.categorySlug === 'string') {
        const [row] = await tx
          .select({ id: category.id })
          .from(category)
          .where(eq(category.key, data.categorySlug))
        if (!row) errors['data.categorySlug'] = 'Kategori tidak ditemukan.'
      }
      if (typeof data.authorId === 'string') {
        const [row] = await tx
          .select({ id: teamMember.id })
          .from(teamMember)
          .where(eq(teamMember.id, data.authorId))
        if (!row) errors['data.authorId'] = 'Penulis tidak ditemukan.'
      }
      if (Object.keys(errors).length)
        throw new CmsError('INVALID', 'Periksa kembali isian yang ditandai.', errors)
    },
  },
  work: {
    tables: portfolioTables,
    entity: 'work',
    auditFields: (keys) => [
      ...new Set(keys.map((key) => (key === 'serviceSlug' ? 'relatedService' : key))),
    ],
    afterPublish: redirectOnSlugChange('work'),
    async validateRefs(tx, data, locale) {
      if (typeof data.serviceSlug !== 'string') return
      const [row] = await tx
        .select({ id: serviceTranslation.serviceId })
        .from(serviceTranslation)
        .where(
          and(eq(serviceTranslation.locale, locale), eq(serviceTranslation.slug, data.serviceSlug)),
        )
      if (!row)
        throw new CmsError('INVALID', 'Periksa kembali isian yang ditandai.', {
          'data.serviceSlug': 'Layanan tidak ditemukan.',
        })
    },
  },
}
