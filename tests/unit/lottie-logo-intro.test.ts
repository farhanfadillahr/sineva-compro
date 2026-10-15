import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Loose structural types: the Lottie schema is large and we only assert on what we emit.
type Prop = { a: 0 | 1; k: unknown }
type Keyframe = { t: number; s?: number[] }
type Layer = {
  nm: string
  ty: number
  ip: number
  op: number
  td?: number
  tt?: number
  ddd?: number
  ks: { o: Prop; r: Prop; p: Prop; a: Prop; s: Prop }
  shapes: Shape[]
}
type Shape = { ty: string; it?: Shape[]; r?: number; ks?: { k: { v: number[][] } } }
type Lottie = {
  v: string
  fr: number
  ip: number
  op: number
  w: number
  h: number
  ddd: number
  assets: Array<Record<string, unknown>>
  layers: Layer[]
}

const variants = [
  {
    file: 'sineva-logo-intro.json',
    w: 600,
    h: 600,
    maxOp: 96,
    minArcs: 4,
    minLetters: 6,
  },
  {
    file: 'sineva-symbol-intro.json',
    w: 400,
    h: 400,
    maxOp: 60,
    minArcs: 4,
    minLetters: 0,
  },
] as const

const pathOf = (file: string) =>
  fileURLToPath(new URL(`../../public/lottie/${file}`, import.meta.url))
const load = (file: string) => JSON.parse(readFileSync(pathOf(file), 'utf8')) as Lottie

const isAnimated = (p: Prop): p is Prop & { a: 1; k: Keyframe[] } => p.a === 1
/** Value a property settles on after its last keyframe (what the final frame shows). */
const lastValue = (p: Prop): number[] => {
  const raw = isAnimated(p) ? (p.k.at(-1)?.s ?? []) : p.k
  return Array.isArray(raw) ? (raw as number[]) : [raw as number]
}
const firstValue = (p: Prop): number[] => {
  const raw = isAnimated(p) ? (p.k[0]?.s ?? []) : p.k
  return Array.isArray(raw) ? (raw as number[]) : [raw as number]
}
const startFrame = (layer: Layer): number => {
  const props = [layer.ks.o, layer.ks.r, layer.ks.p, layer.ks.s].filter(isAnimated)
  return Math.min(...props.map((p) => p.k[0].t))
}
const walk = (node: unknown, visit: (key: string, value: unknown) => void) => {
  if (Array.isArray(node)) node.forEach((n) => walk(n, visit))
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      visit(key, value)
      walk(value, visit)
    }
  }
}

describe.each(variants)('$file', ({ file, w, h, maxOp, minArcs, minLetters }) => {
  const anim = load(file)
  const groups = anim.layers.filter((l) => l.td !== 1 && l.tt !== 1)
  const arcs = groups.filter((l) => l.nm.startsWith('arc-'))
  const letters = groups.filter((l) => l.nm.startsWith('letter-'))
  const sGroups = groups.filter((l) => l.nm === 's')

  it('is valid JSON with the required header fields at 60 fps', () => {
    expect(anim.v).toEqual(expect.any(String))
    expect(anim.fr).toBe(60)
    expect(anim.ip).toBe(0)
    expect(anim.op).toBeGreaterThan(0)
    expect(anim.op).toBeLessThanOrEqual(maxOp)
    expect(anim.w).toBe(w)
    expect(anim.h).toBe(h)
  })

  it('has no expressions, images, fonts, text or 3D layers', () => {
    // Easing handles also use an "x" key, but as number arrays; an expression is a string.
    walk(anim, (key, value) => {
      if (key === 'x') expect(typeof value).not.toBe('string')
    })
    const raw = readFileSync(pathOf(file), 'utf8')
    expect(raw).not.toContain('"ef"')
    expect(raw).not.toContain('"chars"')
    expect(raw).not.toContain('"fonts"')
    expect(anim.ddd).toBe(0)
    for (const a of anim.assets) expect(a).not.toHaveProperty('p')
    for (const l of anim.layers) {
      expect(l.ty).toBe(4) // shape layers only
      expect(l.ddd ?? 0).toBe(0)
    }
  })

  it('stays small and rounds geometry to one decimal', () => {
    expect(statSync(pathOf(file)).size).toBeLessThan(120 * 1024)
    walk(anim, (key, value) => {
      if (key === 'v' && Array.isArray(value) && Array.isArray(value[0])) {
        for (const n of (value as number[][]).flat()) {
          expect(Math.abs(n * 10 - Math.round(n * 10))).toBeLessThan(1e-6)
        }
      }
    })
  })

  it('exposes animated groups: arcs, one S, and (full logo) one per letter', () => {
    expect(anim.layers.length).toBeGreaterThan(0)
    expect(arcs.length).toBeGreaterThanOrEqual(minArcs)
    expect(sGroups).toHaveLength(1)
    expect(letters.length).toBeGreaterThanOrEqual(minLetters)
    if (minLetters === 0) expect(letters).toHaveLength(0)
  })

  it('keeps evenodd gradient fills so holes stay holes', () => {
    for (const layer of groups) {
      const grp = layer.shapes.find((s) => s.ty === 'gr')
      const fill = grp?.it?.find((s) => s.ty === 'gf')
      expect(fill, layer.nm).toBeDefined()
      expect(fill?.r, layer.nm).toBe(2)
      expect(grp?.it?.filter((s) => s.ty === 'sh').length, layer.nm).toBeGreaterThan(0)
    }
  })

  it('settles every group on opacity 100 and the identity transform', () => {
    for (const layer of groups) {
      expect(lastValue(layer.ks.o), layer.nm).toEqual([100])
      expect(lastValue(layer.ks.s).slice(0, 2), layer.nm).toEqual([100, 100])
      expect(lastValue(layer.ks.r), layer.nm).toEqual([0])
      // Layout must match the static logo: position resolves back onto the anchor.
      expect(lastValue(layer.ks.p).slice(0, 2), layer.nm).toEqual(lastValue(layer.ks.a).slice(0, 2))
      expect(layer.ip).toBe(0)
      expect(layer.op).toBe(anim.op)
    }
  })

  it('starts every group invisible so it can animate in', () => {
    for (const layer of groups) expect(firstValue(layer.ks.o), layer.nm).toEqual([0])
  })

  it('keeps all keyframes inside the composition', () => {
    for (const layer of anim.layers) {
      for (const p of Object.values(layer.ks).filter(isAnimated)) {
        for (const kf of p.k) {
          expect(kf.t).toBeGreaterThanOrEqual(0)
          expect(kf.t).toBeLessThan(anim.op)
        }
      }
    }
  })

  it('staggers arcs clockwise by about 40 ms (2.4 frames)', () => {
    const order = [...arcs].sort((a, b) => Number(a.nm.slice(4)) - Number(b.nm.slice(4)))
    const starts = order.map(startFrame)
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeCloseTo(2.4, 1)
    expect(starts[0]).toBe(0)
    // Arcs start from -40 degrees and 85% scale.
    for (const arc of order) {
      expect(firstValue(arc.ks.r)).toEqual([-40])
      expect(firstValue(arc.ks.s).slice(0, 2)).toEqual([85, 85])
    }
  })

  it('pops the S with an overshoot to 104% starting from 60%', () => {
    const s = sGroups[0]
    const scales = (s.ks.s.k as Keyframe[]).map((k) => k.s?.[0])
    expect(scales[0]).toBe(60)
    expect(Math.max(...(scales as number[]))).toBe(104)
    expect(scales.at(-1)).toBe(100)
    expect(startFrame(s)).toBeCloseTo(15, 1) // 0.25 s
  })

  if (minLetters > 0) {
    it('rises letters 24 px with a ~45 ms (2.7 frame) stagger inside 0.7-1.3 s', () => {
      const names = letters.map((l) => l.nm)
      expect(names).toEqual([
        'letter-S',
        'letter-i',
        'letter-i-dot',
        'letter-n',
        'letter-e',
        'letter-v',
        'letter-a',
      ])
      const starts = letters.map(startFrame)
      expect(starts[0]).toBeCloseTo(42, 1) // 0.7 s
      for (let i = 1; i < starts.length; i++) {
        expect(starts[i] - starts[i - 1]).toBeCloseTo(2.7, 1)
      }
      for (const letter of letters) {
        expect(firstValue(letter.ks.p)).toEqual([0, 24, 0])
        const last = letter.ks.p.k as Keyframe[]
        expect(last.at(-1)?.t).toBeLessThanOrEqual(78 + 0.1) // 1.3 s
      }
    })
  }

  it('has a highlight sweep wired as an alpha track matte pair', () => {
    const i = anim.layers.findIndex((l) => l.td === 1)
    expect(i).toBeGreaterThanOrEqual(0)
    const matte = anim.layers[i]
    const band = anim.layers[i + 1]
    // A matte source must sit directly above the layer it masks.
    expect(band.tt).toBe(1)
    expect(band.nm).toBe('sweep-band')
    expect(matte.nm).toBe('sweep-matte')
    expect(matte.ip).toBe(band.ip)
    expect(matte.op).toBe(band.op)
    expect(band.ip).toBeCloseTo(36, 1) // 0.6 s
    expect(band.op).toBeLessThanOrEqual(anim.op)
    // The sweep must only travel across, never alter, the logo: it ends before the hold.
    expect(lastValue(band.ks.o)).toEqual([100])
  })
})
