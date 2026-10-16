import { Badge, Button, Card, Container, Eyebrow, Section } from '@/components/ui'
import { cx } from '@/components/ui/cx'
import { AnimatedPose } from '@/components/motion/animated-pose'
import { SinoLoop } from '@/components/motion/sino-loop'
import { isLoopReady, type LoopId } from '@/components/motion/sino-loops'
import { Reveal } from '@/components/motion/Reveal'
import type { MediaAsset } from '@/features/content/types'
import type { CtaLink, LinkProps } from './_internal/types'

export type TwoPathsCard = Readonly<{
  eyebrow?: string | null
  title: string
  body: string
  /** Small status badge next to the eyebrow, for example the Product "Coming soon" label. */
  badge?: string
  cta: CtaLink
  /** Sino pose. The content DTO carries a pose key; the page resolves it to an asset. */
  image?: MediaAsset | null
  /** Plays this loop in place of `image` once its files exist; until then `image` is drawn. */
  loop?: LoopId
}>

export type TwoPathsProps = LinkProps & {
  product: TwoPathsCard
  services: TwoPathsCard
  /** Sent with the analytics event so the product and services split can be read per locale. */
  locale?: string
}

type PathKey = 'product' | 'services'

/**
 * Home "two paths" (page-patterns.md 2.1 row 2): Product on a teal tint with an aurora glow,
 * Services on the warm surface, each with a Sino pose and one CTA. There is no section header, so
 * the card titles are the h2 headings of the band.
 *
 * Analytics: each CTA carries Umami's declarative event attributes (`data-umami-event`), so the
 * `path_select` event fires with `path` and `locale` without any client JavaScript here. The
 * Umami script (loaded by the analytics ticket) picks the attributes up on click.
 */
export function TwoPaths({ product, services, locale, linkComponent }: TwoPathsProps) {
  const cards: readonly [PathKey, TwoPathsCard][] = [
    ['product', product],
    ['services', services],
  ]
  return (
    <Section tone="canvas">
      <Container size="wide">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {cards.map(([key, card], index) => (
            <Reveal key={key} variant="depth">
              <Card
                as="article"
                variant="path"
                tone={key === 'product' ? 'tint' : 'warm'}
                className="group/path flex h-full flex-col"
              >
                {key === 'product' ? (
                  // Aurora glow behind the pose; it intensifies on hover (components.md section 4).
                  <div
                    aria-hidden="true"
                    className={cx(
                      'pointer-events-none absolute -bottom-24 -end-24 size-96 opacity-60',
                      'bg-(image:--gradient-glow-teal)',
                      'transition-opacity duration-(--dur-med) ease-out motion-reduce:transition-none',
                      'group-hover/path:opacity-100 group-focus-within/path:opacity-100',
                    )}
                  />
                ) : null}
                <div className="relative z-10 flex flex-col items-start gap-4 sm:max-w-[58%]">
                  {card.eyebrow || card.badge ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {card.eyebrow ? <Eyebrow>{card.eyebrow}</Eyebrow> : null}
                      {card.badge ? <Badge soon>{card.badge}</Badge> : null}
                    </div>
                  ) : null}
                  <h2 className="text-h2 text-balance text-text">{card.title}</h2>
                  <p className="text-body text-pretty text-text-secondary">{card.body}</p>
                  <Button
                    href={card.cta.href}
                    linkComponent={linkComponent}
                    variant={key === 'product' ? 'primary' : 'secondary'}
                    size="lg"
                    withArrow
                    data-umami-event="path_select"
                    data-umami-event-path={key}
                    data-umami-event-locale={locale}
                    className="mt-2"
                  >
                    {card.cta.label}
                  </Button>
                </div>
                {card.image || (card.loop && isLoopReady(card.loop)) ? (
                  // Stacks under the text on phones; bleeds off the bottom right edge from sm up. This
                  // box only positions the pose: the lift on hover and focus, the float and the
                  // parallax all live in AnimatedPose, which finds the card by itself.
                  <div
                    data-slot="path-pose"
                    className={cx(
                      'pointer-events-none relative z-0 mt-6 ms-auto w-2/3 max-w-72',
                      'sm:absolute sm:-bottom-4 sm:end-4 sm:mt-0 sm:w-[42%]',
                    )}
                  >
                    {card.loop ? (
                      <SinoLoop
                        loop={card.loop}
                        still={card.image ?? null}
                        index={index}
                        sizes="(min-width: 1024px) 24vw, 60vw"
                      />
                    ) : (
                      <AnimatedPose
                        image={card.image ?? null}
                        index={index}
                        sizes="(min-width: 1024px) 24vw, 60vw"
                      />
                    )}
                  </div>
                ) : null}
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
