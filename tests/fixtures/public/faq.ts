import type { FaqItem, FaqTag } from '../../../src/features/content/types'
import { doc, paragraph } from './helpers'

export type FaqFixture = Readonly<{ tags: readonly FaqTag[]; item: FaqItem }>

const entry = (tags: readonly FaqTag[], question: string, ...answer: string[]): FaqFixture => ({
  tags,
  item: { question, answer: doc(...answer.map(paragraph)) },
})

// Mirrors the future `demo` seed. Tags decide where an item appears: `home`, `product`,
// `services` or `service:<slug>`. The public DTO (FaqItem) carries no tags.
export const faq: readonly FaqFixture[] = [
  entry(
    ['home', 'product'],
    'What is the Sineva Product Suite?',
    'It brings together focused AI products for people operations, finance, sales, social content, support, and business insights.',
  ),
  entry(
    ['home', 'services'],
    'Who is Sineva for?',
    'We work with small businesses, growing companies, and startups that want to use AI in everyday work.',
  ),
  entry(
    ['home', 'product'],
    'Do I need technical skills to use Sino?',
    'No. You ask in plain words, the way you would ask a teammate.',
  ),
  entry(
    ['home', 'services'],
    'Can you build something for my business?',
    'Yes. Tell us what slows your team down and we will suggest a first step.',
  ),
  entry(
    ['product'],
    'Is Sino available now?',
    'Not yet. Join the waitlist and we will email you when Sino is ready.',
  ),
  entry(
    ['services', 'service:ai-discovery'],
    'How does a project start?',
    'We begin with a free consultation. You tell us your goal and we reply with next steps.',
  ),
  entry(
    ['service:ai-build'],
    'What do we get from AI Build?',
    'A working solution for one clear task, tested on your real work, with simple notes for your team.',
  ),
  entry(
    ['service:ai-enablement'],
    'How does AI Enablement work?',
    'We run hands-on sessions with your team and give you shared guidelines for everyday use.',
  ),
]
