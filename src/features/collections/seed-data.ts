/**
 * Launch and demo rows for the ordered collections. Kept apart from `configs.ts` so admin client
 * bundles never include the static site content.
 */
import { staticContent } from '../../content/static/source'
import type { CollectionName } from './configs'

export type SeedRow = { key: string; global: object; local: object }

export const collectionSeedData: Record<
  CollectionName,
  { launch: () => readonly SeedRow[]; demo: readonly SeedRow[] }
> = {
  capabilities: {
    launch: () =>
      staticContent.capabilities.map((item) => ({
        key: item.key,
        global: { tint: item.tint, pose: item.pose, featured: item.featured },
        local: { title: item.title, body: item.body, mockupLines: [...item.mockupLines] },
      })),
    demo: [
      {
        key: 'demo-capability',
        global: { tint: 'mint', pose: 'whiteboard', featured: false },
        local: {
          title: '[Demo] Sino, plan next week',
          body: 'Demo capability for development and tests. Not real product copy.',
          mockupLines: ['[Demo] Sino, plan next week', 'Here is a draft plan.'],
        },
      },
    ],
  },
  businessTypes: {
    launch: () =>
      staticContent.industries.map((item) => ({
        key: item.key,
        global: {},
        local: { label: item.label, exampleDay: item.exampleDay },
      })),
    demo: [
      {
        key: 'demo-business-type',
        global: {},
        local: {
          label: '[Demo] Studio',
          exampleDay: 'Demo business type for development and tests.',
        },
      },
    ],
  },
}
