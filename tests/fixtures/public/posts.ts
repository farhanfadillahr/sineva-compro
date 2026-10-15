import type { PostDetail, PostSummary } from '../../../src/features/content/types'
import { doc, heading, media, paragraph, seo } from './helpers'
import { authorOf, categories, team } from './team'

// Mirrors the future `demo` seed: 6 posts, titles prefixed `[Demo]`, newest first. Covers mix
// uploaded media, a cover kit (pose and gradient) and no cover, so landing tests see all three.
const [aiBasics, smallBusiness, behindTheBuild] = categories
const [rina, budi] = team

const body = (opening: string, closing: string) =>
  doc(heading('The short version'), paragraph(opening), paragraph(closing))

export const postDetails: readonly PostDetail[] = [
  {
    slug: 'demo-first-ai-task-to-hand-off',
    locale: 'en',
    title: '[Demo] Pick the first task to hand off to AI',
    excerpt: 'Start with a task that is small, repeated, and easy to check.',
    cover: { kind: 'cover-kit', pose: 'magnifier', gradient: 'teal' },
    category: aiBasics,
    author: authorOf(rina),
    publishedAt: '2026-10-12T09:00:00.000Z',
    readingMinutes: 4,
    body: body(
      'A good first task is small, happens often, and has a result you can check in a minute.',
      'Write the steps down first. If you cannot describe the task, AI will not guess it for you.',
    ),
    updatedAt: null,
    seo: seo(
      '[Demo] Pick the first task to hand off to AI | Sineva',
      'How to choose a first task for AI: small, repeated, and easy to check. Read the short guide.',
    ),
  },
  {
    slug: 'demo-reply-to-customers-faster',
    locale: 'en',
    title: '[Demo] Reply to customers faster without losing your voice',
    excerpt: 'Drafts save time. Your review keeps the tone yours.',
    cover: {
      kind: 'media',
      media: media('post-reply-faster', 1600, 900, 'Phone showing a customer chat', true),
    },
    category: smallBusiness,
    author: authorOf(budi),
    publishedAt: '2026-10-09T09:00:00.000Z',
    readingMinutes: 5,
    body: body(
      'Most customer questions repeat. A drafted reply handles the repeat part and you add the human part.',
      'Keep a short list of approved answers so every draft starts from something you trust.',
    ),
    updatedAt: '2026-10-10T08:30:00.000Z',
    seo: seo(
      '[Demo] Reply to customers faster | Sineva',
      'Use drafted replies to answer customers faster while keeping your own voice. Read how.',
    ),
  },
  {
    slug: 'demo-what-we-learned-building-a-demo',
    locale: 'en',
    title: '[Demo] What we learned building our first demo',
    excerpt: 'Three small lessons from building a demo on real work.',
    cover: { kind: 'cover-kit', pose: 'building-blocks', gradient: 'sun' },
    category: behindTheBuild,
    author: authorOf(budi),
    publishedAt: '2026-10-06T09:00:00.000Z',
    readingMinutes: 3,
    body: body(
      'We tested the demo on real work early. It showed us what to change before we polished anything.',
      'Short feedback loops beat long plans, so we kept each step small.',
    ),
    updatedAt: null,
    seo: seo(
      '[Demo] What we learned building our first demo | Sineva',
      'Three small lessons from building an AI demo on real work. Read the notes from our team.',
    ),
  },
  {
    slug: 'demo-ai-words-explained',
    locale: 'en',
    title: '[Demo] AI words explained in plain language',
    excerpt: 'Model, prompt, agent. What each word means in everyday terms.',
    cover: { kind: 'cover-kit', pose: 'whiteboard', gradient: 'mint' },
    category: aiBasics,
    author: null,
    publishedAt: '2026-10-03T09:00:00.000Z',
    readingMinutes: 6,
    body: body(
      'A model is the part that writes. A prompt is the request you give it. An agent is a helper that does a task for you.',
      'You do not need the jargon to get started. You need a task and a clear request.',
    ),
    updatedAt: null,
    seo: seo(
      '[Demo] AI words explained in plain language | Sineva',
      'Model, prompt, agent: what each AI word means in everyday terms. Read the plain guide.',
    ),
  },
  {
    slug: 'demo-a-weekly-routine-with-ai',
    locale: 'en',
    title: '[Demo] A simple weekly routine with AI',
    excerpt: 'One short routine you can try this week.',
    cover: null,
    category: smallBusiness,
    author: authorOf(rina),
    publishedAt: '2026-09-29T09:00:00.000Z',
    readingMinutes: 4,
    body: body(
      'Pick one slot each week to review what AI drafted. Keep what works and drop what does not.',
      'A fixed slot turns a one-time test into a habit.',
    ),
    updatedAt: null,
    seo: seo(
      '[Demo] A simple weekly routine with AI | Sineva',
      'A short weekly routine for using AI at work. Try it this week and keep what works.',
    ),
  },
  {
    slug: 'demo-keep-a-human-in-the-loop',
    locale: 'en',
    title: '[Demo] Keep a person in the loop',
    excerpt: 'Why review matters, and how to make it quick.',
    cover: { kind: 'cover-kit', pose: 'thumbs-up', gradient: 'teal' },
    category: behindTheBuild,
    author: authorOf(rina),
    publishedAt: '2026-09-25T09:00:00.000Z',
    readingMinutes: 3,
    body: body(
      'AI can be wrong, so a person should approve anything that reaches a customer.',
      'Make review quick: show the draft, the source, and one button to approve.',
    ),
    updatedAt: null,
    seo: seo(
      '[Demo] Keep a person in the loop | Sineva',
      'Why a person should review what AI drafts, and how to make review quick. Read the guide.',
    ),
  },
]

export const posts: readonly PostSummary[] = postDetails.map(
  ({ slug, locale, title, excerpt, cover, category, author, publishedAt, readingMinutes }) => ({
    slug,
    locale,
    title,
    excerpt,
    cover,
    category,
    author,
    publishedAt,
    readingMinutes,
  }),
)
