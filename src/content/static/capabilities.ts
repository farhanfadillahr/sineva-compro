import type { Industry, ProductCapability } from '../../features/content/types'

// Capability categories follow brand-positioning.md section 3.1. Each one is phrased as something
// Sino helps with, never as a feature spec: no messaging channel, no integration, no price, no
// date. Only the product team (CBT) can widen these claims.
export const capabilities: readonly ProductCapability[] = [
  {
    key: 'customer-chat',
    title: "Sino, reply to today's customer chats",
    body: 'Sino helps you draft replies to common customer questions, so you can read, adjust, and send them.',
    tint: 'teal',
    pose: 'holding-phone',
    mockupLines: [
      "Sino, reply to today's customer chats",
      'Done. I wrote drafts for you to check.',
    ],
    featured: true,
  },
  {
    key: 'social-media',
    title: "Sino, draft this week's social posts",
    body: 'Sino helps you come up with post ideas and caption drafts that you can edit before you share them.',
    tint: 'sun',
    pose: 'megaphone',
    mockupLines: ["Sino, draft this week's social posts", 'Here are three ideas with captions.'],
    featured: false,
  },
  {
    key: 'sales-follow-up',
    title: "Sino, follow up with last week's prospects",
    body: 'Sino helps you remember who asked about your products and drafts a friendly follow-up note for each person.',
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
    body: 'Sino helps you keep simple records and read them as a short summary. It is a helper, not financial advice.',
    tint: 'neutral',
    pose: 'coins-clipboard',
    mockupLines: ["Sino, summarize this month's expenses", 'Here is a summary by category.'],
    featured: false,
  },
  {
    key: 'operations',
    title: 'Sino, list what needs doing today',
    body: 'Sino helps you start the day with a short list of tasks and reminders, so less slips through the cracks.',
    tint: 'teal',
    pose: 'typing-laptop',
    mockupLines: ['Sino, list what needs doing today', 'You have four tasks. Want to start?'],
    featured: false,
  },
]

// Non-regulated businesses only. The example days say what Sino could help with, not what it
// achieves.
export const industries: readonly Industry[] = [
  {
    key: 'online-shop',
    label: 'Online shop',
    exampleDay:
      'In the morning, Sino drafts replies to order questions. You check them, send them, and get back to packing.',
  },
  {
    key: 'cafe-and-restaurant',
    label: 'Cafe and restaurant',
    exampleDay:
      'Sino helps answer questions about opening hours and the menu, then gives you a short list of chats that need you.',
  },
  {
    key: 'local-services',
    label: 'Local services',
    exampleDay:
      'Sino helps collect booking requests and drafts follow-ups, so you can confirm them between jobs.',
  },
]
