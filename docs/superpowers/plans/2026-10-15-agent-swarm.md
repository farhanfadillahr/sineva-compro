# Agent swarm playbook (implementation)

How to implement the [website redesign plan](2026-10-15-website-redesign.md) and the [admin CMS plan](2026-10-15-admin-cms.md) with a swarm of coding agents, so work runs in parallel without losing accuracy. Applies to Claude Code; the roles also work for humans pairing with agents.

## 1. Skills to use when available

Check the session's skill list first. Use the skill when it exists; otherwise follow the equivalent section of this playbook.

| Purpose | Skill (if installed) | Fallback in this doc |
|---|---|---|
| Parallel independent tasks | `superpowers:dispatching-parallel-agents`, `agent-teams` (needs `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) | §3 lanes |
| One subagent per task with review between tasks | `superpowers:subagent-driven-development` | §4 loop |
| Deterministic multi-agent pipelines (fan-out, verify, resume) | `dynamic-workflows` / `workflow-authoring` (Workflow tool, only when the user opts in) | §5 waves |
| Test-first | `superpowers:test-driven-development`, `tdd`, `qa-unit-test`, `qa-integration-test` | §4 step 2 |
| E2E | `qa-regression` (Playwright) | CPR-56 |
| UI from the design system | `frontend-design`, `ui-ux-pro-max:ui-styling`, `design-to-code` (Figma, if Q5 screens exist) | `docs/design/` |
| Next.js correctness | `nextjs-app-router-fundamentals`, `nextjs-server-client-components`, `nextjs-advanced-routing`, `nextjs-anti-patterns` + `node_modules/next/dist/docs/` (AGENTS.md rule) | |
| Security | `secure-coding`, `security-review` | §4 step 5 |
| Review and cleanup | `code-review`, `simplify` | §4 step 5 |
| Finish line | `superpowers:verification-before-completion` | §4 step 6 |

Model policy: the orchestrator runs on the session's main model; **every subagent runs on `sonnet`** (product owner rule).

## 2. Roles

| Role | Count | Does | Never does |
|---|---|---|---|
| **Orchestrator** | 1 (main session) | Picks the next wave, writes task briefs, assigns file ownership, merges results, keeps the plan and Linear in sync | Write feature code itself when a lane can |
| **Spec reader** | 1 per wave, short-lived | Reads the ticket, PRD sections and the exact `docs/design/` sections, returns a task brief: files, contracts, acceptance tests, gotchas | Edit files |
| **Test writer** | 1 per lane | Writes the failing tests first (unit, DB, HTTP, component), runs them, proves RED | Touch production code |
| **Implementer** | 1 per lane | Makes the tests GREEN with the smallest change, following tokens and components | Change tests to pass, change files outside its ownership |
| **Reviewer** | 1 per lane, fresh context | Reviews the diff against the brief, the design docs, security and a11y rules; returns findings | Fix silently; it reports |
| **Verifier** | 1 per wave | Runs `npm run lint`, `typecheck`, `test`, `format:check`, `build`, DB/HTTP suites when touched, Lighthouse/axe for page tickets; attaches evidence | Claim success without output |

## 3. Lanes and file ownership

Parallel lanes only when their files do not overlap. The orchestrator writes an ownership map per wave:

```
Lane A  src/components/ui/**, src/app/globals.css          (CPR-26 tokens + primitives)
Lane B  src/i18n/**, messages/**, tests/**/i18n*           (NEW-i18n-en)
Lane C  tests/unit/copy-lint.test.ts, src/lib/copy/**     (NEW-copy-lint)
Lane D  src/lib/motion/**, src/components/motion/**        (NEW-motion-foundation)
```

Rules:
- Shared files (`package.json`, `package-lock.json`, `globals.css` token block, `messages/en.json`, `src/lib/cache/tags.ts`, Drizzle schema index) have **one owner per wave**. Other lanes request changes through the orchestrator.
- Each lane works in its own git worktree (`isolation: "worktree"` for subagents, or `git worktree add`) on a branch named `faishal/<ticket>` (landing) or `farhan/<ticket>` (CMS).
- Contracts before consumers: DTO types, fixtures, and cache tags (`NEW-cms-contract`) land before the landing lanes that read them, so landing work uses fixtures while CMS lanes build the real queries.
- One ticket = one PR. Small PRs merge faster and keep reviews accurate.

## 4. Per-lane loop (strict TDD)

1. **Brief.** Spec reader produces: ticket ID, acceptance criteria, files to touch, contracts, design doc sections (with § numbers), test list, gotchas.
2. **RED.** Test writer adds failing tests and pastes the failing output.
3. **GREEN.** Implementer makes them pass, uses only semantic tokens and existing primitives, no hardcoded strings (messages or DB), no `—`/`–` in copy.
4. **Refactor.** Implementer tidies with tests green.
5. **Review.** Fresh reviewer checks: acceptance criteria met, design-doc conformance (tokens, motion durations, copy rules), a11y (focus, keyboard, reduced motion), security (auth guards on every admin query/action, input validation, secrets), performance budgets. Findings go back to the implementer; repeat until clean.
6. **Verify.** Verifier runs the full gates and attaches command output to the PR description (evidence, not assertion).
7. **PR.** Conventional Commit messages, PR template from the team rules, link the Linear ticket, update ticket status.

## 5. Waves (suggested schedule)

Each wave starts only when its blockers are merged. Lanes inside a wave run in parallel.

| Wave | Landing lanes (Faishal) | CMS lanes (Farhan) | Gate to next wave |
|---|---|---|---|
| W1 | NEW-i18n-en (CPR-72), NEW-copy-lint (CPR-73) | NEW-cms-contract (CPR-81) | Contracts and EN routing merged |
| W2 | CPR-26 tokens + primitives, NEW-motion-foundation (CPR-74) | NEW-seaweedfs (CPR-67) (infra), CPR-29 settings schema | Tokens merged (blocks all UI) |
| W3 | CPR-32 header/footer, NEW-section-blocks (CPR-75), NEW-logo-intro (CPR-76) | NEW-cms-shell (CPR-80), CPR-23 media | Shell + blocks merged |
| W4 | CPR-36/43 Home, CPR-39 Product, CPR-37 Services | NEW-cms-pages (CPR-82), NEW-cms-product (CPR-83), NEW-cms-faq (CPR-84), CPR-27 | Pages render from fixtures, then real queries |
| W5 | CPR-38 Work, CPR-40/44 Blog, CPR-41 About, CPR-42 Contact, CPR-35 | CPR-30, CPR-31, CPR-28, NEW-cms-seo (CPR-85), CPR-33, NEW-cms-preview (CPR-88) | All pages on real data |
| W6 | NEW-sino-hero (CPR-77) (after NEW-sino-asset-web (CPR-69)), NEW-lottie-library (CPR-71) | NEW-cms-email (CPR-86), CPR-46, CPR-48, CPR-50, NEW-cms-audit (CPR-87) | Leads flow end to end |
| W7 | CPR-52, CPR-57, CPR-58, CPR-59 | CPR-56 E2E (shared), CPR-53 | DoD checklist |

Capacity rule: at most **4 parallel lanes** per person per wave. More lanes increase merge conflicts faster than they save time.

## 6. Task brief template

```markdown
## Task: <ticket> <title>
Owner lane: <A-D> · Branch: <name> · Worktree: <path>
Read first: docs/design/README.md, <doc §>, PRD <§/FR IDs>
Files you own: <globs>
Do not touch: <globs>
Contracts: <types/fixtures/tags to use or create>
Acceptance tests to write first:
- [ ] <test 1>
Gotchas: <list>
Done when: tests green, gates green, reviewer clean, evidence pasted
```

## 7. Accuracy safeguards

- Agents read the installed Next.js docs before writing Next code (AGENTS.md rule).
- No agent marks a ticket done; the orchestrator does after the verifier's evidence.
- Reviewer runs with no memory of the implementation conversation (fresh context) to avoid rubber-stamping.
- When an agent hits ambiguity in the docs, it stops and asks the orchestrator; the orchestrator fixes the doc in the same PR so the next agent does not hit it again.
