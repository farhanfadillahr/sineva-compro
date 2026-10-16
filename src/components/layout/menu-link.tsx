import { cx, focusRing } from '@/components/ui/cx'
import { AppLink } from './app-link'
import { KeyedIcon } from './icons'
import type { MenuLink } from './nav-model'

/**
 * One dropdown or accordion entry: 36 px icon tile, title (15 px 600) and a one-line description
 * (13 px tertiary). The hover background snaps in over 60 ms and fades out over a longer time
 * (motion.md section 5), which is why the two transition durations differ.
 */
export function MenuLinkItem({
  item,
  current,
  onClick,
  className,
}: {
  item: MenuLink
  current?: 'page' | 'true'
  onClick?: () => void
  className?: string
}) {
  return (
    <AppLink
      href={item.href}
      aria-current={current}
      onClick={onClick}
      className={cx(
        'flex min-h-11 items-start gap-3 rounded-md p-3 text-text no-underline',
        'bg-transparent transition-colors duration-(--dur-base) ease-out hover:bg-canvas-alt hover:duration-(--dur-instant)',
        'motion-reduce:transition-none',
        focusRing,
        className,
      )}
    >
      <span className="mt-px flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-tint text-text-brand">
        <KeyedIcon name={item.icon} />
      </span>
      <span className="grid gap-0.5">
        <span className="text-[0.9375rem] leading-snug font-semibold">{item.title}</span>
        <span className="text-micro text-text-tertiary">{item.description}</span>
      </span>
    </AppLink>
  )
}
