// Regenerates every icon the site ships from the brand symbol:
//
//   src/app/icon.svg            optimized, tightly cropped vector (Next.js file convention)
//   src/app/favicon.ico         16, 32 and 48 px, transparent background
//   src/app/apple-icon.png      180 px, symbol at 70 percent on the canvas color
//   public/brand/icon-192.png   manifest icons, symbol at 60 percent on the canvas color so the
//   public/brand/icon-512.png   same file passes as both `any` and `maskable`
//
// Run with `node scripts/generate-icons.mjs` after changing the source art or the canvas token.
// The source file, public/brand/sineva-symbol-original.svg, is only read.
//
// Why raster the SVG ourselves instead of shipping the original: the source is 5225 x 5225 with
// 3-decimal coordinates and a 33-stop gradient (180 KB). The optimizer below keeps the geometry
// (whole units at a 1024 unit scale, relative cubic segments) and replaces the gradient with the two
// stops it already interpolates between, which brings the file to a size fit for a <link rel=icon>
// without pulling in svgo for a single file.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))

// Mirrors --color-canvas in src/app/globals.css (var(--white)). tests/unit/manifest.test.ts and
// tests/unit/app-icons.test.ts fail if the CSS token and these pixels drift apart.
const CANVAS = '#ffffff'

// Longer side of the optimized icon.svg viewBox, in user units. Path coordinates are rounded to
// whole units, so at 1024 the geometry is off by at most half a unit (0.05 percent): invisible at
// any icon size, and integers keep the file a third smaller than 1 decimal does.
const SVG_UNITS = 1024

// Share of the canvas the symbol's longer side occupies. Maskable icons keep important content
// inside a circle of 40 percent of the side; the symbol is not a square, so 60 percent of its
// longer side stays inside that circle (checked by tests/unit/app-icons.test.ts).
const APPLE_FILL = 0.7
const MANIFEST_FILL = 0.6
// A hair under 1 so the antialiased edge of a 16 px favicon is not clipped by the canvas.
const FAVICON_FILL = 0.96

/**
 * Parses a path made only of absolute M, C and Z commands, which is all the source art uses.
 * Anything else throws instead of rendering a wrong icon silently.
 */
function parsePath(d) {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const subpaths = []
  let current = null
  let command = null
  let numbers = []
  const flush = () => {
    if (command === 'M' && numbers.length === 2) {
      current = { start: [numbers[0], numbers[1]], curves: [] }
      subpaths.push(current)
    } else if (command === 'C' && numbers.length === 6) {
      current.curves.push(numbers)
    } else if (numbers.length !== 0) {
      throw new Error(`Unexpected path data after ${command}: ${numbers.join(',')}`)
    }
    numbers = []
  }
  for (const token of tokens) {
    if (/[A-Za-z]/.test(token)) {
      if (!['M', 'C', 'Z'].includes(token)) throw new Error(`Unsupported path command ${token}`)
      flush()
      command = token
      continue
    }
    numbers.push(Number(token))
    // A command may repeat its arguments (implicit `C x1 y1 x2 y2 x y x1 ...`).
    if (command === 'C' && numbers.length === 6) {
      flush()
    }
  }
  flush()
  return subpaths
}

/** Bounding box of the filled shape, sampling each cubic Bezier rather than trusting control points. */
function boundsOf(subpaths) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const add = (x, y) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  for (const { start, curves } of subpaths) {
    let [x0, y0] = start
    add(x0, y0)
    for (const [x1, y1, x2, y2, x3, y3] of curves) {
      for (let step = 1; step <= 24; step++) {
        const t = step / 24
        const u = 1 - t
        add(
          u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        )
      }
      x0 = x3
      y0 = y3
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

// Shortest text for a number: no trailing zeros, no leading zero (".5"), no "-0".
const fmt = (n, decimals = 0) =>
  n
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')
    .replace(/^(-?)0\./, '$1.')
    .replace(/^-0$/, '0')

/** Joins path numbers with the fewest separators: a minus sign already separates. */
const join = (values) =>
  values
    .map((n) => fmt(n))
    .reduce(
      (text, value) => (text === '' || value.startsWith('-') ? text + value : `${text} ${value}`),
      '',
    )

/**
 * Builds the optimized icon: coordinates translated to the symbol's own bounding box and scaled so
 * the longer side is SVG_UNITS, emitted as one absolute `M` per subpath followed by relative `c`
 * segments. Each delta is taken from the already-rounded previous point, so rounding errors do not
 * accumulate along a subpath.
 */
function optimizedSvg(source) {
  const d = source.match(/<path[^>]*\sd="([^"]+)"/)?.[1]
  if (!d) throw new Error('No path found in the source symbol')
  const subpaths = parsePath(d)
  const box = boundsOf(subpaths)
  const scale = SVG_UNITS / Math.max(box.width, box.height)
  const mapX = (x) => (x - box.minX) * scale
  const mapY = (y) => (y - box.minY) * scale

  const round = Math.round
  let out = ''
  for (const { start, curves } of subpaths) {
    let px = round(mapX(start[0]))
    let py = round(mapY(start[1]))
    out += `M${join([px, py])}c`
    let first = true
    for (const c of curves) {
      const pts = []
      for (let i = 0; i < 6; i += 2) pts.push([round(mapX(c[i])), round(mapY(c[i + 1]))])
      const rel = pts.flatMap(([x, y]) => [round(x - px), round(y - py)])
      const text = join(rel)
      // Segments are separated by a space, or nothing when the next one starts with a minus sign.
      out += first || text.startsWith('-') ? text : ` ${text}`
      first = false
      ;[px, py] = pts[2]
    }
    out += 'z'
  }

  // The source gradient is flat until offset 0.125, then linear to the last stop; two stops
  // reproduce it (checked against the 33 source stops, worst channel error 1 of 255).
  const gradient = source.match(
    /<linearGradient[^>]*x1="([\d.]+)"[^>]*y1="([\d.]+)"[^>]*x2="([\d.]+)"[^>]*y2="([\d.]+)"/,
  )
  const stops = [...source.matchAll(/<stop offset="([\d.]+)" stop-color="(#[0-9a-f]{6})"/gi)]
  if (!gradient || stops.length < 2) throw new Error('Gradient not found in the source symbol')
  const [, gx1, gy1, gx2, gy2] = gradient.map(Number)
  const flatUntil = stops.findIndex((s) => s[2] !== stops[0][2]) - 1
  const startOffset = Number(stops[Math.max(flatUntil, 0)][1])
  const first = stops[Math.max(flatUntil, 0)][2]
  const last = stops[stops.length - 1][2]

  const w = fmt(box.width * scale, 1)
  const h = fmt(box.height * scale, 1)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    `<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="${fmt(mapX(gx1))}" y1="${fmt(mapY(gy1))}" x2="${fmt(mapX(gx2))}" y2="${fmt(mapY(gy2))}">` +
    `<stop offset="${startOffset}" stop-color="${first}"/><stop offset="1" stop-color="${last}"/>` +
    `</linearGradient>` +
    `<path fill="url(#g)" fill-rule="evenodd" d="${out}"/></svg>\n`
  return { svg, width: box.width * scale, height: box.height * scale }
}

/**
 * Renders the optimized symbol centered on a square canvas, its longer side taking `fill` of the
 * canvas. `background` null keeps the canvas transparent. Rendering the vector at the target size
 * (instead of shrinking a large raster) keeps edges crisp at 16 px.
 */
async function renderIcon({ svg, width, height }, size, fill, background) {
  const side = Math.max(width, height) / fill
  const inner = svg.replace(
    /^<svg [^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${fmt((width - side) / 2, 2)} ${fmt((height - side) / 2, 2)} ${fmt(side, 2)} ${fmt(side, 2)}">` +
      (background
        ? `<rect x="${fmt((width - side) / 2 - 1, 2)}" y="${fmt((height - side) / 2 - 1, 2)}" width="${fmt(side + 2, 2)}" height="${fmt(side + 2, 2)}" fill="${background}"/>`
        : ''),
  )
  let image = sharp(Buffer.from(inner), { density: 72 })
  // Solid backgrounds ship without an alpha channel: smaller, and launchers never composite them.
  if (background) image = image.removeAlpha()
  return image.png({ compressionLevel: 9, effort: 10 }).toBuffer()
}

/** Packs PNG images into an ICO container; PNG payloads are supported by every current browser. */
function packIco(images) {
  const header = Buffer.alloc(6 + images.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ size, data }, index) => {
    const at = 6 + index * 16
    // A stored 0 means 256, so sizes below that are written as-is.
    header[at] = size
    header[at + 1] = size
    header.writeUInt16LE(1, at + 4) // color planes
    header.writeUInt16LE(32, at + 6) // bits per pixel
    header.writeUInt32LE(data.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...images.map((i) => i.data)])
}

async function write(path, data) {
  await mkdir(dirname(root(path)), { recursive: true })
  await writeFile(root(path), data)
  console.log(`${path} (${data.length} bytes)`)
}

const source = await readFile(root('public/brand/sineva-symbol-original.svg'), 'utf8')
const symbol = optimizedSvg(source)

await write('src/app/icon.svg', symbol.svg)
await write(
  'src/app/favicon.ico',
  packIco(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await renderIcon(symbol, size, FAVICON_FILL, null),
      })),
    ),
  ),
)
await write('src/app/apple-icon.png', await renderIcon(symbol, 180, APPLE_FILL, CANVAS))
for (const size of [192, 512]) {
  await write(
    `public/brand/icon-${size}.png`,
    await renderIcon(symbol, size, MANIFEST_FILL, CANVAS),
  )
}
