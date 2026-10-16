import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { PublicContentSource } from '../content/public'
import type {
  CapabilityTint,
  ContentLocale,
  Industry,
  PoseKey,
  ProductCapability,
} from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { publicCollection } from '../collections/service.server'

async function listCapabilities(locale: ContentLocale): Promise<readonly ProductCapability[]> {
  return (await publicCollection(db, 'capabilities', locale)).map(({ key, global, local }) => ({
    key,
    title: local.title as string,
    body: local.body as string,
    tint: global.tint as CapabilityTint,
    pose: global.pose as PoseKey,
    mockupLines: local.mockupLines as string[],
    featured: global.featured as boolean,
  }))
}

async function listIndustries(locale: ContentLocale): Promise<readonly Industry[]> {
  return (await publicCollection(db, 'businessTypes', locale)).map(({ key, local }) => ({
    key,
    label: local.label as string,
    exampleDay: local.exampleDay as string,
  }))
}

export const productReads = {
  listCapabilities: cachedRead('capabilities', listCapabilities, (l) => [
    cacheTags.capabilities(l),
  ]),
  listIndustries: cachedRead('industries', listIndustries, (l) => [cacheTags.industries(l)]),
} satisfies Partial<PublicContentSource>
