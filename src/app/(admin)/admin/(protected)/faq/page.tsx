import Link from 'next/link'
import { headers } from 'next/headers'
import { requireCapability } from '@/features/auth/session.server'
import { PageHeader } from '@/components/admin/shell'
import { listCollectionForAdmin } from '@/features/collections/service.server'
import { CollectionList } from '@/features/collections/components/collection-list'
import { reorderCollectionAction } from '@/features/collections/actions'
import { FAQ_BASE_TAGS, faqConfig } from '@/features/collections/configs'
import { serviceTagOptions } from '@/features/faq/public.server'
import { routing } from '@/i18n/routing'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'FAQ' }

export default async function FaqAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>
}) {
  await requireCapability('content:write')
  const { tag: rawTag } = await searchParams
  const tags = [...FAQ_BASE_TAGS, ...(await serviceTagOptions(routing.defaultLocale))]
  const tag = typeof rawTag === 'string' && tags.some((t) => t.value === rawTag) ? rawTag : ''
  const { items } = await listCollectionForAdmin(await headers(), 'faq')
  const visible = tag ? items.filter((item) => (item.global.tags as string[]).includes(tag)) : items
  const labelOf = (value: string) => tags.find((t) => t.value === value)?.label ?? value
  return (
    <main className={s.stack}>
      <PageHeader title="FAQ" description={faqConfig.description} />
      <nav aria-label="Filter tag" className={s.row}>
        <Link className={s.chip} href="/admin/faq" aria-current={tag ? undefined : 'page'}>
          Semua
        </Link>
        {tags.map((t) => (
          <Link
            key={t.value}
            className={s.chip}
            href={`/admin/faq?tag=${encodeURIComponent(t.value)}`}
            aria-current={tag === t.value ? 'page' : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <CollectionList
        key={tag}
        reorder={{ action: reorderCollectionAction, fields: { collection: 'faq' } }}
        title={tag ? `Pertanyaan untuk ${labelOf(tag)}` : 'Semua pertanyaan'}
        description={
          tag
            ? 'Urutan mengikuti urutan pustaka. Buka "Semua" untuk mengubah urutan.'
            : 'Urutan ini berlaku di setiap tag.'
        }
        itemLabel={faqConfig.itemLabel}
        basePath="/admin/faq"
        orderable={!tag}
        rows={visible.map((item) => ({
          id: item.id,
          key: item.key,
          title: String(item.locales[routing.defaultLocale]?.question ?? item.key),
          isDemo: item.isDemo,
          meta: (item.global.tags as string[]).map(labelOf).join(', '),
        }))}
      />
    </main>
  )
}
