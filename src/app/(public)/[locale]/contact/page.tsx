import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { ContactFormWithPrefill } from '@/components/pages/contact/contact-form'
import { saveContact } from '@/features/leads/actions'
import { buildContactMetadata } from '@/components/pages/contact/contact-metadata'
import { ContactView } from '@/components/pages/contact/contact-view'
import { getContactModel } from '@/components/pages/contact/get-contact-model'
import { routing } from '@/i18n/routing'

type ContactPageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getContactModel(locale)
  if (!model) notFound()
  return buildContactMetadata(model.page, model.settings)
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getContactModel(locale)
  // A locale without Contact content has no page: 404 rather than an empty shell.
  if (!model) notFound()

  // Without settings there is no number to send to, so the form slot stays empty instead of
  // collecting answers it cannot deliver.
  const { settings } = model
  return (
    <ContactView
      model={model}
      form={
        settings ? (
          <ContactFormWithPrefill
            intro={model.page.form.intro}
            consentLabel={model.page.form.consentLabel}
            settings={{ contact: settings.contact, whatsapp: settings.whatsapp }}
            saveLead={saveContact}
          />
        ) : null
      }
    />
  )
}
