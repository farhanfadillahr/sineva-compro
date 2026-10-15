import type { AuthorSummary, Category, TeamMember } from '../../../src/features/content/types'
import { media } from './helpers'

// Mirrors the future `demo` seed. Names are obviously fictional, with no emails in the DTO.
export const team: readonly TeamMember[] = [
  {
    name: 'Rina Demo',
    role: 'Founder',
    bio: 'Works with business owners to find a first step for AI.',
    photo: media('team-rina', 800, 800, 'Portrait of Rina Demo smiling', true),
    socialUrl: 'https://example.com/team/rina-demo',
  },
  {
    name: 'Budi Demo',
    role: 'AI engineer',
    bio: 'Builds and tests AI solutions on real work.',
    photo: media('team-budi', 800, 800, 'Portrait of Budi Demo at a desk'),
    socialUrl: null,
  },
  {
    name: 'Sari Demo',
    role: 'Designer',
    bio: null,
    photo: null,
    socialUrl: null,
  },
]

export const categories: readonly Category[] = [
  { slug: 'ai-basics', name: 'AI basics' },
  { slug: 'small-business', name: 'Small business' },
  { slug: 'behind-the-build', name: 'Behind the build' },
]

/** Author projection for posts: name, role and photo only. */
export const authorOf = ({ name, role, photo }: TeamMember): AuthorSummary => ({
  name,
  role,
  photo,
})
