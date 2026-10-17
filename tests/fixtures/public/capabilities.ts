import type { Industry, ProductCapability } from '../../../src/features/content/types'

// Mirrors the six Sino products in the public launch content.
export const capabilities: readonly ProductCapability[] = [
  {
    key: 'people-experience',
    title: 'SinoPeople',
    body: 'Smart HR & Employee Experience Engine.',
    tint: 'teal',
    pose: 'whiteboard',
    mockupLines: ['SinoPeople, prepare an onboarding plan', 'Here is a plan for the first weeks.'],
    featured: true,
  },
  {
    key: 'financial-intelligence',
    title: 'SinoMoney',
    body: 'Autonomous Financial Intelligence.',
    tint: 'neutral',
    pose: 'coins-clipboard',
    mockupLines: ['SinoMoney, review these expenses', 'Here is a summary to review.'],
    featured: false,
  },
  {
    key: 'sales-acceleration',
    title: 'SinoSales',
    body: 'Predictive Sales & Deal Acceleration.',
    tint: 'mint',
    pose: 'handover',
    mockupLines: ['SinoSales, review these leads', 'Here are the next steps.'],
    featured: false,
  },
  {
    key: 'social-content',
    title: 'SinoSocial',
    body: 'Adaptive Social & Content Engine.',
    tint: 'sun',
    pose: 'megaphone',
    mockupLines: ['SinoSocial, draft campaign posts', 'Here are campaign ideas.'],
    featured: false,
  },
  {
    key: 'support-automation',
    title: 'SinoHelp',
    body: 'Intelligent Process & Support Automation.',
    tint: 'teal',
    pose: 'holding-phone',
    mockupLines: ['SinoHelp, group these support requests', 'Here are the next steps.'],
    featured: false,
  },
  {
    key: 'enterprise-intelligence',
    title: 'SinoInsights',
    body: 'Enterprise Intelligence & Decision Hub.',
    tint: 'neutral',
    pose: 'magnifier',
    mockupLines: ['SinoInsights, summarize this quarter', 'Here is an executive summary.'],
    featured: false,
  },
]

export const industries: readonly Industry[] = [
  {
    key: 'online-shop',
    label: 'Online shop',
    exampleDay:
      'Morning: Sino drafts replies to order questions. Afternoon: you approve them and move on to packing.',
  },
  {
    key: 'cafe-and-restaurant',
    label: 'Cafe and restaurant',
    exampleDay:
      'Sino answers questions about opening hours and the menu, then sends you a short list of open chats.',
  },
  {
    key: 'local-services',
    label: 'Local services',
    exampleDay:
      'Sino collects booking requests and drafts follow-ups so you can confirm them between jobs.',
  },
]
