// Regenerates every icon the site ships from Sino's head:
//
//   src/app/icon.png            512 px, transparent, tightly cropped (Next.js file convention)
//   src/app/favicon.ico         16, 32 and 48 px, transparent background
//   src/app/apple-icon.png      180 px, head at 70 percent on the canvas color
//   public/brand/icon-192.png   manifest icons, head at 60 percent on the canvas color so the
//   public/brand/icon-512.png   same file passes as both `any` and `maskable`
//
// Run with `node scripts/generate-icons.mjs` after changing the source art or the canvas token.
// The source, assets/brand/sino-head-source.webp, is a 1024 px transparent render of Sino's head and
// helmet from the v008 GLB (sino-3d-mascot scripts/props3d/render_head_icon.py). It is only read.
//
// Why a raster and not the brand symbol: the owner wants the tab to show Sino. A 3D render has no
// vector form, so icon.svg is replaced by icon.png; browsers pick the ICO or the PNG by size.

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))

// Mirrors --color-canvas in src/app/globals.css (var(--white)). tests/unit/manifest.test.ts and
// tests/unit/app-icons.test.ts fail if the CSS token and these pixels drift apart.
const CANVAS = '#ffffff'
const SOURCE = root('assets/brand/sino-head-source.webp')

// Share of the canvas the head's longer side occupies. The helmet is round, so 60 percent keeps it
// inside the maskable safe circle (40 percent radius); the neck ring under it is cut off first.
const APPLE_FILL = 0.7
const MANIFEST_FILL = 0.6
const FAVICON_FILL = 0.98

/** The head cropped to its opaque pixels and padded to a square, transparent. */
async function squareHead() {
  const trimmed = await sharp(SOURCE).trim({ threshold: 1 }).png().toBuffer()
  const { width, height } = await sharp(trimmed).metadata()
  const side = Math.max(width, height)
  return sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: trimmed,
        left: Math.round((side - width) / 2),
        top: Math.round((side - height) / 2),
      },
    ])
    .png()
    .toBuffer()
}

async function render(head, size, fill, background) {
  const inner = Math.round(size * fill)
  const art = await sharp(head).resize(inner, inner, { kernel: 'lanczos3' }).png().toBuffer()
  const pad = Math.floor((size - inner) / 2)
  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: background ? 3 : 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
  const composed = await base
    .composite([{ input: art, left: pad, top: pad }])
    .png()
    .toBuffer()
  // Opaque icons drop the alpha channel entirely (launchers and iOS expect a solid square).
  const out = background ? sharp(composed).flatten({ background }).removeAlpha() : sharp(composed)
  return out.png({ compressionLevel: 9 }).toBuffer()
}

/** Minimal ICO writer: PNG-compressed entries, which every current browser reads. */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, data }, n) => {
    const at = 6 + n * 16
    header[at] = size >= 256 ? 0 : size
    header[at + 1] = size >= 256 ? 0 : size
    header.writeUInt16LE(1, at + 4)
    header.writeUInt16LE(32, at + 6)
    header.writeUInt32LE(data.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...images.map((i) => i.data)])
}

async function write(path, data) {
  await mkdir(dirname(root(path)), { recursive: true })
  await writeFile(root(path), data)
  console.log(path, data.length, 'bytes')
}

const head = await squareHead()
await write('src/app/icon.png', await render(head, 512, 0.98))
await rm(root('src/app/icon.svg'), { force: true })
const favicons = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, data: await render(head, size, FAVICON_FILL) })),
)
await write('src/app/favicon.ico', ico(favicons))
await write('src/app/apple-icon.png', await render(head, 180, APPLE_FILL, CANVAS))
for (const size of [192, 512]) {
  await write(`public/brand/icon-${size}.png`, await render(head, size, MANIFEST_FILL, CANVAS))
}
