'use client'
import { useState } from 'react'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { SchemaField } from '@/components/admin/cms/schema-fields'
import { LocaleTabs } from '@/components/admin/forms'
import { InlineBanner } from '@/components/admin/feedback'
import { f, type ObjectField } from '../../cms/fields'
import {
  SEO_FORM_GLOBAL_GROUPS,
  SEO_FORM_LOCALE_GROUPS,
  settingsGlobalSchema,
  settingsLocaleSchema,
  type SettingsGlobal,
  type SettingsLocale,
} from '../fields'
import { saveSeoSettingsAction } from '../actions'

type Value = { global: SettingsGlobal; locales: Record<string, SettingsLocale> }
const subset = (schema: ObjectField, keys: readonly string[]) =>
  f.object(Object.fromEntries(keys.map((key) => [key, schema.fields[key]])))
const globalForm = subset(settingsGlobalSchema, SEO_FORM_GLOBAL_GROUPS)
const localeForm = subset(settingsLocaleSchema, SEO_FORM_LOCALE_GROUPS)

export function SeoSettingsForm({
  value,
  locales,
  organization,
}: {
  value: Value
  locales: { code: string; label: string }[]
  organization: { name: string; sameAs: string[] }
}) {
  const [locale, setLocale] = useState(locales[0]?.code ?? 'en')
  return (
    <CmsForm action={saveSeoSettingsAction} initialValue={value}>
      {(current, setValue, errors) => (
        <>
          <InlineBanner tone="info">
            Data Organization (JSON-LD): nama &quot;{organization.name}&quot;, logo dan gambar OG
            bawaan dari Pengaturan situs &gt; Brand, sameAs dari media sosial (
            {organization.sameAs.length ? organization.sameAs.join(', ') : 'belum ada'}). Indeks
            situs juga memerlukan SITE_INDEXABLE=true di environment production; preview selalu
            noindex.
          </InlineBanner>
          <SchemaField
            schema={globalForm}
            value={current.global}
            path="global"
            errors={errors}
            isAdmin
            onChange={(next) => setValue({ ...current, global: next as SettingsGlobal })}
          />
          <LocaleTabs
            locales={locales.map((l) => ({ ...l, complete: true }))}
            value={locale}
            onChange={setLocale}
            renderPanel={(code) => (
              <SchemaField
                schema={localeForm}
                value={current.locales[code]}
                path={`locales.${code}`}
                errors={errors}
                isAdmin
                onChange={(next) =>
                  setValue({
                    ...current,
                    locales: { ...current.locales, [code]: next as SettingsLocale },
                  })
                }
              />
            )}
          />
        </>
      )}
    </CmsForm>
  )
}
