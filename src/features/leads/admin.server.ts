import 'server-only'
import { and, count, desc, eq, gte, lt, type SQL } from 'drizzle-orm'
import { db } from '../../lib/db/client.server'
import { writeAudit } from '../audit/service.server'
import { CmsError } from '../cms/errors'
import { cmsMutation, cmsReader } from '../cms/mutation.server'
import { CONTACT_INTERESTS, CONTACT_SEGMENTS } from '../../lib/contact-message'
import { LEAD_STATUSES, lead } from './schema'

export type LeadStatus = (typeof LEAD_STATUSES)[number]
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  qualified: 'Berpotensi',
  won: 'Berhasil',
  lost: 'Tidak lanjut',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/
const one = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '')

export type LeadFilters = {
  status: '' | LeadStatus
  interest: string
  segment: string
  from: string
  to: string
  page: number
  pageSize: number
}

/** Unknown filter values are ignored rather than trusted. */
export function readLeadFilters(
  params: Record<string, string | string[] | undefined>,
): LeadFilters {
  const status = one(params.status)
  const interest = one(params.interest)
  const segment = one(params.segment)
  const page = Number(one(params.page) || 1)
  const pageSize = Number(one(params.pageSize) || 20)
  return {
    status: (LEAD_STATUSES as readonly string[]).includes(status) ? (status as LeadStatus) : '',
    interest: (CONTACT_INTERESTS as readonly string[]).includes(interest) ? interest : '',
    segment: (CONTACT_SEGMENTS as readonly string[]).includes(segment) ? segment : '',
    from: DATE.test(one(params.from)) ? one(params.from) : '',
    to: DATE.test(one(params.to)) ? one(params.to) : '',
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1,
    pageSize: [20, 50, 100].includes(pageSize) ? pageSize : 20,
  }
}

/** Admin only (`leads:manage`): Editors and anonymous users are refused at the query. */
export async function listLeads(headers: Headers, filters: LeadFilters) {
  await cmsReader(headers, 'leads:manage')
  const where: SQL[] = []
  if (filters.status) where.push(eq(lead.status, filters.status))
  if (filters.interest) where.push(eq(lead.interest, filters.interest))
  if (filters.segment) where.push(eq(lead.segment, filters.segment))
  if (filters.from) where.push(gte(lead.createdAt, new Date(`${filters.from}T00:00:00Z`)))
  if (filters.to)
    where.push(
      lt(lead.createdAt, new Date(new Date(`${filters.to}T00:00:00Z`).getTime() + 86_400_000)),
    )
  const condition = where.length ? and(...where) : undefined
  const [{ total }] = await db.select({ total: count() }).from(lead).where(condition)
  const page = Math.min(filters.page, Math.max(1, Math.ceil(total / filters.pageSize)))
  const rows = await db
    .select({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      interest: lead.interest,
      segment: lead.segment,
      status: lead.status,
      createdAt: lead.createdAt,
      isDemo: lead.isDemo,
    })
    .from(lead)
    .where(condition)
    .orderBy(desc(lead.createdAt), desc(lead.id))
    .limit(filters.pageSize)
    .offset((page - 1) * filters.pageSize)
  return {
    items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total,
    page,
    pageSize: filters.pageSize,
  }
}

export async function getLead(headers: Headers, id: string) {
  await cmsReader(headers, 'leads:manage')
  if (!UUID.test(id)) throw new CmsError('NOT_FOUND', 'Lead tidak ditemukan.')
  const [row] = await db.select().from(lead).where(eq(lead.id, id))
  if (!row) throw new CmsError('NOT_FOUND', 'Lead tidak ditemukan.')
  return {
    ...row,
    consentAt: row.consentAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Status and internal notes are the only editable fields; the audit names them, never values. */
export async function updateLead(headers: Headers, input: unknown) {
  const data = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  const id = typeof data.id === 'string' ? data.id : ''
  const status = data.status
  const notes = typeof data.notes === 'string' ? data.notes.replace(/\r\n/g, '\n') : ''
  if (!UUID.test(id)) throw new CmsError('NOT_FOUND', 'Lead tidak ditemukan.')
  if (!(LEAD_STATUSES as readonly unknown[]).includes(status))
    throw new CmsError('INVALID', 'Status tidak valid.', { status: 'Pilih status dari daftar.' })
  if (notes.length > 5000)
    throw new CmsError('INVALID', 'Catatan terlalu panjang.', { notes: 'Maksimal 5000 karakter.' })
  await cmsMutation({
    headers,
    capability: 'leads:manage',
    adminOnly: true,
    run: async (tx, actor) => {
      const [before] = await tx.select().from(lead).where(eq(lead.id, id)).for('update')
      if (!before) throw new CmsError('NOT_FOUND', 'Lead tidak ditemukan.')
      const changed = [
        ...(before.status !== status ? ['status'] : []),
        ...(before.notes !== notes ? ['notes'] : []),
      ]
      if (!changed.length) return
      await tx
        .update(lead)
        .set({ status: status as LeadStatus, notes, updatedBy: actor.id, updatedAt: new Date() })
        .where(eq(lead.id, id))
      await writeAudit(tx, actor, {
        entity: 'leads',
        entityId: id,
        action: 'update',
        changedFields: changed,
      })
    },
  })
}
