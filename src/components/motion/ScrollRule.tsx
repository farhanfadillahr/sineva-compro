import type { ComponentPropsWithoutRef } from 'react'
import styles from './ScrollRule.module.css'

/**
 * A hairline that draws with scroll under a section header (motion.md 4.1). Decorative only.
 * Server component: the motion is CSS, see ScrollRule.module.css. Use it where a section is a
 * long grid and the line helps the eye find where the content starts; most sections need none.
 */
export function ScrollRule({
  className,
  ...rest
}: Omit<ComponentPropsWithoutRef<'span'>, 'children'>) {
  return (
    <span
      {...rest}
      data-scroll-rule=""
      aria-hidden="true"
      className={[styles.rule, className].filter(Boolean).join(' ')}
    />
  )
}
