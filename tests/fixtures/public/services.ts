import type { ServiceDetail, ServiceSummary, StepItem } from '../../../src/features/content/types'
import { seo } from './helpers'

// Mirrors the future `demo` seed and the `base` seed's three service slugs.

/** The shared four-step process. Home and Services overview reuse the same copy. */
export const processSteps: readonly StepItem[] = [
  { title: 'Talk', body: 'Tell us what slows your team down.' },
  { title: 'Plan', body: 'We outline a small, clear first step.' },
  { title: 'Build', body: 'We build it with you and test it on real work.' },
  { title: 'Support', body: 'We stay with you after launch and help your team use it.' },
]

export const serviceDetails: readonly ServiceDetail[] = [
  {
    slug: 'ai-discovery',
    locale: 'en',
    title: 'AI Discovery',
    summary: 'Find where AI can help your business and decide what to try first.',
    icon: 'lightbulb',
    pose: 'magnifier',
    problems: [
      {
        title: 'Too many ideas',
        body: 'You hear about AI everywhere and do not know where to start.',
      },
      { title: 'Unclear value', body: 'You want to know which tasks are worth handing to AI.' },
      { title: 'No plan', body: 'You need a short, honest plan your team can follow.' },
    ],
    deliverables: [
      'A map of tasks where AI can help',
      'A ranked shortlist of ideas',
      'A first step you can start with',
    ],
    process: processSteps,
    tools: ['Workshops', 'Process mapping', 'Prototype sketches'],
    ctaLabel: 'Plan my AI project',
    seo: seo(
      'AI Discovery for your business | Sineva',
      'Find where AI can help your business and choose a first step. Book a free consultation with Sineva.',
    ),
  },
  {
    slug: 'ai-build',
    locale: 'en',
    title: 'AI Build',
    summary: 'We build an AI solution that fits how your team already works.',
    icon: 'puzzle-plug',
    pose: 'building-blocks',
    problems: [
      {
        title: 'Tools that do not fit',
        body: 'Off-the-shelf tools ignore the way your team works.',
      },
      { title: 'No time to build', body: 'Your team is busy running the business.' },
      {
        title: 'Hard to trust',
        body: 'You want to see it work on real tasks before you rely on it.',
      },
    ],
    deliverables: [
      'A working AI solution for one clear task',
      'Testing on your real work',
      'Simple documentation for your team',
    ],
    process: processSteps,
    tools: ['Large language models', 'Workflow automation', 'Chat interfaces'],
    ctaLabel: 'Plan my AI project',
    seo: seo(
      'AI Build: custom AI for your team | Sineva',
      'We build AI that fits the way your team works. Book a free consultation to plan your first build.',
    ),
  },
  {
    slug: 'ai-enablement',
    locale: 'en',
    title: 'AI Enablement',
    summary: 'We help your team learn to use AI well, in their everyday work.',
    icon: 'chart-rising',
    pose: 'whiteboard',
    problems: [
      { title: 'Uneven skills', body: 'Some people use AI daily and others have not tried it.' },
      { title: 'No shared habits', body: 'Everyone does it differently and results vary.' },
      { title: 'Unsure about limits', body: 'People are not sure what is safe to hand to AI.' },
    ],
    deliverables: [
      'Hands-on sessions with your team',
      'Shared guidelines for everyday use',
      'Follow-up support after the sessions',
    ],
    process: processSteps,
    tools: ['Training sessions', 'Playbooks', 'Prompt libraries'],
    ctaLabel: 'Plan my AI project',
    seo: seo(
      'AI Enablement for your team | Sineva',
      'Help your team use AI well in everyday work. Talk to Sineva about training that fits your business.',
    ),
  },
]

// Explicit picks, not a spread, so a field added to the detail never leaks into the summary.
export const services: readonly ServiceSummary[] = serviceDetails.map(
  ({ slug, locale, title, summary, icon, pose }) => ({ slug, locale, title, summary, icon, pose }),
)
