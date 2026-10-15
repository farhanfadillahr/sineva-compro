import type { Industry, ProductCapability } from '../../../src/features/content/types'

// Mirrors the future `demo` seed. Capability categories follow brand-positioning.md section 3.1
// and stay placeholders until team CBT confirms what the product can do.
export const capabilities: readonly ProductCapability[] = [
  {
    key: 'customer-chat',
    title: "Sino, reply to today's customer chats",
    body: 'Sino drafts answers to common questions and you review them before they go out.',
    tint: 'teal',
    pose: 'holding-phone',
    mockupLines: ["Sino, reply to today's customer chats", 'Done. Drafts are ready to review.'],
    featured: true,
  },
  {
    key: 'social-media',
    title: "Sino, draft this week's social posts",
    body: 'Get content ideas and caption drafts you can edit and schedule.',
    tint: 'sun',
    pose: 'megaphone',
    mockupLines: ["Sino, draft this week's social posts", 'Here are three ideas with captions.'],
    featured: false,
  },
  {
    key: 'sales-follow-up',
    title: "Sino, follow up with last week's prospects",
    body: 'Sino keeps track of who asked and drafts a friendly follow-up message.',
    tint: 'mint',
    pose: 'handover',
    mockupLines: [
      "Sino, follow up with last week's prospects",
      'I wrote a short note for each one.',
    ],
    featured: false,
  },
  {
    key: 'finance-admin',
    title: "Sino, summarize this month's expenses",
    body: 'Record simple transactions and see a tidy summary. This is not financial advice.',
    tint: 'neutral',
    pose: 'coins-clipboard',
    mockupLines: ["Sino, summarize this month's expenses", 'Here is a summary by category.'],
    featured: false,
  },
  {
    key: 'operations',
    title: 'Sino, list what needs doing today',
    body: 'Get a short daily summary and reminders so nothing slips.',
    tint: 'teal',
    pose: 'typing-laptop',
    mockupLines: ['Sino, list what needs doing today', 'You have four tasks. Want to start?'],
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
