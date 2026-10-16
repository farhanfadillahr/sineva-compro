import type { IconCardItem, PageContentMap, StepItem } from '../../features/content/types'
import { work } from './empty'
import { asset, doc, heading, paragraph, seo, step } from './helpers'
import { privacyBody } from './privacy'
import { processSteps } from './services'

// Final English copy for every page. Rules it follows (docs/design/copywriting.md): sentence case,
// no em or en dash, no invented numbers, testimonials or logos, CTAs from the lexicon (verb plus
// object, 2 to 4 words). The product is not launched, so every product line is phrased as help
// Sino offers, with no channel, integration, price or date. The waitlist is "Get notified": it
// goes through WhatsApp or email until a backend exists.

const audienceCards: readonly IconCardItem[] = [
  {
    title: 'Small businesses',
    body: 'Owners who want to spend less time on repeat tasks and more on customers.',
    icon: 'chat-bubble',
  },
  {
    title: 'Growing companies',
    body: 'Teams that want AI to fit the tools and habits they already have.',
    icon: 'puzzle-plug',
  },
  {
    title: 'Startups',
    body: 'Founders who want to try an idea quickly and learn from it.',
    icon: 'lightbulb',
  },
]

const productSteps: readonly StepItem[] = [
  step('Tell Sino what you need', 'Ask for a task in everyday words.'),
  step('Sino prepares it', 'Sino helps with a draft, a list, or a summary.'),
  step('You review it', 'Read the result and change anything you like.'),
  step('Carry on with your day', 'Use the result and move on to the next thing.'),
]

export const pages: PageContentMap = {
  home: {
    key: 'home',
    locale: 'en',
    seo: seo(
      'A little help with everyday work | Sineva',
      'More room for the work that matters. Explore practical AI help for your business, and talk to us about a first step.',
    ),
    hero: {
      eyebrow: null,
      headline: 'AI for your business, without the hassle',
      lead: 'A little help with the tasks that fill your day. Let us find where AI can make things easier for you.',
      primaryCtaLabel: 'Book a free consultation',
      secondaryCtaLabel: 'Get notified about Sino',
      poster: asset(
        '/mascot/poster/v008/sino-hero.webp',
        1600,
        1600,
        'Sino, the friendly AI agent mascot, waving hello',
      ),
    },
    twoPaths: {
      product: {
        eyebrow: 'Product',
        title: 'Use it yourself',
        body: 'Sineva AI Agents puts Sino to work on your everyday tasks. It is coming soon, and you can ask to be notified.',
        ctaLabel: 'Explore AI Agents',
        pose: 'holding-phone',
      },
      services: {
        eyebrow: 'Services',
        title: 'Let us build it with you',
        body: 'Not sure where to start, or ready to try an idea? We will work through the next step with you.',
        ctaLabel: 'Explore services',
        pose: 'building-blocks',
      },
    },
    meetSino: {
      title: 'Meet Sino',
      body: 'Sino is our mascot and the face of Sineva AI Agents. One friendly agent, designed to help with many everyday tasks.',
    },
    capabilities: {
      title: 'What Sino can help with',
      intro: 'Hand over a task by asking, the way you would ask a teammate.',
    },
    howWeWork: { title: 'How we work', steps: processSteps },
    whoWeHelp: { title: 'Who we help', cards: audienceCards },
    // Hidden until real projects exist. The section is switched off, not filled with filler.
    selectedWork: { visible: false, title: 'Selected work', intro: null },
    fromBlog: { visible: true, title: 'From the blog' },
    faq: { title: 'Questions, answered', intro: 'Short answers about Sino and our services.' },
    finalCta: {
      headline: 'Ready when you are',
      body: 'Tell us what you want to hand off. We will help you find the first step.',
      primaryCtaLabel: 'Book a free consultation',
      secondaryCtaLabel: 'Get notified about Sino',
      whatsappCtaLabel: 'Chat on WhatsApp',
    },
  },

  product: {
    key: 'product',
    locale: 'en',
    seo: seo(
      'Sineva AI Agents: meet Sino | Sineva',
      'Meet Sino, an AI agent for everyday business tasks. It is not available yet. Ask to be notified when it is ready.',
    ),
    productStatus: 'coming_soon',
    hero: {
      eyebrow: null,
      headline: 'Hand off the busywork to Sino',
      lead: 'Ask Sino for a task the way you would ask a teammate. You look over the result before you use it.',
      primaryCtaLabel: 'Get notified',
      waitlistIntro: 'Send us a quick message and we will let you know when Sino is ready.',
      mockup: {
        bubbles: [
          { from: 'user', text: "Sino, reply to today's customer chats" },
          { from: 'sino', text: 'Done. I wrote drafts for you to check.' },
          { from: 'user', text: 'Show me the first one' },
          { from: 'sino', text: 'Here it is. Change anything you like.' },
        ],
        chips: ['Draft ready', 'For your review', 'Done'],
      },
    },
    capabilities: {
      title: 'What Sino can help with',
      intro: 'Each task is a request you can hand to Sino.',
    },
    howItWorks: { title: 'How it works', steps: productSteps },
    madeForYou: {
      title: 'Made for your business',
      intro: 'See what a day with Sino could look like for your kind of business.',
    },
    control: {
      title: 'You stay in charge',
      features: [
        {
          title: 'You decide',
          body: 'Sino helps with the work. You choose what to use and what to change.',
          icon: 'shield',
        },
        {
          title: 'Plain words',
          body: 'Ask the way you talk. You do not need to learn special commands.',
          icon: 'chat-bubble',
        },
        {
          title: 'Honest about limits',
          body: 'AI can make mistakes, so we encourage you to check the results.',
          icon: 'lightbulb',
        },
      ],
    },
    // Hidden until the product team confirms a comparison we can state honestly.
    comparison: { visible: false, title: 'Ways of working', columns: [], rows: [] },
    faq: { title: 'Questions about Sino', intro: null },
    finalCta: {
      headline: 'Be first to meet Sino',
      body: 'Ask to be notified when Sino is ready, or talk to us about a custom build.',
      primaryCtaLabel: 'Get notified',
      secondaryCtaLabel: 'Book a free consultation',
    },
  },

  servicesOverview: {
    key: 'servicesOverview',
    locale: 'en',
    seo: seo(
      'Find your next step with AI | Sineva',
      'Find, build, and run AI that fits your business with AI Discovery, AI Build, and AI Enablement. Book a free consultation.',
    ),
    hero: {
      eyebrow: null,
      headline: 'AI help that fits your business',
      lead: 'Tell us where the work gets tangled. We will help you find a useful first step and build from there.',
      primaryCtaLabel: 'Book a free consultation',
    },
    servicesIntro: {
      title: 'Three ways we can help',
      body: 'A fresh pair of eyes, a working solution, or a hand getting comfortable with AI. Start with what you need.',
    },
    howWeWork: { title: 'How we work', steps: processSteps },
    whoWeHelp: { title: 'Who we help', cards: audienceCards },
    selectedWork: { visible: false, title: 'Selected work', intro: null },
    faq: { title: 'Questions, answered', intro: null },
    finalCta: {
      headline: 'Plan your first step',
      body: 'Tell us what you want to improve. We will reply with next steps.',
      primaryCtaLabel: 'Book a free consultation',
      secondaryCtaLabel: null,
    },
  },

  about: {
    key: 'about',
    locale: 'en',
    seo: seo(
      'About Sineva | Sineva',
      'You know your business. We are here to help with the work around it. Meet Sineva and Sino, and tell us what would make your day easier.',
    ),
    hero: {
      title: 'More room for what matters',
      lead: 'You have a business to care for. We are here to help make the everyday work a little lighter.',
      scene: asset('/mascot/poses/v008/sino-relaxed.webp', 1200, 1200, 'Sino relaxing with a mug'),
    },
    // Story and mission are proposals from docs/design/brand-positioning.md. The Founder has not
    // approved a company story, so nothing here states a founding date, a number or a history.
    story: doc(
      heading('Our story'),
      paragraph(
        'Running a business means keeping a lot of things moving. Customer questions, unfinished tasks, and plans that need your attention. We want to help you make room for the work you care about.',
      ),
      paragraph(
        'Sometimes that starts with one task you would like to hand over. Sometimes you need a hand finding the right first step. We can work through it together, using the tools and habits your team already knows.',
      ),
      paragraph(
        'We are also building Sino, a friendly AI helper for everyday tasks. While Sino is on the way, you can talk to us about what would make your day easier.',
      ),
    ),
    mission: {
      title: 'Why we are here',
      body: 'To make everyday work a little easier, so you have more time for the people and plans that matter.',
    },
    values: {
      title: 'What we value',
      items: [
        { title: 'Keep it simple', body: 'Plain words and small steps beat big promises.' },
        { title: 'Be honest', body: 'We tell you what AI can do and what it cannot.' },
        { title: 'Build with you', body: 'Your team knows the work, so we work together.' },
      ],
    },
    meetSino: {
      title: 'Meet Sino',
      body: 'Sino is our mascot and the friendly face of Sineva AI Agents. One helper, many everyday tasks.',
    },
    // Hidden until team members agree to be listed.
    team: { visible: false, title: 'The people behind Sineva' },
    finalCta: {
      headline: 'Let us talk about your goals',
      body: 'Tell us what you want to improve. We will reply with next steps.',
      primaryCtaLabel: 'Book a free consultation',
      secondaryCtaLabel: null,
    },
  },

  contact: {
    key: 'contact',
    locale: 'en',
    seo: seo(
      'Talk to us | Sineva',
      'Tell us about your project and get a free consultation. Send your message on WhatsApp and we will reply with next steps.',
    ),
    metaChips: ['Free consultation', 'Plain words, no jargon'],
    headline: 'Tell us about your project',
    lead: 'Share your goal. We turn it into a message you can send us on WhatsApp.',
    steps: [
      step('Tell us your goal', 'Fill in the form with a few details.'),
      step('Send it on WhatsApp', 'We prepare the message. You send it from your own WhatsApp.'),
      step('We plan it together', 'We reply with next steps and agree on a first step that fits.'),
    ],
    // No response time is approved, so the line stays hidden.
    responseTimeText: null,
    form: {
      intro:
        'Tell us a little about your business and what you need. Nothing is sent until you press send in WhatsApp.',
      consentLabel: {
        before: 'I understand this opens WhatsApp with my message ready to send. Read the ',
        linkLabel: 'privacy policy',
        after: '.',
      },
    },
  },

  thankYou: {
    key: 'thankYou',
    locale: 'en',
    seo: seo(
      'Thank you | Sineva',
      'Thanks for reaching out to Sineva. We reply with next steps, or you can chat with us on WhatsApp for a faster answer.',
      true,
    ),
    headline: 'Thanks for reaching out',
    body: 'If you sent your message, we will reply with next steps. Want a faster answer? Chat with us on WhatsApp.',
    whatsappCtaLabel: 'Chat on WhatsApp',
    nextLinks: [
      { label: 'Read the blog', target: 'blog' },
      { label: 'Explore AI Agents', target: 'product' },
    ],
  },

  notFound: {
    key: 'notFound',
    locale: 'en',
    seo: seo(
      'Page not found | Sineva',
      'Sino cannot find this page. Go back to the home page, explore our services, or talk to us about your project.',
      true,
    ),
    headline: "Sino can't find this page",
    body: "Let's get you back on track.",
    links: [
      { label: 'Go to home', target: 'home' },
      { label: 'Explore services', target: 'services' },
      { label: 'Talk to us', target: 'contact' },
    ],
  },

  privacy: {
    key: 'privacy',
    locale: 'en',
    seo: seo(
      'Privacy policy | Sineva',
      'How Sineva handles the details you share with us: what we collect, why, how long we keep it, and how to make a request.',
    ),
    body: privacyBody,
    // The date of the reviewed draft. The text itself says the effective date and the responsible
    // operator are confirmed before the policy takes effect.
    effectiveDate: '2026-10-16',
  },

  blogIndex: {
    key: 'blogIndex',
    locale: 'en',
    seo: seo(
      'Blog | Sineva',
      'Practical notes on using AI in everyday work, from the Sineva team. Read an article, or talk to us about your own project.',
    ),
    title: 'Blog',
    intro: 'Practical notes on using AI in everyday work.',
    emptyState: 'No articles yet. Check back soon, or talk to us today.',
  },

  workIndex: {
    key: 'workIndex',
    locale: 'en',
    // Not indexable while the list is empty, and it switches itself on with the first project.
    seo: seo(
      'Our work | Sineva',
      'Projects Sineva has built and can talk about. Nothing to show yet, so talk to us about yours and plan a first step.',
      work.length === 0,
    ),
    title: 'Our work',
    intro: 'Projects we have built will appear here when they are ready to share.',
    emptyState: 'No projects to show yet. Talk to us about yours.',
  },
}
