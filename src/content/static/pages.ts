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
      'Make your business run smarter with AI | Sineva',
      'Save time on everyday tasks with AI that fits your business. Meet Sino and book a free consultation.',
    ),
    hero: {
      eyebrow: null,
      headline: 'AI for your business, without the hassle',
      lead: 'We make AI accessible for everyone. Let us find where it can make your day easier.',
      primaryCtaLabel: 'Book a free consultation',
      secondaryCtaLabel: 'Get notified about Sino',
      poster: asset(
        '/mascot/poster/v009/sino-hero.webp',
        1600,
        1600,
        'Sino, a friendly AI companion, waving hello',
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
      body: 'Sino is a friendly companion for everyday work. Ask in plain words, and Sino can help with replies, ideas, and the next small task.',
    },
    capabilities: {
      title: 'What Sino can help with',
      intro: 'Hand over a task by asking, the way you would ask a teammate.',
    },
    howWeWork: { title: 'How we work', steps: processSteps },
    whoWeHelp: { title: 'Who we help', cards: audienceCards },
    // Hidden until real projects exist. The section is switched off, not filled with filler.
    selectedWork: { visible: false, title: 'Selected work', intro: null },
    fromBlog: { visible: true, title: 'Insights to get you started' },
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
      'Hand off your busywork to Sino AI | Sineva',
      'Meet Sino AI, a helper for everyday business tasks. Coming soon: get notified the moment it is ready.',
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
      lead: 'AI should be accessible to every business. Tell us where the work gets tangled and we will help you find a first step.',
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
      'See how Sineva makes AI simple | Sineva',
      'Sineva makes AI accessible for everyone, with practical, safe support for your business and your team. See how we work.',
    ),
    hero: {
      title: 'More room for what matters',
      lead: 'Our mission is to make AI accessible for everyone, so the everyday work of running a business feels lighter.',
      scene: asset('/mascot/poses/v008/sino-relaxed.webp', 1200, 1200, 'Sino relaxing with a mug'),
    },
    // Story and mission are proposals from docs/design/brand-positioning.md. The Founder has not
    // approved a company story, so nothing here states a founding date, a number or a history.
    story: doc(
      heading('Our story'),
      paragraph(
        'A business day can move in many directions. Customer questions, repeat tasks, and plans all need your attention. Sineva helps make space for the work you care about.',
      ),
      paragraph(
        'That support can start with choosing a useful task for AI or shaping a solution around the way your team works. We begin by listening, then take the next step together.',
      ),
      paragraph(
        'We are building Sino as a friendly AI companion for everyday business tasks. You can ask in plain words and review each result with a helpful friend by your side.',
      ),
    ),
    mission: {
      title: 'Why we are here',
      body: 'Make AI accessible for everyone. We help people make room for the work, people, and plans that matter to them.',
    },
    values: {
      title: 'What we value',
      items: [
        { title: 'Keep it simple', body: 'Plain words and small steps beat big promises.' },
        { title: 'Be honest', body: 'We explain AI clearly and set practical expectations.' },
        { title: 'Build with you', body: 'Your team knows the work, so we work together.' },
      ],
    },
    meetSino: {
      title: 'Meet Sino',
      body: 'Sino is a friendly companion for everyday work. Ask in plain words, and Sino can help you shape ideas, draft replies, and plan a next step.',
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
      'Book your free AI consultation | Sineva',
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
      'Get practical AI insights for your business | Sineva',
      'Short, practical guides to using AI in everyday work. Read the latest insights, then talk to us about your own project.',
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
