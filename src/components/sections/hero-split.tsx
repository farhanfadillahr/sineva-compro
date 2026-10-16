import type { ReactNode } from 'react'
import { Button, Container, Eyebrow, Section, Split } from '@/components/ui'
import { cx } from '@/components/ui/cx'
import type { MediaAsset, MockupBubble } from '@/features/content/types'
import { HeroEntrance } from './_internal/hero-entrance'
import { MediaFrame } from './_internal/media-frame'
import { ChatBubbles, PhoneFrame } from './_internal/phone-frame'
import { SectionImage } from './_internal/section-image'
import { SinoStage } from './_internal/sino-stage'
import type { CtaLink, LinkProps } from './_internal/types'
import { UiChip } from './_internal/ui-chip'

export type HeroVariant = 'sino-canvas' | 'sino-still' | 'mockup' | 'scene'

export type HeroMockup = Readonly<{
  bubbles: readonly Pick<MockupBubble, 'from' | 'text'>[]
  /** Floating `ui-chip` texts, up to four. They must describe real product behaviour. */
  chips: readonly string[]
}>

export type HeroSplitProps = LinkProps & {
  variant: HeroVariant
  eyebrow?: string | null
  /**
   * At most 10 words (copywriting.md section 3). A list renders one block per line, so a
   * statement and its follow-up sentence stay on separate lines and animate 60 ms apart.
   */
  headline: string | readonly string[]
  /** A page has one h1. Pass `h2` only when the page already has one (the dev gallery). */
  headingAs?: 'h1' | 'h2'
  lead: string
  primaryCta: CtaLink
  secondaryCta?: CtaLink | null
  /** Id of the CTA group, observed by StickyCtaBar to know when the hero CTA left the screen. */
  ctaId?: string
  /** Extra content under the CTAs, for example the Product waitlist form. */
  extra?: ReactNode
  /** Sino still or poster (sino-*), or the scene picture (scene). */
  image?: MediaAsset | null
  /** The hero image is the LCP element: preload it. Use on one image per page. */
  priority?: boolean
  /** sino-canvas only: the realtime canvas, layered over the poster once it is ready. */
  canvas?: ReactNode
  /** mockup only: chat bubbles and floating chips. */
  mockup?: HeroMockup
  /** Visual on the left from lg up. DOM order stays text then visual. */
  reverse?: boolean
}

// Float positions for up to four chips around a phone. Kept inside the column (no negative
// offsets) so a narrow viewport never gets a horizontal scrollbar.
const CHIP_POSITIONS = [
  'start-0 top-10',
  'end-0 top-1/3',
  'start-2 bottom-24',
  'end-2 bottom-8',
] as const

const SIZES = '(min-width: 1024px) 58vw, 100vw'

/**
 * Hero band: text left, visual right (page-patterns.md section 3). Server component; the only
 * client piece is HeroEntrance, which animates the marked elements in (motion.md section 3.2).
 *
 * Tone is always `aurora` (hero background). The `sino-canvas` variant renders the poster image
 * and leaves a slot for the realtime canvas; the slot sits inside the stage so the swap does not
 * move anything. At most one hero-size Sino per viewport (mascot-sino.md section 6).
 */
export function HeroSplit({
  variant,
  eyebrow,
  headline,
  headingAs: Heading = 'h1',
  lead,
  primaryCta,
  secondaryCta,
  ctaId = 'hero-cta',
  extra,
  image,
  priority = false,
  canvas,
  mockup,
  reverse = false,
  linkComponent,
}: HeroSplitProps) {
  const lines = typeof headline === 'string' ? [headline] : headline

  const text = (
    <div className="flex flex-col items-start gap-6">
      {eyebrow ? (
        <Eyebrow dot data-hero-delay={0} data-hero-from="rise-16">
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Heading className="text-display text-balance text-text">
        {lines.map((line, index) => (
          <span key={index} data-hero-delay={index * 60} data-hero-from="rise-16" className="block">
            {index > 0 ? ' ' : null}
            {line}
          </span>
        ))}
      </Heading>
      <p
        data-hero-delay={180}
        data-hero-from="rise-12"
        className="max-w-[52ch] text-lead text-pretty text-text-secondary"
      >
        {lead}
      </p>
      {/* Under 400 px the group stacks full width with the primary first (components.md section 1). */}
      <div
        id={ctaId}
        data-hero-delay={260}
        data-hero-from="rise-12"
        className="flex w-full flex-col gap-3 min-[400px]:w-auto min-[400px]:flex-row min-[400px]:flex-wrap"
      >
        <Button
          href={primaryCta.href}
          linkComponent={linkComponent}
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
            variant="secondary"
            size="xl"
            className="w-full min-[400px]:w-auto"
          >
            {secondaryCta.label}
          </Button>
        ) : null}
      </div>
      {extra}
    </div>
  )

  const visualMotion = { 'data-hero-delay': 200, 'data-hero-from': 'scale' } as const

  let visual: ReactNode
  if (variant === 'mockup') {
    visual = (
      <div {...visualMotion} className="relative mx-auto w-full max-w-md py-6">
        <PhoneFrame>
          <ChatBubbles bubbles={mockup?.bubbles ?? []} />
        </PhoneFrame>
        {(mockup?.chips ?? []).slice(0, CHIP_POSITIONS.length).map((chip, index) => (
          <UiChip
            key={index}
            delay={index * 1.5}
            className={cx('absolute max-w-[60%]', CHIP_POSITIONS[index])}
          >
            {chip}
          </UiChip>
        ))}
      </div>
    )
  } else if (variant === 'scene') {
    visual = (
      <MediaFrame {...visualMotion}>
        {image ? (
          <SectionImage image={image} priority={priority} sizes={SIZES} className="h-auto w-full" />
        ) : null}
      </MediaFrame>
    )
  } else {
    // sino-still and sino-canvas share the stage; the canvas slot is the only difference.
    visual = (
      <SinoStage
        {...visualMotion}
        aspect={image ? image.width / image.height : 1}
        className="max-w-xl"
      >
        {image ? (
          <SectionImage
            image={image}
            priority={priority}
            sizes={SIZES}
            className="size-full object-contain"
          />
        ) : null}
        {variant === 'sino-canvas' && canvas ? (
          <div data-slot="sino-canvas" aria-hidden="true" className="absolute inset-0 z-20">
            {canvas}
          </div>
        ) : null}
      </SinoStage>
    )
  }

  return (
    // The stage glow and orbit arcs extend past the stage box; clip them sideways so they never
    // create a horizontal scrollbar on a phone.
    <Section tone="aurora" data-variant={variant} className="overflow-x-clip">
      <Container size="wide">
        <HeroEntrance>
          <Split text={text} visual={visual} reverse={reverse} />
        </HeroEntrance>
      </Container>
    </Section>
  )
}
