import type { MetadataRoute } from 'next'
import { buildRobotsRules, isIndexable } from '@/lib/robots-policy'
import { getSiteUrl } from '@/lib/site-url'

// The proxy matcher excludes `robots.txt` and `sitemap.xml`, so these two are served straight by
// Next.js and never pass through next-intl. They are generated at build, like the layout's
// `robots` meta tag, so both change together with a new deployment.
export default function robots(): MetadataRoute.Robots {
  return buildRobotsRules({ indexable: isIndexable(), siteUrl: getSiteUrl() })
}
