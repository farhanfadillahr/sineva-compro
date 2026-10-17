import { team, work, workDetails } from '../empty'
import { capabilities, industries } from './capabilities'
import { faq } from './faq'
import { pages } from './pages'
import { categories, postDetails, posts } from './posts'
import { serviceDetails, services } from './services'
import { siteSettings } from './site-settings'

/** The Indonesian launch content, same shape as the English `staticContent`. */
export const staticContentId = {
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
