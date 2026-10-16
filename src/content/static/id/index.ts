import type { Category, PostDetail, PostSummary } from '../../../features/content/types'
import { team, work, workDetails } from '../empty'
import { capabilities, industries } from './capabilities'
import { faq } from './faq'
import { pages } from './pages'
import { serviceDetails, services } from './services'
import { siteSettings } from './site-settings'

// No article is written in Indonesian yet. The blog stays empty in `id` (its index shows the empty
// state) instead of mixing English articles into Indonesian pages; editors publish Indonesian
// posts in the CMS. Categories follow posts, so there are none either.
const posts: PostSummary[] = []
const postDetails: PostDetail[] = []
const categories: Category[] = []

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
