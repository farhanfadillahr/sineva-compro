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

## Work (CPR-30)

`/admin/work` uses the same draft and publish flow as posts (entity `portfolio` in code and
database; "Work" in the UI and URLs). Project type is required; internal demos carry
`internal-demo`, which the page shows as "Internal demo project". The form reminds editors to write
only real, verified results. The Work link, page and Selected work sections switch on by themselves
once a work item is published. Demo seed: three flagged `[Demo]` internal projects (noindex).

## SEO and redirects (CPR-85)

- Per-document SEO (pages, services, posts, work): title (60) and description (160) with live
  counters, OG image (empty uses the generated card), and a snippet and card preview using the
  site title template. Canonical override and noindex are Admin only; the server keeps the stored
  values for an Editor.
- `/admin/settings/seo` (Admin): title template (must contain `{title}`), default description,
  the site-wide index switch and the Search Console token. Organization JSON-LD uses the Brand
  name and logo and the social links. Indexing also needs `SITE_INDEXABLE=true` in production;
  previews stay noindex.
- `/admin/redirects` (Admin): manual 301/308 redirects. Duplicate sources, loops and chains longer
  than 5 hops are refused. A published slug change (service, post, work) creates a 301 from the old
  path in the same transaction as the change, re-points older redirects at the new path and removes
  a redirect away from the new path. The proxy resolves redirects only with
  `CONTENT_SOURCE=database`, never for `/admin` or `/api`, from a 30-second in-memory cache.

## Cache refresh (CPR-33)

Every CMS write calls `revalidateChange` after its transaction commits; the mapping from a change to
cache tags is in `src/features/cms/invalidation.ts` (unit tested). All locales are refreshed, a slug
rename refreshes the old and new item, lists and the sitemap follow the entity, and settings
refresh every page through the layout. A failed or rolled-back write never reaches the refresh.
Drafts and previews are never cached, so they never need a refresh.

## Preview of unsaved pages and services (CPR-88)

"Pratinjau perubahan" in the page and service editors stores the current form state (validated
like a draft) in `preview_state` for ten minutes and opens `/admin/preview/state?token=...`. The
token is HMAC-signed with `BETTER_AUTH_SECRET` and expires with the row. The route needs an admin
session and a valid token, sets a short-lived httpOnly cookie, enables Draft Mode and opens the
real page, which renders the state through the normal DTO path (no cache, `noindex`). Previews
never write content and never refresh caches. Expired rows are removed whenever a preview is
created.

## My profile (CPR-90)

`/admin/profil` for every signed-in user: name (email is read-only; Admins change Editor emails in
Users), avatar (content-sniffed image, cropped to a 256 px WebP, stored in private storage and
served through a short-lived signed URL), password change (current password checked, a wrong one
counts toward the CPR-24 lockout; all other sessions are revoked in the same transaction), active
sessions (device, IP, last active; own sessions only, never tokens) and preferences (table density,
sidebar default) stored per user. Revoking sessions needs the password again when the current
session is older than 15 minutes. Every change is audited (`profile`).

## Email settings (CPR-86)

`/admin/settings/email` (Admin only): Resend API (recommended) or SMTP, sender, reply-to, the
secret (SMTP password or Resend API key) and the templates per locale (lead notification, lead
auto-reply, waitlist confirmation). "Kirim email uji" sends to the signed-in Admin and shows the
provider response.

- Secrets are encrypted with AES-256-GCM using `SETTINGS_ENCRYPTION_KEY` (32 bytes, base64 or 64
  hex). They are write-only in the UI and never reach the client, logs or the audit log. Without
  the key nothing is saved or sent (no plaintext fallback).
- `RESEND_API_KEY`, or `SMTP_HOST` with `SMTP_PASSWORD` (plus `SMTP_PORT`, `SMTP_SECURITY`,
  `SMTP_USERNAME`), override the stored connection; the page shows "Diatur oleh environment".
- Template values are HTML-escaped inside a fixed branded layout; subjects are forced to one line.
- Key rotation: set the new key, open the page, enter the secret again and save (the old ciphertext
  cannot be read with the new key). Prefer environment secrets in production.
- SMTP from a VPS is often blocked or marked as spam; use the Resend API in production. SPF, DKIM
  and DMARC are needed either way (CPR-12). Sending the waitlist confirmation needs a product
  decision first.

## Contact intake (CPR-78)

`submitContact(input, { locale, sourcePage })` (`src/features/leads/actions.ts`) is the public
server action for the contact form. It validates with `src/lib/leads/contact-schema.ts`, which
reuses the form's own rules (`contact-form-model`) for the visible fields and adds the work email
and the WhatsApp number (stored as digits with the country code: `0812…`, `+62812…` and `62812…`
become `62812…`; other numbers need `+` and a country code). Then it runs the anti-spam hook,
stores the lead with status `new`, locale and source page (never from input), schedules the email
step without blocking, and redirects to `/contact/thank-you`. On failure it returns English field
errors, a form error and the submitted values so the form can keep them and offer WhatsApp.

The launch form (Faishal, CPR-47) still composes a WhatsApp message and posts nothing. To switch it
on, the form adds the email and WhatsApp fields and calls `submitContact`; the design is unchanged
until then. There is no public `/api/leads` route.

## Anti-spam (CPR-49)

Every public submission (contact, waitlist) goes through `checkSpam` before anything is stored:

1. Honeypot: the form sends a hidden, empty `website` field. Filled means a bot; the submission is
   dropped silently and the visitor still sees success.
2. Rate limit: at most 5 submissions per client per 10 minutes, counted by a keyed hash of the
   trusted client IP (`intake_attempt`, rows older than a day are deleted). The IP is trusted only
   behind Cloudflare (`CLIENT_IP_MODE=cloudflare` with a locked origin, CPR-68). Without a trusted
   IP, one shared bucket allows 30 per 10 minutes.
3. Turnstile: the form sends the widget token as `turnstileToken`; the server verifies it with
   `TURNSTILE_SECRET_KEY`. Outside production Cloudflare's always-pass test secret is used;
   production refuses submissions until the real secret is set. The form needs
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (test site key `1x00000000000000000000AA` locally).

## Leads (CPR-46)

`/admin/leads` (Admin only): filters by status, need, business type and date (URL parameters),
paginated, newest first. The detail page shows the submission, copy buttons, a WhatsApp reply link
and the follow-up form (status: Baru, Dihubungi, Berpotensi, Berhasil, Tidak lanjut; internal
notes). Editors and anonymous users are refused by the queries and actions, not only the menu.
Audit entries name the changed fields (`status`, `notes`), never their values. Public input can
only create a lead through `submitContact` (CPR-78).

## Waitlist (CPR-48)

`joinWaitlist(input, { locale })` (`src/features/waitlist/actions.ts`) is the public server action
for the Product page form (CPR-79 wires it; the launch form still composes a message). It
validates with `src/lib/leads/waitlist-schema.ts`, runs the anti-spam checks, and stores one row
per normalised email. A repeated or concurrent signup for the same email gets exactly the same
success (no probing whether an address is registered); any other database error is reported.

`/admin/waitlist` (Admin only): filters, deletion on request (PRD 13.4 retention: until 12 months
after launch or until deletion is requested) and "Unduh CSV" (`/admin/waitlist/export`,
`no-store`, cells starting with `=`, `+`, `-`, `@`, tab or carriage return are neutralised).
