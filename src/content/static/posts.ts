import type { Category, PostDetail, RichTextDocument } from '../../features/content/types'
import { bulletList, doc, heading, paragraph, plainText, seo } from './helpers'

// Three starter articles. They teach, and they make no claim about results: no statistics, no
// invented quotes, no client stories. The author is the team, not a named person, so nothing here
// attributes a view to someone who has not approved it.

export const categories: readonly Category[] = [
  { slug: 'ai-basics', name: 'AI basics' },
  { slug: 'small-business', name: 'Small business' },
  { slug: 'project-prep', name: 'Project prep' },
]
const [aiBasics, smallBusiness, projectPrep] = categories

const author = { name: 'Sineva team', role: null, photo: null } as const

/** Average adult reading speed, rounded up so a short article never shows "0 min". */
const WORDS_PER_MINUTE = 200
const readingMinutes = (body: RichTextDocument) =>
  Math.max(1, Math.ceil(plainText(body).trim().split(/\s+/).length / WORDS_PER_MINUTE))

const whereToStart = doc(
  heading('The short version'),
  paragraph(
    'Most small business owners do not need an AI strategy. You need one task that eats your time, a clear idea of what a good result looks like, and a small test. Start there, and the next decisions get easier.',
  ),
  heading('Start with the work, not the tool'),
  paragraph(
    'New AI tools appear every week, and it is easy to feel behind. Picking a tool first is the usual mistake. A tool only helps when you know which job you want it to do.',
  ),
  paragraph(
    'Think about your last normal week. Which tasks did you repeat? Which ones did you put off because they felt slow or boring? Write them down in plain words, even if the list looks messy.',
  ),
  heading('Choose a task that is small, repeated, and easy to check'),
  paragraph('Not every task makes a good first task. Look for three things:'),
  bulletList(
    'Small: it takes minutes, not days, and it has a clear start and end.',
    'Repeated: it happens often, so a small improvement adds up.',
    'Easy to check: you can tell in a minute whether the result is good.',
  ),
  paragraph(
    'Answering the same customer question, drafting a first version of a post, or summarizing a long conversation are typical examples. A task that needs deep judgment, or where one mistake is costly, is a poor place to begin.',
  ),
  heading('Write down how you do it today'),
  paragraph(
    'Before you hand anything to AI, describe the task as if you were training a new teammate. What do you look at first? What would you never say to a customer? What does a good result look like?',
  ),
  paragraph(
    'This step feels slow, but it does most of the work. If you cannot describe the task, an AI tool cannot guess it for you. It also shows you whether the task is really as simple as you thought.',
  ),
  heading('Run a small test'),
  paragraph(
    'Try the task with AI on a handful of real cases, not on one perfect example. Keep a person in the loop: you read the result before it reaches a customer. Note what was good, what was wrong, and what you had to fix.',
  ),
  paragraph(
    'After a few rounds you will know whether the task is worth keeping. If it is not, you have lost very little. That is the point of starting small.',
  ),
  heading('Know the limits'),
  paragraph(
    'AI can be wrong while sounding confident. It can miss context that you take for granted. Treat the first results as a draft, and check anything that involves money, promises, or personal details.',
  ),
  paragraph(
    'Be careful with private information too. Do not paste customer details or passwords into a tool unless you understand how that tool handles them.',
  ),
  heading('When to ask for help'),
  paragraph(
    'Some businesses can do all of this alone. Others want a second pair of eyes to map their work and pick the first step. That is what our AI Discovery service is for.',
  ),
  paragraph(
    'We look at how your business runs, point out where AI can realistically help, and suggest a first step. If you would like to talk it through, book a free consultation.',
  ),
)

const everydayTasks = doc(
  heading('The short version'),
  paragraph(
    'An AI agent is software that takes a request in plain words and does part of the work for you. It will not run your business. It can take the repeat, low-risk tasks that fill your day, so you have more time for the work that needs you.',
  ),
  paragraph(
    'Here are five everyday tasks that are a good fit. They are also the kinds of requests we have in mind for Sino, the agent we are building at Sineva.',
  ),
  heading('1. Replying to common customer questions'),
  paragraph(
    'Many customer messages ask the same things: opening hours, delivery, how to order. An agent can draft a reply for each one, based on answers you have already approved.',
  ),
  paragraph(
    'You stay in charge. Read the drafts, change what you like, and send them. Over time you will also see which questions come up most, which tells you what to explain better on your website.',
  ),
  heading('2. Drafting social media posts'),
  paragraph(
    'Posting regularly is hard when you are busy. An agent can suggest ideas for the week, write a first caption, and offer a few ways to say the same thing.',
  ),
  paragraph(
    'Your voice matters, so treat the result as a first draft. Edit it until it sounds like you, and check every detail about your products before it goes out.',
  ),
  heading('3. Following up with people who asked'),
  paragraph(
    'Someone asks about your product, you reply, and then the conversation goes quiet. A short, friendly follow-up often gets it moving again, but it is easy to forget.',
  ),
  paragraph(
    'An agent can keep a list of who asked about what, and draft a note for each person. You decide who to contact and when.',
  ),
  heading('4. Keeping simple financial records'),
  paragraph(
    'Many small businesses track money in a notebook or a spreadsheet. An agent can help you write down simple transactions and summarize them, for example by category at the end of the month.',
  ),
  paragraph(
    'This is bookkeeping help, not financial advice. For tax, loans, or big decisions, talk to a qualified person.',
  ),
  heading('5. Planning the day'),
  paragraph(
    'Every morning starts with the same question: what needs doing today? An agent can pull your tasks together into a short list and remind you about things that are due.',
  ),
  paragraph(
    'It works best when you tell it your priorities. Think of it as a tidy notepad that can also talk back.',
  ),
  heading('What these tasks have in common'),
  paragraph(
    'Each one is repeated, easy to check, and low risk if a draft needs a fix. That is why they make good first tasks. Tasks that involve large payments, legal promises, or sensitive personal details need more care and a person in the loop.',
  ),
  heading('How to try it safely'),
  bulletList(
    'Pick one task, not all five.',
    'Keep a person in charge of anything that goes out to a customer.',
    'Write down what a good result looks like before you start.',
    'Review the first results closely, and relax the checking only as your trust grows.',
  ),
  paragraph(
    'If you want help choosing your first task, our AI Discovery service is built for that. If you would rather try an agent yourself, ask to be notified when Sino is ready.',
  ),
)

const prepareData = doc(
  heading('The short version'),
  paragraph(
    'AI projects rarely stall because the AI is too weak. More often, the information it needs is scattered, out of date, or known by only one person. A little preparation before you start makes the project smoother and the results more useful.',
  ),
  paragraph(
    'You do not need a data team. You need to know what you have, where it lives, and what is safe to share.',
  ),
  heading('What we mean by business data'),
  paragraph(
    'Data is not only numbers in a database. For most small businesses it means the everyday material your team already uses:',
  ),
  bulletList(
    'Price lists, menus, and product descriptions',
    'Answers you give customers again and again',
    'Spreadsheets of orders, bookings, or customers',
    'Documents that explain how you do things, such as steps and checklists',
    'Chat and email history, when it is appropriate to use it',
  ),
  heading('Step 1: list what you have and where it lives'),
  paragraph(
    'Write a simple list: what information exists, who keeps it, and where it is stored. Include paper notes and personal phones, because that is often where the real answers are.',
  ),
  paragraph('The goal is a map, not a perfect archive. Spend an afternoon on it, not a month.'),
  heading('Step 2: choose the information for the first task'),
  paragraph(
    'Do not prepare everything. Pick the one task you want AI to help with, and gather only the information that task needs. If the task is answering customer questions, that means your common questions, your approved answers, and your current prices.',
  ),
  heading('Step 3: clean up the basics'),
  paragraph(
    'Remove duplicates, fix obvious mistakes, and update anything that is out of date. If two documents disagree, decide which one is right. AI will repeat whatever it is given, including old prices and conflicting rules.',
  ),
  paragraph(
    'Use clear names and consistent wording. If you call the same product three different names, tell your team which one to use.',
  ),
  heading('Step 4: decide what is private'),
  paragraph(
    'Mark what must stay inside your business: customer personal details, payment information, passwords, and anything covered by a contract. Keep these out of tools you do not fully understand.',
  ),
  paragraph(
    'Personal data may be covered by data protection rules. If you are unsure what applies to you, ask a qualified adviser before you share it.',
  ),
  heading('Step 5: write down what good looks like'),
  paragraph(
    'Collect a handful of real examples of good results: a reply you were proud of, a summary that was accurate, a report that was clear. These become the standard to test against.',
  ),
  paragraph(
    'Also note a few bad examples and why they were bad. Both kinds help whoever builds or tunes the solution.',
  ),
  heading('Step 6: name an owner'),
  paragraph(
    'Information changes. Someone should be responsible for keeping it current, such as updating a price or retiring an old answer. Without an owner, even a good setup slowly drifts out of date.',
  ),
  heading('What you can skip'),
  paragraph(
    'You do not need to move everything into one system first. You do not need perfect formatting. You can start with a small, tidy set of information and add more once the first task works.',
  ),
  heading('Where we can help'),
  paragraph(
    'If you are not sure what to gather, an AI Discovery session can map it with you. If you already know the task, our AI Build service starts by looking at the information your team has today. Book a free consultation and tell us what you have.',
  ),
)

// Newest first, which is also the order the Home "From the blog" section shows.
export const postDetails: readonly PostDetail[] = [
  {
    slug: 'where-to-start-with-ai-in-a-small-business',
    locale: 'en',
    title: 'Where to start with AI in a small business',
    excerpt:
      'Start with one repeated task, not with a tool. A short guide to picking your first step.',
    cover: { kind: 'cover-kit', pose: 'magnifier', gradient: 'teal' },
    category: smallBusiness,
    author,
    publishedAt: '2026-10-16T02:00:00.000Z',
    readingMinutes: readingMinutes(whereToStart),
    body: whereToStart,
    updatedAt: null,
    seo: seo(
      'Where to start with AI in a small business | Sineva',
      'Pick one small, repeated task and test it on real work. A plain guide to your first step with AI. Talk to Sineva if you want help.',
    ),
  },
  {
    slug: 'five-everyday-tasks-an-ai-agent-can-take-off-your-plate',
    locale: 'en',
    title: 'Five everyday tasks an AI agent can take off your plate',
    excerpt:
      'Replies, posts, follow-ups, records, and daily planning: where an AI agent can help with routine work.',
    cover: { kind: 'cover-kit', pose: 'handover', gradient: 'sun' },
    category: aiBasics,
    author,
    publishedAt: '2026-10-15T02:00:00.000Z',
    readingMinutes: readingMinutes(everydayTasks),
    body: everydayTasks,
    updatedAt: null,
    seo: seo(
      'Five everyday tasks an AI agent can take on | Sineva',
      'Customer replies, social posts, follow-ups, simple records, and daily planning: five routine tasks an AI agent can help with. Read the guide.',
    ),
  },
  {
    slug: 'how-to-prepare-your-business-data-before-an-ai-project',
    locale: 'en',
    title: 'How to prepare your business data before an AI project',
    excerpt:
      'Good AI results start with tidy information. A plain checklist to get your business data ready.',
    cover: { kind: 'cover-kit', pose: 'whiteboard', gradient: 'mint' },
    category: projectPrep,
    author,
    publishedAt: '2026-10-14T02:00:00.000Z',
    readingMinutes: readingMinutes(prepareData),
    body: prepareData,
    updatedAt: null,
    seo: seo(
      'Prepare your business data for an AI project | Sineva',
      'A six-step checklist to gather, tidy, and protect your business information before an AI project. Read it, then talk to Sineva.',
    ),
  },
]

export const posts = postDetails.map(
  ({ slug, locale, title, excerpt, cover, category, author, publishedAt, readingMinutes }) => ({
    slug,
    locale,
    title,
    excerpt,
    cover,
    category,
    author,
    publishedAt,
    readingMinutes,
  }),
)
