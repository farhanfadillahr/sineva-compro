# Public content contract

Typed public reads shared by the landing pages and the CMS. Landing code builds against fixtures
now. The CMS replaces the fixture source with a database source later, without changing a call
site. Plan: `docs/superpowers/plans/2026-10-15-admin-cms.md` section 1.

## Rules

1. Every function takes an explicit `locale`.
2. Published data only, never drafts.
3. Safe projection: no internal ids, lead data, author emails or storage keys.
4. Empty is explicit: `[]` for collections, `null` for a missing item or optional field, never
   placeholder text. Optional sections carry `visible: boolean`.
5. Cache tags come only from `src/lib/cache/tags.ts`. Invalidation is CPR-33.
6. Field limits (meta title 60, meta description 160, headline and body words) live in
   `limits.ts` and match `docs/design/copywriting.md`.
7. A DTO change affects both sides. Update the fixtures in the same PR and tell the other owner.

## Files

| File                | Purpose                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| `types.ts`          | DTOs, page keys, pose and icon keys                                         |
| `public.ts`         | `PublicContentSource` interface (no `server-only`, safe to import anywhere) |
| `fixture-source.ts` | `createFixtureContentSource()`, serves the fixtures below                   |
| `limits.ts`         | `FIELD_LIMITS` and `countWords`                                             |

## Functions

Fixtures are in `tests/fixtures/public/`. Only `en` has fixture content. Any other locale returns
the empty contract, which is useful for testing hidden sections.

| Function                                           | Returns                       | Fixture                          |
| -------------------------------------------------- | ----------------------------- | -------------------------------- |
| `getSiteSettings(locale)`                          | `SiteSettingsDTO \| null`     | `site-settings.ts`               |
| `getPage(key, locale)`                             | `PageContentMap[key] \| null` | `pages.ts` (one per `PageKey`)   |
| `listServices(locale)`                             | `ServiceSummary[]`            | `services.ts` (`services`)       |
| `getService(slug, locale)`                         | `ServiceDetail \| null`       | `services.ts` (`serviceDetails`) |
| `listCapabilities(locale)`                         | `ProductCapability[]`         | `capabilities.ts`                |
| `listIndustries(locale)`                           | `Industry[]`                  | `capabilities.ts` (`industries`) |
| `listFaq(tag, locale)`                             | `FaqItem[]`                   | `faq.ts`                         |
| `listWork({ locale, service?, featured? })`        | `WorkSummary[]`               | `work.ts` (`work`)               |
| `getWork(slug, locale)`                            | `WorkDetail \| null`          | `work.ts` (`workDetails`)        |
| `listPosts({ locale, category?, page, pageSize })` | `PostPage`                    | `posts.ts` (`posts`)             |
| `getPost(slug, locale)`                            | `PostDetail \| null`          | `posts.ts` (`postDetails`)       |
| `listCategories(locale)`                           | `Category[]`                  | `team.ts` (`categories`)         |
| `listTeam(locale)`                                 | `TeamMember[]`                | `team.ts` (`team`)               |

`MediaAsset` is embedded in the DTOs above (covers, galleries, photos, OG images). It has no
standalone read function.

## Using the fixtures

```ts
// Relative imports: vitest has no `@/` alias configured. Paths shown from `tests/unit/`.
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import { publicFixtures } from '../fixtures/public'

const content = createFixtureContentSource()
const home = await content.getPage('home', 'en')
```

Use `publicFixtures` directly when a component test only needs one DTO.
