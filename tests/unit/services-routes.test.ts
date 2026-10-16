import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import en from '../../messages/en.json'
import { staticContent } from '../../src/content/static'

vi.mock('next-intl/server', () => ({
  getMessages: async () => en,
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}))

const { default: ServicesListPage, generateMetadata: listMetadata } =
  await import('../../src/app/(public)/[locale]/services/page')
const {
  default: ServiceDetailPage,
  generateMetadata: detailMetadata,
  generateStaticParams,
} = await import('../../src/app/(public)/[locale]/services/[slug]/page')

const params = (slug: string, locale = 'en') => ({ params: Promise.resolve({ locale, slug }) })
const listParams = (locale = 'en') => ({ params: Promise.resolve({ locale }) })

async function digestOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    return (error as { digest?: string }).digest
  }
  return undefined
}
const NOT_FOUND = 'NEXT_HTTP_ERROR_FALLBACK;404'

describe('/services/[slug] static params', () => {
  it('prerenders one page per service of the content source, per locale', async () => {
    const slugs = staticContent.services.map((s) => s.slug)
    expect(slugs).toEqual(['ai-discovery', 'ai-build', 'ai-enablement'])
    expect(await generateStaticParams()).toEqual(slugs.map((slug) => ({ locale: 'en', slug })))
  })

  it('has no param for Web Development', async () => {
    const all = (await generateStaticParams()).map((p) => p.slug)
    expect(all).not.toContain('web-development')
  })
})

describe('/services/[slug] 404', () => {
  it('answers 404 for an unknown slug from the page and from generateMetadata', async () => {
    expect(await digestOf(ServiceDetailPage(params('unknown')))).toBe(NOT_FOUND)
    expect(await digestOf(detailMetadata(params('unknown')))).toBe(NOT_FOUND)
  })

  it('answers 404 for Web Development, which is not a service any more', async () => {
    expect(await digestOf(ServiceDetailPage(params('web-development')))).toBe(NOT_FOUND)
  })

  it('answers 404 for an unsupported locale', async () => {
    expect(await digestOf(ServiceDetailPage(params('ai-build', 'xx')))).toBe(NOT_FOUND)
    expect(await digestOf(ServicesListPage(listParams('xx')))).toBe(NOT_FOUND)
  })
})

describe('service detail page and metadata', () => {
  it.each(staticContent.serviceDetails)(
    'renders $slug and takes metadata from its SEO',
    async (service) => {
      const element = (await ServiceDetailPage(params(service.slug))) as ReactElement<{
        model: { service: { slug: string } }
        stickyPrimaryHref: string
      }>
      expect(element.props.model.service.slug).toBe(service.slug)
      // The sticky bar is a client component, so the page passes it a ready href.
      expect(element.props.stickyPrimaryHref).toBe(`/contact?service=${service.slug}`)
      const meta = await detailMetadata(params(service.slug))
      expect(meta.title).toEqual({ absolute: service.seo.metaTitle })
      expect(meta.description).toBe(service.seo.metaDescription)
    },
  )
})

describe('services list page and metadata', () => {
  it('renders the list view and takes metadata from the page SEO', async () => {
    const element = (await ServicesListPage(listParams())) as ReactElement<{
      model: { page: { key: string } }
    }>
    expect(element.props.model.page.key).toBe('servicesOverview')
    const meta = await listMetadata(listParams())
    expect(meta.title).toEqual({ absolute: staticContent.pages.servicesOverview.seo.metaTitle })
  })
})
