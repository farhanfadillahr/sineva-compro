import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { PublicContentSource } from '../content/public'
import type {
  CardItem,
  ContentLocale,
  IconKey,
  PoseKey,
  SeoFields,
  ServiceDetail,
  ServiceSummary,
  StepItem,
} from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { isPreviewRequest } from '../cms/preview.server'
import { previewStateFor } from '../preview/service.server'
import { resolveMediaFields } from '../cms/media.server'
import { serviceLocaleSchema } from './fields'
import { publishedServices } from './service.server'

type Published = Awaited<ReturnType<typeof publishedServices>>[number]

function summary(item: Published, locale: ContentLocale): ServiceSummary {
  return {
    slug: item.slug,
    locale,
    title: item.local.title as string,
    summary: item.local.summary as string,
    icon: item.global.icon as IconKey,
    pose: item.global.pose as PoseKey,
  }
}

/** Published services, with the previewed service's unsaved state swapped in (CPR-88). */
async function servicesFor(locale: ContentLocale, preview: boolean): Promise<Published[]> {
  const items = await publishedServices(db, locale)
  if (!preview) return items
  const state = await previewStateFor('service', locale)
  if (!state) return items
  const data = state.data as {
    slug: string
    global: Record<string, unknown>
    local: Record<string, unknown>
  }
  const previewed: Published = {
    id: state.target,
    slug: data.slug,
    global: data.global,
    local: data.local,
  }
  return items.some((item) => item.id === state.target)
    ? items.map((item) => (item.id === state.target ? previewed : item))
    : [...items, previewed]
}

async function listServices(
  locale: ContentLocale,
  preview = false,
): Promise<readonly ServiceSummary[]> {
  return (await servicesFor(locale, preview)).map((item) => summary(item, locale))
}

async function getService(
  slug: string,
  locale: ContentLocale,
  preview = false,
): Promise<ServiceDetail | null> {
  const item = (await servicesFor(locale, preview)).find((s) => s.slug === slug)
  if (!item) return null
  const local = (await resolveMediaFields(db, serviceLocaleSchema, item.local, locale)) as Record<
    string,
    unknown
  >
  return {
    ...summary(item, locale),
    problems: local.problems as CardItem[],
    deliverables: local.deliverables as string[],
    process: local.process as StepItem[],
    tools: item.global.tools as string[],
    ctaLabel: local.ctaLabel as string,
    seo: local.seo as SeoFields,
  }
}

const cachedList = cachedRead(
  'services',
  (l: ContentLocale) => listServices(l),
  (l) => [cacheTags.services(l)],
)
const cachedItem = cachedRead(
  'service',
  (slug: string, l: ContentLocale) => getService(slug, l),
  (slug, l) => [
    cacheTags.services(l),
    ...(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? [cacheTags.service(slug, l)] : []),
  ],
)

export const serviceReads = {
  async listServices(locale: ContentLocale) {
    return (await isPreviewRequest()) ? listServices(locale, true) : cachedList(locale)
  },
  async getService(slug: string, locale: ContentLocale) {
    return (await isPreviewRequest()) ? getService(slug, locale, true) : cachedItem(slug, locale)
  },
} satisfies Partial<PublicContentSource>
