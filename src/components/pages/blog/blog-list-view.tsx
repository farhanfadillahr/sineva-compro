import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { Reveal } from '@/components/motion/Reveal'
import { Container, Section, SectionHeader, type ActionLinkComponent } from '@/components/ui'
import { cx } from '@/components/ui/cx'
import { sectionToneClasses } from '@/components/ui/section'
import { PostCard } from '../home/post-card'
import { BlogEmptyState } from './blog-empty-state'
import type { BlogLabels } from './blog-labels'
import { BLOG_HREFS, type BlogListModel } from './blog-model'
import { BlogPagination } from './blog-pagination'
import { CategoryFilter } from './category-filter'
import { FeaturedPost } from './featured-post'

export type BlogListViewProps = {
  model: BlogListModel
  labels: BlogLabels
  /** Localised link component for internal links (next-intl's Link through the layout's AppLink). */
  linkComponent?: ActionLinkComponent
}

/**
 * The Blog list body (page-patterns.md 2.6): h1 and intro, the featured latest article, the
 * category filter, a grid of `card-post` and pagination, or the empty state. A pure function of
 * the model: the page loads the content, this renders it.
 *
 * The featured card and the grid never show the same article (the model leaves it out of the
 * grid). On a filtered list there is no featured card.
 */
export function BlogListView({ model, labels, linkComponent }: BlogListViewProps) {
  const { page, featured, posts, locale, pagination } = model
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      {/* A shorter band than a hero Section: the title and one line of intro do not need 8rem. */}
      <div
        data-blog-section="header"
        data-tone="aurora"
        className={cx(sectionToneClasses.aurora, 'py-12 lg:py-16')}
      >
        <Container>
          <SectionHeader titleAs="h1" title={page.title} lead={page.intro} />
        </Container>
      </div>

      <Section tone="canvas" data-blog-section="listing" className="pt-10 lg:pt-12">
        <Container className="flex flex-col gap-10">
          {featured ? (
            <Reveal variant="depth">
              <FeaturedPost
                post={featured}
                locale={locale}
                latestLabel={labels.latestBadge}
                readLabel={labels.readArticle}
                linkComponent={linkComponent}
              />
            </Reveal>
          ) : null}

          {model.categories.length > 0 ? (
            <CategoryFilter
              label={labels.categoryFilterLabel}
              allLabel={labels.allCategories}
              categories={model.categories}
              active={model.activeCategory}
              linkComponent={linkComponent}
            />
          ) : null}

          {model.isEmpty ? (
            <BlogEmptyState
              title={labels.emptyTitle}
              body={page.emptyState}
              ctaLabel={labels.emptyCta}
              ctaHref={BLOG_HREFS.contact}
              linkComponent={linkComponent}
            />
          ) : null}

          {posts.length > 0 ? (
            <ul data-blog-grid="" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Reveal as="li" variant="depth" key={post.slug} className="flex">
                  <PostCard post={post} locale={locale} linkComponent={linkComponent} />
                </Reveal>
              ))}
            </ul>
          ) : null}

          <BlogPagination
            label={labels.paginationLabel}
            previousLabel={labels.previousPage}
            nextLabel={labels.nextPage}
            pageLabel={labels.pageLink}
            category={model.activeCategory}
            page={pagination.page}
            totalPages={pagination.totalPages}
            linkComponent={linkComponent}
          />
        </Container>
      </Section>
    </main>
  )
}
