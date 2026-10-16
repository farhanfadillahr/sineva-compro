'use client'
import { useState } from 'react'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import { FieldOptionsContext, SchemaField } from '@/components/admin/cms/schema-fields'
import { InlineBanner } from '@/components/admin/feedback'
import { LocaleTabs } from '@/components/admin/forms'
import { Badge } from '@/components/admin/primitives'
import { emptyValue } from '../../cms/fields'
import { documentStatus } from '../status'
import {
  documentConfigs,
  documentSlugField,
  type DocumentItem,
  type DocumentName,
} from '../configs'
import {
  deleteDocumentAction,
  publishDocumentAction,
  saveDraftAction,
  unpublishDocumentAction,
} from '../actions'
import s from '@/components/admin/admin.module.css'

type Option = { value: string; label: string }

/**
 * Draft editor per locale. "Simpan draf" never changes the site; "Terbitkan" copies the saved draft
 * to the published snapshot; "Pratinjau" opens the public page with the draft (authorised only).
 */
export function DocumentEditor({
  name,
  item,
  locales,
  isAdmin,
  fieldOptions,
}: {
  name: DocumentName
  item: DocumentItem | null
  locales: { code: string; label: string }[]
  isAdmin: boolean
  fieldOptions: Record<string, Option[]>
}) {
  const config = documentConfigs[name]
  const [locale, setLocale] = useState(locales[0]?.code ?? 'en')
  const local = item?.locales[locale]
  const status = documentStatus(local)
  const initial = {
    ...(item ? { id: item.id } : {}),
    locale,
    slug: local?.draftSlug ?? '',
    data: local?.draft ?? (emptyValue(config.schema) as Record<string, unknown>),
  }
  const hidden = { document: name, id: item?.id ?? '', locale }
  return (
    <FieldOptionsContext value={fieldOptions}>
      {config.formHint ? <InlineBanner tone="info">{config.formHint}</InlineBanner> : null}
      <LocaleTabs
        locales={locales.map((l) => ({ ...l, complete: !!item?.locales[l.code]?.published }))}
        value={locale}
        onChange={setLocale}
      />
      <CmsForm
        key={`${item?.id ?? 'new'}:${locale}`}
        action={saveDraftAction}
        initialValue={initial}
        hidden={{ document: name }}
        submitLabel="Simpan draf"
        redirectTo={item ? undefined : (id) => `${config.adminPath}/${id}`}
        side={() => (
          <div className={s.panel}>
            <p>
              Status: <Badge tone={status.tone}>{status.label}</Badge>
            </p>
            {local?.publishedSlug ? (
              <p className={s.mono}>
                {config.publicPrefix}
                {local.publishedSlug}
              </p>
            ) : null}
            {item && local ? (
              <div className={s.stack}>
                <a
                  className={s.button}
                  href={`/admin/preview?${new URLSearchParams({ kind: name, id: item.id, locale })}`}
                  target="_blank"
                  rel="noopener"
                >
                  Pratinjau draf
                </a>
                <ConfirmAction
                  action={publishDocumentAction}
                  fields={hidden}
                  label={local.published ? 'Terbitkan ulang' : 'Terbitkan'}
                  tone="primary"
                  title="Terbitkan draf"
                  description="Draf yang tersimpan akan tampil di situs. Simpan perubahan terbaru lebih dulu."
                  confirmLabel="Terbitkan"
                />
                {local.published ? (
                  <ConfirmAction
                    action={unpublishDocumentAction}
                    fields={hidden}
                    label="Batalkan publikasi"
                    tone="secondary"
                    title="Batalkan publikasi"
                    description="Halaman ini hilang dari situs. Draf tetap tersimpan."
                    confirmLabel="Batalkan publikasi"
                  />
                ) : null}
              </div>
            ) : (
              <p className={s.muted}>Simpan draf untuk membuka pratinjau dan menerbitkan.</p>
            )}
          </div>
        )}
        secondaryActions={() =>
          item && !Object.values(item.locales).some((l) => l?.published) ? (
            <ConfirmAction
              action={deleteDocumentAction}
              fields={{ document: name, id: item.id }}
              label="Hapus"
              title={`Hapus ${config.itemLabel.toLowerCase()}`}
              description="Draf di semua bahasa akan dihapus permanen."
              confirmName={local?.draftSlug}
              redirectTo={config.adminPath}
            />
          ) : null
        }
      >
        {(value, setValue, errors) => (
          <>
            <div className={s.panel}>
              <SchemaField
                schema={documentSlugField}
                value={value.slug}
                path="slug"
                errors={errors}
                isAdmin={isAdmin}
                onChange={(next) => setValue({ ...value, slug: String(next ?? '') })}
              />
              <p className={s.muted}>
                {config.publicPrefix}
                {value.slug || '<slug>'}
              </p>
              {local?.publishedSlug && local.publishedSlug !== value.slug ? (
                <p className={s.warning}>
                  Slug terbit akan berubah saat diterbitkan. Redirect 301 dari alamat lama dibuat
                  otomatis.
                </p>
              ) : null}
            </div>
            <SchemaField
              schema={config.schema}
              value={value.data}
              path="data"
              errors={errors}
              isAdmin={isAdmin}
              onChange={(next) => setValue({ ...value, data: next as Record<string, unknown> })}
            />
          </>
        )}
      </CmsForm>
    </FieldOptionsContext>
  )
}
