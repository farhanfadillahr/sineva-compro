# Copywriting guide

Applies to all public text: pages, buttons, forms, error messages, emails, metadata, alt text, and WhatsApp templates. Copy language for v1: **English**. Copy examples in this document are in English.

## Public voice update (2026-10-16)

Lead with the help a visitor wants: a task made easier, a useful first step, or support for their team. Keep the company category as internal positioning. Avoid opening with "Sineva is an AI consulting company". Prefer "A little help with the tasks that fill your day" and "Let us find where AI can make things easier for you". Keep claims modest, concrete and human.

## 1. Hard rules (checked in review and by the content lint)

1. **No em-dash (`—`) or en-dash (`–`) in public copy.** Split into two sentences, or use a period, comma, colon, or parentheses. Number ranges are written `10 to 50` or `10-50` (plain hyphen).
   - Wrong: `AI agents — built for small businesses`
   - Right: `AI agents built for small businesses.`
   - Enforcement: a unit test scans `messages/*.json` and seed content strings for the characters `—` and `–` (ticket in the [implementation plan](../superpowers/plans/2026-10-15-website-redesign.md)). The admin also validates public content fields with the same rule.
2. **Never invent facts.** No customer numbers, testimonials, client logos, ratings, certifications, or results ("save 40 hours") until there is data. Sintra patterns such as "40,000+ business owners" and five-star ratings are **not used** until there is real evidence. This continues the rule in `docs/content/outline.md` §19.
3. **Do not promise business results** (revenue up, costs down X%) and do not mention product features that team `CBT` has not confirmed.
4. **One idea per sentence.** Body sentences are at most ±20 words.
5. **Brand:** `Sineva` (company name), `Sino` (friendly AI companion). Describe Sino to visitors as a companion or helpful friend, never as a mascot. Never write "Sineva Tech" in public copy. The product name follows [brand-positioning.md](brand-positioning.md) §3.1.

## 2. Voice

| Principle | Do | Avoid |
|---|---|---|
| Simple | Everyday words: *help, build, reply, save time* | *leverage, synergy, cutting-edge, revolutionize* |
| Direct | Start with the benefit or the action | Long openers, small talk |
| Human | The pronouns *you* and *we* | Passive sentences and abstract nouns |
| Honest | *"Tell us what slows your team down."* | *"The #1 AI platform"* |
| Warm | Light greetings, Sino may "speak" in microcopy | Excessive joking on serious pages (privacy, data errors) |

Headline pattern borrowed from Sintra (its structure, not its sentences): **a short statement + a second sentence that removes doubt.** Example structure: *"Your AI team for everyday work. Ready when you are."*

## 3. Structure of each section

```
Eyebrow (optional, 1-3 words, uppercase mono)    e.g. PRODUCT
Headline (max 8 words, main title 10)            e.g. Hand off the busywork to Sino
Body (1-2 sentences, max 30 words)               e.g. Sino replies to customers, drafts posts,
                                                      and keeps your books tidy. You stay in charge.
CTA (1 primary, optionally 1 secondary)          e.g. Join the waitlist · See what Sino can do
```

Capitalization: **Sentence case** for headlines, buttons, menus, and labels (not Title Case like Sintra). Reason: friendlier to read, consistent with the casual tone, and easier to localize.

## 4. CTA lexicon

CTAs use a **verb + object**, 2-4 words, no period.

| Goal | Main label | Allowed variations | Don't |
|---|---|---|---|
| Consultation (main conversion) | **Book a free consultation** | Talk to us · Get a free consultation | Submit · Click here · Learn more |
| WhatsApp | **Chat on WhatsApp** | Message us on WhatsApp | WhatsApp |
| Waitlist | **Join the waitlist** | Get early access | Sign up now!!! |
| Product | **See what Sino can do** | Explore the Sineva Product Suite | |
| Services | **Explore services** | See how we help | |
| Service detail | **Plan my AI project** | Talk about this service | |
| Portfolio | **See our work** | View project | |
| Blog | **Read article** | Read more articles | Read more (without context) |
| Contact form (submit) | **Send message** | | Submit |
| Waitlist (submit) | **Join waitlist** | | |

Button labels must stay clear when read **without context** (screen readers read a list of links).

## 5. Microcopy

| Situation | Pattern | Example |
|---|---|---|
| Field label | Short noun | `Work email`, `WhatsApp number` |
| Helper text | Why we ask | `We only use this to reply to you.` |
| Validation error | What is wrong + how to fix it | `Enter an email like name@company.com.` |
| Server error | Calm, offer another way | `We couldn't send your message. Your answers are still here. Try again, or chat with us on WhatsApp.` |
| Form success | Confirmation + next step | `Thanks, Rina. We'll reply within one business day.` (a time figure only if the Founder approves the SLA) |
| Waitlist success | Short | `You're on the list. We'll email you when Sino is ready.` |
| Empty state | Positive, give direction | `No articles yet. Check back soon, or talk to us today.` |
| 404 | Sino is lost, show the way home | `Sino can't find this page. Let's get you back on track.` |
| Loading | Avoid "Please wait" | `Sending...` |

## 6. WhatsApp templates (EN)

Per context, managed in Site Settings (FR-LEAD-02). Draft:

| Context | Message |
|---|---|
| General | `Hi Sineva, I'd like to talk about using AI in my business.` |
| Services | `Hi Sineva, I'm interested in {service name}. Can we talk?` |
| Product | `Hi Sineva, I'd like to know more about the Sineva Product Suite.` |
| Thank-you page | `Hi Sineva, I just sent the contact form and would like a faster reply.` |

## 7. Metadata

- Meta title ≤ 60 characters, pattern: `{Page topic} | Sineva`.
- Meta description ≤ 160 characters, one benefit sentence + one call-to-action sentence.
- No em-dash in metadata and OG either.

## 8. Alt text

- Decorative Sino next to text: `alt=""` (the surrounding text already explains it).
- Sino conveying information (e.g. demonstrating a step): describe the action, `Sino sorting customer messages into folders`.
- Do not write `image of` or `3D render of`.

## 9. Copy review checklist

- [ ] No `—` or `–`
- [ ] Headline ≤ 8 words (hero ≤ 10)
- [ ] Every section has one clear primary CTA
- [ ] No unverified number claims, testimonials, or features
- [ ] Sentence case
- [ ] Translatable: no idioms or wordplay that cannot be localized, no text inside images
- [ ] UI strings are in `messages/en.json`, not hardcoded in components
