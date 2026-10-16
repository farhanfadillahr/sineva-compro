import type { ComponentProps, ReactNode } from 'react'
import Image from 'next/image'
import { cx } from '@/components/ui/cx'
import type { MockupBubble } from '@/features/content/types'

type PhoneFrameSize = 'sm' | 'md' | 'lg'

// The transparent render comes from assets/phone/sineva-phone-source.glb. Keep the CSS screen
// separate so all visible text remains sharp and can follow the page locale/content.
const PHONE_WIDTH: Record<PhoneFrameSize, string> = {
  sm: 'max-w-58',
  md: 'max-w-70',
  lg: 'max-w-80 lg:max-w-96',
}

type PhoneFrameProps = Omit<ComponentProps<'div'>, 'children'> & {
  children: ReactNode
  size?: PhoneFrameSize
}

/**
 * Pre-rendered 3D phone frame with an HTML screen. Rendering the GLB once keeps each card light
 * and avoids adding more WebGL contexts; screen text stays live, sharp, and translatable.
 * The mockup is decorative because its card already carries the same task in text.
 */
export function PhoneFrame({ size = 'md', className, children, ...rest }: PhoneFrameProps) {
  return (
    <div
      {...rest}
      data-slot="phone-frame"
      aria-hidden="true"
      className={cx(
        'relative mx-auto aspect-[0.519] w-full overflow-visible drop-shadow-xl',
        PHONE_WIDTH[size],
        className,
      )}
    >
      <Image
        src="/phone/sineva-phone-frame.avif"
        alt=""
        fill
        unoptimized
        sizes="(min-width: 1024px) 28rem, 80vw"
        className="pointer-events-none object-fill"
      />
      <div className="absolute inset-0 flex flex-col gap-2 overflow-hidden bg-surface/95 px-[9%] pb-[10%] pt-[13%] [clip-path:polygon(7%_9%,91%_6%,94%_93%,8%_96%)]">
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
