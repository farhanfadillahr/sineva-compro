import type { FaqItem, FaqTag } from '../../features/content/types'
import { paragraphs } from './helpers'

export type FaqEntry = Readonly<{ tags: readonly FaqTag[]; item: FaqItem }>

const entry = (tags: readonly FaqTag[], question: string, ...answer: string[]): FaqEntry => ({
  tags,
  item: { question, answer: paragraphs(...answer) },
})

// One library, tagged by where an item appears: `home`, `product`, `services` or `service:<slug>`.
// The public DTO (FaqItem) carries no tags. Home holds 5 to 7 items (page-patterns.md section 2.1).
// Answers state only what is confirmed: the product is not available yet, and nothing here names a
// price, a date, a channel or an integration.
export const faq: readonly FaqEntry[] = [
  entry(
    ['home', 'product'],
    'What is Sino?',
    'Sino is a friendly companion for everyday work. Ask for a task in plain words, and Sino helps you work through it.',
  ),
  entry(
    ['home', 'services'],
    'Who is Sineva for?',
    'We work with small businesses, growing companies, and startups that want to use AI in everyday work.',
  ),
  entry(
    ['home', 'product'],
    'Do I need technical skills to use Sino?',
    'No. You ask in everyday words, the way you would ask a teammate.',
  ),
  entry(
    ['home', 'services', 'service:ai-build'],
    'Can you build something for my business?',
    'Yes. Tell us what slows your team down and we will suggest a first step. Building is what our AI Build service is for.',
  ),
  entry(
    ['home', 'product'],
    'Is Sino available now?',
    'Not yet. Ask to be notified and we will let you know when Sino is ready.',
  ),
  entry(
    ['home', 'services', 'service:ai-discovery'],
    'How does a project start?',
    'We begin with a free consultation. You tell us your goal, and we reply with next steps.',
  ),
  entry(
    ['home', 'services', 'service:ai-discovery'],
    'What if I am not sure which service I need?',
    'Start with AI Discovery. We look at how your business works and help you choose a first step.',
  ),

  entry(
    ['product'],
    'Which tasks can Sino help with?',
    'We are building Sino to help with customer chats, social media, sales follow-up, finance and admin, and daily operations.',
  ),
  entry(
    ['product'],
    'Will Sino replace my team?',
    'No. Sino is meant to take repeat tasks off your plate, so you can spend your time on work that needs a person.',
  ),

  entry(
    ['services'],
    'Do you only work with big companies?',
    'No. We work with small businesses, growing companies, and startups.',
  ),

  entry(
    ['service:ai-discovery'],
    'What do we get from AI Discovery?',
    'A map of where AI could help, a ranked shortlist of ideas, and a recommended first step in plain words.',
  ),
  entry(
    ['service:ai-discovery'],
    'Do we need to know about AI first?',
    'No. Bring your questions and a description of how your business works. We explain the rest in plain words.',
  ),

  entry(
    ['service:ai-build'],
    'What do we get from AI Build?',
    'A working solution for one clear task, tested on your real work, with simple notes for your team.',
  ),
  entry(
    ['service:ai-build'],
    'Can you work with the tools we already use?',
    'We start by looking at how your team works today, and we aim to fit the tools you already use. We will tell you honestly what is possible.',
  ),
  entry(
    ['service:ai-build'],
    'Do you build websites?',
    'Yes, when a web app is part of the AI solution. We do not offer websites as a separate service.',
  ),

  entry(
    ['service:ai-enablement'],
    'How does AI Enablement work?',
    'We run hands-on sessions built around the tasks your team does, and we give you shared guidelines for everyday use.',
  ),
  entry(
    ['service:ai-enablement'],
    'Who is AI Enablement for?',
    'Teams that are starting to use AI, or that use it unevenly and want shared habits.',
  ),
  entry(
    ['service:ai-enablement'],
    'Do you help after the sessions?',
    'Yes. We offer follow-up support, so your team can ask questions as they put it into practice.',
  ),
]
