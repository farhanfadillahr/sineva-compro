'use client'
import { useState } from 'react'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { SchemaField } from '@/components/admin/cms/schema-fields'
import { LocaleTabs } from '@/components/admin/forms'
import { DescriptionList } from '@/components/admin/display'
import type { PageKey } from '../../content/types'
import { editorSections, pageSchemas } from '../fields'
import { savePageAction } from '../actions'
import { PreviewButton } from '../../preview/components/preview-button'
import s from '@/components/admin/admin.module.css'

type LocaleState = {
  data: Record<string, unknown> | null
  stored: boolean
  updatedAt: string | null
}

/**
 * Section-by-section editor in page order. Each section is a collapsible panel; optional sections
 * carry their own visibility switch. One locale is saved at a time.
 */
export function PageEditor({
  pageKey,
  locales,
  labels,
  isAdmin,
  publicPath,
}: {
  pageKey: PageKey
  locales: Record<string, LocaleState>
  labels: Record<string, string>
  isAdmin: boolean
  publicPath: string | null
}) {
  const codes = Object.keys(locales)
  const [locale, setLocale] = useState(codes[0] ?? 'en')
  const schema = pageSchemas[pageKey]
  const sections = editorSections(pageKey)
  return (
    <>
      <LocaleTabs
        locales={codes.map((code) => ({
          code,
          label: labels[code] ?? code,
          complete: !!locales[code].data,
        }))}
        value={locale}
        onChange={setLocale}
      />
      {locales[locale].data ? (
        <CmsForm
          key={locale}
          action={savePageAction}
          initialValue={{ locale, data: locales[locale].data }}
          hidden={{ pageKey }}
          side={(value) => (
            <div className={s.panel}>
              <DescriptionList
                items={[
                  {
                    label: 'Status',
                    value: locales[locale].stored ? 'Terbit' : 'Konten peluncuran',
                  },
                  {
                    label: 'Terakhir diubah',
                    value: locales[locale].updatedAt
                      ? new Date(locales[locale].updatedAt!).toLocaleString('id-ID')
                      : 'Belum pernah',
                  },
                  { label: 'Alamat', value: publicPath ?? 'Halaman 404' },
                ]}
              />
              <p className={s.muted}>Halaman tersimpan langsung tampil di situs.</p>
              <PreviewButton kind="page" target={pageKey} locale={locale} data={value.data} />
            </div>
          )}
        >
          {(value, setValue, errors) =>
            sections.map((section) => (
              <details key={section} open className={s.panel}>
                <summary>
                  <strong>{sectionLabel(schema.fields[section], section)}</strong>
                </summary>
                <SchemaField
                  schema={unlabelled(schema.fields[section])}
                  value={value.data?.[section]}
                  path={`data.${section}`}
                  errors={errors}
                  isAdmin={isAdmin}
                  onChange={(next) =>
                    setValue({ ...value, data: { ...value.data, [section]: next } })
                  }
                />
              </details>
            ))
          }
        </CmsForm>
      ) : (
        <p className={s.muted}>Belum ada konten untuk bahasa ini.</p>
      )}
    </>
  )
}

const sectionNames: Record<string, string> = {
  headline: 'Judul',
  lead: 'Paragraf pembuka',
  body: 'Isi',
  metaChips: 'Chip meta',
  steps: 'Langkah',
  responseTimeText: 'Waktu respons',
  form: 'Formulir',
  whatsappCtaLabel: 'CTA WhatsApp',
  nextLinks: 'Tautan berikutnya',
  links: 'Tautan',
  effectiveDate: 'Tanggal berlaku',
  title: 'Judul',
  intro: 'Pengantar',
  emptyState: 'Teks saat kosong',
  productStatus: 'Status produk',
  story: 'Cerita',
}

function sectionLabel(field: (typeof pageSchemas)[PageKey]['fields'][string], key: string) {
  return ('label' in field && field.label) || sectionNames[key] || key
}

/** The panel summary shows the label, so the inner fieldset does not repeat it. */
function unlabelled(field: (typeof pageSchemas)[PageKey]['fields'][string]) {
  return field.kind === 'object' ? { ...field, label: undefined } : field
}
