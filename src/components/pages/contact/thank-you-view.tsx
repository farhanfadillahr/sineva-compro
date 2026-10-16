import { useTranslations } from 'next-intl'
import { WhatsAppIcon } from '@/components/layout/icons'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { Reveal } from '@/components/motion/Reveal'
import { ThankYouFlight } from '@/components/mascot/sino-launch/thank-you-flight'
import { SinoLoop } from '@/components/motion/sino-loop'
import { poseImage } from '@/components/pages/home/poses'
import { Button, Container, Section, type ActionLinkComponent } from '@/components/ui'
import type { PageLinkTarget } from '@/features/content/types'
import { whatsappHrefFor } from '@/lib/whatsapp'
import { CheckGlyph } from './glyphs'
import type { ThankYouModel } from './contact-model'

// The content names a destination by key and never stores a URL (types.ts, PageLinkTarget); the
// page resolves it. `satisfies` makes a new target a type error here instead of a dead link.
const LINK_HREFS = {
  home: '/',
  product: '/products/ai-agents',
  services: '/services',
  work: '/work',
  blog: '/blog',
  about: '/about',
  contact: '/contact',
} as const satisfies Record<PageLinkTarget, string>

export type ThankYouViewProps = Readonly<{
  model: ThankYouModel
  /** Localised link component for the internal links (next-intl's Link through AppLink). */
  linkComponent?: ActionLinkComponent
}>

/**
 * /contact/thank-you (page-patterns.md 2.9): Sino with a thumbs up and a check, what happens next,
 * a WhatsApp button for a faster reply, and ways to keep exploring.
 *
 * The check is a static icon. The animated check (Lottie L3) is deferred until that asset exists;
 * the box is already the final size, so swapping the animation in moves nothing.
 */
export function ThankYouView({ model, linkComponent }: ThankYouViewProps) {
  const t = useTranslations('Contact')
  const { page, settings } = model
  const whatsappHref = whatsappHrefFor(settings?.whatsapp, { kind: 'thankYou' })

  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      <Section tone="canvas">
        <Container size="text" className="flex flex-col items-center gap-6 text-center">
          <div className="relative size-48 sm:size-56">
            <ThankYouFlight>
              <SinoLoop
                loop="L-thumbs"
                still={poseImage('thumbs-up')}
                sizes="(min-width: 640px) 224px, 192px"
                className="size-full object-contain"
              />
            </ThankYouFlight>
            <span
              data-slot="check-icon"
              aria-hidden="true"
              className="absolute right-2 bottom-2 flex size-14 items-center justify-center rounded-pill bg-success text-text-inverse shadow-md"
            >
              <CheckGlyph className="size-7" strokeWidth={2.5} />
            </span>
          </div>
          <h1 className="text-h1 text-balance text-text">{page.headline}</h1>
          <p className="max-w-[52ch] text-lead text-pretty text-text-secondary">{page.body}</p>

          {whatsappHref ? (
            <Button
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="xl"
              leadingIcon={<WhatsAppIcon className="text-success" />}
            >
              {page.whatsappCtaLabel}
            </Button>
          ) : null}

          {page.nextLinks.length > 0 ? (
            <Reveal
              as="nav"
              aria-labelledby="thank-you-more"
              className="mt-4 flex flex-col items-center gap-3 border-t border-border pt-8"
            >
              <h2 id="thank-you-more" className="text-label text-text-secondary">
                {t('thankYou.moreLabel')}
              </h2>
              <ul className="flex flex-wrap justify-center gap-3">
                {page.nextLinks.map((link) => (
                  <li key={link.target}>
                    <Button
                      href={LINK_HREFS[link.target]}
                      linkComponent={linkComponent}
                      variant="secondary"
                      size="md"
                      withArrow
                    >
                      {link.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </Container>
      </Section>
    </main>
  )
}
