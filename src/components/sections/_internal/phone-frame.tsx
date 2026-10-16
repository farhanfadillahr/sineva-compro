import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/components/ui/cx'
import type { MockupBubble } from '@/features/content/types'

type PhoneFrameSize = 'sm' | 'md' | 'lg'

// Screen heights. `sm` fits a half-height bento tile, `lg` fills a 2x2 featured tile.
const SCREEN_HEIGHT: Record<PhoneFrameSize, string> = {
  sm: 'min-h-56',
  md: 'min-h-88',
  lg: 'min-h-88 lg:min-h-144',
}

type PhoneFrameProps = Omit<ComponentProps<'div'>, 'children'> & {
  children: ReactNode
  size?: PhoneFrameSize
}

/**
 * Phone frame placeholder with an HTML screen (`device-phone`, components.md section 10). The
 * pre-rendered frame asset is not available yet; this draws the same silhouette in CSS. Screens
 * are built as HTML so nothing that needs translation is baked into an image (page-patterns.md
 * section 4). The whole mockup is decorative: the card around it already says the same in text,
 * so it is hidden from assistive tech.
 *
 * Radii follow the nested radius rule (tokens.md section 4): outer 36 px, padding 8 px, inner 28 px.
 */
export function PhoneFrame({ size = 'md', className, children, ...rest }: PhoneFrameProps) {
  return (
    <div
      {...rest}
      data-slot="phone-frame"
      aria-hidden="true"
      className={cx(
        'relative mx-auto w-full max-w-70 rounded-2xl bg-action-dark p-2 shadow-lg',
        className,
      )}
    >
      <div
        className={cx(
          'flex flex-col gap-2 overflow-hidden rounded-xl bg-surface p-3',
          SCREEN_HEIGHT[size],
        )}
      >
        <span className="mx-auto mb-1 h-1.5 w-14 shrink-0 rounded-pill bg-border-strong" />
        {children}
      </div>
    </div>
  )
}

type ChatBubblesProps = ComponentProps<'div'> & {
  bubbles: readonly Pick<MockupBubble, 'from' | 'text'>[]
}

/** Chat bubbles for a phone screen: the user's request on the right, Sino's answer on the left. */
export function ChatBubbles({ bubbles, className, ...rest }: ChatBubblesProps) {
  return (
    <div {...rest} className={cx('flex flex-col gap-2', className)}>
      {bubbles.map((bubble, index) => (
        <div
          key={index}
          data-slot="chat-bubble"
          data-from={bubble.from}
          className={cx(
            'max-w-[85%] rounded-md px-3 py-2 text-micro',
            bubble.from === 'user'
              ? 'self-end rounded-ee-xs bg-action-primary text-text-inverse'
              : 'self-start rounded-es-xs bg-canvas-alt text-text',
          )}
        >
          {bubble.text}
        </div>
      ))}
    </div>
  )
}
