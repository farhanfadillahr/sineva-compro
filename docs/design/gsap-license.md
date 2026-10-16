# GSAP license check

[motion.md](motion.md) section 8 asks for a quick license check before launch, because the GSAP "Standard 'no charge'" license is free to use but is not an OSI license. This is that check. It is an engineering read, not legal advice: someone with authority should still sign off on the license text.

## What we use

- `gsap` 3.15.0 and its `ScrollTrigger` plugin (pinned in `package.json`), loaded on demand by `src/lib/motion/gsap.ts` for the sticky step story and later scroll scenes.
- The installed package declares `"license": "Standard 'no charge' license: https://gsap.com/standard-license."` (`node_modules/gsap/package.json`).
- Use case: a public marketing website and a custom admin panel for the same company. Nothing we ship lets end users build or edit animations.

## Findings

Fetched on 2026-10-16 with WebFetch (the tool returns a model-written summary of the page, so the quoted clauses below are worth re-reading on the original pages before sign-off). Confidence: official sources, summarised.

| Question | Answer | Source |
|---|---|---|
| Is commercial use on a company website allowed? | Yes. The license grants a non-exclusive, worldwide right to use GSAP "on any website, web application, or digital interface by any person or entity". The FAQ states "Commercial usage is covered under the standard license." | [standard-license](https://gsap.com/standard-license) |
| Are the plugins we use covered (ScrollTrigger, SplitText if needed)? | Yes. The FAQ lists the formerly members-only plugins as included at no charge, and ScrollTrigger is in the plugin list. This statement is in the FAQ, not the license body, so treat the license body as the authority if they ever differ. | [standard-license](https://gsap.com/standard-license), [gsap.com/pricing](https://gsap.com/pricing) |
| Is attribution required? | No attribution clause. We must not remove or alter proprietary notices or branding inside the GSAP files, which our bundling does not do. | [standard-license](https://gsap.com/standard-license) |
| What is prohibited? | Using GSAP in a visual, no-code animation builder that competes with Webflow's animation tooling, and reverse engineering GSAP to build such a product. A marketing site and a content admin are neither. | [standard-license](https://gsap.com/standard-license) |
| Version and date of the text | Effective 2025-04-30, last modified 2025-05-30. The pricing page says GSAP is free for all users thanks to Webflow's support. | [standard-license](https://gsap.com/standard-license), [gsap.com/pricing](https://gsap.com/pricing) |

## Gotchas

- **The license can change.** Webflow may amend it, and continued use of newer releases counts as acceptance. If we reject a revision we may keep using earlier versions under their original terms but not newer ones. That is the reason `gsap` stays pinned to an exact version: upgrading is a decision, and the license text should be re-read as part of it.
- **The "competing visual builder" clause is vaguely worded** ("similar to", "materially assists"). If the admin panel ever grows an animation or motion editor for end users, re-check before shipping it. Today it has none.
- **AI-generated GSAP code** is explicitly not a prohibited use according to the FAQ.
- The license is incorporated into Webflow's Terms of Service and prevails over them for GSAP. The Terms of Service were not reviewed here.

## Result

No blocker found for the current use. Open item: legal or the owner confirms the license text once before launch (not done here).
