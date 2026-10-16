import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/components/ui/cx'
import type { MockupBubble } from '@/features/content/types'

type PhoneFrameSize = 'sm' | 'md' | 'lg'

// Front-on render of assets/phone/sineva-phone-source.glb (sino-3d-mascot
// scripts/props3d/render_phone_frame.py, 900 x 1847). Its screen is a transparent rounded rectangle and
// the dynamic island is part of the image, so the HTML screen sits BEHIND the frame: the bezel and the
// island cover the screen edges at any size, and every visible line stays live, sharp text.
// Why not the earlier angled render: its screen was a perspective trapezoid, and a straight CSS polygon
// could never line up with it (bubbles ran over the island and past the bezel).
const FRAME_SRC = '/phone/sineva-phone-front.avif'

const PHONE_WIDTH: Record<PhoneFrameSize, string> = {
  sm: 'max-w-58',
  md: 'max-w-70',
  lg: 'max-w-80 lg:max-w-96',
}

/** Words in the chat chrome. They come from the messages (Product.phone), never from this file. */
export type PhoneChrome = Readonly<{ name: string; status: string; day: string }>

type PhoneFrameProps = Omit<ComponentProps<'div'>, 'children'> & {
  children: ReactNode
  size?: PhoneFrameSize
  /** Without it the header shows the avatar only and there is no day chip. */
  chrome?: PhoneChrome
}

/**
 * Pre-rendered 3D phone frame with a live HTML chat screen. Rendering the GLB once keeps each card
 * light and avoids adding more WebGL contexts. Sizes inside the screen use container query units
 * (cqw, 1 % of the phone width), so the chat keeps its proportions from a small card to the hero.
 * The mockup is decorative because its card already carries the same task in text.
 */
export function PhoneFrame({ size = 'md', chrome, className, children, ...rest }: PhoneFrameProps) {
  return (
    <div
      {...rest}
      data-slot="phone-frame"
      aria-hidden="true"
      className={cx(
        'relative mx-auto aspect-[900/1847] w-full drop-shadow-xl [container-type:inline-size]',
        PHONE_WIDTH[size],
        className,
      )}
    >
      {/* Screen hole measured on the render: x 48 to 851, y 83 to 1796 (px of 900 x 1847). The
          screen extends about 7 px under the bezel on every side, and its corner radius matches the
          hole's (75 px) plus that overlap, so no transparent corner shows. */}
      <div
        data-slot="phone-screen"
        className="absolute top-[4.1%] right-[4.6%] bottom-[2.3%] left-[4.6%] flex flex-col overflow-hidden rounded-[9.6%/4.6%] bg-canvas-alt"
      >
        <div
          data-slot="chat-header"
          className="flex items-center gap-[2.6cqw] border-b border-border bg-surface px-[5cqw] pt-[11.5cqw] pb-[3cqw]"
        >
          {/* The brand symbol as a CSS mask, not an <img>: the mockup must not add images to the
              cards that tests and readers count as content. */}
          <span className="flex size-[8.5cqw] shrink-0 items-center justify-center rounded-full bg-action-primary">
            <span className="size-[5.4cqw] bg-text-inverse [mask:url(/brand/sineva-symbol-original.svg)_center/contain_no-repeat]" />
          </span>
          {chrome ? (
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-[clamp(10px,4cqw,15px)] font-semibold text-text">
                {chrome.name}
              </span>
              <span className="flex items-center gap-[1cqw] text-[clamp(8px,2.9cqw,11px)] text-text-secondary">
                <span className="size-[1.6cqw] rounded-full bg-action-primary" />
                {chrome.status}
              </span>
            </span>
          ) : null}
        </div>
        <div
          data-slot="chat-messages"
          className="flex min-h-0 flex-1 flex-col justify-start gap-[2.6cqw] px-[4.5cqw] py-[4.5cqw]"
        >
          {chrome ? (
            <span className="self-center rounded-full bg-surface px-[2.6cqw] py-[0.8cqw] text-[clamp(8px,2.6cqw,10px)] text-text-secondary">
              {chrome.day}
            </span>
          ) : null}
          {children}
          {/* Sino is still typing: makes the screen read as a live chat rather than a static card. */}
          <span
            data-slot="chat-typing"
            className="flex gap-[1cqw] self-start rounded-[4.5cqw] rounded-es-[1.2cqw] bg-surface px-[3.6cqw] py-[3cqw] shadow-xs"
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-[1.6cqw] animate-pulse rounded-full bg-text-secondary/60"
                style={{ animationDelay: `${dot * 180}ms` }}
              />
            ))}
          </span>
        </div>
        <div
          data-slot="chat-composer"
          className="flex items-center gap-[2cqw] bg-surface px-[4.5cqw] pt-[2.6cqw] pb-[6cqw]"
        >
          <span className="h-[8cqw] flex-1 rounded-full border border-border bg-canvas-alt" />
          <span className="flex size-[8cqw] items-center justify-center rounded-full bg-action-primary">
            <svg
              viewBox="0 0 24 24"
              className="size-[4.2cqw] fill-none stroke-text-inverse stroke-[2.5]"
            >
              <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
      {/* A background, not an <img>: the frame is pure decoration and must not count as content. */}
      <span
        data-slot="phone-shell"
        className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${FRAME_SRC})` }}
      />
    </div>
  )
}

type ChatBubblesProps = ComponentProps<'div'> & {
  bubbles: readonly Pick<MockupBubble, 'from' | 'text'>[]
}

/** Chat bubbles for a phone screen: the user's request on the right, Sino's answer on the left. */
export function ChatBubbles({ bubbles, className, ...rest }: ChatBubblesProps) {
  return (
    <div {...rest} className={cx('flex flex-col gap-[2.6cqw]', className)}>
      {bubbles.map((bubble, index) => (
        <div
          key={index}
          data-slot="chat-bubble"
          data-from={bubble.from}
          className={cx(
            'max-w-[82%] rounded-[4.5cqw] px-[3.6cqw] py-[2.4cqw] text-[clamp(10px,3.5cqw,13px)] leading-snug shadow-xs',
            bubble.from === 'user'
              ? 'self-end rounded-ee-[1.2cqw] bg-action-primary text-text-inverse'
              : 'self-start rounded-es-[1.2cqw] bg-surface text-text',
          )}
        >
          {bubble.text}
        </div>
      ))}
    </div>
  )
}
