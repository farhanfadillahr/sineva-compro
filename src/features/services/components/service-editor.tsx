'use client'
import { useState } from 'react'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { SchemaField } from '@/components/admin/cms/schema-fields'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import { LocaleTabs } from '@/components/admin/forms'
import { emptyValue } from '../../cms/fields'
import { serviceGlobalSchema, serviceLocaleSchema, serviceSlugField } from '../fields'
import { deleteServiceAction, saveServiceAction } from '../actions'
import type { ServiceItem } from '../service.server'
import { PreviewButton } from '../../preview/components/preview-button'
import s from '@/components/admin/admin.module.css'

type Local = Record<string, unknown> & { slug: string }
type Value = {
  id?: string
  published: boolean
  global: Record<string, unknown>
  locales: Record<string, Local | null>
}

export function ServiceEditor({
  item,
  locales,
  isAdmin,
  defaultProcess,
}: {
  item: ServiceItem | null
  locales: { code: string; label: string }[]
  isAdmin: boolean
  /** New services start from the Home "How we work" steps. */
  defaultProcess: { title: string; body: string }[]
}) {
  const [locale, setLocale] = useState(locales[0]?.code ?? 'en')
  const blank = () =>
    ({
      slug: '',
      ...(emptyValue(serviceLocaleSchema) as Record<string, unknown>),
      process: defaultProcess,
    }) as Local
  const initial: Value = item
    ? {
        id: item.id,
        published: item.published,
        global: item.global,
        locales: Object.fromEntries(
          locales.map((l) => {
            const value = item.locales[l.code]
            return [l.code, value ? { slug: value.slug, ...value.data } : null]
          }),
        ),
      }
    : {
        published: false,
        global: emptyValue(serviceGlobalSchema) as Record<string, unknown>,
        locales: Object.fromEntries(locales.map((l, i) => [l.code, i === 0 ? blank() : null])),
      }
  return (
    <CmsForm
      action={saveServiceAction}
      initialValue={initial}
      redirectTo={item ? undefined : (id) => `/admin/services/${id}`}
      side={(value) => (
        <div className={s.panel}>
          <p>
            Status: <strong>{value.published ? 'Terbit' : 'Draf'}</strong>
          </p>
          <p className={s.muted}>
            {value.published
              ? 'Layanan tampil di situs. Matikan lalu simpan untuk menyembunyikannya.'
              : 'Layanan belum tampil di situs.'}
          </p>
          {value.locales[locale] ? (
            <PreviewButton
              kind="service"
              target={item?.id ?? 'new'}
              locale={locale}
              data={(() => {
                const { slug, ...local } = value.locales[locale]!
                return { slug, global: value.global, local }
              })()}
            />
          ) : null}
        </div>
      )}
      secondaryActions={() =>
        item && !item.published ? (
          <ConfirmAction
            action={deleteServiceAction}
            fields={{ id: item.id }}
            label="Hapus"
            title="Hapus layanan"
            description="Layanan draf ini akan dihapus permanen."
            confirmName={item.locales[locales[0]?.code ?? 'en']?.slug}
            redirectTo="/admin/services"
          />
        ) : null
      }
    >
      {(value, setValue, errors) => (
        <>
          <div className={s.panel}>
            <label className={s.switch}>
              <input
                type="checkbox"
                role="switch"
                checked={value.published}
                onChange={(event) => setValue({ ...value, published: event.target.checked })}
              />
              Terbitkan di situs
            </label>
          </div>
          <SchemaField
            schema={serviceGlobalSchema}
            value={value.global}
            path="global"
            errors={errors}
            isAdmin={isAdmin}
            onChange={(next) => setValue({ ...value, global: next as Record<string, unknown> })}
          />
          <LocaleTabs
            locales={locales.map((l) => ({ ...l, complete: !!value.locales[l.code] }))}
            value={locale}
            onChange={setLocale}
            renderPanel={(code) => {
              const local = value.locales[code]
              const update = (next: Local) =>
                setValue({ ...value, locales: { ...value.locales, [code]: next } })
              if (!local)
                return (
                  <button type="button" className={s.button} onClick={() => update(blank())}>
                    Tambah konten untuk bahasa ini
                  </button>
                )
              return (
                <div className={s.stack}>
                  <div className={s.panel}>
                    <SchemaField
                      schema={serviceSlugField}
                      value={local.slug}
                      path={`locales.${code}.slug`}
                      errors={errors}
                      isAdmin={isAdmin}
                      onChange={(next) => update({ ...local, slug: String(next ?? '') })}
                    />
                    {item?.published && item.locales[code]?.slug !== local.slug ? (
                      <p className={s.warning}>
                        Slug layanan terbit berubah. Redirect 301 dari alamat lama dibuat otomatis.
                      </p>
                    ) : null}
                  </div>
                  <SchemaField
                    schema={serviceLocaleSchema}
                    value={local}
                    path={`locales.${code}`}
                    errors={errors}
                    isAdmin={isAdmin}
                    onChange={(next) => update(next as Local)}
                  />
                </div>
              )
            }}
          />
          {errors.locales ? <p className={s.error}>{errors.locales}</p> : null}
        </>
      )}
    </CmsForm>
  )
}
