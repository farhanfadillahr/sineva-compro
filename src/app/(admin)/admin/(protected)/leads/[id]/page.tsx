import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requirePrincipal } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { CmsError } from '@/features/cms/errors'
import { getLead, LEAD_STATUS_LABELS } from '@/features/leads/admin.server'
import { LeadDetail } from '@/features/leads/components/lead-detail-form'

export const metadata = { title: 'Detail lead' }

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requirePrincipal()
  if (principal.role !== 'admin') notFound()
  const { id } = await params
  let lead
  try {
    lead = await getLead(await headers(), id)
  } catch (error) {
    if (error instanceof CmsError && error.code === 'NOT_FOUND') notFound()
    throw error
  }
  return (
    <main>
      <PageHeader
        title={lead.name}
        description={lead.interest}
        status={{
          label: LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] ?? lead.status,
        }}
      />
      <LeadDetail lead={lead} />
    </main>
  )
}
