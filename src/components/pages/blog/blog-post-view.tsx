import { RichText } from '@/components/content/rich-text'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { Reveal } from '@/components/motion/Reveal'
import { FinalCta } from '@/components/sections'
import { serializeJsonLd } from '@/components/sections/_internal/faq'
import { Badge, Container, Section, SectionHeader, type ActionLinkComponent } from '@/components/ui'
import { cx } from '@/components/ui/cx'
import { sectionToneClasses } from '@/components/ui/section'
import { whatsappHrefFor } from '@/lib/whatsapp'
import { poseImage } from '../home/poses'
import { PostCard } from '../home/post-card'
import { Breadcrumb } from '../services/breadcrumb'
import { buildBreadcrumbJsonLd } from '../services/services-json-ld'
import { formatDate, formatMinutes } from './blog-format'
import { buildBlogPostingJsonLd } from './blog-json-ld'
import type { BlogLabels } from './blog-labels'
import { BLOG_HREFS, BLOG_RESERVED_IDS, blogPostHref, type BlogPostModel } from './blog-model'
import { PostCover } from './post-cover'
import { ShareButtons } from './share-buttons'
import { TableOfContents } from './table-of-contents'

export type BlogPostViewProps = {
  model: BlogPostModel
  labels: BlogLabels
  /** Public site origin: share links, the copied link and the JSON-LD urls are absolute. */
  siteUrl: URL
  /** Localised link component for internal links (next-intl's Link through the layout's AppLink). */
  linkComponent?: ActionLinkComponent
}

// Anchors of this page. They are also reserved from heading ids (BLOG_RESERVED_IDS).
const SHARE_ID = 'article-share'
const RELATED_ID = 'related-posts'
const TOC_ID = 'article-toc'

/**
 * The article body (page-patterns.md 2.6): breadcrumb, h1 left and cover right, author, dates
 * and read time, a sticky table of contents on desktop, the 720 px body from the shared rich
 * text renderer, share buttons, related articles and the closing call to action.
 *
 * Structured data: BlogPosting and BreadcrumbList. The table of contents and the body are built
 * from the same sanitised tree and the same reserved ids, so every entry points at a heading
 * that exists.
 */
export function BlogPostView({ model, labels, siteUrl, linkComponent }: BlogPostViewProps) {
  const { post, settings, related, headings, locale, readingMinutes } = model
  const { article } = labels
  const url = new URL(blogPostHref(post.slug), siteUrl).toString()
  const whatsappHref = whatsappHrefFor(settings?.whatsapp, { kind: 'general' })
  const hasToc = headings.length > 0

  const structuredData = [
    buildBlogPostingJsonLd({ post, settings, siteUrl }),
    buildBreadcrumbJsonLd(
      [
        { name: labels.homeCrumb, path: BLOG_HREFS.home },
        { name: labels.blogCrumb, path: BLOG_HREFS.blog },
        { name: post.title, path: blogPostHref(post.slug) },
      ],
      siteUrl.origin,
    ),
  ]

  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      <Breadcrumb
        label={labels.breadcrumbLabel}
        items={[
          { label: labels.homeCrumb, href: BLOG_HREFS.home },
          { label: labels.blogCrumb, href: BLOG_HREFS.blog },
        ]}
        current={post.title}
        linkComponent={linkComponent}
      />

      <div
        data-blog-header=""
        data-tone="aurora"
        className={cx(sectionToneClasses.aurora, 'mt-4 py-10 lg:py-14')}
      >
        <Container size="wide">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div
              className={cx(
                'flex flex-col items-start gap-5',
                post.cover ? 'lg:col-span-7' : 'lg:col-span-12',
              )}
            >
              {post.category ? <Badge tone="brand">{post.category.name}</Badge> : null}
              <h1 className="text-h1 text-balance text-text">{post.title}</h1>
              <p className="max-w-[60ch] text-lead text-pretty text-text-secondary">
                {post.excerpt}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-text-secondary">
                {post.author ? (
                  <span className="font-medium text-text">
                    {article.byAuthor(post.author.name)}
                  </span>
                ) : null}
                <span>
                  {article.published}{' '}
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
                </span>
                {post.updatedAt ? (
                  <span>
                    {article.updated}{' '}
                    <time dateTime={post.updatedAt}>{formatDate(post.updatedAt, locale)}</time>
                  </span>
                ) : null}
                <span>{formatMinutes(readingMinutes, locale)}</span>
              </p>
            </div>
            {post.cover ? (
              <div className="lg:col-span-5">
                <div className="aspect-video overflow-hidden rounded-xl shadow-md [border:var(--border-hairline)]">
                  <PostCover cover={post.cover} sizes="(min-width: 1024px) 40vw, 100vw" priority />
                </div>
              </div>
            ) : null}
          </div>
        </Container>
      </div>

      <div data-tone="canvas" className="bg-canvas py-12 lg:py-16">
        <Container>
          <div
            className={cx(
              'lg:grid lg:justify-center lg:gap-x-16',
              hasToc ? 'lg:grid-cols-[14rem_minmax(0,45rem)]' : 'lg:grid-cols-[minmax(0,45rem)]',
            )}
          >
            {hasToc ? (
              // Desktop only: below 1024 px the page is a single reading column and the list
              // would push the article down the screen.
              <aside id={TOC_ID} data-blog-toc="" className="hidden lg:block">
                <div className="sticky top-28">
                  <TableOfContents
                    label={article.tocLabel}
                    title={article.tocTitle}
                    headings={headings}
                  />
                </div>
              </aside>
            ) : null}
            <div data-blog-body="" className="mx-auto w-full min-w-0 max-w-(--container-text)">
              <RichText
                document={post.body}
                reservedIds={BLOG_RESERVED_IDS}
                linkComponent={linkComponent}
              />
              <div
                id={SHARE_ID}
                className="mt-12 flex flex-col gap-4 pt-8 [border-top:var(--border-hairline)]"
              >
                <p className="text-label text-text">{article.shareTitle}</p>
                <ShareButtons
                  title={post.title}
                  url={url}
                  labels={{
                    groupLabel: article.shareTitle,
                    whatsapp: article.shareWhatsapp,
                    linkedin: article.shareLinkedin,
                    copyLink: article.copyLink,
                    linkCopied: article.linkCopied,
                    copyFailed: article.copyFailed,
                  }}
                />
              </div>
            </div>
          </div>
        </Container>
      </div>

      {related.length > 0 ? (
        <Section tone="alt" id={RELATED_ID} data-blog-related="">
          <Container className="flex flex-col gap-12">
            <Reveal>
              <SectionHeader title={article.relatedTitle} />
            </Reveal>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {related.map((item, index) => (
                <Reveal as="li" key={item.slug} index={index} className="flex">
                  <PostCard post={item} locale={locale} linkComponent={linkComponent} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <FinalCta
        headline={article.finalCtaHeadline}
        body={article.finalCtaBody}
        primaryCta={{ label: article.finalCtaButton, href: BLOG_HREFS.contact }}
        whatsappCta={whatsappHref ? { label: article.chatOnWhatsapp, href: whatsappHref } : null}
        image={poseImage('wave')}
        linkComponent={linkComponent}
      />

      {structuredData.map((data) => (
        <script
          key={data['@type']}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
        />
      ))}
    </main>
  )
}
