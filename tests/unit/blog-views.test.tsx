import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlogListView } from '@/components/pages/blog/blog-list-view'
import { blogLabelsFromMessages } from '@/components/pages/blog/blog-labels'
import {
  loadBlogListModel,
  loadBlogPostModel,
  type BlogListModel,
  type BlogPostModel,
} from '@/components/pages/blog/blog-model'
import { BlogPostView } from '@/components/pages/blog/blog-post-view'
import { formatDate } from '@/components/pages/blog/blog-format'
import type { PostDetail } from '@/features/content/types'
import { createStaticContentSource } from '../../src/content/static'
import en from '../../messages/en.json'
import { many, sourceOf } from './blog-test-utils'
import { installIntersectionObserver } from './motion-test-utils'
import { criticalAxeViolations, stubMedia } from './sections-test-utils'

const labels = blogLabelsFromMessages(en)
const SITE = new URL('https://sineva.example')
const STATIC = createStaticContentSource()
const LATEST = 'where-to-start-with-ai-in-a-small-business'

beforeEach(() => {
  stubMedia({})
  installIntersectionObserver()
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
})

const jsonLd = () =>
  Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  ).map((script) => JSON.parse(script.textContent!) as Record<string, unknown>)

// ---------------------------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------------------------

describe('BlogListView', () => {
  const list = async (
    source = STATIC,
    query: Record<string, string> = {},
  ): Promise<BlogListModel> => (await loadBlogListModel(source, 'en', query))!
  const renderList = (model: BlogListModel) =>
    render(<BlogListView model={model} labels={labels} />)

  it('has one h1 from the page content, its intro, and the main landmark target', async () => {
    const model = await list()
    const { container } = renderList(model)
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]!.textContent).toBe(model.page.title)
    expect(container.textContent).toContain(model.page.intro)
    const main = container.querySelector('main')!
    expect(main.id).toBe('main-content')
    expect(main.getAttribute('tabindex')).toBe('-1')
  })

  it('features the latest article as a wide card with category, title, excerpt and date', async () => {
    const model = await list()
    const { container } = renderList(model)
    const featured = container.querySelector<HTMLElement>('[data-blog-featured]')!
    const post = model.featured!
    const heading = within(featured).getByRole('heading', { level: 2 })
    expect(heading.textContent).toBe(post.title)
    expect(within(featured).getByRole('link', { name: post.title }).getAttribute('href')).toBe(
      `/blog/${post.slug}`,
    )
    expect(featured.textContent).toContain(post.category!.name)
    expect(featured.textContent).toContain(post.excerpt)
    expect(featured.querySelector('time')?.getAttribute('datetime')).toBe(post.publishedAt)
    expect(featured.textContent).toContain(formatDate(post.publishedAt, 'en'))
    // The cover kit sits in the card.
    expect(featured.querySelector('[data-slot="cover-kit"]')).not.toBeNull()
  })

  it('does not repeat the featured article in the grid', async () => {
    const { container } = renderList(await list())
    const links = Array.from(container.querySelectorAll('a')).filter(
      (a) => a.getAttribute('href') === `/blog/${LATEST}`,
    )
    expect(links).toHaveLength(1)
    expect(container.querySelectorAll('[data-blog-grid] article')).toHaveLength(2)
  })

  it('renders cards with category, date and read time, and clamps titles to two lines', async () => {
    const { container } = renderList(await list())
    for (const card of container.querySelectorAll<HTMLElement>('[data-blog-grid] article')) {
      expect(card.querySelector('time')).not.toBeNull()
      expect(card.textContent).toMatch(/\d+\s?min/)
      expect(card.querySelector('[data-tone="brand"]')).not.toBeNull()
      expect(card.querySelector('h3')!.className).toContain('line-clamp-2')
    }
  })

  it('renders a chip filter row driven by the URL, with All selected by default', async () => {
    const model = await list()
    renderList(model)
    const nav = screen.getByRole('navigation', { name: labels.categoryFilterLabel })
    const links = within(nav).getAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual([
      labels.allCategories,
      ...model.categories.map((c) => c.name),
    ])
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/blog',
      ...model.categories.map((c) => `/blog?category=${c.slug}`),
    ])
    expect(links[0]!.getAttribute('aria-current')).toBe('true')
    expect(links.slice(1).every((a) => a.getAttribute('aria-current') === null)).toBe(true)
  })

  it('marks the chip of the active category and hides the featured card', async () => {
    const model = await list(STATIC, { category: 'ai-basics' })
    const { container } = renderList(model)
    const nav = screen.getByRole('navigation', { name: labels.categoryFilterLabel })
    const current = within(nav)
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'true')
    expect(current.map((a) => a.textContent)).toEqual(['AI basics'])
    expect(container.querySelector('[data-blog-featured]')).toBeNull()
    expect(container.querySelectorAll('[data-blog-grid] article')).toHaveLength(1)
  })

  it('hides the pagination when everything fits on one page', async () => {
    renderList(await list())
    expect(screen.queryByRole('navigation', { name: labels.paginationLabel })).toBeNull()
  })

  it('shows numbered pagination with Previous and Next for more than 9 cards', async () => {
    const model = await list(sourceOf(many(20)), { page: '2' })
    renderList(model)
    const nav = screen.getByRole('navigation', { name: labels.paginationLabel })
    expect(within(nav).getByRole('link', { name: labels.previousPage }).getAttribute('href')).toBe(
      '/blog',
    )
    expect(within(nav).getByRole('link', { name: labels.nextPage }).getAttribute('href')).toBe(
      '/blog?page=3',
    )
    const current = within(nav).getByText('2')
    expect(current.getAttribute('aria-current')).toBe('page')
    expect(
      within(nav)
        .getByRole('link', { name: labels.pageLink(3) })
        .getAttribute('href'),
    ).toBe('/blog?page=3')
  })

  it('has no Previous link on the first page and no Next link on the last', async () => {
    const first = renderList(await list(sourceOf(many(20)), { page: '1' }))
    expect(screen.queryByRole('link', { name: labels.previousPage })).toBeNull()
    expect(screen.getByRole('link', { name: labels.nextPage })).not.toBeNull()
    first.unmount()
    renderList(await list(sourceOf(many(20)), { page: '3' }))
    expect(screen.queryByRole('link', { name: labels.nextPage })).toBeNull()
    expect(screen.getByRole('link', { name: labels.previousPage })).not.toBeNull()
  })

  it('keeps the category in the pagination links of a filtered list', async () => {
    renderList(await list(sourceOf(many(40)), { category: 'beta' }))
    const nav = screen.getByRole('navigation', { name: labels.paginationLabel })
    expect(within(nav).getByRole('link', { name: labels.nextPage }).getAttribute('href')).toBe(
      '/blog?category=beta&page=2',
    )
  })

  it('renders the empty state with Sino relaxed and a consultation CTA when there are no articles', async () => {
    const model = await list(sourceOf([]))
    const { container } = renderList(model)
    const empty = container.querySelector<HTMLElement>('[data-blog-empty]')!
    expect(empty.textContent).toContain(model.page.emptyState)
    expect(empty.querySelector('img')?.getAttribute('src')).toContain('sino-relaxed')
    // Decorative: the text next to Sino says it all.
    expect(empty.querySelector('img')?.getAttribute('alt')).toBe('')
    expect(within(empty).getByRole('link', { name: labels.emptyCta }).getAttribute('href')).toBe(
      '/contact',
    )
    expect(container.querySelector('[data-blog-featured]')).toBeNull()
    expect(container.querySelector('[data-blog-grid]')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('keeps the filter row on an empty category so the visitor can go elsewhere', async () => {
    const { container } = renderList(await list(sourceOf(many(4)), { category: 'empty' }))
    expect(container.querySelector('[data-blog-empty]')).not.toBeNull()
    expect(screen.getByRole('navigation', { name: labels.categoryFilterLabel })).not.toBeNull()
  })

  it('has no critical accessibility violations', async () => {
    const { container } = renderList(await list(sourceOf(many(20)), { page: '2' }))
    expect(await criticalAxeViolations(container)).toEqual([])
  })

  it('has no critical accessibility violations in the empty state', async () => {
    const { container } = renderList(await list(sourceOf([])))
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

// ---------------------------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------------------------

describe('BlogPostView', () => {
  const article = async (slug = LATEST, source = STATIC): Promise<BlogPostModel> =>
    (await loadBlogPostModel(source, slug, 'en'))!
  const renderPost = (model: BlogPostModel) =>
    render(<BlogPostView model={model} labels={labels} siteUrl={SITE} />)

  it('has one h1 (the title), and the main landmark target', async () => {
    const model = await article()
    const { container } = renderPost(model)
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]!.textContent).toBe(model.post.title)
    const main = container.querySelector('main')!
    expect(main.id).toBe('main-content')
    expect(main.getAttribute('tabindex')).toBe('-1')
  })

  it('does not render visual breadcrumbs', async () => {
    renderPost(await article())
    expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).toBeNull()
  })

  it('shows the cover, category, author, published date and read time', async () => {
    const model = await article()
    const { container } = renderPost(model)
    const header = container.querySelector<HTMLElement>('[data-blog-header]')!
    expect(header.querySelector('[data-slot="cover-kit"]')).not.toBeNull()
    expect(header.textContent).toContain(model.post.category!.name)
    expect(header.textContent).toContain(labels.article.byAuthor(model.post.author!.name))
    const time = header.querySelector('time')!
    expect(time.getAttribute('datetime')).toBe(model.post.publishedAt)
    expect(time.textContent).toBe(formatDate(model.post.publishedAt, 'en'))
    expect(header.textContent).toContain(`${model.readingMinutes} min`)
  })

  it('shows the updated date only when the article was edited', async () => {
    const model = await article()
    const unedited = renderPost(model)
    expect(unedited.container.textContent).not.toContain(labels.article.updated)
    unedited.unmount()
    const edited: PostDetail = { ...model.post, updatedAt: '2026-10-20T08:00:00.000Z' }
    const { container } = renderPost({ ...model, post: edited })
    expect(container.textContent).toContain(labels.article.updated)
    expect(
      Array.from(container.querySelectorAll('time')).map((t) => t.getAttribute('datetime')),
    ).toContain('2026-10-20T08:00:00.000Z')
  })

  it('renders the body in a 720 px column through the rich text renderer', async () => {
    const model = await article()
    const { container } = renderPost(model)
    const body = container.querySelector<HTMLElement>('[data-blog-body]')!
    expect(body.className).toContain('max-w-(--container-text)')
    expect(body.querySelectorAll('h2').length).toBeGreaterThan(3)
    expect(body.querySelectorAll('h1')).toHaveLength(0)
  })

  it('builds the table of contents from the headings, linked to the body ids', async () => {
    const model = await article()
    const { container } = renderPost(model)
    const toc = screen.getByRole('navigation', { name: labels.article.tocLabel })
    const links = within(toc).getAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual(model.headings.map((h) => h.text))
    for (const link of links) {
      const id = link.getAttribute('href')!.slice(1)
      expect(container.querySelector(`#${id}`), id).not.toBeNull()
    }
  })

  it('shows the table of contents on desktop only', async () => {
    const { container } = renderPost(await article())
    const aside = container.querySelector<HTMLElement>('[data-blog-toc]')!
    expect(aside.className).toMatch(/(^|\s)hidden(\s|$)/)
    expect(aside.className).toContain('lg:block')
  })

  it('leaves out the table of contents for an article without headings', async () => {
    const model = await article()
    const { container } = renderPost({ ...model, headings: [] })
    expect(container.querySelector('[data-blog-toc]')).toBeNull()
  })

  it('has share buttons with an encoded WhatsApp link, a LinkedIn link and copy link', async () => {
    const model = await article()
    renderPost(model)
    const group = screen.getByRole('group', { name: labels.article.shareTitle })
    const url = `https://sineva.example/blog/${model.post.slug}`
    const whatsapp = within(group).getByRole('link', { name: labels.article.shareWhatsapp })
    expect(new URL(whatsapp.getAttribute('href')!).searchParams.get('text')).toBe(
      `${model.post.title} ${url}`,
    )
    const linkedin = within(group).getByRole('link', { name: labels.article.shareLinkedin })
    expect(new URL(linkedin.getAttribute('href')!).searchParams.get('url')).toBe(url)
    expect(within(group).getByRole('button', { name: labels.article.copyLink })).not.toBeNull()
  })

  it('lists up to 3 related articles and never the article itself', async () => {
    const model = await article()
    const { container } = renderPost(model)
    const related = container.querySelector<HTMLElement>('[data-blog-related]')!
    expect(within(related).getByRole('heading', { level: 2 }).textContent).toBe(
      labels.article.relatedTitle,
    )
    const cards = related.querySelectorAll('article')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThanOrEqual(3)
    expect(related.querySelector(`a[href="/blog/${model.post.slug}"]`)).toBeNull()
  })

  it('leaves out the related section when there is nothing else to read', async () => {
    const model = await article()
    const { container } = renderPost({ ...model, related: [] })
    expect(container.querySelector('[data-blog-related]')).toBeNull()
  })

  it('ends with a consultation call to action', async () => {
    const model = await article()
    const { container } = renderPost(model)
    const cta = container.querySelector<HTMLElement>('#final-cta')!
    expect(within(cta).getByRole('heading', { level: 2 }).textContent).toBe(
      labels.article.finalCtaHeadline,
    )
    expect(
      within(cta).getByRole('link', { name: labels.article.finalCtaButton }).getAttribute('href'),
    ).toBe('/contact')
    expect(within(cta).getByRole('link', { name: labels.article.chatOnWhatsapp })).not.toBeNull()
  })

  it('emits BlogPosting and BreadcrumbList structured data with absolute urls', async () => {
    const model = await article()
    renderPost(model)
    const [posting, breadcrumb] = jsonLd() as [
      Record<string, unknown>,
      { itemListElement: { item: string }[] } & Record<string, unknown>,
    ]
    expect(posting['@type']).toBe('BlogPosting')
    expect(posting.url).toBe(`https://sineva.example/blog/${model.post.slug}`)
    expect(posting.headline).toBe(model.post.title)
    expect(breadcrumb['@type']).toBe('BreadcrumbList')
    expect(breadcrumb.itemListElement.map((entry) => entry.item)).toEqual([
      'https://sineva.example/',
      'https://sineva.example/blog',
      `https://sineva.example/blog/${model.post.slug}`,
    ])
  })

  it('has no critical accessibility violations', async () => {
    const { container } = renderPost(await article())
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})
