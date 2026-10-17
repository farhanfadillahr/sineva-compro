import { describe, expect, it } from 'vitest'
import { createStaticContentSource } from '@/content/static/source'
import { blogSitemapSource } from '@/lib/sitemap'
import { buildSiteJsonLd } from '@/lib/site-json-ld'
import { buildBlogPostMetadata } from '@/components/pages/blog/blog-metadata'

const staticContentSource = createStaticContentSource()

describe('launch SEO', () => {
  it('includes the blog and every published launch article', async () => {
    const entries = await blogSitemapSource({ content: staticContentSource, locale: 'en' })
    const posts = await staticContentSource.listPosts({ locale: 'en', page: 1, pageSize: 100 })
    expect(entries.map((entry) => entry.path)).toEqual([
      '/blog',
      ...posts.posts.map((post) => `/blog/${post.slug}`),
    ])
  })

  it('includes the Indonesian blog and its articles', async () => {
    const entries = await blogSitemapSource({ content: staticContentSource, locale: 'id' })
    expect(entries).toHaveLength(5)
  })

  it('leaves an empty blog out of the sitemap (a locale before its first article)', async () => {
    const empty = {
      ...staticContentSource,
      listPosts: async ({ page, pageSize }: { page: number; pageSize: number }) => ({
        posts: [],
        total: 0,
        page,
        pageSize,
      }),
    }
    expect(await blogSitemapSource({ content: empty, locale: 'id' })).toEqual([])
  })

  it('connects the site to the organization using only confirmed identity', () => {
    const data = buildSiteJsonLd(new URL('https://sineva.example'), null)
    expect(data['@graph'][1].publisher?.['@id']).toBe('https://sineva.example/#organization')
    expect(data['@graph'][0]).not.toHaveProperty('address')
  })

  it('shares the article title and image on Twitter', async () => {
    const post = await staticContentSource.getPost(
      'where-to-start-with-ai-in-a-small-business',
      'en',
    )
    const settings = await staticContentSource.getSiteSettings('en')
    expect(buildBlogPostMetadata(post!, settings).twitter).toMatchObject({
      title: post!.seo.metaTitle,
      description: post!.seo.metaDescription,
      card: 'summary_large_image',
    })
  })
})
