import { Card, Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { CardTone } from '@/components/ui/card'
import { cx } from '@/components/ui/cx'
import { AnimatedPose } from '@/components/motion/animated-pose'
import { Reveal } from '@/components/motion/Reveal'
import type { CapabilityTint, MediaAsset, ProductCapability } from '@/features/content/types'
import { bentoColClass, bentoLayout, bentoRowClass } from './_internal/bento'
import { ChatBubbles, PhoneFrame } from './_internal/phone-frame'

// `ProductCapability` from the content layer fits as is; the page adds the resolved pose image.
export type TaskCardItem = Pick<ProductCapability, 'key' | 'title' | 'body' | 'tint' | 'featured'> &
  Readonly<{
    /** Request and reply shown as chat bubbles in a phone frame when there is no image. */
    mockupLines?: readonly string[]
    /** Sino pose bleeding off the bottom edge. Wins over the phone mockup. */
    image?: MediaAsset | null
  }>

export type TaskCardGridProps = {
  eyebrow?: string | null
  title: string
  intro?: string | null
  items: readonly TaskCardItem[]
  tone?: SectionTone
}

// The mint surface has no semantic token (tokens.md lists teal-50, sun-100, ink-50), so it is a
// light mix of the mint primitive into white. The tone map keeps the other three on tokens.
const MINT_SURFACE = 'bg-[color-mix(in_srgb,var(--mint-200)_30%,var(--white))]'
const TINT: Record<CapabilityTint, { tone: CardTone; extra?: string }> = {
  teal: { tone: 'tint' },
  sun: { tone: 'warm' },
  mint: { tone: 'none', extra: MINT_SURFACE },
  neutral: { tone: 'alt' },
}

/**
 * "What Sino can do" bento (page-patterns.md 2.1 row 4): one `card-task` per capability, titled
 * as a request to Sino, tinted per capability, with a pose or a chat mockup bleeding off the
 * bottom edge. Cards fade in with a 50 ms stagger (motion.md section 4.1). Renders nothing for an
 * empty list so a page never shows a heading over an empty grid.
 *
 * Gotcha: the featured card is placed explicitly in the first row and the others fill around it
 * (`grid-flow-dense`), so on desktop the visual order can differ from the DOM order when the
 * featured item is not first. Keep the DOM order meaningful for reading.
 */
export function TaskCardGrid({ eyebrow, title, intro, items, tone = 'canvas' }: TaskCardGridProps) {
  if (items.length === 0) return null

  const featuredIndex = items.findIndex((item) => item.featured)
  const layout = bentoLayout(items.length, featuredIndex === -1 ? null : featuredIndex)

  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeader eyebrow={eyebrow} title={title} lead={intro} />
        </Reveal>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-flow-dense lg:grid-cols-6">
          {items.map((item, index) => {
            const tile = layout[index]!
            const tint = TINT[item.tint]
            const isFeaturedTile = tile.rowSpan === 2
            const mockupLines = item.mockupLines ?? []
            return (
              <Reveal
                as="li"
                key={item.key}
                index={index}
                className={cx(
                  'flex',
                  isFeaturedTile && 'md:col-span-2 lg:row-start-1 lg:col-start-1',
                  bentoColClass[tile.colSpan],
                  bentoRowClass[tile.rowSpan],
                )}
              >
                <Card
                  variant="task"
                  tone={tint.tone}
                  featured={item.featured}
                  data-tint={item.tint}
                  className={cx('group/task flex w-full flex-col gap-6', tint.extra)}
                >
                  <div className="flex flex-col gap-3">
                    <h3 className="text-h3 text-balance text-text">{item.title}</h3>
                    <p className="text-body-sm text-pretty text-text-secondary">{item.body}</p>
                  </div>
                  {item.image ? (
                    // The tilt direction alternates by position (motion.md section 6, Sintra's
                    // rotate(+-2deg)); AnimatedPose derives it from `index`.
                    <div className="pointer-events-none mt-auto -mb-6 flex justify-center lg:-mb-8">
                      <AnimatedPose
                        image={item.image}
                        index={index}
                        sizes="(min-width: 1024px) 30vw, 90vw"
                        className="w-full max-w-72"
                      />
                    </div>
                  ) : mockupLines.length > 0 ? (
                    <PhoneFrame
                      size={isFeaturedTile ? 'lg' : 'sm'}
                      className={cx(
                        'mt-auto',
                        isFeaturedTile ? '-mb-24 max-w-80 lg:max-w-96' : '-mb-20 max-w-64',
                      )}
                    >
                      <ChatBubbles
                        bubbles={mockupLines.map((text, i) => ({
                          // The request comes first, then Sino's reply, alternating.
                          from: i % 2 === 0 ? ('user' as const) : ('sino' as const),
                          text,
                        }))}
                      />
                    </PhoneFrame>
                  ) : null}
                </Card>
              </Reveal>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
