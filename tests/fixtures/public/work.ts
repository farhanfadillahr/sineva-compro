import type { WorkDetail, WorkSummary } from '../../../src/features/content/types'
import { media, seo } from './helpers'

// Mirrors the future `demo` seed: 3 work items, all `Internal demo project`, titles prefixed
// `[Demo]`. Results describe what was built and never claim measured outcomes.
export const workDetails: readonly WorkDetail[] = [
  {
    slug: 'demo-support-chat-assistant',
    locale: 'en',
    title: '[Demo] Support chat assistant',
    summary: 'A demo assistant that drafts replies to common customer questions.',
    projectType: 'internal-demo',
    cover: media('work-support-chat', 1600, 1000, 'Chat screen showing drafted replies', true),
    stack: ['Large language models', 'TypeScript', 'PostgreSQL'],
    serviceSlug: 'ai-build',
    featured: true,
    challenge: 'Answering the same customer questions by hand takes time away from other work.',
    solution: 'We built a demo that drafts replies from a short list of approved answers.',
    result: 'A working demo the team can try and give feedback on.',
    gallery: [
      media('work-support-chat-1', 1600, 1000, 'Inbox with drafted replies waiting for review'),
      media('work-support-chat-2', 1600, 1000, 'Approval screen for a drafted reply'),
    ],
    demoUrl: 'https://demo.example.com/support-chat',
    seo: seo(
      '[Demo] Support chat assistant | Sineva',
      'An internal demo project that drafts replies to common customer questions. See how it works.',
    ),
  },
  {
    slug: 'demo-weekly-report-automation',
    locale: 'en',
    title: '[Demo] Weekly report automation',
    summary: 'A demo that gathers weekly numbers into a short written summary.',
    projectType: 'internal-demo',
    cover: media('work-weekly-report', 1600, 1000, 'Report summary with highlights'),
    stack: ['Workflow automation', 'Spreadsheets'],
    serviceSlug: 'ai-enablement',
    featured: true,
    challenge: 'Writing the weekly report by hand is slow and easy to put off.',
    solution: 'We built a demo that collects the numbers and drafts the summary for review.',
    result: 'A working demo that shows how a weekly report can be drafted in minutes.',
    gallery: [],
    demoUrl: null,
    seo: seo(
      '[Demo] Weekly report automation | Sineva',
      'An internal demo project that drafts a weekly report from your numbers. See how we approach it.',
    ),
  },
  {
    slug: 'demo-ai-opportunity-map',
    locale: 'en',
    title: '[Demo] AI opportunity map',
    summary: 'A demo workshop output that ranks tasks by how well AI could help.',
    projectType: 'internal-demo',
    cover: null,
    stack: ['Workshops', 'Process mapping'],
    serviceSlug: 'ai-discovery',
    featured: false,
    challenge: 'Teams hear many AI ideas and cannot tell which one to try first.',
    solution: 'We ran a demo workshop and ranked the tasks by effort and value.',
    result: 'A short ranked list and a clear first step.',
    gallery: [],
    demoUrl: null,
    seo: seo(
      '[Demo] AI opportunity map | Sineva',
      'An internal demo project that ranks tasks by how well AI could help. See how we find a first step.',
    ),
  },
]

export const work: readonly WorkSummary[] = workDetails.map(
  ({ slug, locale, title, summary, projectType, cover, stack, serviceSlug, featured }) => ({
    slug,
    locale,
    title,
    summary,
    projectType,
    cover,
    stack,
    serviceSlug,
    featured,
  }),
)
