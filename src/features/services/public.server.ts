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

async function listServices(locale: ContentLocale): Promise<readonly ServiceSummary[]> {
  return (await publishedServices(db, locale)).map((item) => summary(item, locale))
}

async function getService(slug: string, locale: ContentLocale): Promise<ServiceDetail | null> {
  const item = (await publishedServices(db, locale)).find((s) => s.slug === slug)
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

export const serviceReads = {
  listServices: cachedRead('services', listServices, (l) => [cacheTags.services(l)]),
  getService: cachedRead('service', getService, (slug, l) => [
    cacheTags.services(l),
    ...(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? [cacheTags.service(slug, l)] : []),
  ]),
} satisfies Partial<PublicContentSource>
