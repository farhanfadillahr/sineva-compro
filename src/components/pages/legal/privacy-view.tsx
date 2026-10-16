import { useTranslations } from 'next-intl'
import { RichText, extractHeadings } from '@/components/content/rich-text'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { Container, Section } from '@/components/ui'
import type { PrivacyPageContent } from '@/features/content/types'
import { formatLegalDate } from './privacy-outline'
import { PrivacyToc } from './privacy-toc'

export type PrivacyViewProps = Readonly<{ page: PrivacyPageContent }>

/**
 * /privacy-policy (page-patterns.md 2.9): a text page with a 720 px reading column, a sticky table
 * of contents from 1024 px up and the last updated date.
 *
 * The DOM order is title, contents, text. On a phone the contents is a short list before the text;
 * from `lg` it moves to a left column through grid placement, so keyboard order and reading order
 * match what a visitor sees.
 */
export function PrivacyView({ page }: PrivacyViewProps) {
  const t = useTranslations('Privacy')
  const reservedIds = ['main-content', 'privacy-title', 'privacy-toc']
  const headings = extractHeadings(page.body, { reservedIds })

  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      <Section tone="canvas">
        <Container
          // The grid only exists from lg: below it everything stacks in document order. The text
          // column is fixed to the 720 px reading width; the contents takes the rest of the row.
          className="flex flex-col gap-8 lg:grid lg:grid-cols-[15rem_minmax(0,var(--container-text))] lg:justify-center lg:gap-x-16 lg:gap-y-10"
        >
          <header className="lg:col-start-2 lg:row-start-1">
            <h1 id="privacy-title" className="text-h1 text-balance text-text">
              {t('title')}
            </h1>
            <p className="mt-4 text-label text-text-secondary">
              {t('lastUpdated')}:{' '}
              <time dateTime={page.effectiveDate}>{formatLegalDate(page.effectiveDate)}</time>
            </p>
          </header>

          <PrivacyToc
            headings={headings}
            label={t('tocLabel')}
            className="lg:col-start-1 lg:row-span-2 lg:row-start-1"
          />

          <article className="max-w-(--container-text) text-body text-text-secondary lg:col-start-2 lg:row-start-2">
            {/* The first block carries no top margin of its own: the grid gap spaces it. */}
            <RichText
              document={page.body}
              reservedIds={reservedIds}
              className="[&>:first-child]:mt-0"
            />
          </article>
        </Container>
      </Section>
    </main>
  )
}
