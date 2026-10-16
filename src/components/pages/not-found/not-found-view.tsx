import { useTranslations } from 'next-intl'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { Reveal } from '@/components/motion/Reveal'
import { SinoLoop } from '@/components/motion/sino-loop'
import { poseImage } from '@/components/pages/home/poses'
import { SinoStage } from '@/components/sections/_internal/sino-stage'
import { Button, Container, Section, type ActionLinkComponent } from '@/components/ui'
import type { NotFoundPageContent, PageLinkTarget } from '@/features/content/types'

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

export type NotFoundViewProps = Readonly<{
  page: NotFoundPageContent
  /** Localised link component for the internal links (next-intl's Link through AppLink). */
  linkComponent?: ActionLinkComponent
}>

/**
 * The 404 page (page-patterns.md 2.9, components.md section 11): Sino confused, the headline, one
 * line to get back on track, and links to Home, Services and Contact. The first link is the
 * primary action; the rest are secondary so the page has one clear next step.
 *
 * Sino is decorative (empty alt): the headline carries the meaning. The pose goes through
 * AnimatedPose like every other still, and sits in a stage so its glow reacts to hover. SinoLoop
 * is that same AnimatedPose: it plays L-confused once the loop is delivered and draws the confused
 * still until then.
 */
export function NotFoundView({ page, linkComponent }: NotFoundViewProps) {
  const t = useTranslations('NotFound')
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      <Section tone="canvas">
        <Container size="text" className="flex flex-col items-center gap-6 text-center">
          {/* The stage glow spills past its box; the clip keeps it from widening the page. */}
          <div className="w-full overflow-x-clip">
            <SinoStage className="max-w-48 sm:max-w-56">
              <SinoLoop
                loop="L-confused"
                still={poseImage('confused')}
                sizes="(min-width: 640px) 224px, 192px"
                className="size-full object-contain"
              />
            </SinoStage>
          </div>
          <h1 className="text-h1 text-balance text-text">{page.headline}</h1>
          <p className="max-w-[52ch] text-lead text-pretty text-text-secondary">{page.body}</p>
          {page.links.length > 0 ? (
            <Reveal as="nav" aria-label={t('linksLabel')}>
              <ul className="flex flex-wrap justify-center gap-3">
                {page.links.map((link, index) => (
                  <li key={link.target}>
                    <Button
                      href={LINK_HREFS[link.target]}
                      linkComponent={linkComponent}
                      variant={index === 0 ? 'primary' : 'secondary'}
                      size="lg"
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
