'use client'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { SchemaField } from '@/components/admin/cms/schema-fields'
import { LocaleTabs } from '@/components/admin/forms'
import { useState } from 'react'
import { f, type FieldErrors, type ObjectField } from '../../cms/fields'
import {
  SITE_FORM_GLOBAL_GROUPS,
  SITE_FORM_LOCALE_GROUPS,
  settingsGlobalSchema,
  settingsLocaleSchema,
  type SettingsGlobal,
  type SettingsLocale,
} from '../fields'
import { fillTemplate, whatsappLink } from '../project'
import { saveSiteSettingsAction } from '../actions'
import c from '@/components/admin/cms/cms.module.css'

type Value = { global: SettingsGlobal; locales: Record<string, SettingsLocale> }

const subset = (schema: ObjectField, keys: readonly string[]) =>
  f.object(Object.fromEntries(keys.map((key) => [key, schema.fields[key]])))

const globalForm = subset(settingsGlobalSchema, SITE_FORM_GLOBAL_GROUPS)
const localeForm = subset(settingsLocaleSchema, SITE_FORM_LOCALE_GROUPS)

function Preview({ number, message }: { number: string; message: string }) {
  const href = whatsappLink(number, message)
  return (
    <div className={c.preview}>
      <span>Pratinjau tautan</span>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {href}
      </a>
    </div>
  )
}

export function SettingsForm({
  value,
  isAdmin,
  services,
  locales,
}: {
  value: Value
  isAdmin: boolean
  services: Record<string, { slug: string; title: string }[]>
  locales: { code: string; label: string }[]
}) {
  const [locale, setLocale] = useState(locales[0]?.code ?? 'en')
  return (
    <CmsForm action={saveSiteSettingsAction} initialValue={value}>
      {(current, setValue, errors: FieldErrors) => {
        const site = current.global.brand.siteName
        const product = current.global.brand.productName
        const number = current.global.contact.whatsappNumber
        const titleOf = (code: string, slug: unknown) =>
          services[code]?.find((service) => service.slug === slug)?.title ?? String(slug)
        return (
          <>
            <SchemaField
              schema={globalForm}
              value={current.global}
              path="global"
              errors={errors}
              isAdmin={isAdmin}
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
                  isAdmin={isAdmin}
                  extras={{
                    [`locales.${code}.whatsapp.general`]: (v) => (
                      <Preview number={number} message={fillTemplate(String(v ?? ''), { site })} />
                    ),
                    [`locales.${code}.whatsapp.product`]: (v) => (
                      <Preview
                        number={number}
                        message={fillTemplate(String(v ?? ''), { site, product })}
                      />
                    ),
                    [`locales.${code}.whatsapp.thankYou`]: (v) => (
                      <Preview number={number} message={fillTemplate(String(v ?? ''), { site })} />
                    ),
                    ...Object.fromEntries(
                      current.locales[code].whatsapp.services.map((entry, index) => [
                        `locales.${code}.whatsapp.services.${index}.message`,
                        (v: unknown) => (
                          <Preview
                            number={number}
                            message={fillTemplate(String(v ?? ''), {
                              site,
                              service: titleOf(code, entry.serviceSlug),
                            })}
                          />
                        ),
                      ]),
                    ),
                  }}
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
        )
      }}
    </CmsForm>
  )
}
