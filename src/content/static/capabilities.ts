import type { Industry, ProductCapability } from '../../features/content/types'

// Product names and positioning follow the product descriptions supplied for the launch copy.
export const capabilities: readonly ProductCapability[] = [
  {
    key: 'people-experience',
    title: 'SinoPeople',
    body: 'Smart HR & Employee Experience Engine. An AI HR companion for every stage of the employee journey. It screens resumes, personalizes onboarding, and tracks employee sentiment and performance insights in real time.',
    tint: 'teal',
    pose: 'whiteboard',
    mockupLines: [
      'SinoPeople, prepare an onboarding plan for our new hire',
      'Here is a personalized plan for their first weeks.',
    ],
    featured: true,
  },
  {
    key: 'financial-intelligence',
    title: 'SinoMoney',
    body: 'Autonomous Financial Intelligence. An AI financial assistant that automates invoice processing, flags unusual expenses, forecasts cash flow, and generates precise compliance and audit reports on demand. It provides information, not financial advice.',
    tint: 'neutral',
    pose: 'coins-clipboard',
    mockupLines: [
      'SinoMoney, review this month’s invoices and expenses',
      'I found items to review and prepared a monthly summary.',
    ],
    featured: false,
  },
  {
    key: 'sales-acceleration',
    title: 'SinoSales',
    body: 'Predictive Sales & Deal Acceleration. A sales co-pilot that scores incoming leads, predicts deal likelihood, drafts tailored proposals, and gives real-time coaching during customer conversations.',
    tint: 'mint',
    pose: 'handover',
    mockupLines: [
      'SinoSales, review these new leads',
      'Here are their priorities and suggested next steps.',
    ],
    featured: false,
  },
  {
    key: 'social-content',
    title: 'SinoSocial',
    body: 'Adaptive Social & Content Engine. An AI brand strategist that monitors social trends, drafts multi-channel campaign copy, schedules content dynamically, and analyzes customer engagement sentiment across platforms.',
    tint: 'sun',
    pose: 'megaphone',
    mockupLines: [
      'SinoSocial, draft this week’s campaign posts',
      'Here are campaign ideas and copy for your review.',
    ],
    featured: false,
  },
  {
    key: 'support-automation',
    title: 'SinoHelp',
    body: 'Intelligent Process & Support Automation. A 24/7 support platform that handles routine customer and team tickets, coordinates cross-department workflows, and resolves complex queries through conversational AI.',
    tint: 'teal',
    pose: 'holding-phone',
    mockupLines: [
      'SinoHelp, organize these incoming support requests',
      'Requests are grouped with suggested next steps.',
    ],
    featured: false,
  },
  {
    key: 'enterprise-intelligence',
    title: 'SinoInsights',
    body: 'Enterprise Intelligence & Decision Hub. A central AI dashboard that synthesizes complex data across departments into conversational insights, executive summaries, and predictive forecasts.',
    tint: 'neutral',
    pose: 'magnifier',
    mockupLines: [
      'SinoInsights, summarize this quarter’s performance',
      'Here is an executive summary with key trends.',
    ],
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
