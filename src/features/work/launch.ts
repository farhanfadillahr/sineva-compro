import { staticContent } from '../../content/static/source'
import { storedFromDto } from '../cms/fields'
import { withTopicTitle } from '../cms/seo-title'
import { workConfig } from '../documents/configs'

/** Stored snapshots of launch work items (none until real projects exist). */
export function launchWork() {
  return staticContent.workDetails.map((work) => {
    const { slug, locale, ...rest } = work
    void locale
    const data = { ...rest, seo: withTopicTitle(rest.seo) }
    return { slug, data: storedFromDto(workConfig.schema, data) as Record<string, unknown> }
  })
}

const demoSeo = (title: string) => ({
  metaTitle: title,
  metaDescription: 'Demo work item for development and tests. Not a real project.',
  ogImage: null,
  canonicalUrl: null,
  noindex: true,
})

/** Clearly marked demo projects (CMS plan 4.1): published on loopback databases only. */
export const demoWork = [1, 2, 3].map((n) => {
  const title = `[Demo] Internal demo project ${n}`
  return {
    slug: `demo-work-${n}`,
    data: {
      title,
      projectType: 'internal-demo',
      summary: 'Demo work item for development and tests. Not a real project.',
      cover: null,
      challenge: 'Demo challenge.',
      solution: 'Demo solution.',
      result: 'Demo result. No real metrics.',
      stack: ['Demo'],
      gallery: [],
      demoUrl: null,
      serviceSlug: null,
      featured: n === 1,
      seo: demoSeo(title),
    },
  }
})
