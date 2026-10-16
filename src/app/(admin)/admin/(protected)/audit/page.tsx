import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { readServerEnv } from '@/env/server'
import { db } from '@/lib/db/client.server'
import { requirePrincipal } from '@/features/auth/session.server'
import { AccessDeniedError } from '@/features/auth/access-errors'
import { AuditInputError, auditPageHref } from '@/features/audit/input'
import { listAuditLog } from '@/features/audit/query.server'
import { AuditView } from '@/features/audit/components/audit-view'

export const metadata = { title: 'Log audit' }
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    actor?: string | string[]
    entity?: string | string[]
    page?: string | string[]
    pageSize?: string | string[]
  }>
}) {
  await requirePrincipal()
  const params = await searchParams
  let result: Awaited<ReturnType<typeof listAuditLog>>
  try {
    result = await listAuditLog(db, readServerEnv(process.env), await headers(), {
      actor: params.actor,
      entity: params.entity,
      page: params.page,
      pageSize: params.pageSize,
    })
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      if (error.code === 'UNAUTHORIZED') redirect('/admin/login')
      notFound()
    }
    if (error instanceof AuditInputError) notFound()
    throw error
  }
  if (params.page !== undefined && Number(params.page) !== result.page)
    redirect(auditPageHref(result))
  return <AuditView result={result} />
}
