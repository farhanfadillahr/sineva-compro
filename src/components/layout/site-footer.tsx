import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/container'
import { cx, focusRing } from '@/components/ui/cx'
import type { SiteSettingsDTO } from '@/features/content/types'
import { AppLink } from './app-link'
import { FooterColumn } from './footer-column'
import { SocialIcon, type SocialNetwork } from './icons'
import { Logo } from './logo'
import type { NavService } from './nav-model'

/** The part of the site settings the footer reads. */
export type FooterSettings = Pick<SiteSettingsDTO, 'contact' | 'social'>

const socialNetworks: readonly SocialNetwork[] = ['instagram', 'linkedin', 'tiktok', 'youtube', 'x']

// Inset focus ring: the column lists sit in an overflow-hidden region (accordion), which would
// clip an outline drawn outside the link box.
const linkClass = cx(
  'inline-flex min-h-11 items-center rounded-xs text-body-sm text-text-secondary no-underline',
  'transition-colors duration-(--dur-fast) ease-out hover:text-text motion-reduce:transition-none',
  'focus-visible:-outline-offset-2',
  focusRing,
)

/**
 * Site footer (components.md section 3). Light, on `--color-canvas-alt`. It renders on the server;
 * only the column accordion is a client component.
 *
 * Everything that depends on site settings is optional on purpose (FR-GLB-03): an empty address,
 * legal entity, business hours or social account renders nothing, never a placeholder.
 */
export function SiteFooter({
  settings,
  services,
  showWork = true,
}: {
  settings: FooterSettings | null
  services: readonly NavService[]
  /** `false` hides the Work link while there are no projects to list. */
  showWork?: boolean
}) {
  const t = useTranslations('Footer')
  const nav = useTranslations('Nav')
  const brand = useTranslations('Brand')

  const contact = settings?.contact
  const legal = contact?.legalEntity
    ? [
        contact.legalEntity.name,
        contact.legalEntity.registrationNumber
          ? t('registration', { number: contact.legalEntity.registrationNumber })
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null
  // The public email can be unconfirmed (null), so each line is optional and the whole block
  // disappears when none of them has content, rather than leaving an empty rule line.
  const hasAddressBlock = Boolean(contact?.email || contact?.businessHours || contact?.address)
  const hasContactBlock = hasAddressBlock || Boolean(legal)
  const socials = socialNetworks.flatMap((network) => {
    const href = settings?.social[network]
    return href ? [{ network, href }] : []
  })

  return (
    <footer className="relative overflow-hidden bg-canvas-alt">
      <Container size="wide" data-slot="footer-content" className="relative z-10 pt-12 md:pt-16">
        <div className="grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-4">
          <FooterColumn title={t('columns.product')}>
            <ul className="m-0 list-none p-0 pb-4 md:pb-0">
              <li>
                <AppLink href="/products/ai-agents" className={linkClass}>
                  {t('links.aiAgents')}
                </AppLink>
              </li>
              <li>
                <AppLink href="/products/ai-agents" className={linkClass}>
                  {t('links.joinWaitlist')}
                </AppLink>
              </li>
            </ul>
          </FooterColumn>

          <FooterColumn title={t('columns.services')}>
            <ul className="m-0 list-none p-0 pb-4 md:pb-0">
              {services.map((service) => (
                <li key={service.slug}>
                  <AppLink href={`/services/${service.slug}`} className={linkClass}>
                    {service.title}
                  </AppLink>
                </li>
              ))}
              <li>
                <AppLink href="/services" className={linkClass}>
                  {t('links.allServices')}
                </AppLink>
              </li>
            </ul>
          </FooterColumn>

          <FooterColumn title={t('columns.company')}>
            <ul className="m-0 list-none p-0 pb-4 md:pb-0">
              <li>
                <AppLink href="/about" className={linkClass}>
                  {t('links.about')}
                </AppLink>
              </li>
              {showWork ? (
                <li>
                  <AppLink href="/work" className={linkClass}>
                    {t('links.work')}
                  </AppLink>
                </li>
              ) : null}
              <li>
                <AppLink href="/blog" className={linkClass}>
                  {t('links.blog')}
                </AppLink>
              </li>
              <li>
                <AppLink href="/contact" className={linkClass}>
                  {t('links.contact')}
                </AppLink>
              </li>
            </ul>
          </FooterColumn>

          <FooterColumn title={t('columns.legal')}>
            <ul className="m-0 list-none p-0 pb-4 md:pb-0">
              <li>
                <AppLink href="/privacy-policy" className={linkClass}>
                  {t('links.privacyPolicy')}
                </AppLink>
              </li>
            </ul>
          </FooterColumn>
        </div>

        {hasContactBlock ? (
          <div className="mt-8 grid gap-1 border-t border-border pt-8 text-body-sm text-text-secondary">
            {hasAddressBlock ? (
              <address className="grid gap-1 not-italic">
                {contact?.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className={cx(
                      'w-fit rounded-xs text-text no-underline hover:underline',
                      focusRing,
                    )}
                  >
                    {contact.email}
                  </a>
                ) : null}
                {contact?.businessHours ? <p className="m-0">{contact.businessHours}</p> : null}
                {contact?.address ? (
                  <p data-slot="footer-address" className="m-0">
                    {contact.address}
                  </p>
                ) : null}
              </address>
            ) : null}
            {legal ? (
              <p data-slot="footer-legal" className="m-0 text-micro text-text-tertiary">
                {legal}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-border py-6">
          <div className="flex items-center gap-4">
            <AppLink
              href="/"
              aria-label={nav('homeLabel')}
              className={cx(
                'inline-flex size-11 items-center justify-center rounded-sm',
                focusRing,
              )}
            >
              <Logo wordmark={false} />
            </AppLink>
            {socials.length > 0 ? (
              <ul
                aria-label={t('socialLabel')}
                className="m-0 flex list-none items-center gap-1 p-0"
              >
                {socials.map(({ network, href }) => (
                  <li key={network}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t(`social.${network}`)}
                      className={cx(
                        'flex size-11 items-center justify-center rounded-sm text-text-secondary',
                        'transition-colors duration-(--dur-fast) ease-out hover:bg-surface hover:text-text',
                        'motion-reduce:transition-none',
                        focusRing,
                      )}
                    >
                      <SocialIcon name={network} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <p className="m-0 font-mono text-xs text-text-tertiary">{t('copyright')}</p>
        </div>
      </Container>

      {/* Quiet brand moment behind the navigation, not below it: the wordmark is out of flow and
          sits under the columns, anchored to the bottom edge and cropped by it, so the footer is
          only as tall as its links and the bottom bar stays last. Decorative only. */}
      <div
        aria-hidden="true"
        data-slot="footer-watermark"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 translate-y-[18%] text-center font-sans text-[20vw] leading-[0.85] font-semibold tracking-[-0.04em] text-border select-none"
      >
        {brand('name')}
      </div>
    </footer>
  )
}
