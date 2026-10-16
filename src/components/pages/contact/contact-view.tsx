import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { WhatsAppIcon } from '@/components/layout/icons'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { Reveal } from '@/components/motion/Reveal'
import { Button, Card, Container, Section } from '@/components/ui'
import { whatsappHrefFor } from '@/lib/whatsapp'
import type { ContactModel } from './contact-model'
import { CheckGlyph } from './glyphs'

export type ContactViewProps = Readonly<{
  model: ContactModel
  /**
   * The form. A slot, so this view stays a server component and the page decides which client
   * component fills it (the prefill wrapper reads the URL, which a server view must not).
   */
  form: ReactNode
}>

/**
 * /contact (page-patterns.md 2.8, Sintra book-a-demo pattern): centred meta chips, headline and
 * lead on the alternate canvas, then two columns. Left: three steps and the other ways to reach
 * us. Right: the form card. Every line comes from the page content, the settings or the `Contact`
 * messages; a setting that is empty removes its line instead of leaving a label with no value.
 */
export function ContactView({ model, form }: ContactViewProps) {
  const t = useTranslations('Contact')
  const { page, settings } = model
  const whatsappHref = whatsappHrefFor(settings?.whatsapp, { kind: 'general' })
  const email = settings?.contact.email ?? null
  const hours = settings?.contact.businessHours ?? null
  const address = settings?.contact.address ?? null
  const details = [
    email
      ? { key: 'email', label: t('side.emailLabel'), value: email, href: `mailto:${email}` }
      : null,
    hours ? { key: 'hours', label: t('side.hoursLabel'), value: hours, href: null } : null,
    address ? { key: 'address', label: t('side.addressLabel'), value: address, href: null } : null,
  ].filter((item) => item !== null)

  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      <Section tone="alt">
        <Container>
          <header className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            {page.metaChips.length > 0 ? (
              <ul
                data-slot="meta-chips"
                aria-label={t('side.highlightsLabel')}
                className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-body-sm text-text-secondary"
              >
                {page.metaChips.map((chip, index) => (
                  <li key={chip} className="flex items-center gap-3">
                    {index > 0 ? <span aria-hidden="true">{'·'}</span> : null}
                    <span className="inline-flex items-center gap-1.5">
                      <CheckGlyph className="text-text-brand" />
                      {chip}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <h1 className="text-h1 text-balance text-text">{page.headline}</h1>
            <p className="max-w-[65ch] text-lead text-pretty text-text-secondary">{page.lead}</p>
          </header>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-16 lg:grid-cols-12 lg:items-start">
            <div className="flex flex-col gap-10 lg:col-span-5">
              <ol aria-label={t('side.stepsLabel')} className="flex flex-col gap-6">
                {page.steps.map((step, index) => (
                  <Reveal as="li" variant="depth" key={step.title}>
                    <Card variant="step">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-surface-tint font-mono text-eyebrow text-text-brand"
                      >
                        {index + 1}
                      </span>
                      <div className="flex flex-col gap-1">
                        <p className="text-h4 text-text">{step.title}</p>
                        <p className="text-body-sm text-text-secondary">{step.body}</p>
                      </div>
                    </Card>
                  </Reveal>
                ))}
              </ol>

              {whatsappHref || details.length > 0 || page.responseTimeText ? (
                <Reveal variant="depth" delayMs={150}>
                  <Card tone="surface" className="flex flex-col gap-5">
                    {whatsappHref ? (
                      <div className="flex flex-col items-start gap-3">
                        <h2 className="text-h4 text-text">{t('side.whatsappTitle')}</h2>
                        <p className="text-body-sm text-text-secondary">{t('side.whatsappBody')}</p>
                        <Button
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="whatsapp"
                          size="lg"
                          leadingIcon={<WhatsAppIcon className="text-success" />}
                        >
                          {t('side.whatsappCta')}
                        </Button>
                      </div>
                    ) : null}
                    {details.length > 0 ? (
                      <dl className="flex flex-col gap-3">
                        {details.map((item) => (
                          <div key={item.key} className="flex flex-col gap-0.5">
                            <dt className="text-micro text-text-tertiary">{item.label}</dt>
                            <dd className="text-body-sm text-text">
                              {item.href ? (
                                <a
                                  href={item.href}
                                  className="text-(--color-link) underline underline-offset-4"
                                >
                                  {item.value}
                                </a>
                              ) : (
                                item.value
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {/* Only an approved response time (the Founder's SLA) ever reaches this line. */}
                    {page.responseTimeText ? (
                      <p className="text-body-sm text-text-secondary">{page.responseTimeText}</p>
                    ) : null}
                  </Card>
                </Reveal>
              ) : null}
            </div>

            {/* Not `Card`: components.md section 6 asks for radius-xl, padding 32 and shadow-md
                here, and Card's base variant fixes radius-card and shadow-sm. */}
            <Reveal
              variant="depth"
              data-slot="form-card"
              delayMs={100}
              className="rounded-xl bg-surface p-6 shadow-md [border:var(--border-hairline)] sm:p-8 lg:col-span-7"
            >
              {form}
            </Reveal>
          </div>
        </Container>
      </Section>
    </main>
  )
}
