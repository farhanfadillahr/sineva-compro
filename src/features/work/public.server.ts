import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { ListWorkInput, PublicContentSource } from '../content/public'
import type {
  ContentLocale,
  MediaAsset,
  SeoFields,
  WorkDetail,
  WorkProjectType,
  WorkSummary,
} from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { resolveMediaFields } from '../cms/media.server'
import { isPreviewRequest } from '../cms/preview.server'
import { workConfig } from '../documents/configs'
import { publicDocuments } from '../documents/service.server'

async function allWork(locale: ContentLocale, preview: boolean): Promise<WorkDetail[]> {
  const documents = await publicDocuments(db, 'work', locale, preview)
  return Promise.all(
    documents.map(async (doc) => {
      const data = (await resolveMediaFields(db, workConfig.schema, doc.data, locale)) as Record<
        string,
        unknown
      >
      return {
        slug: doc.slug,
        locale,
        title: data.title as string,
        summary: data.summary as string,
        projectType: data.projectType as WorkProjectType,
        cover: (data.cover as MediaAsset | null) ?? null,
        stack: data.stack as string[],
        serviceSlug: (data.serviceSlug as string | null) ?? null,
        featured: data.featured as boolean,
        challenge: data.challenge as string,
        solution: data.solution as string,
        result: data.result as string,
        // A gallery image without a published file or alt text is left out, not shown broken.
        gallery: (data.gallery as (MediaAsset | null)[]).filter((m): m is MediaAsset => !!m),
        demoUrl: (data.demoUrl as string | null) ?? null,
        seo: data.seo as SeoFields,
      }
    }),
  )
}

function summaryOf(work: WorkDetail): WorkSummary {
  const { slug, locale, title, summary, projectType, cover, stack, serviceSlug, featured } = work
  return { slug, locale, title, summary, projectType, cover, stack, serviceSlug, featured }
}

async function listWorkFrom(input: ListWorkInput, preview: boolean) {
  return (await allWork(input.locale, preview))
    .filter(
      (item) =>
        (input.service === undefined || item.serviceSlug === input.service) &&
        (input.featured === undefined || item.featured === input.featured),
    )
    .map(summaryOf)
}

const cachedList = cachedRead(
  'work',
  (input: ListWorkInput) => listWorkFrom(input, false),
  (input) => [cacheTags.work(input.locale)],
)
const cachedItem = cachedRead(
  'work-item',
  async (slug: string, locale: ContentLocale) =>
    (await allWork(locale, false)).find((w) => w.slug === slug) ?? null,
  (slug, locale) => [
    cacheTags.work(locale),
    ...(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? [cacheTags.workItem(slug, locale)] : []),
  ],
)

export const workReads = {
  async listWork(input: ListWorkInput) {
    return (await isPreviewRequest()) ? listWorkFrom(input, true) : cachedList(input)
  },
  async getWork(slug: string, locale: ContentLocale) {
    if (await isPreviewRequest())
      return (await allWork(locale, true)).find((w) => w.slug === slug) ?? null
    return cachedItem(slug, locale)
  },
} satisfies Partial<PublicContentSource>
