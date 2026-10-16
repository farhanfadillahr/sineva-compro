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
