import { useTranslations } from 'next-intl'
import { cx } from '@/components/ui/cx'

/**
 * Symbol plus "Sineva" wordmark set as text (components.md section 2: Plus Jakarta Sans 600, 20 px,
 * tracking -0.02em, --teal-900). The text stands in for the horizontal lockup until design
 * exports it; swapping it is a change in this file only. The accessible name belongs to the
 * link around the logo, so the symbol is decorative.
 *
 * Plain <img> on purpose: next/image cannot optimise SVG, so it would add the loader and
 * placeholder machinery without shrinking anything.
 */
export function Logo({
  wordmark = true,
  className,
}: {
  /** The footer shows the symbol alone. */
  wordmark?: boolean
  className?: string
}) {
  const t = useTranslations('Brand')
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/sineva-symbol-original.svg"
        alt=""
        width={28}
        height={28}
        decoding="async"
        className="size-7 shrink-0"
      />
      {wordmark ? (
        // No semantic token exists for the deep brand teal (tokens.md 1.2 lists --teal-900 as the
        // wordmark colour), so the primitive is read directly.
        <span className="font-sans text-[1.25rem] leading-none font-semibold tracking-[-0.02em] text-(--teal-900)">
          {t('name')}
        </span>
      ) : null}
    </span>
  )
}
