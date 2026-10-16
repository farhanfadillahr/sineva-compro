import type { ComponentProps, ElementType } from 'react'
import { cx } from './cx'

export type ContainerSize = 'default' | 'wide' | 'text'

// --container-max (1240 px) for content, --container-max-wide (1360 px) for hero and full-bleed
// cards, --container-text (720 px) for articles. The side padding is the responsive --gutter
// (16, 24, 32 px). box-sizing is border-box (Tailwind preflight), so the max width includes it.
export const containerSizeClasses: Record<ContainerSize, string> = {
  default: 'max-w-(--container-max)',
  wide: 'max-w-(--container-max-wide)',
  text: 'max-w-(--container-text)',
}

type ContainerProps = ComponentProps<'div'> & {
  as?: 'div' | 'main' | 'header' | 'footer' | 'section' | 'article' | 'nav'
  size?: ContainerSize
}

export function Container({
  as = 'div',
  size = 'default',
  className,
  children,
  ...rest
}: ContainerProps) {
  const Tag = as as ElementType
  return (
    <Tag
      {...rest}
      className={cx('mx-auto w-full px-(--gutter)', containerSizeClasses[size], className)}
    >
      {children}
    </Tag>
  )
}
