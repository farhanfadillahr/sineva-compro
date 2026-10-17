import Link from 'next/link'
import { Badge } from '@/components/admin/primitives'
import { EmptyState } from '@/components/admin/display'
import { SectionHeader } from '@/components/admin/shell'
import { routing } from '@/i18n/routing'
import { documentConfigs, type DocumentItem, type DocumentName } from '../configs'
import { documentStatus } from '../status'
import s from '@/components/admin/admin.module.css'

/** Server-rendered list of posts or work with the status of each locale. */
export function DocumentList({ name, items }: { name: DocumentName; items: DocumentItem[] }) {
  const config = documentConfigs[name]
  return (
    <section className={s.stack} aria-label={config.title}>
      <SectionHeader
        title={config.title}
        helper={config.description}
        action={
          <Link className={`${s.button} ${s.primary}`} href={`${config.adminPath}/new`}>
            Tambah {config.itemLabel.toLowerCase()}
          </Link>
        }
      />
      {items.length === 0 ? (
        <EmptyState message={`Belum ada ${config.itemLabel.toLowerCase()}.`} />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Judul</th>
                <th scope="col">Slug</th>
                <th scope="col">Status</th>
                <th scope="col">Diubah</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const local = item.locales[routing.defaultLocale] ?? Object.values(item.locales)[0]
                return (
                  <tr key={item.id}>
                    <td>
                      <Link href={`${config.adminPath}/${item.id}`}>
                        {String(local?.draft.title || 'Tanpa judul')}
                      </Link>{' '}
                      {item.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                    </td>
                    <td className={s.mono}>{local?.draftSlug ?? '-'}</td>
                    <td>
                      <div className={s.row}>
                        {routing.locales.map((code) => {
                          const status = documentStatus(item.locales[code])
                          return (
                            <Badge key={code} tone={status.tone}>
                              {routing.locales.length > 1 ? `${code.toUpperCase()} ` : ''}
                              {status.label}
                            </Badge>
                          )
                        })}
                      </div>
                    </td>
                    <td className={s.mono}>
                      {new Date(item.updatedAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
