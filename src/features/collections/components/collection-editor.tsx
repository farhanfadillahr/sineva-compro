'use client'
import { useState } from 'react'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { SchemaField } from '@/components/admin/cms/schema-fields'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import { InlineBanner } from '@/components/admin/feedback'
import { LocaleTabs } from '@/components/admin/forms'
import { emptyValue } from '../../cms/fields'
import { collectionConfigs, keyField, type CollectionItem, type CollectionName } from '../configs'
import { deleteCollectionItemAction, saveCollectionItemAction } from '../actions'
import s from '@/components/admin/admin.module.css'

type Value = {
  id?: string
  key: string
  global: Record<string, unknown>
  locales: Record<string, Record<string, unknown> | null>
}

/** Create or edit one item of an ordered collection. */
export function CollectionEditor({
  name,
  item,
  locales,
  isAdmin,
  basePath,
}: {
  name: CollectionName
  item: CollectionItem | null
  locales: { code: string; label: string }[]
  isAdmin: boolean
  basePath: string
}) {
  const config = collectionConfigs[name]
  const [locale, setLocale] = useState(locales[0]?.code ?? 'en')
  const initial: Value = item
    ? {
        id: item.id,
        key: item.key,
        global: item.global,
        locales: Object.fromEntries(locales.map((l) => [l.code, item.locales[l.code] ?? null])),
      }
    : {
        key: '',
        global: emptyValue(config.globalSchema) as Record<string, unknown>,
        locales: Object.fromEntries(
          locales.map((l, i) => [
            l.code,
            i === 0 ? (emptyValue(config.localeSchema) as Record<string, unknown>) : null,
          ]),
        ),
      }
  return (
    <>
      {config.formHint ? <InlineBanner tone="info">{config.formHint}</InlineBanner> : null}
      <CmsForm
        action={saveCollectionItemAction}
        initialValue={initial}
        hidden={{ collection: name }}
        redirectTo={item ? undefined : (id) => `${basePath}/${id}`}
        secondaryActions={() =>
          item ? (
            <ConfirmAction
              action={deleteCollectionItemAction}
              fields={{ collection: name, id: item.id }}
              label="Hapus"
              title={`Hapus ${config.itemLabel.toLowerCase()}`}
              description="Item ini akan hilang dari situs. Tindakan ini tidak dapat dibatalkan."
              confirmName={item.key}
              redirectTo={basePath}
            />
          ) : null
        }
      >
        {(value, setValue, errors) => (
          <>
            <div className={s.panel}>
              {item ? (
                <p>
                  {config.keyLabel}: <span className={s.mono}>{item.key}</span>
                </p>
              ) : (
                <SchemaField
                  schema={keyField}
                  value={value.key}
                  path="key"
                  errors={errors}
                  isAdmin={isAdmin}
                  onChange={(next) => setValue({ ...value, key: String(next ?? '') })}
                />
              )}
            </div>
            {Object.keys(config.globalSchema.fields).length ? (
              <SchemaField
                schema={{ ...config.globalSchema, label: 'Tampilan' }}
                value={value.global}
                path="global"
                errors={errors}
                isAdmin={isAdmin}
                onChange={(next) => setValue({ ...value, global: next as Record<string, unknown> })}
              />
            ) : null}
            <LocaleTabs
              locales={locales.map((l) => ({ ...l, complete: !!value.locales[l.code] }))}
              value={locale}
              onChange={setLocale}
              renderPanel={(code) =>
                value.locales[code] ? (
                  <SchemaField
                    schema={{ ...config.localeSchema, label: 'Konten' }}
                    value={value.locales[code]}
                    path={`locales.${code}`}
                    errors={errors}
                    isAdmin={isAdmin}
                    onChange={(next) =>
                      setValue({
                        ...value,
                        locales: { ...value.locales, [code]: next as Record<string, unknown> },
                      })
                    }
                  />
                ) : (
                  <button
                    type="button"
                    className={s.button}
                    onClick={() =>
                      setValue({
                        ...value,
                        locales: {
                          ...value.locales,
                          [code]: emptyValue(config.localeSchema) as Record<string, unknown>,
                        },
                      })
                    }
                  >
                    Tambah konten untuk bahasa ini
                  </button>
                )
              }
            />
            {errors.locales ? <p className={s.error}>{errors.locales}</p> : null}
          </>
        )}
      </CmsForm>
    </>
  )
}
