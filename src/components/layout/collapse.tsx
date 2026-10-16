import type { ReactNode } from 'react'
import { cx } from '@/components/ui/cx'

// Classes are written out in full so Tailwind can see them.
const alwaysOpenClasses = { md: 'md:grid-rows-[1fr]', lg: 'lg:grid-rows-[1fr]' } as const

/**
 * Height-animated disclosure region. The grid-template-rows 0fr to 1fr transition animates to
 * `auto` height without measuring content, so it needs no JS and no layout reads. Under reduced
 * motion the row simply snaps (motion.md section 9: accordion without height animation).
 *
 * A collapsed region is `inert` and `aria-hidden`: it is clipped to zero height, but its links
 * would otherwise stay in the tab order and the accessibility tree.
 *
 * `alwaysOpenAt` keeps the region open from a breakpoint up in CSS alone (footer columns), so the
 * server markup is right at every width before any JavaScript runs.
 */
export function Collapse({
  open,
  id,
  alwaysOpenAt,
  inert,
  className,
  children,
}: {
  open: boolean
  id?: string
  alwaysOpenAt?: keyof typeof alwaysOpenClasses
  /** Overrides the default (`!open`) when CSS, not state, keeps the region open. */
  inert?: boolean
  className?: string
  children: ReactNode
}) {
  const isInert = inert ?? !open
  return (
    <div
      id={id}
      data-open={open}
      inert={isInert}
      aria-hidden={isInert || undefined}
      className={cx(
        'grid transition-[grid-template-rows] duration-(--dur-med) ease-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        alwaysOpenAt && alwaysOpenClasses[alwaysOpenAt],
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
