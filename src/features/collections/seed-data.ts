/**
 * Launch and demo rows for the ordered collections. Kept apart from `configs.ts` so admin client
 * bundles never include the static site content.
 */
import { staticContent } from '../../content/static/source'
import type { CollectionName } from './configs'

export type SeedRow = { key: string; global: object; local: object }

/** Stable kebab-case key from a question, for launch rows that had no key. */
export function keyFromText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

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
  faq: {
    launch: () =>
      staticContent.faq.map((entry) => ({
        key: keyFromText(entry.item.question),
        global: { tags: [...entry.tags] },
        local: { question: entry.item.question, answer: entry.item.answer },
      })),
    demo: [
      {
        key: 'demo-faq',
        global: { tags: ['home'] },
        local: {
          question: '[Demo] Is this a demo question?',
          answer: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Yes. Demo FAQ for development and tests.' }],
              },
            ],
          },
        },
      },
    ],
  },
  // No team member has agreed to be listed yet, so the launch has none.
  team: {
    launch: () =>
      staticContent.team.map((member) => ({
        key: keyFromText(member.name),
        global: {
          name: member.name,
          photo: member.photo
            ? {
                kind: 'static',
                url: member.photo.url,
                width: member.photo.width,
                height: member.photo.height,
                alt: member.photo.alt,
              }
            : null,
          socialUrl: member.socialUrl,
          showOnAbout: true,
        },
        local: { role: member.role, bio: member.bio },
      })),
    demo: [
      {
        key: 'demo-team-member',
        global: { name: '[Demo] Team member', photo: null, socialUrl: null, showOnAbout: false },
        local: { role: 'Demo role', bio: 'Demo profile for development and tests.' },
      },
    ],
  },
  categories: {
    launch: () =>
      staticContent.categories.map((c) => ({ key: c.slug, global: {}, local: { name: c.name } })),
    demo: [{ key: 'demo-category', global: {}, local: { name: '[Demo] Category' } }],
  },
}
