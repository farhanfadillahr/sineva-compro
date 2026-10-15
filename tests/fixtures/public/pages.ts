import type { IconCardItem, PageContentMap, StepItem } from '../../../src/features/content/types'
import { doc, heading, media, paragraph, seo } from './helpers'
import { processSteps } from './services'

// Mirrors the future `demo` seed for `page_content` (admin CMS plan section 4.1). This is dummy
// copy that follows copywriting.md. Product wording is a placeholder until team CBT confirms the
// real capabilities, so none of it may be read as a product claim.

const audienceCards: readonly IconCardItem[] = [
  {
    title: 'Small businesses',
    body: 'Owners who want to spend less time on repeat tasks.',
    icon: 'chat-bubble',
  },
  {
    title: 'Growing companies',
    body: 'Teams that need AI to fit the tools they already use.',
    icon: 'puzzle-plug',
  },
  {
    title: 'Startups',
    body: 'Founders who want to try an idea quickly and learn from it.',
    icon: 'lightbulb',
  },
]

const productSteps: readonly StepItem[] = [
  { title: 'Connect your channels', body: 'Tell Sino where your customers and tasks come from.' },
  { title: 'Teach Sino your business', body: 'Share how you work so Sino can follow your style.' },
  {
    title: 'Let Sino handle the busywork',
    body: 'Hand over repeat tasks by asking in plain words.',
  },
  { title: 'Review and approve', body: 'Check the result and approve it before it goes out.' },
]

export const pages: PageContentMap = {
  home: {
    key: 'home',
    locale: 'en',
    seo: seo(
      'AI consulting and AI agents | Sineva',
      'Sineva helps you hand off busywork to Sino, an AI agent, or build AI that fits your business. Book a free consultation.',
    ),
    hero: {
      eyebrow: 'AI consulting and AI agents',
      headline: 'Hand off the busywork to Sino',
      lead: 'Sino replies to customers, drafts posts, and keeps your books tidy. You stay in charge.',
      primaryCtaLabel: 'Book a free consultation',
      secondaryCtaLabel: 'Join the waitlist',
      poster: media(
        'home-hero-poster',
        1600,
        900,
        'Sino waving in a bright small business space',
        true,
      ),
    },
    twoPaths: {
      product: {
        eyebrow: 'Product',
        title: 'Use it yourself',
        body: 'Start with Sineva AI Agents and let Sino take on everyday tasks.',
        ctaLabel: 'See what Sino can do',
        pose: 'holding-phone',
      },
      services: {
        eyebrow: 'Services',
        title: 'Let us build it with you',
        body: 'Work with our team to find, build, and run AI that fits your business.',
        ctaLabel: 'Explore services',
        pose: 'building-blocks',
      },
    },
    meetSino: {
      title: 'Meet Sino',
      body: 'Sino is the AI agent that works across your daily tasks. One agent, many abilities.',
    },
    capabilities: {
      title: 'What Sino can do',
      intro: 'Hand over a task by asking, the way you would ask a teammate.',
    },
    howWeWork: { title: 'How we work', steps: processSteps },
    whoWeHelp: { title: 'Who we help', cards: audienceCards },
    selectedWork: {
      visible: true,
      title: 'Selected work',
      intro: 'Internal demo projects that show how we approach a problem.',
    },
    fromBlog: { visible: true, title: 'From the blog' },
    faq: { title: 'Questions, answered', intro: 'Short answers about Sino and our services.' },
    finalCta: {
      headline: 'Ready when you are',
      body: 'Tell us what you want to hand off. We will help you find the first step.',
      primaryCtaLabel: 'Book a free consultation',
      secondaryCtaLabel: 'Join the waitlist',
      whatsappCtaLabel: 'Chat on WhatsApp',
    },
  },

  product: {
    key: 'product',
    locale: 'en',
    seo: seo(
      'Sineva AI Agents: meet Sino | Sineva',
      'Meet Sino, an AI agent for everyday business tasks. Join the waitlist to get early access.',
    ),
    productStatus: 'coming_soon',
    hero: {
      eyebrow: 'Product',
      headline: 'Hand off the busywork to Sino',
      lead: 'Ask Sino for a task the way you would ask a teammate. You review the result.',
      primaryCtaLabel: 'Join the waitlist',
      waitlistIntro: 'Leave your email and we will tell you when Sino is ready.',
      mockup: {
        bubbles: [
          { from: 'user', text: "Sino, reply to today's customer chats" },
          { from: 'sino', text: 'Done. I drafted replies for you to review.' },
          { from: 'user', text: 'Show me the first one' },
          { from: 'sino', text: 'Here it is. Approve it or edit it.' },
        ],
        chips: ['Draft ready', 'Needs review', 'Approved'],
      },
    },
    capabilities: {
      title: 'What Sino can do',
      intro: 'Each task is a request you can hand to Sino.',
    },
    howItWorks: { title: 'How it works', steps: productSteps },
    madeForYou: {
      title: 'Made for your business',
      intro: 'See an example day for your kind of business.',
    },
    control: {
      title: 'You stay in control',
      features: [
        { title: 'You approve the work', body: 'Sino prepares it and you decide.', icon: 'shield' },
        {
          title: 'A person can step in',
          body: 'You can take over a conversation at any time.',
          icon: 'chat-bubble',
        },
        {
          title: 'Clear about its limits',
          body: 'Sino tells you when it is unsure instead of guessing.',
          icon: 'lightbulb',
        },
      ],
    },
    // Hidden until the product team confirms a comparison we can state honestly.
    comparison: { visible: false, title: 'Ways of working', columns: [], rows: [] },
    faq: { title: 'Questions about Sino', intro: null },
    finalCta: {
      headline: 'Get early access to Sino',
      body: 'Join the waitlist, or ask us about a custom build.',
      primaryCtaLabel: 'Join the waitlist',
      secondaryCtaLabel: 'Book a free consultation',
    },
  },

  servicesOverview: {
    key: 'servicesOverview',
    locale: 'en',
    seo: seo(
      'AI consulting services | Sineva',
      'Find, build, and run AI that fits your business with Sineva. Book a free consultation to plan your first step.',
    ),
    hero: {
      eyebrow: 'Services',
      headline: 'AI help that fits your business',
      lead: 'We help you find, build, and run AI. You get a clear plan at every step.',
      primaryCtaLabel: 'Book a free consultation',
    },
    servicesIntro: {
      title: 'Three ways we can help',
      body: 'Start where you are. Each service stands on its own, or you can combine them.',
    },
    howWeWork: { title: 'How we work', steps: processSteps },
    whoWeHelp: { title: 'Who we help', cards: audienceCards },
    selectedWork: {
      visible: true,
      title: 'Selected work',
      intro: 'Internal demo projects that show how we approach a problem.',
    },
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
      'About us | Sineva',
      'Learn how Sineva helps businesses use AI without the hassle, and meet the team and Sino. Talk to us.',
    ),
    hero: {
      title: 'We help you use AI without the hassle',
      lead: 'Sineva is an AI consulting company that also builds ready-to-use AI agents.',
      scene: media('about-scene', 1600, 1200, 'Sino and two colleagues at a meeting table', true),
    },
    story: doc(
      heading('Our story'),
      paragraph(
        'We started Sineva to make AI useful for people who run businesses, not only for engineers.',
      ),
      paragraph('We build and teach with real work, so the result is something your team can use.'),
    ),
    mission: {
      title: 'Our mission',
      body: 'Help businesses use AI in simple, honest ways that fit how they work.',
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
      body: 'Sino is our mascot and the face of our AI agent. One friendly helper for many tasks.',
    },
    team: { visible: true, title: 'The people behind Sineva' },
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
      'Contact Sineva | Sineva',
      'Tell us about your project and get a free consultation. We reply with clear next steps.',
    ),
    metaChips: ['Free consultation', 'No obligation'],
    headline: 'Tell us about your project',
    lead: 'Share your goal and we will reply with next steps.',
    steps: [
      { title: 'Tell us your goal', body: 'Fill in the form with a few details.' },
      { title: 'We reply with next steps', body: 'We read your message and answer with a plan.' },
      { title: 'We plan it together', body: 'We agree on a first step that fits your business.' },
    ],
    // No SLA is approved yet, so the response-time line stays hidden.
    responseTimeText: null,
    form: {
      intro: 'Tell us a little about your business and what you need.',
      consentLabel: {
        before: 'I agree that Sineva may use my details to reply to me. Read the ',
        linkLabel: 'privacy policy',
        after: '.',
      },
    },
  },

  thankYou: {
    key: 'thankYou',
    locale: 'en',
    seo: {
      ...seo('Thank you | Sineva', 'We got your message and will reply with next steps.'),
      noindex: true,
    },
    headline: 'Thanks, we got your message',
    body: 'We will reply with next steps. Want a faster answer? Chat with us on WhatsApp.',
    whatsappCtaLabel: 'Chat on WhatsApp',
    nextLinks: [
      { label: 'Read the blog', target: 'blog' },
      { label: 'See what Sino can do', target: 'product' },
    ],
  },

  notFound: {
    key: 'notFound',
    locale: 'en',
    seo: {
      ...seo('Page not found | Sineva', 'Sino cannot find this page. Go back to the home page.'),
      noindex: true,
    },
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
      'How Sineva handles the details you share with us. Read what we collect and why we collect it.',
    ),
    body: doc(
      heading('What we collect'),
      paragraph(
        'We collect the details you send through our forms, such as your name, work email, and message.',
      ),
      heading('Why we collect it'),
      paragraph('We use these details to reply to you and to follow up on your request.'),
    ),
    effectiveDate: '2026-10-15',
  },

  blogIndex: {
    key: 'blogIndex',
    locale: 'en',
    seo: seo(
      'Blog | Sineva',
      'Practical notes on using AI in everyday work, from the Sineva team. Read an article today.',
    ),
    title: 'Blog',
    intro: 'Practical notes on using AI in everyday work.',
    emptyState: 'No articles yet. Check back soon, or talk to us today.',
  },

  workIndex: {
    key: 'workIndex',
    locale: 'en',
    seo: seo(
      'Our work | Sineva',
      'Internal demo projects that show how Sineva approaches AI problems. See our work and get in touch.',
    ),
    title: 'Our work',
    intro: 'Internal demo projects that show how we approach AI problems.',
    emptyState: 'No projects to show yet. Talk to us about yours.',
  },
}
