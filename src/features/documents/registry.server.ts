import 'server-only'
import { eq } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { cacheTags } from '../../lib/cache/tags'
import type { DatabaseTransaction } from '../../lib/db/connection'
import type { Principal } from '../auth/types'
import { CmsError } from '../cms/errors'
import { category, teamMember } from '../collections/tables'
import type { DocumentName } from './configs'
import { postTables, type DocumentTables } from './tables'

type Entry = Readonly<{
  tables: DocumentTables
  /** Public cache tags to refresh for a locale and the slugs involved. */
  tags: (locale: string, slugs: readonly (string | null)[]) => string[]
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

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const slugTags = (slugs: readonly (string | null)[], build: (slug: string) => string) =>
  [...new Set(slugs)].filter((s): s is string => !!s && SLUG.test(s)).map(build)

const postAudit: Record<string, string> = {
  categorySlug: 'category',
  authorId: 'author',
  bylineName: 'author',
  publishDate: 'publishedAt',
}

export const documentRegistry: Record<DocumentName, Entry> = {
  posts: {
    tables: postTables,
    tags: (locale, slugs) => {
      const l = locale as (typeof routing.locales)[number]
      return [
        cacheTags.posts(l),
        cacheTags.sitemap,
        ...slugTags(slugs, (slug) => cacheTags.post(slug, l)),
      ]
    },
    auditFields: (keys) => [...new Set(keys.map((key) => postAudit[key] ?? key))],
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
}
