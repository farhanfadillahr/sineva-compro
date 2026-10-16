'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { cx } from '@/components/ui/cx'
import { observeVisibility } from '@/lib/motion/in-view'
import { prefersReducedMotion } from '@/lib/motion/reduced-motion'
import type { MockupBubble } from '@/features/content/types'
import { CHAT_TIMING, chatTimeline } from './chat-sequence'
import styles from './chat-bubbles.module.css'

type ChatBubblesProps = ComponentProps<'div'> & {
  bubbles: readonly Pick<MockupBubble, 'from' | 'text'>[]
}

type View = { shown: number; typing: boolean }

/**
 * Chat bubbles for a phone screen, played as a live conversation while the phone is on screen:
 * the request lands, Sino types, the reply lands, then the finished chat holds and the loop
 * restarts. The server HTML and the first client render show the whole conversation (the final
 * state), so nothing is hidden without JavaScript; the loop only starts once the phone is at least
 * a third in view. Reduced motion keeps the static, complete conversation. Off screen the loop
 * stops, so idle cards cost nothing.
 */
export function ChatBubbles({ bubbles, className, ...rest }: ChatBubblesProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ shown: bubbles.length, typing: false })

  useEffect(() => {
    const el = ref.current
    if (!el || bubbles.length === 0 || prefersReducedMotion()) return
    const steps = chatTimeline(bubbles)
    const loop = CHAT_TIMING.loopLength(steps)
    let timers: ReturnType<typeof setTimeout>[] = []
    const stop = () => {
      timers.forEach(clearTimeout)
      timers = []
    }
    const play = () => {
      stop()
      for (const step of steps) {
        timers.push(setTimeout(() => setView({ shown: step.shown, typing: step.typing }), step.at))
      }
      timers.push(setTimeout(play, loop))
    }
    const disconnect = observeVisibility(
      el,
      (visible) => {
        if (visible) play()
        else {
          stop()
          setView({ shown: bubbles.length, typing: false })
        }
      },
      { threshold: 0.35 },
    )
    return () => {
      stop()
      disconnect()
    }
  }, [bubbles])

  return (
    <div ref={ref} {...rest} className={cx('flex flex-col gap-[2.6cqw]', className)}>
      {bubbles.slice(0, view.shown).map((bubble, index) => (
        <div
          key={index}
          data-slot="chat-bubble"
          data-from={bubble.from}
          className={cx(
            styles.bubble,
            'max-w-[82%] rounded-[4.5cqw] px-[3.6cqw] py-[2.4cqw] text-[clamp(10px,3.5cqw,13px)] leading-snug shadow-xs',
            bubble.from === 'user'
              ? 'origin-bottom-right self-end rounded-ee-[1.2cqw] bg-action-primary text-text-inverse'
              : 'origin-bottom-left self-start rounded-es-[1.2cqw] bg-surface text-text',
          )}
        >
          {bubble.text}
        </div>
      ))}
      {view.typing ? (
        <span
          data-slot="chat-typing"
          className={cx(
            styles.bubble,
            'flex origin-bottom-left gap-[1cqw] self-start rounded-[4.5cqw] rounded-es-[1.2cqw] bg-surface px-[3.6cqw] py-[3cqw] shadow-xs',
          )}
        >
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={cx(styles.dot, 'size-[1.6cqw] rounded-full bg-text-secondary')}
              style={{ animationDelay: `${dot * 160}ms` }}
            />
          ))}
        </span>
      ) : null}
    </div>
  )
}
