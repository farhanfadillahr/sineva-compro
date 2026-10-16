import { describe, expect, it, vi } from 'vitest'
import en from '../../messages/en.json'
import { staticContent } from '../../src/content/static'

vi.mock('next-intl/server', () => ({
  getMessages: async () => en,
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}))

// The localised link pulls in next-intl's client navigation, which does not load in the jsdom
// project. These tests look at what the routes decide (404, canonical, params), not at links.
vi.mock('@/components/layout/app-link', () => ({ AppLink: () => null }))

const { default: BlogListPage, generateMetadata: listMetadata } =
  await import('../../src/app/(public)/[locale]/blog/page')
const {
  default: BlogPostPage,
  generateMetadata: postMetadata,
  generateStaticParams,
} = await import('../../src/app/(public)/[locale]/blog/[slug]/page')

const listProps = (searchParams: Record<string, string | string[]> = {}, locale = 'en') => ({
  params: Promise.resolve({ locale }),
  searchParams: Promise.resolve(searchParams),
})
const postProps = (slug: string, locale = 'en') => ({
  params: Promise.resolve({ locale, slug }),
})

async function digestOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    return (error as { digest?: string }).digest
  }
  return undefined
}
const NOT_FOUND = 'NEXT_HTTP_ERROR_FALLBACK;404'

describe('/blog/[slug] static params', () => {
  it('prerenders one page per article of the content source', async () => {
    const slugs = staticContent.postDetails.map((post) => post.slug)
    expect(slugs).toHaveLength(3)
    expect(await generateStaticParams()).toEqual(slugs.map((slug) => ({ locale: 'en', slug })))
  })
})

describe('/blog/[slug] 404', () => {
  it('answers 404 for an unknown slug, from the page and from generateMetadata', async () => {
    expect(await digestOf(BlogPostPage(postProps('does-not-exist')))).toBe(NOT_FOUND)
    expect(await digestOf(postMetadata(postProps('does-not-exist')))).toBe(NOT_FOUND)
  })

  it('answers 404 for an unsupported locale', async () => {
    const slug = staticContent.postDetails[0]!.slug
    expect(await digestOf(BlogPostPage(postProps(slug, 'xx')))).toBe(NOT_FOUND)
  })

  it('renders a known article', async () => {
    const slug = staticContent.postDetails[0]!.slug
    expect(await BlogPostPage(postProps(slug))).toBeTruthy()
    const metadata = await postMetadata(postProps(slug))
    expect(metadata.alternates?.canonical).toBe(`/blog/${slug}`)
  })
})

describe('/blog', () => {
  it('renders the list', async () => {
    expect(await BlogListPage(listProps())).toBeTruthy()
  })

  it('answers 404 for an unsupported locale', async () => {
    expect(await digestOf(BlogListPage(listProps({}, 'xx')))).toBe(NOT_FOUND)
    expect(await digestOf(listMetadata(listProps({}, 'xx')))).toBe(NOT_FOUND)
  })

  it('points the canonical of a filtered list at /blog', async () => {
    const metadata = await listMetadata(listProps({ category: 'ai-basics' }))
    expect(metadata.alternates?.canonical).toBe('/blog')
  })

  it('does not fail on an unknown category and canonicalises it to /blog', async () => {
    expect(await BlogListPage(listProps({ category: 'nope' }))).toBeTruthy()
    const metadata = await listMetadata(listProps({ category: 'nope' }))
    expect(metadata.alternates?.canonical).toBe('/blog')
  })

  it('keeps the unfiltered list on /blog', async () => {
    const metadata = await listMetadata(listProps())
    expect(metadata.alternates?.canonical).toBe('/blog')
  })

  it('reads a repeated or malformed query without throwing', async () => {
    expect(
      await BlogListPage(listProps({ category: ['ai-basics', 'x'], page: 'abc' })),
    ).toBeTruthy()
    expect(await BlogListPage(listProps({ page: '999' }))).toBeTruthy()
  })
})
