# CMS (custom admin content)

The custom admin at `/admin` edits public content stored in PostgreSQL. The public pages read it
through the same `PublicContentSource` contract as the static launch content, so switching source
changes no component and no design.

## Content source

| `CONTENT_SOURCE` | Public pages read |
| --- | --- |
| unset or `static` | Typed launch content in `src/content/static` (main, Vercel phase 1) |
| `database` | Published rows edited in `/admin`, cached with the tags in `src/lib/cache/tags.ts` |

Reads that no CMS table backs yet fall back to the static content
(`src/features/cms/database-source.server.ts`). Saving in the admin invalidates the matching cache
tags, so the next request shows the change without a deploy.

Switching a server to the database:

```sh
npm run db:migrate
npm run db:seed            # base: launch content, inserted only when missing
CONTENT_SOURCE=database npm run build
```

The base seed copies the static launch content into the tables, so the site looks exactly the same
right after the switch. It never overwrites a row an editor changed. `npm run db:seed -- --demo`
adds clearly marked demo rows on a loopback database; `--purge-demo` removes untouched ones.

## Building blocks

- `src/features/cms/fields.ts`: field descriptors. The admin renders forms from them and the server
  validates submissions with the same descriptor (length limits, em/en dash rule, formats).
- `src/features/cms/mutation.server.ts`: one transaction per save with the principal re-read inside
  it, media usage rows and the audit entry.
- `src/components/admin/cms/`: generic form shell and field renderer.

## Site settings (CPR-29)

`/admin/settings`. Editors change Contact, Social and WhatsApp templates. Brand, Lead routing,
Feature toggles, Analytics, Verification and SEO are Admin only; the server keeps the stored values
of those groups for an Editor even if the request carries changes.

WhatsApp template placeholders (contract with CPR-45). They are resolved on the server; the site
receives final messages.

| Placeholder | Meaning | Allowed in |
| --- | --- | --- |
| `{site}` | Site name | every template |
| `{product}` | Product name (Brand) | product |
| `{service}` | Service title | per-service templates |

Unknown placeholders are rejected on save. The WhatsApp number is stored in E.164 (`+62...`); the
`wa.me` link uses digits only.

## Page content (CPR-82)

`/admin/pages` lists the ten fixed pages with their status per locale; `/admin/pages/<id>` edits
one page section by section, in page order. Sections live in code (no page builder); optional
sections have a "Tampilkan bagian ini" switch. Pages save as published (v1).

Each page document is stored in `page_content` with a `version`. To change a page shape, append a
migration to `src/features/pages/migrations.ts` and update the descriptor in
`src/features/pages/fields.ts` and the static content together; older rows are migrated on read.
A unit test runs every page's launch content through its descriptor, so drift fails the suite.

## Ordered collections (CPR-83 onwards)

Small collections share one engine (`src/features/collections/`): an item table with a stable
`key`, `sort_order` and language-independent `data`, plus one translation row per locale. The
descriptors in `configs.ts` render the admin form and validate every write and read. Keys are
kebab-case and cannot change after creation. "Simpan urutan" saves the display order in one go;
it is refused if the list changed since the page was opened.

Seed: `--module=<name>` with `capabilities`, `business-types` and the later collections. Base
inserts launch rows whose key is missing; demo rows use a `demo-` key and `is_demo = true`, and
`--purge-demo` removes only those.

## Product (CPR-83)

`/admin/product`: launch status (Segera hadir or Tersedia), capabilities and business types. The
status is stored once in the Product page document; Home and Product read it, so switching it moves
the site's calls to action from the waitlist to "try" without a deploy. Business types are the
Product page tabs only; the contact and waitlist segment list stays a fixed list in code.

## FAQ library (CPR-84)

`/admin/faq`: one library for Home, Product, Services and each service page. Tags decide where an
item appears (`home`, `product`, `services`, `service:<slug>`, listed from the current services).
The library order applies inside every tag; reorder from the "Semua" view. Answers are limited to
paragraphs and lists with bold, italic and links. The landing page builds `FAQPage` JSON-LD from
the same items with plain-text answers (`buildFaqPageJsonLd`). Tags live in the item's validated
`data`, which keeps the library on the shared collection engine; a separate tag table can be added
if the library grows beyond a few hundred items.

## Services (CPR-27)

`/admin/services`: list in site order with publish status, and an editor per service. Slugs are
per locale and unique within it (database constraint `service_translation_locale_slug_unique`).
New services start as drafts with the Home "How we work" steps as their process. A published
service must be unpublished before it can be deleted. The summary is the card's "who it is for"
line ("For ..."). Service FAQs come from the FAQ library (`service:<slug>` tags). Saving a service
also refreshes the site settings cache, because the per-service WhatsApp messages list services.

## Team and authors (CPR-28)

`/admin/team`: name, photo (from Media), social link and "show on About" are language-independent;
role and bio are per locale. Only members with "show on About" appear on the About page, and only
when the About team section and the site setting `showTeam` are on. Any member can be an article
author; the article keeps pointing at the member's stable id when the profile changes. The launch
has no members until someone agrees to be listed.

## Blog (CPR-31) and publishable documents

Posts (and Work, CPR-30) keep a draft and a published snapshot per locale. "Simpan draf" never
changes the site; "Terbitkan" copies the saved draft, fully validated, to the snapshot in one
transaction; "Batalkan publikasi" removes the snapshot and keeps the draft. Drafts may be
incomplete, but formats, limits, the copy rule and the rich text node list apply on every save.
Slugs are unique per locale for drafts and published snapshots (database constraints). An article
only appears in a locale where it is published; there is no cross-locale fallback.

Categories (`/admin/blog/categories`) use the collection engine; the key is the slug used by
`/blog?category=<slug>`. A category or team member still used by an article cannot be deleted.
Authors are team members; without one, the byline name is shown (launch articles: "Sineva team").

### Preview

"Pratinjau draf" opens `/admin/preview?kind=posts&id=<id>&locale=<locale>`. It needs an admin
session, resolves the public path from the database and enables Next.js Draft Mode for that
browser. The public page then reads drafts only while the session is valid, bypasses every cache
and is sent with `X-Robots-Tag: noindex, nofollow`. End it with a POST to `/admin/preview/exit`.
