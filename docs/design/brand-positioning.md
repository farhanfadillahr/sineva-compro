# Brand & positioning

This document defines **what we sell and to whom**. Every visual, copy, and page-structure decision in this folder derives from it.

## 1. Who Sineva is

Sineva is an **AI consulting company** with two pillars of equal weight on the website:

Brand name: **Sineva** (not "Sineva Tech"). Decision 2026-10-15.

| Pillar | What | Model | Status on website v1 |
|---|---|---|---|
| **Product** | Ready-to-use conversational AI agents (chatbots) for UMKM (Indonesian micro, small and medium enterprises). One agent can help with many kinds of work: replying to customer chats, managing social media content, recording and summarizing finances, following up with prospects, and more. | SaaS | Product page + waitlist (the product is not sold through website v1). |
| **Services** | AI consulting: helping businesses find, build, and run AI solutions that fit their processes. | Per-project service | Services page + consultation form + WhatsApp. |

How we differ from Sintra (the design reference): Sintra sells only SaaS. Sineva sells **a product and services**, so every page must clearly answer "do I use the product myself, or do I need help?"

## 2. Positioning statement (working, not public copy)

> For business owners and teams who want to use AI without the hassle, Sineva provides ready-to-use AI agents and AI consulting support, so daily work gets done faster with tools that genuinely fit their business.

## 3. Offering architecture

### 3.1 Product: Sineva AI Agents (working name)

> **The product name has not been decided by the Founder.** "Sineva AI Agents" is a working name in the documents. Change it in one place (messages + content DB) once it is decided.

The capabilities that may be mentioned on the website are **only those confirmed by the product team (team `CBT`)**. Capability categories used as the page structure (contents pending confirmation):

| Category (structure) | Example UMKM tasks | Copy notes |
|---|---|---|
| Customer chat | Answering customer questions, opening hours, order status | Do not claim channels (WhatsApp/IG) before they are confirmed |
| Social media | Content ideas, caption drafts, posting schedule | |
| Sales follow-up | Following up with prospects, recording leads | |
| Finance & admin | Recording transactions, summarizing expenses | Must not sound like financial advice |
| Operations | Daily summaries, reminders, SOPs | |

Sintra's visual model that we borrow: each capability is shown as **"one task handed off to the agent"** (example pattern: *"Sino, reply to today's customer chats"*). We do **not** copy Sintra's "many characters = many employees" concept. Sineva has **one mascot, Sino**, who plays an agent with many abilities. This matches our product (one agent, many capabilities) and makes 3D assets cheaper to produce.

### 3.2 Services: AI Consulting

**Proposed** service structure (the Founder must approve the final names and content; the page structure can already be built):

| Service (proposed) | Who it is for | Outcomes discussed |
|---|---|---|
| **AI Discovery** | Businesses that don't know where to start | Process mapping, realistic AI opportunities, recommended first steps |
| **AI Build** | Businesses that already know their problem | Custom AI agents, workflow automation, integration into the systems in use (including a web app if needed) |
| **AI Enablement** | Teams starting to use AI | Team training, usage guides, support after go-live |

Change from PRD Rev. 2: **Web Development is no longer a standalone service.** Web development can still be delivered as part of AI Build. The consequences are in [PRD Rev. 3](../prd/2026-10-14-company-profile-prd.md) and the [ticket plan](../superpowers/plans/2026-10-15-linear-alignment.md).

### 3.3 How the two pillars relate

The mental diagram that must be readable on the Home page:

```
              Sineva  (AI consulting company)
              ┌─────────────────┴─────────────────┐
         Use it yourself                     Let us build it with you
      Product: Sineva AI Agents            Services: AI Consulting
      (UMKM, self-serve, waitlist)         (UMKM, companies, startups)
              └──────── same AI know-how ─────────┘
```

Rule: **two main CTAs always sit side by side** in the hero and the closing CTA:
- Primary: **Book a free consultation** (Services, the main conversion goal, per D3 of the PRD).
- Secondary: **Join the waitlist** (Product), until the product launches; it becomes **Try Sineva AI Agents** after launch.

## 4. Target users

| Segment | Most relevant pillar | What they need from the website |
|---|---|---|
| **UMKM** (online shops, F&B, local services) | Product, then Services | Simple language, real task examples, quick contact via WhatsApp |
| **Mid-size companies/corporates** | Services | Clear working process, proof of competence, data security |
| **Startups** | Services (AI Build) | Speed, technical quality, a partner who understands AI |

## 5. Personality

| We are | We are not |
|---|---|
| Friendly and down to earth | Stiff and corporate |
| Clear, straight to the point | Full of AI jargon |
| Optimistic but honest | Hype ("revolutionary", "10x") |
| Helpful like a colleague | Preachy |

This personality is translated into visuals through: a bright, spacious canvas, one strong brand color (teal), rounded corners, subtle motion, and Sino as the friendly face. Details in [tokens.md](tokens.md), [motion.md](motion.md), and [mascot-sino.md](mascot-sino.md).

## 6. Website language

- **Primary language: English (`en`)**, the default locale and the only locale at v1 launch.
- **i18n-ready:** all UI text goes through next-intl messages, DB content is stored per `(entity_id, locale)`, and slugs are per locale. Adding Bahasa Indonesia later only requires adding a locale and content, with no structural change.
- The existing Indonesian draft copy (`docs/content/copy-id.md`) is **kept as source material for the `id` locale later**, not as a source of v1 copy. Its positioning (Web Development + AI & Automation) is outdated.

Copywriting rules are in [copywriting.md](copywriting.md).
