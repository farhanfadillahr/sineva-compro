import { Button, Container, Section, type SectionTone } from '@/components/ui'
import { cx } from '@/components/ui/cx'
import type { MediaAsset } from '@/features/content/types'
import { WhatsAppGlyph } from './_internal/icons'
import { SectionImage } from './_internal/section-image'
import type { CtaLink, LinkProps } from './_internal/types'
import floatStyles from './_internal/ui-chip.module.css'

/**
 * The tone this block contributes to a page, for `checkSectionTones`. The rounded panel is the
 * page's one inverse section (page-patterns.md section 4); the full-bleed band around it stays on
 * the canvas, so the section above only has to differ from the inverse panel, not from the band.
 */
export const FINAL_CTA_TONE = 'inverse' as const satisfies SectionTone

export type FinalCtaProps = LinkProps & {
  /** Anchor for StickyCtaBar, which hides while this block is on screen. */
  id?: string
  headline: string
  body?: string | null
  primaryCta: CtaLink
  secondaryCta?: CtaLink | null
  whatsappCta?: CtaLink | null
  /** Sino S1 waving. One hero-size Sino per viewport: do not pair this with a large hero pose. */
  image?: MediaAsset | null
}

/**
 * Closing call to action (components.md sections 1 and 13): inverse panel with the aurora wash,
 * radius 2xl, the main CTA, an optional second CTA and WhatsApp, and a Sino pose that floats.
 *
 * Button choice on the dark panel: the main CTA is the white pill (`secondary`) because the
 * `primary` teal fill and the `dark` fill both sit too close to the panel colour to read as a
 * button; the second CTA keeps the teal fill, whose white label still has strong contrast.
 */
export function FinalCta({
  id = 'final-cta',
  headline,
  body,
  primaryCta,
  secondaryCta,
  whatsappCta,
  image,
  linkComponent,
}: FinalCtaProps) {
  return (
    <Section id={id} tone="canvas">
      <Container size="wide">
        <div
          data-tone={FINAL_CTA_TONE}
          className="relative isolate overflow-hidden rounded-2xl bg-surface-inverse text-text-inverse"
        >
          <div
            data-slot="cta-aurora"
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-(image:--gradient-aurora)"
          />
          <div
            className={cx(
              'grid grid-cols-1 items-center gap-10 p-8 sm:p-12 lg:p-16',
              image && 'lg:grid-cols-12',
            )}
          >
            <div className={cx('flex flex-col items-start gap-6', image && 'lg:col-span-7')}>
              <h2 className="text-h1 text-balance text-text-inverse">{headline}</h2>
              {body ? (
                <p className="max-w-[52ch] text-lead text-pretty text-text-inverse">{body}</p>
              ) : null}
              <div className="flex w-full flex-col gap-3 min-[400px]:w-auto min-[400px]:flex-row min-[400px]:flex-wrap">
                <Button
                  href={primaryCta.href}
                  linkComponent={linkComponent}
                  variant="secondary"
                  size="xl"
                  withArrow
                  className="w-full min-[400px]:w-auto"
                >
                  {primaryCta.label}
                </Button>
                {secondaryCta ? (
                  <Button
                    href={secondaryCta.href}
                    linkComponent={linkComponent}
                    variant="primary"
                    size="xl"
                    className="w-full min-[400px]:w-auto"
                  >
                    {secondaryCta.label}
                  </Button>
                ) : null}
                {whatsappCta ? (
                  <Button
                    href={whatsappCta.href}
                    variant="whatsapp"
                    size="xl"
                    leadingIcon={<WhatsAppGlyph />}
                    className="w-full min-[400px]:w-auto"
                  >
                    {whatsappCta.label}
                  </Button>
                ) : null}
              </div>
            </div>
            {image ? (
              <div className="flex justify-center lg:col-span-5 lg:justify-end">
                <div className={cx('w-3/4 max-w-sm', floatStyles.float)}>
                  <SectionImage
                    image={image}
                    sizes="(min-width: 1024px) 30vw, 60vw"
                    className="h-auto w-full"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  )
}
