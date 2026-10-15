# 3D asset requirements (asset production backlog)

List of additional 3D/render assets the website design needs. Assets that **already exist**: `sino.glb` v004 (rig + 7 clips) and static renders in `sino-3d-mascot/export/renders/` (front, 3/4, side, back, face, avatar). The spec for integrating assets into the website is in [mascot-sino.md](mascot-sino.md).

This document is **a spec only**. Production happens in the `sino-3d-mascot` project (Blender), and the exported results are then copied into this repo per §6.

## 1. Why additional assets are needed

Findings from the Sintra research ([research/sintra-reference.md](research/sintra-reference.md)):
- Almost all Sintra visuals are **pre-baked renders** (looping MP4 video, still images, one Lottie animation), not realtime 3D. There is only one `<canvas>` on the homepage. The performance cost is low and render quality is maximal.
- Characters always appear **in a work context** (office desk, phone, laptop), never floating alone. This is what makes the product feel real.
- Every capability has its own visual (the "Soshie, schedule social media posts" card + phone mockup + character).

Sineva strategy: **a single realtime GLB only in the hero** (cursor interaction, greeting), and everything else as lightweight **pre-baked renders**. The rationale and budget are in [mascot-sino.md](mascot-sino.md) §2.

## 2. Technical standards for all assets

| Aspect | Standard |
|---|---|
| Look | Same as v004: stylized realism, matte-soft materials, glossy helmet |
| Lighting | **Bright studio** for the light UI: key light upper-left (±45°), soft fill, thin teal rim `#80D2D2`. Soft contact shadow under the feet. No dark background. |
| Background | Transparent (alpha) unless labeled "scene" |
| Camera | 50-85 mm equivalent, camera height at Sino's chest level, unless stated otherwise |
| Color | sRGB, **AgX** view transform (or Filmic) with the "Medium Contrast" look. One preset for all renders for consistency |
| Master resolution | 2048 px on the longest side (still), 1920×1080 or 1080×1350 (video) |
| Web still format | AVIF (primary) + WebP (fallback) + PNG master not deployed |
| Web alpha video format | WebM VP9 alpha (Chrome/Firefox/Edge) + HEVC with alpha `.mov`/`.mp4` (Safari). Always include a still poster |
| Web opaque video format | MP4 H.264 + WebM VP9, no audio track |
| Loop | First frame = last frame (seamless), 24 fps, 2-6 seconds |
| Safe area | Leave an 8% margin on all sides; the head must not be cut off in a 1:1 crop |
| File budget (after compression) | Still ≤ 120 KB (AVIF, 1200 px), video loop ≤ 900 KB, OG image ≤ 300 KB |
| Naming | `sino-{category}-{action}-{variant}.{ext}`, example `sino-pose-wave-34.avif` |

## 3. Asset list

Priority: **P0** = needed for v1 launch. **P1** = enriches, may follow later. **P2** = after launch.

### 3.1 Additional animation clips for `sino.glb` (realtime, hero)

| ID | Clip | Type | Duration | Used in | Priority |
|---|---|---|---|---|---|
| A1 | `look_around` | loop | 4 s | Hero idle variation, head slowly turns left-right | P1 |
| A2 | `point_right` / `point_left` | one-shot, hold at the end | 1.2 s | Hero points at the headline / CTA on first scroll | P0 |
| A3 | `nod_yes` | one-shot | 0.8 s | Hover reaction on the primary CTA | P1 |
| A4 | `celebrate_jump` | one-shot | 1.6 s | After a successful form submit (if the hero mascot is visible) | P2 |
| A5 | `wave_small` | one-shot | 1.2 s | Short version of `greet_wave` for repeat greetings that don't feel repetitive | P1 |

Technical requirements for clips: bone and morph target names identical to v004, and the head must stay overridable by the cursor look-at (a clip must not lock the head bone rotation by more than ±10°, so the look-at blending stays natural). Re-export via `scripts/export_web.py`, then apply draco compression with `--palette false` (see [mascot-sino.md](mascot-sino.md) §1.1).

### 3.2 Transparent pose stills (pre-rendered)

A set of poses for sections, cards, and UI states. All 3/4 view unless stated otherwise.

| ID | Pose | Used in | Priority |
|---|---|---|---|
| S1 | Wave (already exists as a clip, needs a still) | Footer CTA, waitlist | P0 |
| S2 | Holding phone, looking at screen | Product: customer chat | P0 |
| S3 | Typing on laptop | Product: operations, AI Build | P0 |
| S4 | Holding megaphone / phone with heart bubble | Product: social media | P0 |
| S5 | Holding coin stack + clipboard | Product: finance & admin | P0 |
| S6 | Handing over a paper / handshake gesture | Product: sales follow-up | P0 |
| S7 | Magnifying glass, curious | Services: AI Discovery | P0 |
| S8 | Stacking building blocks | Services: AI Build | P0 |
| S9 | Pointing at a small whiteboard | Services: AI Enablement | P0 |
| S10 | Thumbs up | Thank-you page | P0 |
| S11 | Scratching helmet, confused | 404, empty state | P0 |
| S12 | Peeking from the right edge (body cut off by the frame) | Attached to the edge of a card/table, like the Sintra mascot above the comparison table | P1 |
| S13 | Sitting, relaxed, holding mug | About, blog empty state | P1 |
| S14 | Front-facing headshot, smiling (bust) | Avatar in chat bubble, author fallback | P0 (`sino_avatar_2048` exists, check whether it is enough) |

Variants: every pose is exported at **2048 px master** and **1:1 + 4:5 crops**.

### 3.3 Scene renders (with background)

Sintra pattern: the character in a real workspace. Sineva version: **a bright small-business space in Indonesia/Southeast Asia** (not a luxury home), so it is relevant to UMKM (Indonesian micro, small and medium enterprises) and differs from Sintra.

| ID | Scene | Ratio | Used in | Priority |
|---|---|---|---|---|
| C1 | Sino at a small cafe's cashier counter, morning, window light | 16:9 + 4:5 (mobile) | Hero fallback/poster, default OG | P0 |
| C2 | Sino at an online shop's packing table, cardboard boxes and a phone | 4:3 | Product use case card | P1 |
| C3 | Sino and two people (silhouettes, no clear faces) at a meeting table with a whiteboard | 4:3 | Services, About | P1 |
| C4 | Close-up of Sino's hand holding a phone with a chat UI screen (screen replaced in post, see §4) | 4:5 | Product hero section | P0 |
| C5 | Laptop workspace with a small Sino beside the keyboard (Sintra's "small team on the desk" pattern) | 16:9 | "How it works" section | P1 |

Scene rules: warm neutral background palette (cream, light wood, white), teal accents only from Sino and one or two props. No real logos or brands. No text in renders (text is always HTML so it can be translated).

### 3.4 Video loops

| ID | Loop | Format | Used in | Priority |
|---|---|---|---|---|
| V1 | Sino idle breathing + blink, transparent, 3/4 | alpha WebM + HEVC alpha | Hero fallback on devices without WebGL / with data saver | P0 |
| V2 | Scene C1 with subtle motion (coffee steam, Sino waves once at second 1) | MP4/WebM opaque | Alternative hero option if the GLB performance test fails | P1 |
| V3 | Sino typing on a laptop (animated version of S3) | alpha | Product "operations" section | P2 |

### 3.5 Scroll-scrub sequence

| ID | Sequence | Spec | Used in | Priority |
|---|---|---|---|---|
| Q1 | Helmet turn + eyes open | 60 frames, Sino's close-up head rotates ±30° then the eyes open and smile. Export as an **AVIF/WebP sprite** (or driven directly from the GLB, see note) | "Meet Sino" section on the Home page, equivalent of Sintra's helmet Lottie | P1 |

Note: since the GLB is already on the page, Q1 can be replaced by **driving the GLB from scroll progress** (no new assets). Decide after the GLB performance test in the hero. If the GLB passes the budget, choose the GLB option.

### 3.6 3D icons (props)

Small 3D icons in the same style (clay-soft material, teal + white), used in feature cards and pricing-style grids, following Sintra's "Also included" card pattern.

| ID | Icon | Priority |
|---|---|---|
| I1 | Chat bubble | P0 |
| I2 | Calendar | P1 |
| I3 | Coin / wallet | P0 |
| I4 | Megaphone | P0 |
| I5 | Chart rising | P1 |
| I6 | Puzzle / plug (integration) | P0 |
| I7 | Shield (privacy/security) | P1 |
| I8 | Lightbulb (discovery) | P0 |

Spec: 512×512 transparent, light isometric camera (30°/20° rotation), AVIF ≤ 25 KB. The set must look like one family: same edge radius, thickness, and lighting.

### 3.7 Blog & OG templates

| ID | Asset | Spec | Priority |
|---|---|---|---|
| B1 | Default OG | 1200×630, Sino S1 on the right, left area empty for the HTML-to-image title (the title is rendered by `next/og`, not in the render) | P0 |
| B2 | Blog cover kit | Sino poses S2-S13 on the brand gradient background ([tokens.md](tokens.md) `--gradient-cover-*`), 1600×900. The editor picks combinations in the admin, no per-article render | P1 |

## 4. UI screen mockups (not 3D, but needed alongside scenes)

Sintra puts real product screenshots in phone/laptop mockups. For Sineva:
- Screens are built as **HTML/SVG components** on top of a rendered device frame (the phone/laptop frame is rendered without a screen, the screen = a transparent area). The benefit: text stays translatable, sharp, and can be animated (chat bubbles appearing one by one).
- Frame renders needed: **phone frame** (3/4 left, 3/4 right, front) and **laptop frame** (3/4), light aluminum material. Priority P0 for the phone 3/4.
- Screen content may only depict features confirmed by team `CBT`.

## 5. Acceptance checklist per asset

- [ ] Look and lighting match side by side with the v004 renders (check in one preview grid)
- [ ] Clean on `--color-canvas` and `--color-surface-tint` backgrounds (see [tokens.md](tokens.md)), no dark fringe on alpha edges
- [ ] File size under the §2 budget
- [ ] No text, third-party logos, or recognizable human faces
- [ ] File name follows the convention, master PNG/EXR stored in `sino-3d-mascot/export/`
- [ ] Passes brand/IP review (risk R1 in `sino-3d-mascot/IMPLEMENTATION_PLAN.md`: Sino must not look like a Sintra character)

## 6. Location in the website repo

```
public/mascot/
├── sino.glb                 (draco-optimized output, not the raw 13 MB file)
├── poster/                  hero poster still (LCP)
├── poses/                   S1-S14  (.avif, .webp)
├── scenes/                  C1-C5
├── loops/                   V1-V3   (.webm, .mp4, poster)
├── icons/                   I1-I8
└── og/                      B1
```

Large assets (video, GLB) can move to the SeaweedFS `media-public` bucket behind the Cloudflare CDN once NEW-seaweedfs and CPR-9 are ready. Until then, `public/` is enough.
