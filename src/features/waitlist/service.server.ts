import 'server-only'
import { and, count, desc, eq, gte, lt, type SQL } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import {
  normalizeEmail,
  readWaitlistSubmission,
  validateWaitlist,
  type WaitlistSubmission,
} from '../../lib/leads/waitlist-schema'
import { CONTACT_SEGMENTS } from '../../lib/contact-message'
import { writeAudit } from '../audit/service.server'
import { CmsError } from '../cms/errors'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { checkSpam } from '../leads/hooks.server'
import { afterWaitlistJoined } from './hooks.server'
import { waitlist } from './schema'

export type WaitlistResult =
  | { ok: true }
  | {
      ok: false
      errors: Record<string, string>
      formError: string | null
      values: WaitlistSubmission
    }

const MESSAGES = { required: 'This field is required.', invalid: 'Please check this value.' }

/**
 * Joins the waitlist. A duplicate email (the known unique constraint) gets exactly the same success
 * as a new signup, so nobody can probe whether an address is registered; concurrent duplicates
 * resolve the same way. Any other database error is reported, never hidden as success.
 */
export async function joinWaitlistEntry(
  input: unknown,
  context: { headers: Headers; locale?: string },
): Promise<WaitlistResult> {
  const values = readWaitlistSubmission(input)
  const errors = validateWaitlist(values)
  if (Object.keys(errors).length)
    return {
      ok: false,
      errors: Object.fromEntries(Object.entries(errors).map(([k, code]) => [k, MESSAGES[code!]])),
      formError: null,
      values,
    }
  const verdict = await checkSpam({
    kind: 'waitlist',
    input: (input && typeof input === 'object' ? input : {}) as Record<string, unknown>,
    headers: context.headers,
  })
  if (!verdict.ok && verdict.reason === 'honeypot') return { ok: true }
  if (!verdict.ok)
    return {
      ok: false,
      errors: {},
      formError:
        verdict.reason === 'rate'
          ? 'Too many requests in a short time. Please try again later.'
          : 'We could not verify this request. Please try again.',
      values,
    }
  const locale = (routing.locales as readonly string[]).includes(context.locale ?? '')
    ? context.locale!
    : routing.defaultLocale
  try {
    const inserted = await db
      .insert(waitlist)
      .values({
        email: normalizeEmail(values.email),
        segment: values.segment || null,
        locale,
        consentAt: new Date(),
      })
      .onConflictDoNothing({ target: waitlist.email })
      .returning({ id: waitlist.id })
    if (inserted[0]) {
      const id = inserted[0].id
      try {
        const { after } = await import('next/server')
        after(() =>
          afterWaitlistJoined(id).catch(() => console.error('Waitlist follow-up failed.')),
        )
      } catch {
        void afterWaitlistJoined(id).catch(() => console.error('Waitlist follow-up failed.'))
      }
    }
    return { ok: true }
  } catch {
    console.error('Waitlist entry could not be stored.')
    return { ok: false, errors: {}, formError: 'Something went wrong. Please try again.', values }
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '')

export function readWaitlistFilters(params: Record<string, string | string[] | undefined>) {
  const segment = one(params.segment)
  const page = Number(one(params.page) || 1)
  const pageSize = Number(one(params.pageSize) || 20)
  return {
    segment: (CONTACT_SEGMENTS as readonly string[]).includes(segment) ? segment : '',
    from: DATE.test(one(params.from)) ? one(params.from) : '',
    to: DATE.test(one(params.to)) ? one(params.to) : '',
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1,
    pageSize: [20, 50, 100].includes(pageSize) ? pageSize : 20,
  }
}
export type WaitlistFilters = ReturnType<typeof readWaitlistFilters>

function where(filters: Omit<WaitlistFilters, 'page' | 'pageSize'>) {
  const parts: SQL[] = []
  if (filters.segment) parts.push(eq(waitlist.segment, filters.segment))
  if (filters.from) parts.push(gte(waitlist.createdAt, new Date(`${filters.from}T00:00:00Z`)))
  if (filters.to)
    parts.push(
      lt(waitlist.createdAt, new Date(new Date(`${filters.to}T00:00:00Z`).getTime() + 86_400_000)),
    )
  return parts.length ? and(...parts) : undefined
}

/** Admin only (`waitlist:export`), refused for Editors and anonymous users at the query. */
export async function listWaitlist(headers: Headers, filters: WaitlistFilters) {
  await cmsReader(headers, 'waitlist:export')
  const condition = where(filters)
  const [{ total }] = await db.select({ total: count() }).from(waitlist).where(condition)
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / filters.pageSize)))
  const rows = await db
    .select()
    .from(waitlist)
    .where(condition)
    .orderBy(desc(waitlist.createdAt), desc(waitlist.id))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize)
  return {
    items: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      consentAt: r.consentAt.toISOString(),
    })),
    total,
    page,
    pageSize: filters.pageSize,
  }
}

export async function exportWaitlist(
  headers: Headers,
  filters: Omit<WaitlistFilters, 'page' | 'pageSize'>,
) {
  await cmsReader(headers, 'waitlist:export')
  return db.select().from(waitlist).where(where(filters)).orderBy(desc(waitlist.createdAt))
}

/** Deletion on request (PRD 13.4 retention). */
export async function deleteWaitlistEntry(headers: Headers, id: string) {
  await cmsMutation({
    headers,
    capability: 'waitlist:export',
    adminOnly: true,
    run: async (tx, actor) => {
      const [row] = await tx
        .delete(waitlist)
        .where(eq(waitlist.id, id))
        .returning({ id: waitlist.id })
      if (!row) throw new CmsError('NOT_FOUND', 'Entri tidak ditemukan.')
      await writeAudit(tx, actor, {
        entity: 'waitlist',
        entityId: id,
        action: 'delete',
        changedFields: ['email'],
      })
    },
  })
}
