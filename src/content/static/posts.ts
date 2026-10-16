import type { Category, PostDetail, RichTextDocument } from '../../features/content/types'
import { bulletList, doc, heading, paragraph, plainText, seo } from './helpers'

// Four launch articles. They teach, and they make no claim about results: no statistics, no
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
  heading('Try it with a customer question'),
  paragraph(
    'Imagine you run a small bakery. People often ask when orders close and whether you deliver to their area. Gather your current delivery rules, opening hours, and order cutoff times. Ask the tool to draft a reply using only those notes. Tell it to ask you when an answer is missing.',
  ),
  paragraph(
    'Now test an awkward case. A customer wants delivery outside your usual area for an order tomorrow. A useful draft should explain the limit or ask you to review it. A cheerful promise that your team cannot keep is a failed result, even if the wording sounds friendly.',
  ),
  heading('Keep a simple record'),
  paragraph(
    'Use a small sheet with the original request, the draft, your correction, and the time spent checking it. Compare that with doing the task yourself. Include the checking time in your decision. If every answer needs rewriting, change the instructions or choose a simpler task before trying again.',
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
  heading('Give the agent a clear boundary'),
  paragraph(
    'A helpful request names the task, the information to use, and the point where the agent should stop. Instead of asking it to handle customer service, ask it to draft replies to delivery questions using your current delivery notes. Say that unusual requests should come back to you.',
  ),
  paragraph(
    'The same boundary applies to the other tasks. A caption draft should use the prices you supply. A follow-up note should go only to people you have chosen. A daily list should show missing information instead of quietly making it up. Small instructions like these make results easier to review.',
  ),
  heading('Review the whole task'),
  paragraph(
    'Try several ordinary examples and a few awkward ones before relying on the setup. Check the facts as well as the tone. Record what you changed and why, then update the instructions. Count the time spent correcting drafts too. Keep the task only when the complete process feels useful for your team.',
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
    'An AI project can get stuck when the information it needs is scattered, out of date, or known by only one person. A little preparation before you start makes the project smoother and the results more useful.',
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
  heading('Make a small reference pack'),
  paragraph(
    'For a customer reply pilot, your pack could contain one current price list, a delivery guide, and a page of approved answers. Put a date and an owner on each file. Add a short note saying which file wins if two answers disagree. Keep a separate list of questions that need a person.',
  ),
  paragraph(
    'Use made-up names in your test cases when a real identity adds nothing to the task. For example, you can check whether a delivery reply is correct without sharing the full customer conversation. Ask yourself what information is needed for the answer, then leave the rest out of the reference pack.',
  ),
  heading('Check it with someone who does the work'),
  paragraph(
    'Ask a teammate to answer a few sample questions using only the pack. If they need to ask you for missing details, the AI will need those details too. Fix the gaps before the pilot. Keep a note of each change so you can explain why a result changed later.',
  ),
  heading('What you can skip'),
  paragraph(
    'You do not need to move everything into one system first. You do not need perfect formatting. You can start with a small, current set of information and add more once the first task works.',
  ),
  heading('Where we can help'),
  paragraph(
    'If you are not sure what to gather, an AI Discovery session can map it with you. If you already know the task, our AI Build service starts by looking at the information your team has today. Book a free consultation and tell us what you have.',
  ),
)

const safeAi = doc(
  heading('The short version'),
  paragraph(
    'An AI tool that works but leaks data, makes decisions nobody checks, or cannot be explained is not a win. Safe AI is planned from the first day: what it may see, what it may do, who checks it, and how you would know if something went wrong.',
  ),
  heading('Start with what the AI may see'),
  paragraph(
    'Give the tool only the information its task needs. A tool that answers delivery questions does not need payment details or your whole customer list. Less access means less to lose if something goes wrong.',
  ),
  bulletList(
    'Keep passwords, payment details, and identity numbers out of AI tools.',
    'Check where the tool stores what you send it, and for how long.',
    'Use separate accounts for each person, so access can be removed when someone leaves.',
  ),
  heading('Decide what the AI may do on its own'),
  paragraph(
    'Drafting a reply is low risk. Sending money, changing prices, or promising a refund is not. Write down which actions the AI may take alone and which ones need a person to approve first. Start strict and loosen the rules only when the results earn it.',
  ),
  heading('Keep a person in the loop'),
  paragraph(
    'Someone should read the results, at least at the start, and be able to say why a result is right or wrong. Name that person. When nobody owns the checking, small mistakes repeat quietly.',
  ),
  heading('Keep a record'),
  paragraph(
    'Keep a simple log of what the AI was asked and what it produced, for the tasks that matter. When a customer asks why they got a certain answer, you can look it up instead of guessing. A record also shows whether the tool is getting better or worse over time.',
  ),
  heading('Plan for mistakes'),
  paragraph(
    'AI can be wrong while sounding sure of itself. Decide in advance what happens when it is: who is told, how the mistake is fixed, and how you switch the tool off if you need to. A clear plan turns a bad moment into a small one.',
  ),
  heading('Check a tool before you trust it'),
  paragraph(
    'Before a new AI tool touches real work, ask a few plain questions. Who makes it, and where is it based? Does it keep what you type, and can you delete it? Can you control who on your team has access? If the answers are hard to find, treat that as an answer too.',
  ),
  paragraph(
    'A free tool is not always a bad choice, and a paid one is not always safe. What matters is whether you understand what happens to your information once you press send.',
  ),
  heading('Test it on real cases before you rely on it'),
  paragraph(
    'A demo shows the best case. Your customers will bring the odd questions, the typos, and the angry messages. Try the tool on a set of real, everyday cases, including a few hard ones, and write down where it fails. Also try asking it to do something it should refuse, and check that it does.',
  ),
  paragraph(
    'Only move a task into daily use once the results are good enough that checking them is quick. If every answer needs heavy fixing, the tool is not ready yet, however impressive it looked at first.',
  ),
  heading('Review it on a schedule'),
  paragraph(
    'Tools change, prices change, and your business changes. Put a short review in the calendar every few months: is the tool still doing the job, is anyone using it in ways you did not plan, and do the rules still fit? Trust is something you keep earning, not something you set once.',
  ),
  heading('Set simple team rules'),
  paragraph(
    'Most risk comes from everyday use, not from the tool itself. A one-page guide helps more than a long policy nobody reads:',
  ),
  bulletList(
    'Which AI tools the team may use, and for what.',
    'What must never be pasted into them.',
    'Who to ask before trying a new tool or a new use.',
  ),
  paragraph(
    'Some data is covered by data protection rules. If you are unsure what applies to your business, ask a qualified adviser before you share it.',
  ),
  heading('Where we can help'),
  paragraph(
    'In AI Build we design these safeguards into the solution from the start: limited access, protected data, clear rules for what the AI may do, and a record of its work. In AI Enablement we help your team agree on simple rules for safe everyday use. Book a free consultation and tell us what you want to protect.',
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
  {
    slug: 'how-to-use-ai-safely-in-your-business',
    locale: 'en',
    title: 'How to use AI safely in your business',
    excerpt:
      'Working AI is not enough. A plain guide to security, clear rules, and trust before you rely on it.',
    cover: { kind: 'cover-kit', pose: 'typing-laptop', gradient: 'teal' },
    category: aiBasics,
    author,
    publishedAt: '2026-10-13T02:00:00.000Z',
    readingMinutes: readingMinutes(safeAi),
    body: safeAi,
    updatedAt: null,
    seo: seo(
      'How to use AI safely in your business | Sineva',
      'Limit what AI can see and do, keep a person in the loop, keep a record, and set simple team rules. Read the guide.',
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
