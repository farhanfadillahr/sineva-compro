/**
 * Realistic English fixtures for every public read function (the `en` locale). Landing component
 * tests import these, and the fixture source (`src/features/content/fixture-source.ts`) serves
 * them. They mirror what the future `demo` seed inserts (admin CMS plan section 4.1), so keep
 * both in step. Other locales deliberately have no fixture: they exercise the empty contract.
 */
import { capabilities, industries } from './capabilities'
import { faq } from './faq'
import { pages } from './pages'
import { postDetails, posts } from './posts'
import { serviceDetails, services } from './services'
import { siteSettings } from './site-settings'
import { categories, team } from './team'
import { workDetails, work } from './work'

export const publicFixtures = {
  siteSettings,
  pages,
  services,
  serviceDetails,
  capabilities,
  industries,
  faq,
  work,
  workDetails,
  posts,
  postDetails,
  categories,
  team,
} as const

export type { FaqFixture } from './faq'
