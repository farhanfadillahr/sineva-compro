# Sintra.ai reference (design research, 2026-10-15)

Design-research reference for agents building the Sineva website. It records what we observed on sintra.ai and what we adopt, adapt, or reject. It is evidence, not a spec: our decisions live in [tokens.md](../tokens.md), [motion.md](../motion.md), [mascot-sino.md](../mascot-sino.md), [copywriting.md](../copywriting.md), and [brand-positioning.md](../brand-positioning.md). When this file and those disagree, those win. Link to them, do not copy values from here into components.

Core tension to keep in mind: Sintra is **dark-dominant** (black canvas, full-bleed video, saturated glow). Sineva is **light-dominant** (white canvas, teal, one dark section at most per page). Most patterns below survive the inversion only after adaptation, and some do not survive at all.

## 0. Scope, method, sources

### 0.1 Pages and sources

| Page | How it was seen |
|---|---|
| https://sintra.ai (home) | Live browser (Chrome, 1366 px wide) |
| https://sintra.ai/pricing | Live browser |
| https://sintra.ai/solutions/conversational-ai-agents | Live browser |
| https://sintra.ai/blog | Live browser |
| https://sintra.ai/blog/best-ai-chatbots | Live browser |
| https://sintra.ai/book-a-demo | Live browser |
| https://sintra.ai/build-ai-employee | Static download only (HTML/CSS) |
| https://sintra.ai/comparison/chatgpt | Static download only |
| https://sintra.ai/affiliate | Static download only |

### 0.2 Method

1. **Live pass (2026-10-15):** visual walkthrough of the six live pages, computed-style spot checks on headings, buttons, nav, and dropdowns, and a stack check (libraries, `<canvas>` count, video elements).
2. **Static pass:** extraction of `shared.css` (33.8 KB), `page.css` (189 KB, the **home** page CSS only), 9 HTML pages, and 51 unique inline `<style>` blocks (3,109 rules). Only inline `<script>` blocks were read. Webflow chunk JS (IX2/IX3 interaction timelines) was not available, so any interaction defined there has unknown from/to values.
3. This document merges both. Where they disagree, the **live value wins** and the discrepancy is noted (see §0.4).

### 0.3 Confidence labels

| Label | Meaning |
|---|---|
| **[observed]** | Seen directly in the live browser on 2026-10-15 |
| **[extracted]** | Read from the downloaded static files (CSS values, inline scripts, markup) |
| **[inference]** | Our interpretation of the above. Treat as a hypothesis |

Counts quoted from the static pass are declaration occurrences across the CSS corpus, not usage on screen.

### 0.4 Known discrepancies and gaps

- Home H1: **[observed]** 64 px / 64 px; **[extracted]** `h1` rule says 56 px (3.5rem) and `.text-size-7xl` says 64 px. The live page uses the 64 px class. Use the observed value.
- Nav CTA radius: **[observed]** 11 px; **[extracted]** base rule `.75rem` (12 px) with a desktop override of 11 px on sibling buttons. Same component, desktop override wins.
- Static CSS for pricing (`pr3-*`), solutions, and affiliate pages is only partially visible (only inline embeds were provided). Pricing values below that come from inline embeds are marked accordingly.
- **[extracted]** Sintra's CSS is mostly literal values plus Webflow classes. Only 107 custom properties exist, all in one `:root` block. There is no systematic token layer to "copy". The system we derive is ours.
- **[extracted]** Many off-grid values (`.766rem`, `1.281rem`, `1.406rem`) are Webflow px-to-rem conversions of one-off designer values, not a deliberate scale. Do not reproduce them.

### 0.5 IP note

We borrow **patterns only**. Never copy Sintra assets, copy, character designs, illustrations, screenshots, or layouts 1:1. That includes the Vizzy/Soshie/Cassie characters and their poses, the exact section order and headline wording, the purple/blue glow card treatment as a literal look, and the "Wonder Kids" display font. Sino must stay visually distinct from Sintra's mascots: see risk R1 in the [sino-3d-mascot implementation plan](../../../../sino-3d-mascot/IMPLEMENTATION_PLAN.md) (same style class, different design; brand/IP review of the final concept before launch). Easing curves, durations, and generic component anatomy (pill button, accordion, sticky steps) are common practice and fine to reuse.

## 1. Visual language summary

| Aspect | Sintra | Sineva adaptation | Our doc |
|---|---|---|---|
| Canvas | Black (#000) home, alternating black sections; white on blog/solutions/book-a-demo [observed] | White canvas, `--ink-50` alternating, at most one dark section per page | [tokens.md](../tokens.md) §1.3 |
| Brand color | Single action blue `#3B82F6`, plus per-character colors (purple, orange, teal...) [extracted] | One brand teal (`--teal-700` action, `--teal-500` brand). Warm `--sun-*` as the only second accent | [tokens.md](../tokens.md) §1.2 |
| Hero | Full-bleed autoplay video, headline left-bottom, one CTA [observed] | Aurora gradient on white, headline left, Sino stage right (realtime only on home hero) | [mascot-sino.md](../mascot-sino.md) §2 |
| Typography | GT Walsheim Pro 500 headings, DM Sans nav, DM Mono labels, tracking about -3% [observed, extracted] | Plus Jakarta Sans 600, Geist Mono eyebrows, tracking -2.5% to -3.5% | [tokens.md](../tokens.md) §2 |
| Headline style | Title Case, sentence-length, often two sentences [extracted] | Sentence case, max 8 words, statement plus doubt-removing second sentence | [copywriting.md](../copywriting.md) §2, §3 |
| Shape | Pill primary CTA (100rem), 11-12 px square-ish nav/secondary buttons, 16 px cards dominant [extracted] | Same two dialects, radius scale 6 to 36 px, pill for primary | [tokens.md](../tokens.md) §4 |
| Depth | Almost no drop shadow. 1.5 px inset bevel on buttons, colored glow on dark cards [extracted] | Bevel kept (teal/ink tinted), real soft shadows added because light UIs need them, glow only as `--shadow-glow` | [tokens.md](../tokens.md) §5 |
| Motion | Webflow IX + GSAP 3.15 + ScrollTrigger + Swiper 11 + Lottie; no Lenis, no custom cursor [observed, extracted] | Same easing/duration language, CSS first, GSAP on demand, native scroll | [motion.md](../motion.md) |
| Mascots | Pre-rendered videos/stills, one character per capability, in real scenes [observed] | One mascot (Sino), pre-baked renders plus one realtime hero, in context | [mascot-sino.md](../mascot-sino.md) §2, §6 |
| Proof | "40,000+ business owners", 100M+/600K+ stats, star ratings [observed] | None until real data exists | [copywriting.md](../copywriting.md) §1 rule 2 |
| Page rhythm | One h2 per section, centered intro then asymmetric content, very airy [extracted, inference] | Same rhythm on a 4 px scale, `--section-y` 64 to 128 px | [tokens.md](../tokens.md) §3 |

## 2. Typography

### 2.1 Families [observed unless noted]

| Role | Family | Notes |
|---|---|---|
| Headings, body (most pages) | GT Walsheim Pro (400/500/700, commercial) | Body default 17 px / 1.5, headings weight 500 |
| Nav, header, dropdowns | DM Sans | |
| Mono labels (eyebrows, micro-labels, copyright) | DM Mono 500 | Uppercase, tracking .08em to .96 px [extracted] |
| Display accent | "Wonder Kids" (with `background-clip:text` gradient workaround) [extracted] | Playful one-offs. **Not reused** |
| Blog tables | Inter [extracted] | |
| `build-ai-employee`, `affiliate` | DM Sans as body [extracted] | [inference] newer pages are migrating off GT Walsheim |

Body rendering [extracted]: `-webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; font-feature-settings:"salt" on`.

### 2.2 Observed values

| Element | Size / line-height | Weight | Tracking | Colors | Source |
|---|---|---|---|---|---|
| Home H1 | 64 / 64 px | 500 | -1.92 px (-3%) | white on black | [observed] |
| Blog post H1 | 60 / 72 px | 500 | -1.8 px (-3%) | black on white | [observed] |
| Blog body `p` | 18 / 30.6 px (1.7) | 400 | 0 | | [observed] |
| Blog meta | 17 px | 400 | | `#737373` | [observed] |
| Home h2 | 72 px (desktop), 44 (<=991), 36 (<=767) | 500 | -3% | | [extracted] |
| h3 / h4 / h5 / h6 | 40 / 32 / 24 / 20 px, line-height 1.2 / 1.3 / 1.4 / 1.4 | 500 | | | [extracted] |
| Body | 17 / 24 px | 400 | -2% | | [extracted] |
| Stat numerals | 72 px / 1 | 500 | -3% | | [extracted] |
| Eyebrow (mono) | 12 px | 500 | .96 px, uppercase | `#6B6EF2` on the promo card | [extracted] |

### 2.3 Patterns worth noting

- **[extracted]** Letter-spacing is the strongest typographic signature: `-.03em` appears 18 times and is the dominant value, applied to every size from 14 px up.
- **[extracted]** The h2 (72 px) is larger than the h1 (56 px, or 64 px live). H1 appears once on the hero; the h2 acts as the big section statement.
- **[extracted]** Scale is stepwise across three max-width breakpoints (991 / 767 / 479, desktop-first). Only 3 `clamp()` uses exist (footer). No fluid type scale.
- **[extracted]** Muted text is `opacity:.6`, not a separate gray, on dark surfaces. On light pages it is `#737373`.
- **[inference]** Large body (17 px, not 16) plus tight tracking on large headings is what makes the site feel "premium but friendly".

Sineva position: adopt large headlines, medium-semibold weight, negative tracking, 17 px body ([tokens.md](../tokens.md) §2.2). Reject Title Case. Use a free geometric sans (Plus Jakarta Sans) because GT Walsheim is licensed.

## 3. Color and surfaces

### 3.1 Palette [extracted]

Tailwind-like hue scales with a custom near-black `-975` per hue. Key values:

| Role | Value |
|---|---|
| Action blue | `#3B82F6` (hover `#2563EB`) |
| Neutrals (slate set, nav/footer/affiliate) | `#0F172A` text, `#334155`, `#64748B`, `#E2E8F0` borders, `#CBD5E1`, `#F8FAFC`, `#E9EEF3` |
| Neutrals (neutral set, page CSS) | `#171717`, `#737373`, `#E5E5E5`, `#F5F5F5`, `#FAFAFA` |
| Dark surfaces | `#000`, `#121212`, `#171717`, `#1B1B1B` (table rows) |
| Indigo (edition badge, promo card) | `#6366F1` / `#6B6EF2` |
| Purple (Brain, footer CTA, gradient text) | `#8B5CF6`, `#6D44CC`, `#9B70FF`, `#5D2985` to `#10061A` |
| Error | `#B42318` on `#FEF3F2`; discount badge `#EF4444` |
| Online dot | `#22C55E` with 30% ring |

Broken tokens: `amber-50/200/500` are all `white` (placeholder). Do not mirror.

Top literal colors by count [extracted]: `#ffffff` 141, `#000000` 56, `#3b82f6` 22, `#0f172a` 21, `#334155` 18, `#e2e8f0` 13. [inference] The system is near-binary black/white with blue as the only brand/action color; hue variety comes from per-character colors, not the brand.

Per-character colors [extracted]: soshie `#8B5CF6`, cassie `#3B82F6`, milli `#D946EF`, scouty `#14B8A6`, buddy `#0EA5E9`, vizzy/emmie `#EAB308`, penn `#10B981`, commet `#F97316`, seomi `#84CC16`, gigi `#22C55E`, dexter `#F59E0B`. Each is used as a 2 px inset ring on the pricing helper chooser and as the card gradient on home. This is the "one character per capability, one color per character" system. Sineva rejects it (§8, §9).

### 3.2 White-alpha ladder (dark surfaces) [extracted]

| Step | Value | Use |
|---|---|---|
| 5% | `#ffffff0d` | Card bg, hover bg |
| 10% | `#ffffff1a` | Card bg, border, floater pill bg |
| 20% | `#ffffff33` | Border, stat card border |
| 30% | `#ffffff4d` | FAQ dividers |
| 50% | `#ffffff80` | Muted text, placeholders |
| 70% | `#ffffffb3` | Footer links |

Light-surface equivalents [extracted]: borders `#17171733` (20%) and `#1717171a` (10%), shadows `#0f172a14` (8%) and `#0000001a`.

[inference] The ladder is the right abstraction for Sineva too, but inverted: **ink-alpha on white** (see `--border-hairline` in [tokens.md](../tokens.md) §6). Do not define a white-alpha ladder in v1, there is no dark theme.

### 3.3 Gradient vocabulary [extracted]

64 gradient declarations, grouped:

1. **Black fade overlays** (`linear-gradient(#0000 N%, #000)`) blend video and photos into black sections (hero, lore, brain, floater CTA wrapper). Dark-only technique.
2. **Vertical dark-to-indigo CTA gradient** `#0F172A to #100C52 / #130C85`, with a hover fill that slides up from `translateY(100%)`.
3. **Purple radial brand surfaces** `#5D2985 to #10061A` (stat panel, Brain), footer CTA `#9B70FF to #6D44CC`.
4. **Gradient text** purple-200 to purple-500 via `background-clip:text`.
5. **Gradient hairline borders** via `mask-composite:xor` (pricing feature card `rgba(255,255,255,.5)` to 0; discount pill conic spin with `@property --angle`, 2.5 s linear infinite).
6. **Soft light-blue washes on light surfaces** (comparison table): `#FFF to #F0F6FF to #E2EDFF` plus radial `#C6DCFF`. This is the one gradient family Sintra already uses on a light canvas, and the closest model for our aurora.
7. **Edge-fade masks** for marquees (`transparent, black 5%, black 95%, transparent`).
8. **Shine sweep** `105deg` band, `rgba(255,255,255,.2/.4)`, 6 s ease-out infinite, on the special button.

Glow cards [extracted]: `linear-gradient(<brand>, <brand-dark>)` fill, `1px solid #ffffff1a`, and `0 0 70px <brand>66` outer glow (soshie `#823aff66`, cassie `#3371d466`, vizzy `#b0720a66`). Content padding `3rem 3rem 0`, character image bottom-aligned.

### 3.4 Glass and blur [extracted]

Real `backdrop-filter` is rare: floater CTA pill `blur(40px)` over `#ffffff1a`, nav helper drawer `blur(1.25rem)`, mobile burger `blur(15px)`, one card illustration `blur(5px)`. `filter: blur(2.5px to 0)` is used as the nav content cross-fade, `grayscale(100%)` to `0` as active-state color reveal on helper chips.

## 4. Shape and elevation

### 4.1 Radius [extracted]

| Value | Count | Where |
|---|---|---|
| `1rem` (16 px) | 19 | **Dominant**: cards, dropdown panels, comparison rows, video slides |
| `.75rem` (12 px) | 13 | Nav CTA, secondary bevel buttons, inputs, stat cards |
| `0` | 12 | Resets |
| `100%` / `50%` | 9 / 5 | Avatars, circles |
| `2rem` | 9 | Large containers |
| `.5rem` | 8 | |
| `100rem` | 4 | **Primary pill button**, floater pill |
| `1.375rem` | 4 | Comparison highlight column top/bottom corners |
| `1.5rem` | 3 | Plan cards, stat panel; `24px` modal |

Live spot checks [observed]: primary pill `1600px`, nav CTA `11px`, "Log in" ghost `9px`, dropdown panel dark and rounded.

[inference] Two button dialects coexist on purpose: marketing **pill** (100rem) for page CTAs, app-like **rounded-square** (9 to 12 px) bevel buttons for nav, footer, and secondary actions.

### 4.2 Bevel buttons [observed, extracted]

The tactile bevel is Sintra's most distinctive depth device. Depth comes from a 1.5 px inset rim, not a drop shadow.

| Variant | Value | Source |
|---|---|---|
| Light nav CTA (dark pages) | bg `#F8FAFC`, text `#0F172A`, `box-shadow: inset 0 1.5px 0 #fff, inset 0 -1.5px 0 #E9EEF3, 0 0 1.5px rgba(51,65,85,.25)`, radius 11 px, padding 11 px 20 px, `transition: background-color .16s cubic-bezier(.22,1,.36,1)` | [observed] |
| Dark nav CTA (light pages) | bg `#1A1B2E` live (`#0F172A` in CSS), inverted bevel `inset 0 1.5px #fff3, inset 0 -1.5px #000, 0 0 1.5px #33415540`, hover bg `#25273E` plus gradient fill sweep | [observed] / [extracted] |
| Dark gradient CTA (`.aff_button`) | `linear-gradient(180deg,#0F172A 49.83%,#100C52 100%)`, `::after` bevel `rgb(0,0,0) 0 -1.5px inset, rgba(255,255,255,.2) 0 1.5px inset` | [extracted] |
| Burger (mobile) | `0 0 0 1px #cbd5e1, 0 3px #cbd5e1` ("pressed key"), 44 px square, radius 12 px | [extracted] |
| Special white | white fill, two gradient layers (blue-200 to white), `outline:1px solid #fff3; outline-offset:4px; box-shadow:0 0 0 4px #ffffff1a`, hover halo grows to `#fff3` | [extracted] |

### 4.3 Other shadows [extracted]

| Family | Value | Used on |
|---|---|---|
| Ambient | `0 2px 4px #0f172a14` | Dropdown cards |
| Ambient (panel) | `0 1px 2px rgba(15,23,42,.06)` | Shared rail panel |
| Card (light) | `0 8px 10px -6px #4040400f, 0 20px 25px -5px #4040400f` | Product visual cards |
| Testimonial text | `0 0 100px rgba(0,0,0,.10)` | Solutions testimonials |
| Modal | `0 24px 64px #00000073`, radius 24 px | QR popup |
| Glow | `0 0 70px <brand>66` | Dark task cards |
| Focus ring | `outline:.125rem solid #4d65ff; outline-offset:.125rem` on `[tabindex]:focus-visible` | Global |

## 5. Components inventory

### 5.1 Buttons [extracted unless noted]

| Variant | Key values |
|---|---|
| Primary pill (`.button`) | bg/border `#3B82F6`, white, min-height 48 px, padding 12 px 18 px, radius 100rem, 17 px / 24 px weight 500, gap 8 px, `transition: all .2s`. **[observed]** home hero CTA matches (17 px, .2 s) |
| Hover | bg `#2563EB`, `translateY(-2px)` |
| Active | `scale(.98)` |
| Sizes | `.is-sm` 36 px (padding 6 px 12 px), `.is-xl` 60 px (padding 18 px 24 px, 19 px) |
| Secondary | transparent, text `#171717`, border `#1717171a`, hover `#f5f5f5` and border `#17171733` |
| White | white bg, border `#d4d4d4` |
| Link | no chrome, blue text, hover transform none |
| Landing-page (`.is-lp`) | padding 16 px 46 px, larger on x-lp (22 px text, 60 px side padding) |
| Table CTA | white bg, blue text, full width (sits inside the highlighted comparison column) |
| Ghost ("Log in") | transparent, radius 9 px [observed] |
| Nav CTA | bevel button, see §4.2 |
| Arrow nudge | trailing svg `translateX(2px)` on hover, 300 ms ease |

### 5.2 Navigation and dropdowns

- **Header surface [observed]:** transparent at the top, hides on scroll down (`transform` .5 s), reappears on scroll up with a filled background (black on dark pages, white on light pages). **[extracted]** vanilla rAF, `THRESHOLD=8px`, `TOP_OFFSET=10px`, fill applied while off-screen so it never flashes, wrapper `padding-top` synced to header height via ResizeObserver, `prefers-reduced-motion` respected.
- **Structure [extracted]:** logo 72 x 16, centered nav list (Product, Features, Resources as dropdown triggers; Pricing, Book a Demo, Log in, CTA as links), optional promo card. Max width 1440 px, padding 14 px 40 px.
- **Link [extracted]:** 36 px high, padding 0 14 px, weight 500, hover `opacity:.6`. Sibling dimming: hovering the list dims all other items to .6 (250 ms).
- **Desktop dropdown [observed]:** dark rounded panel, items with a title plus one-line description. "Resources" is a 2-column mega panel (Learn / Company) with a "What's new" promo card (mono eyebrow, violet button).
- **Dropdown mechanics [extracted]:** a **single shared panel** (`.navbara__rail_panel`) that morphs between triggers (see §6.3). Panel: radius 16 px, border `1px #cbd5e1`, shadow `0 2px 4px #0f172a14` (dark: `#121212` with `#212121` border).
- **Dropdown item [extracted]:** grid `36px 1fr`, gap 12 px, padding 12 px 20 px 12 px 12 px, radius 10 px, hover bg `#F8FAFC` (dark `#ffffff0d`), title `#334155`, description `#64748B`.
- **Promo card [extracted]:** radius 14 px, padding 16 px 18 px 16 px 16 px, mono eyebrow 12 px uppercase tracking .96 px; light variant bg `rgba(224,231,255,.5)`, dark variant indigo `rgba(99,102,241,.2)` with radial highlight and `1px solid #6366f1`.
- **Mobile (<= 991 px) [extracted]:** burger 44 px, full-screen sheet (`padding: 6rem 1rem 14rem`) revealed by `clip-path` wipe, rows staggered, accordion rows (padding 20 px 12 px), **bottom-fixed action bar** (`position:fixed; inset:auto 0 0; padding:16px; bg #fff`) holding the CTA.

### 5.3 Cards

| Type | Key values | Source |
|---|---|---|
| Task card (glow) | radius 16 px, `1px #ffffff1a`, brand gradient fill, 70 px glow, phone UI mockup plus character bottom-aligned | [observed, extracted] |
| Benefit card (dark) | bg `#171717`, min-height 472 px, `0 1px 3px #4040401a`, image bleeds -32 px, 3-col grid gap 32 px (second row 2-col) | [extracted] |
| Small UI-chip card | Floating mini widget (post views 96,598, "brand tone" memory) used to suggest product UI | [observed] |
| Stat card | bg `#ffffff1a`, `1px #fff3`, radius 12 px, padding 24 px, numeral 72 px / 1, sub 20 px at .75 opacity. Container: purple radial, radius 24 px, padding 56 px 40 px | [observed, extracted] |
| Floating stat card | Product UI collage with floating chips ("People reached 5,649 up 237", sparkline) on light pages | [observed] |
| Testimonial card | bg `#ffffff0d`, radius 16 px, padding 20 px, stars, 32 px avatar; 3-column masonry (`column-count:3; gap 24px`); white variant `1px #0000001a` | [observed, extracted] |
| Photo card (carousel) | Rounded photo card with mascot figurine, "How does conversational AI work?" horizontal carousel | [observed] |
| Video slide | 340 x 600 px, radius 16 px, overflow hidden, black edge fade 200 px wide | [extracted] |
| Blog featured | Purple cover with mascot left of title, category pills | [observed] |
| Modal | white, radius 24 px, max 488 px, rise animation `translateY(16px) scale(.97)` to 0, .35 s expo | [extracted] |
| Pricing feature card | bg `#ffffff0d`, radius 8 px, 1 px gradient hairline | [extracted] |

### 5.4 Badges and tags

| Element | Key values | Source |
|---|---|---|
| Eyebrow chip | Mono uppercase, 12 px, tracking .96 px | [extracted] |
| Meta chips | "15 min, zero obligation" and "No sales pressure" under the book-a-demo H1, dot separated | [observed] |
| Discount badge | `#EF4444`, white, radius 7 px, 12 px / 500 | [extracted] |
| Discount pill with spinning border | `#F0D861` on `#2C2C2C`, radius 50 px, conic hairline spin 2.5 s | [extracted] |
| "Most popular" tab | Blue backing behind the middle plan card forms a header tab (inset `-2rem -.187rem -.187rem`, radius 24 px) | [observed, extracted] |
| Online dot | 5 px `#22C55E` plus 2 px ring at 30% | [extracted] |
| Category pill (blog) | Selected state light blue, unselected plain | [observed] |

### 5.5 Segmented control, plan cards, chooser

- **Segmented toggle [extracted]:** pricing "Individual vs Sintra X". Active: white bg, black text, radius 6 px, padding 6 px 12 px, weight 500, shadow `0 1px 3px #0000001a`. Inactive text `#737373`. Selecting flips the whole page theme via a body class.
- **Radio plan cards [extracted]:** `border:3px solid #2e3b52`, radius 24 px, padding 24 px, bg `linear-gradient(180deg, rgba(59,130,246,.25), 0) over #303030`, 3-col grid gap 24 px; selected border `#3B82F6`; radio 20 px circle, filled blue with `inset 0 0 0 3px #293545, 0 0 0 .5px #3b82f6`; border/height transition .2 s. **[observed]** each card has a mascot group image on top.
- **Helper chooser [extracted]:** grayscale(100%) chips that go full color plus a 2 px inset colored ring when active (250 ms).

### 5.6 Comparison table [observed, extracted]

Grid `2fr 1fr 1fr 1fr 1fr 1fr`, row bg `#1B1B1B` (dark) or white (light), radius 16 px, cell padding 16 px 24 px. The **Sintra column is highlighted**: bg `#3B82F6`, top and bottom corners radius 22 px, it visually pops out of the table, check and cross icons in cells, and a CTA sits inside the column. On the solutions page a mascot **peeks above** the highlighted column. The light variant sits on a pale blue wash (§3.3 item 6).

### 5.7 Accordion and FAQ [extracted]

- Home FAQ (dark): list grid `.75fr 1fr`, gap 64 px 80 px, row `border-bottom:1px solid #ffffff4d`, question padding 20 px 0, icon box 32 px, answer text `rgba(255,255,255,.6)`.
- GSAP height tween `0 to auto`: open `.4 s power2.out`, close `power2.inOut`. Icon rotates 45 deg (plus to x) or 180 deg (chevron). Affiliate FAQ is single-open. Home FAQ is likely Webflow IX2 **[inference]** (six `data-w-id` elements, timeline not provided).
- Affiliate dividers are a 1 px dashed line drawn by a gradient: `linear-gradient(90deg, var(--c1) 0 50%, transparent 0) 0 0 / 8px 100% round`.
- "How it works" step list [extracted]: padding 34 px 0, `border-bottom:1px solid #7d797a`; inactive opacity .75 and paragraph `max-height:0; opacity:0; translateY(-4px)`; active heading grows to 32 px.

### 5.8 Testimonials, logos, proof

- 3-column masonry with star ratings [observed]; floating pill `40,000+ business owners use Sintra · View more` over the section bottom [observed]. Pill: `inline-flex`, radius 100rem, padding 8 px 16 px 8 px 8 px, bg `#ffffff1a`, `backdrop-filter:blur(40px)`, overlapping 32 px avatars with 1 px `#525252` border, on a fade-to-black wrapper [extracted].
- Logo marquee: CSS `marquee 25s linear infinite`, translateX 0 to -33.333% (3 copies), 5% edge mask [extracted]. Press row (Forbes etc.) on pricing [observed]. "Trusted by leading teams worldwide" logo section on home [observed].
- Video testimonials lazy-injected by ScrollTrigger (`start:'top bottom+=200', once:true`) [extracted].

### 5.9 Footer [observed, extracted]

Black, 4-column link grid (gap 56 px; link color `#ffffffb3`), 7 link groups total, app-store badges (132 x 44 and 149 x 44), 24 px social icons, 216 x 48 logo, mono copyright. Newsletter CTA band ("Want a welcome gift?"): purple radial `#9B70FF to #6D44CC`, radius 20 px, inset highlight `inset 0 1px 1px #ffffff40`, input pill `bg #4c2f8e` with 44 px light-bevel submit, mascot ornament. Max width 1360 px, padding `104px 40px 80px`.

### 5.10 Forms [extracted]

Webflow defaults: 38 px high, padding 8 px 12 px, border `1px #ccc`, focus border `#3898ec`. Site-specific: blog search input 400 px wide, padding 12 px 16 px, radius 8 px, `inset 0 0 0 1px rgba(0,0,0,.1)`, paired with a "Search" button [observed]; footer email pill; affiliate range slider (track gradient `#7c6cf5 to #3b2fb8` up to `--fill`, thumb shadow `0 3px 8px rgba(18,18,43,.45)`); Calendly embed with shimmer skeleton (`#eee/#f5f5f5`, 1.4 s). Error text `#EF4444` 12 px; system error `#B42318`.

### 5.11 Spacing and layout [extracted]

| Item | Value |
|---|---|
| Global gutter | `5vw` left/right |
| Section padding | small 48 px, medium 80 (64 tablet, 48 mobile), large 128 (96 tablet, 64 mobile) |
| Containers | large 1280 px, medium 1024 px, header 1440 px, footer 1360 px |
| Gaps (dominant) | 24, 16, 32, 12, 8, 40 px (about a 4 px scale with half-steps) |
| Hero | `min-height:100vh` |
| Breakpoints | desktop-first `max-width` 991 / 767 / 479; `min-width:992` for hover and nav scoping |
| Home page height | about 20,800 px at 1366 wide [observed] |

## 6. Motion and interaction

### 6.1 Stack [observed, extracted]

Webflow, GSAP 3.15 (core, ScrollTrigger, SplitText `<script>` included), Swiper 11, Lottie (via Webflow), jQuery 3.5.1. Mixpanel and GrowthBook are analytics, ignored here.

**Absent [extracted, 0 hits across all 9 pages]:** Lenis (or any smooth-scroll hijack), custom cursor, SplitText **calls** (the script is loaded, never invoked), ScrollTrigger `pin`, `stagger` (manual `delay: i * .04/.05` only), numeric `scrub` (all `scrub:true`).

### 6.2 Easings and durations [extracted]

| Curve | Name in source | Use |
|---|---|---|
| `cubic-bezier(.22,1,.36,1)` | `--nava-ease` (7 uses) | Nav default, header CTA hover [observed .16 s], hover color |
| `cubic-bezier(.16,1,.3,1)` | `--nava-expo` | Popup rise, dropdown content fade |
| `cubic-bezier(.34,1.35,.64,1)` | `--nava-bounce` | Dropdown panel morph, burger lines |
| `cubic-bezier(.34,1.56,.64,1)` | | Chevron (stronger overshoot) |
| `cubic-bezier(.4,0,.2,1)` | Material standard | Button fill sweep |
| `cubic-bezier(.22,.61,.36,1)` / `(.2,.7,0,.98)` | `--ease-smooth` / `--ease-emph` | Accordion and step list |
| `(.7,0,.25,1)` | JS | Mobile wipe |
| `(.32,.72,0,1)` / `(.5,0,.8,.4)` / `(.65,0,.3,1.12)` | JS | Divider draw / exit / unfold (+12 px overshoot) |

Durations in the wild: 55 ms (menu item hover-in snap), 120 to 260 ms (UI), 300 ms (button fill, chevron), 360 / 520 ms (`--t-med` / `--t-slow` accordions), 500 ms (header hide, mobile wipe), 6 s / 25 s (loops). Default `.button` transition is `all .2s`. [observed] hero pill .2 s, nav CTA .16 s.

### 6.3 Behaviors

1. **Header hide/show [observed, extracted]:** see §5.2. `transform .5s ease, background-color .25s ease`.
2. **Dropdown morph [extracted]:** one panel. Open: opacity 0 to 1, `translate3d(var(--nava-x), 6px, 0) scale(.97)` to `scale(1)`, width/height/transform 200 ms bounce. Close 120 ms ease. Content panes cross-fade with WAAPI (in 200 ms, out 60 ms, close 120 ms) plus `blur(2.5px to 0)` and a short drift. Item hover: in 55 ms, out 260 ms. Chevron rotates 180 deg in 300 ms.
3. **Mobile wipe menu [extracted]:** `clip-path` sheet, 500 ms `(.7,0,.25,1)`, close 250 ms, row stagger, spring accordion with about 12 px overshoot, all respecting reduced motion.
4. **Sticky steps ("From setup to value in minutes") [observed, extracted]:** sticky phone plus 4 numbered steps; active step larger, others dim to .75 opacity. There is no real pin: one `ScrollTrigger.create({trigger:wrap, start:'top top', end:'bottom top', scrub:true})` maps progress to N step bounds (unequal widths, trim .10, extra last .15), toggles `.active`, and crossfades phone images (`duration .45, power1.out`). Text state is CSS (`max-height`, font-size 32 px, `--t-slow 520ms`).
5. **Marquees [extracted]:** (a) GSAP `x` tween with 7 cloned groups, `duration = distance / 80 px/s`, alternating direction per row, ResizeObserver re-measure, paused under reduced motion; (b) affiliate logos at 60 px/s; (c) CSS-only 25 s loop with 5% mask.
6. **Scroll-scrubbed horizontal list (affiliate) [extracted]:** `gsap.fromTo(list, {x:0}, {x:-(scrollWidth - clientWidth), scrub:true})` inside `gsap.matchMedia('(min-width:991px)')`, Swiper `slidesPerView:'auto'` below.
7. **Orbit carousel (build-ai-employee) [extracted]:** a single proxy tween `progress 0 to 1`, 15 s, `repeat:-1`, `ease:'none'`; each item `x = cos(a) * r, y = sin(a) * r` with `a = (progress + i / count) * 2PI`.
8. **Odometer (affiliate calculator) [extracted]:** per-digit reels, `y: -digit * 1.1em`, `.55 s power3.out`, `delay: i * .04`.
9. **Sticky CTA bar [observed, extracted]:** hidden at `yPercent:100, opacity:0`; once the hero leaves (`ScrollTrigger start:'bottom top'`), slides in `.4 s power2.out`; on enter-back hides `.4 s power2.in`. Appears after scrolling past the hero on pricing [observed].
10. **Accordion height tween [extracted]:** see §5.7.
11. **Lazy video [extracted]:** muted looping `<video>` injected when the section is 200 px from the viewport.
12. **Swiper (home mascot carousel) [extracted]:** `slidesPerView:'auto', centeredSlides:true, spaceBetween:32 (16 under 992), loop:true, speed:600, touchRatio:1.49`; custom 56 px round arrows (`#353033`, `0 4px 52px #000`); plays the active slide's video on `realIndexChange`.
13. **Lottie helmet face [observed]:** one `<canvas>` on the home page; mascot closes and opens its eyes. It is the only canvas on the page.
14. **Video [observed]:** autoplay, muted, loop everywhere (hero `vizzy_waving.mp4`, carousel cards, testimonials).

### 6.4 Hover patterns [extracted]

- Primary: `translateY(-2px)` plus darker blue; active `scale(.98)`.
- Dark CTA: `::before` gradient fill from `translateY(100%)` to 0, 300 ms `(.4,0,.2,1)`; arrow nudge 2 px.
- Toolkit tiles: `rotate(2deg)` on odd, `-2deg` on even (>= 992 px, 300 ms ease-in-out).
- Special white button: halo ring grows 4 px.
- Nav: sibling dim to .6; item bg snap in 55 ms, fade out 260 ms.
- Few CSS `:hover` transforms exist overall (about 6). Most home-page hover logic lives in Webflow IX2 (9 elements carry `data-w-id`: Lottie, brain floaters, floater CTA, 6 FAQ questions), timelines not visible to us.

Reduced motion: `prefers-reduced-motion: reduce` appears 4 times (nav, sticky header, marquees). Coverage is partial; Sineva's rule in [motion.md](../motion.md) §9 is stricter.

## 7. Page architecture

### 7.1 Home (dark) [observed, with section classes from extracted]

Roughly 20 sections, about 20,800 px tall at 1366 wide. Sequence:

1. **Video hero:** full-bleed `vizzy_waving.mp4` in a real interior, headline left-bottom (H1 64 px, white), one blue pill CTA "Get Sintra AI".
2. **Lore / Lottie helmet:** canvas face, eyes close/open, centered h2 "Find The Right AI Employee for Any Business".
3. **Mascot carousel (Swiper):** tall video cards, each character in its own workplace, arrows, name/role/description below, "Get helpers" pill.
4. **Desk photo:** full-bleed photo of mascot figurines on a real desk.
5. **Automations:** centered "Employ AI staff to automate work. Even while you sleep."; three large glow cards (purple "Soshie, schedule social media posts for me", blue "Cassie, check my Facebook comments", orange "Vizzy, help me prepare for today's meetings"), each with a phone UI mockup plus the character.
6. **How it works:** "From setup to value in minutes", sticky phone plus 4 numbered steps.
7. **Work globally:** hand holding a phone, purple glow.
8. **Brain / knowledge graph:** "They learn your business", dark mascot center, connector lines to doc chips.
9. **Integrations:** icon grid plus phone mockup.
10. **Workspaces:** laptop mockup, feature list "as employees".
11. **Benefits:** "The benefits of hiring AI helpers", 3 dark cards.
12. **UI-chip cards:** post views 96,598, brand tone memory.
13. **Stats:** purple radial "Built on real work, proven at scale" (100M+, 600K+, 50+, 24/7).
14. **Testimonials:** masonry with stars, floating pill "40,000+ business owners use Sintra".
15. **Comparison table:** Sintra column highlighted, CTA inside.
16. **Logos:** "Trusted by leading teams worldwide".
17. **Pricing hero** (static pass: `section_pr4-hero`, id `hero`) embedded again.
18. **Closing CTA:** "Your new AI digital workers team with infinite knowledge."
19. **FAQ.**
20. **Footer** (§5.9).

[extracted] Pattern: alternating black full-bleed sections, **one h2 per section**, pricing repeated at the bottom of long pages. [observed] the hero H1 is Title Case: "AI Employees: Your First Digital Workers Team That Never Sleep" per the static pass.

### 7.2 Pricing (dark) [observed, extracted]

Hero with 3 plan cards (mascot group image on top, blue "Most popular" tab above the middle card, discount badges, struck-through prices, "14-day money-back guarantee"), press logos row (Forbes etc.), feature list card ("Everything you're getting"), "Also included" horizontal card carousel with 3D icon illustrations, per-helper feature blocks, trust blocks, FAQ. A sticky bottom CTA bar appears after the hero.

### 7.3 Solutions / conversational-ai-agents (light) [observed, extracted]

White background. H1 left, product UI collage right with floating stat cards ("People reached 5,649 up 237", sparkline). "How does conversational AI work?" horizontal carousel of photo cards with mascot figurines. Then: how to deploy, use cases, bento features, "How to set up" 3 steps, Brain, tiers (startups, SMBs, enterprises), integrations, comparison table with a mascot peeking above the highlighted column, stats, testimonials, outro CTA with "14-days risk-free guarantee", FAQ.

### 7.4 Blog index and post (light) [observed, extracted]

- **Index:** white, featured post (purple cover with mascot plus title right), category pills (All / Product / Business, selected pill light blue), search input plus Search button, "Load more".
- **Post:** breadcrumb; H1 left (60 / 72 px) with a teal cover image right (mascot holding a magnifier); author avatar, dates, "18 min read"; **sticky Table of Contents in a left column**, body right (18 px / 30.6 px, meta 17 px `#737373`); related articles; footer.

### 7.5 Book a demo (pale blue-grey) [observed]

Background about `#E2E8F0`. Centered H1 "See if Sintra's right for you." with meta chips ("15 min, zero obligation", "No sales pressure"). Left: 3 numbered steps (mono step numbers in circles). Right: white card holding the Calendly embed (640 px max).

### 7.6 Not visited live (static only)

- `build-ai-employee` [extracted]: hero, "not a chatbot" argument, "You're drowning in busywork", three steps with 01/02/03, "What can I build?", "Why not just use ChatGPT or Claude?", "Start free", affiliate earn, FAQ, "Ready to build?". Uses the orbit carousel and marquees.
- `comparison/chatgpt` [extracted]: SEO landing: hero, logo strip, comparison table, bento "where X falls short", benefits, specialists, "made simple" steps, Brain, stats (+37%, 5x, 20h), testimonials, outro with guarantee, FAQ.
- `affiliate` [extracted]: hero, earnings calculator (odometer), scrolling audience cards, toolkit (tiles rotate on hover), 3-step process, FAQ.

### 7.7 Reusable landing block kit [extracted, inference]

Sintra's SEO pages (`solutions/*`, `comparison/*`) reuse one block library. It is a good checklist for Sineva service and product pages:

| # | Block | Notes for Sineva |
|---|---|---|
| 1 | Hero: h1 plus one CTA | Single CTA per [copywriting.md](../copywriting.md) §3 |
| 2 | Explainer ("What is X?") | Short, one paragraph plus visual |
| 3 | How it works (3 steps or sticky steps) | See [motion.md](../motion.md) §4.2 |
| 4 | Use cases (3 cards) | Per capability or service |
| 5 | Bento features | 3 to 5 tiles, max one with Sino |
| 6 | Comparison table | Only truthful comparisons. "With vs without AI support" is safer than named competitors |
| 7 | Stats | **Only with real data** |
| 8 | Testimonials | **Only with real people** |
| 9 | Outro CTA with risk-reducer | Guarantee claims only if the business backs them |
| 10 | FAQ | Accordion |

Repeating the CTA in nearly every block is Sintra's conversion mechanic. Sineva keeps one clear primary CTA per section but does not need to repeat the identical label ([copywriting.md](../copywriting.md) §4 lexicon).

## 8. Mascot usage patterns

**[observed]** Mascots are **pre-rendered** (videos and stills), not realtime 3D. The whole home page has a single `<canvas>` (the Lottie helmet face). Videos autoplay muted and loop. Patterns:

| Pattern | Sintra example | Notes |
|---|---|---|
| In real context | Vizzy waving in a real interior; figurines on a real desk | Photographic compositing of a rendered character into a real-looking scene |
| One character per capability | Soshie (social), Cassie (comments/support), Vizzy (meetings), Buddy, Commet, Seomi... each with its own color | Easy to scale a catalog of "employees". Hard to maintain, and ties the brand to many assets |
| Carousel of tall video cards | Each helper in its own workplace, name/role/description below | Centered Swiper, plays the active card's video |
| Glow task cards | Brand-colored gradient card plus phone UI mockup plus character bottom-aligned, request phrased as a command to the character | The "hand-off phrase" pattern: `<Name>, <do this task for me>` |
| Peeking | Mascot peeks above the highlighted comparison column | Draws the eye to the recommended column. Cheap (one still) |
| On covers | Blog covers (purple with mascot, teal with mascot and magnifier) | Cover kit with one brand color per cover |
| Group image on pricing cards | Mascot group above each plan | |
| Lottie face | Helmet face closing and opening its eyes as a section intro | Single, small interaction |
| Mascot in UI mockups | Characters appear next to phone UI | Ties the character to the product surface |

Sineva rules these patterns feed into: one mascot only (Sino), pre-baked stills and alpha video everywhere except the home hero, at most one large Sino per viewport, peeking and covers allowed. See [mascot-sino.md](../mascot-sino.md) §2, §4, §6 and the capability-per-pose model in [brand-positioning.md](../brand-positioning.md) §3.1.

## 9. Adopt / Adapt / Reject

### 9.1 Adopt (take as is)

| Item | Why | Where it lands |
|---|---|---|
| Easing curves `(.22,1,.36,1)`, `(.16,1,.3,1)`, `(.34,1.35,.64,1)`, `(.7,0,.25,1)`, `(.5,0,.8,.4)` | Neutral, proven, no brand attached | [motion.md](../motion.md) §2.1 |
| Duration language (55/60 ms snap in, 160 to 260 UI, 360 / 520 for accordions and reveals, 500 header) | Same | [motion.md](../motion.md) §2.2 |
| Pill primary CTA (radius 100rem, 17 px / 500, padding 12 x 18 px, .2 s) | Clear, accessible, friendly | [tokens.md](../tokens.md) §4 |
| Sentence-length headlines with -3% tracking, medium weight, large size | Core of the "premium but friendly" feel | [tokens.md](../tokens.md) §2.2 |
| Large 17 px body, 18 px / 1.7 for articles | Readability | [tokens.md](../tokens.md) §2.2 |
| Mono eyebrow labels | Tech accent without coldness | [tokens.md](../tokens.md) §2.1 |
| Native scroll, no Lenis, no custom cursor | Accessibility and performance, and Sintra does the same | [motion.md](../motion.md) §4, §6 |
| Hover micro-patterns: `translateY(-2px)` lift, `scale(.98)` press, arrow nudge, sibling dim to .6 | Cheap, universal | [motion.md](../motion.md) §6 |
| Accordion: GSAP height `0 to auto`, plus rotating to x | Same | [motion.md](../motion.md) §6 |
| Blog post layout: H1 left plus cover right, sticky left Table of Contents, 18 px body | Good for long reads | Blog pages |
| Book-a-demo layout: centered H1 plus meta chips, 3 numbered steps left, embed card right | Fits our consultation form | Contact page |
| Orbit carousel (single proxy tween, 15 s) | Cheap, GPU friendly | [motion.md](../motion.md) §4.3 |

### 9.2 Adapt (change before using)

| Item | Sintra | Sineva change |
|---|---|---|
| Bevel buttons | White-on-dark and dark-on-light with `#E9EEF3` rim | Teal and ink-tinted bevel, `--shadow-button-bevel` and `--shadow-button-bevel-light` ([tokens.md](../tokens.md) §5). Primary nav CTA is `--color-action-dark` on light pages |
| Header hide/show | Transparent, hides on scroll down, black or white fill | Transparent on the aurora gradient, `--surface-nav` plus `--blur-nav` when scrolled, never hides while a dropdown, menu, or focus is inside ([motion.md](../motion.md) §5) |
| Morphing dropdown | Dark rounded panel, single shared rail | Light panel, `--radius-md`, `--shadow-md`, 36 px icon tile plus title plus one line, optional promo card in `--color-surface-tint` |
| Sticky steps | Phone mockup plus 4 steps, GSAP progress map | Keep, but CSS `position: sticky`, mobile stacks, steps are clickable and keyboard accessible ([motion.md](../motion.md) §4.2) |
| Glow cards | Saturated gradient plus 70 px colored glow on black | Light form: white or tint card, hairline border, `--shadow-glow` (teal, 22% at 40 px) only on the "featured" card, one `--gradient-brand` per viewport max ([tokens.md](../tokens.md) §1.4) |
| Product card example ("SinoHelp, handle customer support requests") | Product name and task inside colored cards | Use the product names in [brand-positioning.md](../brand-positioning.md) §3.1 |
| Video hero | Full-bleed autoplay video on black | Home hero uses poster plus realtime GLB with fallback loop; elsewhere pre-baked stills ([mascot-sino.md](../mascot-sino.md) §3) |
| Mascot peeking | Above comparison column | Sino peeks from a card edge (asset S12) |
| Comparison table | Highlighted column in `#3B82F6`, check/cross, CTA in column | Highlight column in `--teal-700` or `--teal-50` with a teal outline, check and cross icons with text labels (not color alone) |
| Light-surface wash | `#FFF to #F0F6FF to #E2EDFF` with radial `#C6DCFF` | Aurora gradient with teal and mint radials plus a warm sun accent ([tokens.md](../tokens.md) §1.4) |
| Stat blocks | 72 px numerals on purple radial | Same numeral treatment (tabular figures), only with real data, on a tint surface |
| Floating CTA pill / sticky CTA bar | Blur pill with avatars; slim bar after hero | Slim bar with Primary CTA plus WhatsApp, mobile only on long pages ([motion.md](../motion.md) §4.5). No avatar stack |
| Marquee | 25 s CSS loop or GSAP 80 px/s | 40 to 60 px/s, only for capability tags until real customer logos exist |
| Eyebrow in indigo | Mono, `#6B6EF2` | Mono, `--teal-700` |
| Footer newsletter band | Purple radial with welcome gift input | Teal brand gradient band or a plain closing CTA; no gift promise |
| Radius scale | Mixed 6 to 24 px, dominant 16 px | `--radius-xs` 6 to `--radius-2xl` 36 px, cards 20 px ([tokens.md](../tokens.md) §4) |
| Gradient text | Purple 200 to 500 on 40 px+ | `--gradient-text`, teal, 40 px+ only, 1 to 3 words |
| Demo/consultation meta chips | "15 min, zero obligation" | Only claims we can keep. A time figure needs Founder approval ([copywriting.md](../copywriting.md) §5) |

### 9.3 Reject (do not carry over)

| Item | Reason |
|---|---|
| **Dark-dominant canvas** | Sineva is light-dominant by decision (PRD D10, light only in v1). At most one dark section per page ([tokens.md](../tokens.md) §1.3). Black fade overlays and white-alpha ladders are dark-only techniques |
| **Scale stats without data** (100M+, 600K+, "40,000+ business owners") | Violates copy rule 2. No numbers until there is real evidence ([copywriting.md](../copywriting.md) §1) |
| **Star ratings and testimonials without real reviews** | Same rule, plus fabricated social proof is a legal and trust risk |
| **Multiple characters per capability** (11 helpers with their own colors) | Sineva has one mascot, Sino, with many capabilities. Cheaper to produce and matches our one-agent product ([brand-positioning.md](../brand-positioning.md) §3.1) |
| **Title Case headlines** | We use sentence case ([copywriting.md](../copywriting.md) §3) |
| **Wonder Kids display font** and **GT Walsheim** | Wonder Kids is a one-off playful face tied to Sintra. GT Walsheim is commercially licensed |
| **Per-character color system** | One brand teal plus warm accent only |
| **Purple/blue neon glow aesthetic** | Too close to Sintra's identity (IP/trade-dress risk, see §0.5) and wrong for a calm teal brand |
| **Copying Sintra's section order and wording** | IP note §0.5. We reuse the block kit, not the sequence and phrases |
| **"$1 per day" pricing framing, 14-day guarantee, discount badges, struck-through prices** | Sineva has no self-serve pricing in v1 (waitlist and consultation) |
| **Repeated identical CTA in every block** | One clear primary CTA per section, from our lexicon |
| **Affiliate, calculator, "earn from your AI employees" pages** | Out of scope for a consulting site |
| **Ten-plus helper chooser chips and per-helper pricing pages** | No equivalent in Sineva's offering |
| **Webflow-isms** (`all .2s` transitions, `w-` classes, fractional rem conversions, broken `amber` tokens) | We build our own token layer |
| **Floating avatar-stack CTA pill** | Needs real people and adds a second sticky element beside the CTA bar |
| **Realtime 3D for every mascot appearance** | Sintra does not do it either. Pre-baked renders everywhere except the home hero |

## 10. Quick lookup for agents

| If you are building... | Read | Primary Sintra evidence |
|---|---|---|
| Header, dropdowns, mobile menu | [motion.md](../motion.md) §5 | §5.2, §6.3 items 1 to 3 |
| Buttons and bevel | [tokens.md](../tokens.md) §5 | §4.2, §5.1 |
| Hero | [motion.md](../motion.md) §3.2, [mascot-sino.md](../mascot-sino.md) §3 to §5 | §7.1 item 1, §8 |
| How-it-works section | [motion.md](../motion.md) §4.2 | §6.3 item 4, §5.7 |
| Cards with Sino | [mascot-sino.md](../mascot-sino.md) §6 | §5.3, §8 |
| Comparison table | [tokens.md](../tokens.md) | §5.6 |
| FAQ | [motion.md](../motion.md) §6 | §5.7 |
| Blog | [tokens.md](../tokens.md) §2.2 | §7.4 |
| Contact page | [copywriting.md](../copywriting.md) §4, §5 | §7.5 |
| Landing page structure | [brand-positioning.md](../brand-positioning.md) | §7.7 |
| Any copy (headlines, stats, proof) | [copywriting.md](../copywriting.md) | §9.3 |
