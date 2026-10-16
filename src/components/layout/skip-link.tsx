import { useTranslations } from 'next-intl'
import { cx, focusRing } from '@/components/ui/cx'

/** The skip link must stay the first focusable element. Its target is the page's own <main>. */
export const MAIN_CONTENT_ID = 'main-content'

export function SkipLink() {
  const t = useTranslations('Nav')
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className={cx(
        'sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]',
        'focus:flex focus:min-h-11 focus:items-center focus:rounded-sm focus:bg-action-dark focus:px-4',
        'focus:text-label focus:text-text-inverse focus:no-underline focus:shadow-lg',
        focusRing,
      )}
    >
      {t('skipToContent')}
    </a>
  )
}
