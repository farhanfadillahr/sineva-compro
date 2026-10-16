import type { ServiceDetail, ServiceSummary, StepItem } from '../../features/content/types'
import { seo, step } from './helpers'

/** The four-step story shown on Home and the Services overview. */
export const processSteps: readonly StepItem[] = [
  step('Talk it through', 'Tell us which part of the day you would like to make easier.'),
  step('Make a plan', 'We choose one useful first step and agree on what good looks like.'),
  step('Build it together', 'You try it on real work, and we improve it with your feedback.'),
  step('Keep it useful', 'We help your team settle in and keep the work moving.'),
]

export const serviceDetails: readonly ServiceDetail[] = [
  {
    slug: 'ai-discovery',
    locale: 'en',
    title: 'AI Discovery',
    summary:
      'For businesses that do not know where to start. Find where AI can help and decide what to try first.',
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
      'A map of the tasks where AI could help',
      'A ranked shortlist of ideas, with reasons',
      'Notes on risks and limits in plain words',
      'A recommended first step you can start with',
    ],
    process: [
      step('Talk', 'We listen to how your business runs and where the time goes.'),
      step('Map', 'We map the tasks and tools your team uses today.'),
      step('Rank', 'We weigh each idea by effort, value, and risk.'),
      step('Recommend', 'We give you a short plan with a clear first step.'),
    ],
    tools: ['Workshops', 'Process mapping', 'Opportunity scoring', 'Prototype sketches'],
    ctaLabel: 'Plan my AI project',
    seo: seo(
      'AI Discovery: find where AI can help | Sineva',
      'Not sure where to start with AI? Map your work, rank the ideas, and pick a first step. Book a free consultation with Sineva.',
    ),
  },
  {
    slug: 'ai-build',
    locale: 'en',
    title: 'AI Build',
    summary:
      'For businesses that know their problem. We build an AI solution that fits how your team already works.',
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
      {
        title: 'Scattered systems',
        body: 'Your information lives in many places and needs to work together.',
      },
    ],
    deliverables: [
      'A working AI solution for one clear task',
      'Testing on your real work',
      'A connection to the systems you already use, where it makes sense',
      'Simple notes your team can follow',
    ],
    process: [
      step('Scope', 'We agree on one clear task and what a good result looks like.'),
      step('Build', 'We build a first version in small steps and show you as we go.'),
      step('Test', 'We try it on your real work and fix what we find.'),
      step('Hand over', 'We give your team simple notes and stay available for questions.'),
    ],
    tools: ['Language models', 'Workflow automation', 'Chat interfaces', 'Web apps'],
    ctaLabel: 'Plan my AI project',
    seo: seo(
      'AI Build: custom AI for your team | Sineva',
      'We build AI that fits the way your team works, from chat helpers to workflow automation. Book a free consultation to plan it.',
    ),
  },
  {
    slug: 'ai-enablement',
    locale: 'en',
    title: 'AI Enablement',
    summary:
      'For teams that are starting with AI. We help your team learn to use AI well in everyday work.',
    icon: 'chart-rising',
    pose: 'whiteboard',
    problems: [
      { title: 'Uneven skills', body: 'Some people use AI daily and others have not tried it.' },
      { title: 'No shared habits', body: 'Everyone does it differently and results vary.' },
      {
        title: 'Unsure about limits',
        body: 'People are not sure what is safe to hand over to AI.',
      },
    ],
    deliverables: [
      'Hands-on sessions built around your own tasks',
      'Shared guidelines for everyday use',
      'Practice exercises and example prompts',
      'Follow-up support after the sessions',
    ],
    process: [
      step('Understand', 'We learn what your team does and how they use AI today.'),
      step('Plan', 'We design the sessions around your real tasks.'),
      step('Train', 'We run hands-on sessions where people practice on their own work.'),
      step('Support', 'We answer questions and update the guidelines as you learn.'),
    ],
    tools: ['Training sessions', 'Playbooks', 'Prompt libraries', 'Practice exercises'],
    ctaLabel: 'Plan my AI project',
    seo: seo(
      'AI Enablement: train your team on AI | Sineva',
      'Help your team use AI well in everyday work, with hands-on sessions and clear guidelines. Talk to Sineva about training that fits.',
    ),
  },
]

// Explicit picks, not a spread, so a field added to the detail never leaks into the summary.
export const services: readonly ServiceSummary[] = serviceDetails.map(
  ({ slug, locale, title, summary, icon, pose }) => ({ slug, locale, title, summary, icon, pose }),
)
