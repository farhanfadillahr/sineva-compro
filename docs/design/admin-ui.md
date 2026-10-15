# Admin UI (CMS) design system

The admin at `/admin` uses the **same design tokens** as the public site ([tokens.md](tokens.md)) so the product feels like one brand, but with a denser, calmer layout built for daily editing. Scope and data: [Admin CMS implementation plan](../superpowers/plans/2026-10-15-admin-cms.md).

## 1. Principles

1. **Same tokens, different density.** Colors, fonts, radius, focus ring, and shadows come from `tokens.md`. Spacing and type sizes step down one level.
2. **Clarity over delight.** No mascot canvas, no scroll animations, no Lottie except `check-pop` on successful save. Motion is limited to state feedback (≤ 240 ms).
3. **The editor sees the result.** Every content form shows character counters tied to the layout limits, a live SEO snippet preview, and a preview link.
4. **Safe by default.** Destructive actions confirm, secrets are write-only, unsaved changes are guarded.
5. **Light only**, like the public site (PRD Rev. 3). Admin UI language: Indonesian (PRD FR-ADM-05). Content locale tabs are separate from UI language.

## 2. Token usage in the admin

| Token area | Public site | Admin |
|---|---|---|
| Fonts | Plus Jakarta Sans, Geist Mono | Same. Geist Mono also for IDs, slugs, timestamps |
| Base text | 17 px | **15 px** (`--text-body-sm`), line-height 1.5 |
| Headings | Display scale | Page title 24 px 600, section title 18 px 600, card title 15 px 600 |
| Canvas | White | `--color-canvas-alt` (`--ink-50`) app background, white panels |
| Primary action | `--color-action-primary` pill | Same color, **rounded-square 10 px** buttons (no pills except status chips) |
| Radius | Cards 20-28 px | Panels 14 px, inputs 10 px, tables 12 px |
| Shadow | Soft, layered | `--shadow-xs` on panels, `--shadow-md` on popovers and dialogs only |
| Focus | 2 px `--color-focus` | Same |
| Status colors | `--color-success`, `--color-danger` | Plus `warning` (`--amber-700` on amber tint) for drafts and missing translations |

## 3. Layout

```
┌───────────────┬──────────────────────────────────────────────┐
│ Sidebar 248px │ Top bar 56px: breadcrumb · search · user menu │
│               ├──────────────────────────────────────────────┤
│ Logo symbol   │ Page header: title, status, primary action    │
│ Dasbor        │ ┌──────────────────────────┬───────────────┐ │
│ Konten        │ │ Main form / table         │ Side panel     │ │
│  Halaman      │ │ (max 840 px for forms)    │ 320 px: status,│ │
│  Layanan      │ │                           │ publish, SEO   │ │
│  Produk       │ │                           │ preview, meta  │ │
│  Karya        │ └──────────────────────────┴───────────────┘ │
│  Blog         │                                              │
│  FAQ          │                                              │
│  Tim          │                                              │
│  Media        │                                              │
│ Lead (Admin)  │                                              │
│ Waitlist (Ad.)│                                              │
│ Pengaturan    │                                              │
│  Situs        │                                              │
│  SEO          │                                              │
│  Email        │                                              │
│  Redirect     │                                              │
│ Pengguna (Ad.)│                                              │
│ Log audit (Ad)│                                              │
└───────────────┴──────────────────────────────────────────────┘
```

- Sidebar: white, hairline right border, items 36 px tall, radius 10, active item `--color-surface-tint` + `--color-text-brand`, group labels in Geist Mono 11 px uppercase. Items the role cannot access are **not rendered** (and the server still checks).
- Collapses to an icon rail at < 1280 px, to a drawer at < 768 px. The admin is desktop-first; it must still work at 768 px.
- Page header: title, status badge (Draft / Published / Unsaved changes), primary action on the right (Simpan / Terbitkan).

## 4. Component catalog

All admin components live in `src/components/admin/` (built in `NEW-cms-shell`), consume the shared tokens, and have unit tests (Testing Library) for keyboard and ARIA behaviour. Public and admin share the primitives in `src/components/ui/` (Button, Input, Badge, Dialog base) so changes to tokens apply to both.

### 4.1 Libraries (checked with `npm view` on 2026-10-15, pin exact at install)

| Need | Library | Version | License | Why |
|---|---|---|---|---|
| Data table logic (sorting, filtering, selection, column visibility) | `@tanstack/react-table` | 9.3.1 | MIT | Headless, so it uses our markup and tokens |
| Charts | `recharts` | 3.10.1 | MIT | SVG, supports `<defs>` gradients, React 19 peer OK |
| Calendar / date picker | `react-day-picker` | 10.0.2 | MIT | Headless-friendly, accessible grid |
| Date math and formatting | `date-fns` | 4.4.0 | MIT | Tree-shakable, `id` locale for the Indonesian admin |
| Rich text | `@tiptap/react` | 3.32.0 | MIT | Structured JSON output (PRD §9.4) |
| Drag to reorder | `@dnd-kit/core` | 6.3.1 | MIT | Accessible keyboard sorting |
| Command palette | `cmdk` | 1.1.1 | MIT | Global search (Ctrl/Cmd+K) |

These load only under `/admin` (route-group layout), never in public bundles. Verify with the bundle analyzer in CI.

### 4.2 Navigation and shell

| Component | Spec |
|---|---|
| **Sidebar (hierarchical)** | Width 248 px. Three levels max: group label (Geist Mono 11 px uppercase, not clickable) > item (icon 18 px + label, 36 px tall) > sub-item (indented 28 px, no icon, 32 px tall). Groups: Ringkasan, Konten (Halaman > each page; Koleksi > Layanan, Produk, Karya, Blog > Artikel / Kategori, FAQ, Tim; Media), Prospek (Lead, Waitlist; Admin only), Pengaturan (Situs, SEO, Email, Redirect; Admin only), Sistem (Pengguna, Log audit; Admin only). Expand/collapse per item with chevron (rotate 90°, 160 ms), state remembered in localStorage (try/catch). **Active trail**: the active leaf gets `--color-surface-tint` bg + `--color-text-brand`, its parents get brand text + a 2 px left indicator. Badges on items (e.g. new leads count) use the `brand` badge. Keyboard: arrow keys move, Right/Left expand/collapse, Enter navigates (ARIA tree pattern). Collapsed rail mode (64 px) at < 1280 px shows icons with tooltips and flyout sub-menus. Footer: user card (avatar, name, role) opening the user menu |
| **Top bar** | 56 px, white, hairline bottom. Left: breadcrumb (Geist Mono separators `/`, last item not a link, truncates middle items on small widths). Center/right: global search trigger (opens command palette), "Lihat situs" link (new tab), notifications bell (new leads; Admin), user avatar menu |
| **Page header** | Title (24 px 600), optional description (14 px tertiary), status badge, meta line (Geist Mono 12 px: "Diperbarui 15 Okt 2026, 14.20 oleh Farhan"), actions on the right (primary + secondary + overflow menu). Becomes sticky with a compact 56 px version after scrolling 80 px, so Save is always reachable |
| **Section header** (inside pages) | 18 px 600 title, helper text, optional right-aligned action |
| **Breadcrumb** | `nav aria-label="Breadcrumb"`, `aria-current="page"` on the last item |
| **Tabs** | Underline tabs for sub-views (e.g. Lead: Detail / Catatan / Riwayat), 40 px, active underline 2 px `--teal-700`, ARIA tabs |
| **Command palette** | Cmd/Ctrl+K: search pages, collections, media, leads (Admin), settings; recent items; actions ("Artikel baru"). Results respect role |
| **User menu** | Avatar dropdown: Profil saya, Ganti password, Keluar. Keluar uses the existing logout flow |

### 4.3 Data display

| Component | Spec |
|---|---|
| **Data table** | Built on TanStack Table. Toolbar: search (debounced 300 ms, synced to `?search=`), chip filters, column visibility menu, density toggle (comfortable 52 px / compact 40 px rows), export button (Admin, where allowed). Header: sticky, `--ink-50` bg, Geist Mono 12 px labels, sortable columns show an arrow and set `aria-sort`. Rows: hover tint, selected tint `--teal-50`, clickable row opens detail (whole row is a link, actions remain buttons). Cells: text truncation with tooltip, status badges, avatar + name, relative dates with absolute date in tooltip, locale completeness dots. Row actions in a kebab menu. Bulk selection checkbox column with a bulk action bar that slides up from the bottom (Lead: change status, export; content: publish/unpublish). Empty state, loading skeleton rows (5), error state with retry. **Server-side** sorting/filtering/pagination via URL params (shareable, back-button safe); tables never load all rows client-side |
| **Pagination** | Bottom of tables: "Menampilkan 21-40 dari 134" (Geist Mono numbers) + page size select (20/50/100, default 20) + controls: first, previous, page numbers with ellipsis (1 … 4 5 6 … 12), next, last. 36 px square buttons radius 10, current page `--color-action-primary` bg. Keyboard and screen-reader labels ("Halaman 5"). URL param `?page=`. Out-of-range page redirects to the last page instead of a 404 (fixes the current users list behaviour) |
| **Stat card (KPI)** | White panel radius 14, padding 20: label (13 px tertiary), value (28 px 600 tabular), delta chip (vs previous period, success/danger tone with arrow; neutral when no previous data), optional sparkline (gradient area, 40 px tall). Clickable to the filtered list |
| **List card** | Panel with title + "Lihat semua" link, list rows 48 px (avatar/icon, title, meta, trailing badge). Used for "Lead terbaru", "Draft menunggu" |
| **Activity feed** | Vertical timeline: 8 px dot (tone by action), actor avatar, sentence ("Farhan menerbitkan Artikel X"), relative time. Source: audit log |
| **Completeness card** | Per locale progress bar ("EN 100%") with list of missing required fields linking to the field |
| **Description list** | Lead detail and media details: label (13 px tertiary) / value pairs in 2 columns, copy button on email/phone |
| **Avatar** | 24/32/40 px circle, initials fallback on `--teal-100` with teal-800 text |
| **Tooltip / popover** | Tooltip 12 px on ink-950, 6 px radius, 400 ms delay; popover = white panel radius 14 `--shadow-md` |
| **Empty state** | See §5 note: small Sino still, one sentence, one action |
| **Skeleton** | `--ink-50` blocks, shimmer disabled under reduced motion |

### 4.4 Charts (Dashboard, Lead and Waitlist reports)

Built with Recharts on the brand palette. Charts are for Admin only (they show lead data).

| Chart | Spec |
|---|---|
| **Gradient area chart** (Lead per hari/minggu) | Line 2 px `--teal-700`, area fill `linearGradient` from `rgba(0,148,155,.28)` at the top to `rgba(0,148,155,0)` at the bottom. Grid: horizontal only, `--ink-100`, dashed 3 3. Axes: Geist Mono 12 px `--ink-500`, no axis lines. Tooltip: white card radius 12 `--shadow-md`, date + value + delta. Active dot 6 px with white 2 px ring. Range selector (7 / 30 / 90 hari / custom with date range picker) |
| **Comparison series** | Second series (previous period) dashed `--ink-400` without fill |
| **Bar chart** (Lead per layanan, per jenis bisnis) | Bars radius 6 top, `--teal-500` with `--teal-700` for the selected bar, horizontal variant for long labels |
| **Donut** (Lead per status) | 5 status colors from the status badge tones, center label total, legend as clickable chips that filter the lead table |
| **Sparkline** | In stat cards, area gradient same as main chart, no axes |
| Rules | Colors only from tokens; no 3D, no pie with > 5 slices; every chart has a text summary for screen readers (`aria-describedby` with the key numbers) and a "Lihat sebagai tabel" toggle; respect reduced motion (disable Recharts animation); empty data shows an empty state, not a flat line |

### 4.5 Forms and inputs

| Component | Spec |
|---|---|
| **Image dropzone** | Dashed 1.5 px `--ink-400` border, radius 14, min-height 180, `--ink-50` bg; icon + "Seret gambar ke sini atau pilih file" + allowed types and max size (Geist Mono 12 px). States: hover/drag-over (border `--teal-500`, bg `--teal-50`, scale 1.01), uploading (per-file row with thumbnail, filename, progress bar `--teal-500`, cancel), success (thumbnail + replace/remove), error (red border, message, retry). Multiple files queue for the gallery field. Client checks type/size before upload; server re-checks (content sniffing). Fully keyboard accessible (the zone is a button that opens the file dialog). Paste from clipboard supported |
| **Image field** | Shows the selected media with aspect-ratio preview, focal point picker (click to set, crosshair), alt text inputs per enabled locale, "Ganti" and "Hapus" |
| **Calendar / date picker** | react-day-picker in a popover: month grid, 36 px day cells, today ring, selected `--color-action-primary` bg white text, range selection with `--teal-50` in-between, disabled days `--ink-400`. Header with month/year and prev/next buttons. Keyboard per ARIA grid. Indonesian locale (`date-fns/locale/id`), week starts Monday. Variants: single date (publish date), date range (lead filters, chart range) with presets ("Hari ini", "7 hari", "30 hari", "Bulan ini"), date-time (time input 24 h). Input shows `15 Okt 2026` format; stored as UTC ISO |
| **Toggle switch** | 36×20, on `--teal-700`, label on the right, used for visibility toggles |
| **Radio cards** | For mode choices (Email: Resend API / SMTP): bordered cards radius 14, selected border `--teal-700` + check |
| **Combobox / multi-select** | Tags, related service, categories: input with filtered listbox, chips for selected values, create-new option where allowed |
| **Slug input** | Prefix showing the public path (`/blog/`), auto-generated from title until edited, kebab-case validation, warning when changing a published slug ("Redirect 301 akan dibuat") |
| **Rich text editor** | See §4.6 |
| **Sortable list** | dnd-kit with drag handle and keyboard sorting (Space to pick up, arrows to move) |
| **Secret field, counters, copy rule hint, locale tabs** | As in §4.7 |

### 4.6 Rich text editor (Tiptap)

Toolbar (sticky in long forms): Paragraph/H2/H3 select, bold, italic, link (dialog with URL validation, internal link search), bullet list, numbered list, quote, code block, image (media picker), horizontal rule, undo/redo. Slash menu (`/`) for the same blocks. Paste cleans foreign formatting. Output: Tiptap JSON validated server-side against the allowed node list. Word count + reading time in the footer. Em dash typed or pasted is flagged inline.

### 4.7 Content-specific controls

| Component | Spec |
|---|---|
| Locale tabs | Segmented control with completeness dots (§4 earlier rules) |
| Text field with counter | 42/60 counter, amber at 90%, red over limit, save blocked |
| Copy rule hint | Inline error on `—` / `–` with one-click replace |
| Choice pickers | Thumbnail grid for Sino poses, icons, tints |
| SEO panel | Snippet + OG preview, counters, noindex (Admin) |
| Secret field | Masked, write-only, env-managed state |

### 4.8 Overlays and feedback

| Component | Spec |
|---|---|
| Dialog | Radius 20, `--shadow-lg`, max 520 px (720 for media picker), focus trap, Escape closes, destructive confirm by typing the name |
| Drawer | Right side 480 px for quick edits (media details, lead quick view) |
| Dropdown menu | White, radius 14, items 36 px, icons 16 px, destructive items red, keyboard navigation |
| Toast | Bottom-right, success with `check-pop` Lottie once, error with retry, `role="status"` |
| Inline alert / banner | Page-level banner for "Diatur oleh environment", "Ada perubahan yang belum disimpan", maintenance notes |
| Progress | Linear bar 4 px radius pill for uploads and exports |

### 4.9 User profile settings (Profil saya)

Available to every signed-in user at `/admin/profil`:
- **Profil**: name (editable), email (read-only for Editors; Admin changes emails through Users), avatar upload via the image dropzone (stored in `media-private`, square crop).
- **Keamanan**: change password (current password, new password 12-128 chars with strength hint, confirm). Changing the password revokes other sessions (consistent with CPR-24 behaviour).
- **Sesi aktif**: list of sessions (device/user agent, IP, last active) with "Keluar dari sesi ini" and "Keluar dari semua perangkat lain".
- **Preferensi**: table density, sidebar collapsed default. Stored per user in the DB.
- Every change writes to the audit log; password and session changes show a toast and require re-auth if the session is older than 15 minutes.

## 5. Key screens

| Screen | Content |
|---|---|
| Dasbor | Cards: new leads (Admin), waitlist count (Admin), drafts waiting, missing translations, last published items, quick links |
| Halaman (list) | Fixed list of pages (Home, Product, Services overview, About, Contact, Thank you, 404, Privacy, Blog index, Work index) with last updated and completeness per locale |
| Page editor | Left: section-by-section accordion matching the page order in [page-patterns.md](page-patterns.md); each section has a visibility toggle if optional. Right: preview link, SEO panel, status |
| Collection list | Table with title, status, locale completeness, updated, actions |
| Collection editor | Form sections + side panel (status, publish, preview, SEO, slug with redirect warning) |
| Media library | Grid, filters, usage count, details drawer (alt per locale, caption, focal point, replace file) |
| Lead list / detail | Table with filters (status, service, business type, date); detail with fields, status select, internal notes, WhatsApp quick link |
| Settings: Situs | Groups from the CMS plan §2.1 as form sections |
| Settings: Email | Mode toggle (Resend API / SMTP), connection fields, secret field, sender fields, templates per locale with placeholder chips, "Kirim email uji" button with result panel |
| Settings: SEO | Global template, defaults, Organization data, Search Console token |
| Redirects | Table + add form, conflict and loop detection |
| Audit log | Read-only table, filters by actor and entity |

## 6. Accessibility and quality

Same rules as [accessibility-performance.md](accessibility-performance.md) §1 (contrast, focus, keyboard, labels). Admin performance target: interactions < 200 ms INP on a mid-range laptop; no Lighthouse gate. Admin pages are `noindex` and never cached publicly.
