#!/usr/bin/env node
/**
 * Builds the Sineva logo intro animations (Lottie / bodymovin JSON) from the traced SVGs in
 * assets/brand/logos/svg. Node built-ins only; run with:
 *
 *   node scripts/lottie/build-logo-intro.mjs
 *
 * Outputs public/lottie/sineva-logo-intro.json (stacked, 600x600) and
 * public/lottie/sineva-symbol-intro.json (symbol only, 400x400).
 *
 * Source geometry facts this script is built around (checked against the files, not assumed):
 *  - Paths use only M, C and Z (absolute). The parser still handles M/L/H/V/C/S/Z in absolute and
 *    relative form so a re-trace with different output does not silently break.
 *  - The symbol is only 4 disjoint subpaths with no holes: two big crescents that each carry one
 *    arm of the "S" (a bar with a rounded tip), and two small crescents. There is no separate "S"
 *    subpath, so the S is carved out of the two big crescents by cutting each along a chord
 *    between the two notches where its arm meets the arc.
 *  - The wordmark is 9 subpaths: 7 letter shapes (S, i, i-dot, n, e, v, a) plus 2 counters (the
 *    holes of "e" and "a"). Counters stay with their letter and the group uses even-odd fill.
 *  - The traced paths are very dense (~3400 cubic segments in the symbol), which would blow the
 *    size budget, so every outline is re-fitted with far fewer cubics (see refit()).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SVG_DIR = `${ROOT}assets/brand/logos/svg/`
const OUT_DIR = `${ROOT}public/lottie/`

const FPS = 60
/** Max distance (comp px) a re-fitted outline may drift from the traced one. */
const FIT_TOLERANCE = 0.1
/** Turn angle (deg) above which an anchor is a hard corner and is never merged across. */
const CORNER_DEG = 25

// ---------------------------------------------------------------------------------------------
// Small vector helpers. Points are [x, y].
// ---------------------------------------------------------------------------------------------
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const len = (a) => Math.hypot(a[0], a[1])
const dist = (a, b) => len(sub(a, b))
const unit = (a) => {
  const l = len(a)
  return l > 0 ? mul(a, 1 / l) : [0, 0]
}
const round1 = (n) => Math.round(n * 10) / 10 || 0 // `|| 0` folds -0 into 0
const round3 = (n) => Math.round(n * 1000) / 1000 || 0
const roundPt = (p) => [round1(p[0]), round1(p[1])]

// ---------------------------------------------------------------------------------------------
// SVG parsing
// ---------------------------------------------------------------------------------------------
function parseAttrs(tag) {
  const attrs = {}
  for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[m[1]] = m[2]
  return attrs
}

function parseSvg(file) {
  const src = readFileSync(file, 'utf8')
  const gradients = {}
  for (const m of src.matchAll(/<linearGradient\b([^>]*)>([\s\S]*?)<\/linearGradient>/g)) {
    const a = parseAttrs(m[1])
    if (a.gradientUnits !== 'userSpaceOnUse') {
      throw new Error(`gradient ${a.id}: only userSpaceOnUse is supported`)
    }
    const stops = [...m[2].matchAll(/<stop\b([^>]*)\/?>/g)].map((s) => {
      const sa = parseAttrs(s[1])
      return { offset: Number(sa.offset), color: parseHex(sa['stop-color']) }
    })
    gradients[a.id] = {
      p1: [Number(a.x1), Number(a.y1)],
      p2: [Number(a.x2), Number(a.y2)],
      stops,
    }
  }
  const paths = [...src.matchAll(/<path\b([^>]*)\/?>/g)].map((m) => {
    const a = parseAttrs(m[1])
    const gradient = /url\(#([^)]+)\)/.exec(a.fill ?? '')?.[1]
    if (!gradient || !gradients[gradient])
      throw new Error(`path ${a.id}: unresolved fill ${a.fill}`)
    if (a['fill-rule'] !== 'evenodd') throw new Error(`path ${a.id}: expected fill-rule evenodd`)
    return { id: a.id, gradient, subpaths: parsePathData(a.d) }
  })
  return { gradients, paths }
}

function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex ?? '')
  if (!m) throw new Error(`unsupported colour ${hex}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** A cubic segment. Lines become degenerate cubics so everything downstream is cubic-only. */
const cubic = (p0, c1, c2, p1) => ({ p0, c1, c2, p1 })
const line = (p0, p1) => cubic(p0, p0, p1, p1)

/** Returns [{ segs: cubic[] }] — one entry per closed subpath. */
function parsePathData(d) {
  if (/[^MmLlHhVvCcSsZz0-9eE.,\s+-]/.test(d)) {
    throw new Error('path data uses commands this script does not handle (Q/T/A)')
  }
  const tokens = d.match(/[MmLlHhVvCcSsZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)
  const subs = []
  let i = 0
  let cmd = ''
  let cur = [0, 0]
  let start = [0, 0]
  let lastC2 = null // for S (smooth cubic) reflection
  let segs = null
  const num = () => Number(tokens[i++])
  const close = () => {
    if (!segs) return
    if (dist(cur, start) > 1e-9) segs.push(line(cur, start))
    if (segs.length) subs.push({ segs })
    segs = null
    cur = start
  }
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) cmd = tokens[i++]
    const rel = cmd === cmd.toLowerCase()
    const op = cmd.toUpperCase()
    const base = rel ? cur : [0, 0]
    if (op === 'Z') {
      close()
      lastC2 = null
      continue
    }
    if (op === 'M') {
      close()
      cur = start = [base[0] + num(), base[1] + num()]
      segs = []
      lastC2 = null
      cmd = rel ? 'l' : 'L' // extra coordinate pairs after M are implicit line-tos
      continue
    }
    if (!segs) throw new Error(`drawing command ${cmd} before any moveto`)
    let next
    if (op === 'L') next = line(cur, [base[0] + num(), base[1] + num()])
    else if (op === 'H') next = line(cur, [(rel ? cur[0] : 0) + num(), cur[1]])
    else if (op === 'V') next = line(cur, [cur[0], (rel ? cur[1] : 0) + num()])
    else if (op === 'C') {
      const c1 = [base[0] + num(), base[1] + num()]
      const c2 = [base[0] + num(), base[1] + num()]
      next = cubic(cur, c1, c2, [base[0] + num(), base[1] + num()])
    } else if (op === 'S') {
      const c1 = lastC2 ? sub(mul(cur, 2), lastC2) : cur
      const c2 = [base[0] + num(), base[1] + num()]
      next = cubic(cur, c1, c2, [base[0] + num(), base[1] + num()])
    } else throw new Error(`unsupported path command ${cmd}`)
    lastC2 = op === 'C' || op === 'S' ? next.c2 : null
    if (dist(next.p0, next.p1) > 1e-9 || dist(next.p0, next.c1) > 1e-9) segs.push(next)
    cur = next.p1
  }
  close()
  return subs
}

// ---------------------------------------------------------------------------------------------
// Geometry utilities
// ---------------------------------------------------------------------------------------------
const bez = (s, u) => {
  const v = 1 - u
  const b0 = v * v * v
  const b1 = 3 * u * v * v
  const b2 = 3 * u * u * v
  const b3 = u * u * u
  return [
    b0 * s.p0[0] + b1 * s.c1[0] + b2 * s.c2[0] + b3 * s.p1[0],
    b0 * s.p0[1] + b1 * s.c1[1] + b2 * s.c2[1] + b3 * s.p1[1],
  ]
}
const mapSeg = (s, fn) => cubic(fn(s.p0), fn(s.c1), fn(s.c2), fn(s.p1))

/** Bounding box of the flattened curve (true extent, not the looser control-point hull). */
function bboxOf(segs) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const s of segs) {
    for (let k = 0; k <= 8; k++) {
      const p = bez(s, k / 8)
      x0 = Math.min(x0, p[0])
      y0 = Math.min(y0, p[1])
      x1 = Math.max(x1, p[0])
      y1 = Math.max(y1, p[1])
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
}
const unionBox = (boxes) =>
  bboxOf(boxes.flatMap((b) => [line([b.x0, b.y0], [b.x1, b.y1]), line([b.x0, b.y1], [b.x1, b.y0])]))

/** Signed shoelace area of the anchor polygon; only used to rank shapes by size. */
function areaOf(segs) {
  let a = 0
  for (const s of segs) a += s.p0[0] * s.p1[1] - s.p1[0] * s.p0[1]
  return Math.abs(a / 2)
}

/** Even-odd point-in-shape test on the flattened outline. */
function containsPoint(segs, pt) {
  let inside = false
  for (const s of segs) {
    let prev = s.p0
    for (let k = 1; k <= 8; k++) {
      const p = bez(s, k / 8)
      if (prev[1] > pt[1] !== p[1] > pt[1]) {
        const x = prev[0] + ((pt[1] - prev[1]) / (p[1] - prev[1])) * (p[0] - prev[0])
        if (x > pt[0]) inside = !inside
      }
      prev = p
    }
  }
  return inside
}

// ---------------------------------------------------------------------------------------------
// Outline re-fitting
//
// Why: the traced outlines are ~1500 tiny cubics per big shape (error ~0.2 SVG units). Lottie
// stores v/i/o per vertex, so keeping them blows the 120 KB budget several times over.
// Why not Ramer-Douglas-Peucker + polylines: it would turn smooth crescents into facets.
// Why not feed raw points to a generic Schneider fit: the original tangents are already known to
// be correct, so we merge *runs* of the existing cubics and pin each run's end tangents to the
// original ones. That keeps G1 behaviour exactly where the trace had it and never smooths over a
// real corner (runs are cut at every anchor whose turn angle exceeds CORNER_DEG).
// ---------------------------------------------------------------------------------------------
const TANGENT_EPS = 1e-3
const firstDir = (...vs) => {
  for (const v of vs) if (len(v) > TANGENT_EPS) return unit(v)
  return [0, 0]
}
const outDir = (s) => firstDir(sub(s.c1, s.p0), sub(s.c2, s.p0), sub(s.p1, s.p0))
const inDir = (s) => firstDir(sub(s.p1, s.c2), sub(s.p1, s.c1), sub(s.p1, s.p0))
const turnDeg = (a, b) => (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI

/** turns[i] = direction change at the anchor that starts segs[i]. */
function anchorTurns(segs) {
  const n = segs.length
  return segs.map((s, i) => turnDeg(inDir(segs[(i - 1 + n) % n]), outDir(s)))
}

/** Least-squares cubic through samples Q with fixed end tangents (Schneider's formulation). */
function fitCubic(Q, u, t1, t2) {
  const P0 = Q[0]
  const P3 = Q[Q.length - 1]
  let c00 = 0
  let c01 = 0
  let c11 = 0
  let x0 = 0
  let x1 = 0
  for (let k = 0; k < Q.length; k++) {
    const t = u[k]
    const v = 1 - t
    const b0 = v * v * v
    const b1 = 3 * t * v * v
    const b2 = 3 * t * t * v
    const b3 = t * t * t
    const a1 = mul(t1, b1)
    const a2 = mul(t2, b2)
    c00 += dot(a1, a1)
    c01 += dot(a1, a2)
    c11 += dot(a2, a2)
    const tmp = sub(Q[k], add(mul(P0, b0 + b1), mul(P3, b2 + b3)))
    x0 += dot(a1, tmp)
    x1 += dot(a2, tmp)
  }
  const det = c00 * c11 - c01 * c01
  const chord = dist(P0, P3)
  let alpha1 = Math.abs(det) > 1e-12 ? (x0 * c11 - x1 * c01) / det : 0
  let alpha2 = Math.abs(det) > 1e-12 ? (c00 * x1 - c01 * x0) / det : 0
  if (alpha1 < 1e-6 * chord || alpha2 < 1e-6 * chord) {
    // Degenerate solve (collinear-ish samples): fall back to the classic one-third handles.
    alpha1 = alpha2 = chord / 3
  }
  return cubic(P0, add(P0, mul(t1, alpha1)), add(P3, mul(t2, alpha2)), P3)
}

/** Fits segs[i..e) as one cubic; returns it, or null if it drifts beyond `tol`. */
function fitRun(segs, i, e, tol) {
  const Q = []
  for (let k = i; k < e; k++) for (let j = 0; j < 5; j++) Q.push(bez(segs[k], j / 5))
  Q.push(segs[e - 1].p1)
  const t1 = outDir(segs[i])
  const t2 = mul(inDir(segs[e - 1]), -1) // handle at the end points back along the curve
  if (len(t1) === 0 || len(t2) === 0) return null
  const u = [0]
  for (let k = 1; k < Q.length; k++) u.push(u[k - 1] + dist(Q[k], Q[k - 1]))
  const total = u[u.length - 1]
  for (let k = 0; k < u.length; k++) u[k] /= total
  let curve = fitCubic(Q, u, t1, t2)
  for (let iter = 0; iter < 4; iter++) {
    // Newton-Raphson reparameterisation: move each sample's parameter to its closest point.
    for (let k = 1; k < Q.length - 1; k++) {
      const q = bez(curve, u[k])
      const d1 = bezDeriv1(curve, u[k])
      const d2 = bezDeriv2(curve, u[k])
      const diff = sub(q, Q[k])
      const den = dot(d1, d1) + dot(diff, d2)
      if (Math.abs(den) > 1e-12) u[k] = Math.min(1, Math.max(0, u[k] - dot(diff, d1) / den))
    }
    curve = fitCubic(Q, u, t1, t2)
  }
  let err = 0
  for (let k = 0; k < Q.length; k++) err = Math.max(err, dist(bez(curve, u[k]), Q[k]))
  return err <= tol ? curve : null
}

function bezDeriv1(s, u) {
  const v = 1 - u
  return add(
    add(mul(sub(s.c1, s.p0), 3 * v * v), mul(sub(s.c2, s.c1), 6 * v * u)),
    mul(sub(s.p1, s.c2), 3 * u * u),
  )
}
function bezDeriv2(s, u) {
  const v = 1 - u
  const a = add(sub(s.c2, mul(s.c1, 2)), s.p0)
  const b = add(sub(s.p1, mul(s.c2, 2)), s.c1)
  return add(mul(a, 6 * v), mul(b, 6 * u))
}

/** Greedy run-merging of a closed cubic outline. Returns a (much shorter) closed cubic list. */
function refit(segs, tol = FIT_TOLERANCE) {
  const turns = anchorTurns(segs)
  const firstCorner = turns.findIndex((t) => t > CORNER_DEG)
  const r0 = firstCorner === -1 ? 0 : firstCorner
  const S = [...segs.slice(r0), ...segs.slice(0, r0)]
  const T = [...turns.slice(r0), ...turns.slice(0, r0)]
  const n = S.length
  const runs = []
  let i = 0
  while (i < n) {
    let maxEnd = n
    for (let k = i + 1; k < n; k++) {
      if (T[k] > CORNER_DEG) {
        maxEnd = k
        break
      }
    }
    let best = { end: i + 1, curve: S[i] }
    let misses = 0
    // Tolerate two consecutive misses: one noisy sample should not end a long smooth run.
    for (let e = i + 2; e <= maxEnd && misses < 3; e++) {
      const fit = fitRun(S, i, e, tol)
      if (fit) {
        best = { end: e, curve: fit }
        misses = 0
      } else misses++
    }
    runs.push(best.curve)
    i = best.end
  }
  return runs
}

/** Closed cubic list -> Lottie bezier object (v/i/o handles relative to their vertex). */
function toLottiePath(runs) {
  const n = runs.length
  const v = []
  const iT = []
  const oT = []
  for (let k = 0; k < n; k++) {
    const r = runs[k]
    const prev = runs[(k - 1 + n) % n]
    v.push(roundPt(r.p0))
    oT.push(roundPt(sub(r.c1, r.p0)))
    iT.push(roundPt(sub(prev.c2, r.p0)))
  }
  return { i: iT, o: oT, v, c: true }
}

// ---------------------------------------------------------------------------------------------
// Symbol split: crescents vs. the S
// ---------------------------------------------------------------------------------------------

// Reference bbox of the symbol-only SVG, and the hand-picked cut points in that space. Points are
// mapped into whichever file is processed by their position inside the symbol bbox, so the same
// table works for the (slightly different) trace in the stacked SVG.
const REF_BOX = { x0: 233, y0: 391, w: 4745, h: 4481 }
const REF_CUTS = {
  left: {
    notchA: [1187, 1948], // arm's upper edge meets the arc
    notchB: [888, 2780], // arm's lower edge meets the arc
    tip: [2911, 3732], // rounded end of the arm
  },
  right: {
    notchA: [4374, 2500],
    notchB: [3911, 3478],
    tip: [2202, 1493],
  },
}
/** How far (comp px) the arc piece reaches into the arm so the seam never antialiases open. */
const SEAM_OVERLAP = 3

/**
 * Sharpness of the outline at anchor k, measured over a window of `span` path length on each
 * side. The tracer approximates a corner with a run of anchors that each turn only a few
 * degrees, so the per-anchor tangent turn (anchorTurns) reads ~0 even at a real notch; a
 * windowed chord angle recovers it.
 */
function windowedTurn(segs, k, span) {
  const n = segs.length
  const walk = (dir) => {
    let acc = 0
    let j = k
    while (acc < span) {
      const next = (j + dir + n) % n
      acc += dist(segs[j].p0, segs[next].p0)
      j = next
      if (j === k) break
    }
    return segs[j].p0
  }
  const here = segs[k].p0
  return turnDeg(unit(sub(here, walk(-1))), unit(sub(walk(1), here)))
}

/** Sharpest anchor within `radius` of `target` (the notch where an arm meets its arc). */
function snapToCorner(segs, target, radius, span) {
  let best = -1
  let bestTurn = -1
  for (let k = 0; k < segs.length; k++) {
    if (dist(segs[k].p0, target) > radius) continue
    const t = windowedTurn(segs, k, span)
    if (t > bestTurn) {
      best = k
      bestTurn = t
    }
  }
  if (best === -1) throw new Error(`no anchor within ${radius} of cut target ${target}`)
  return best
}

const nearestAnchor = (segs, target) =>
  segs.reduce((best, s, k) => (dist(s.p0, target) < dist(segs[best].p0, target) ? k : best), 0)

const chain = (segs, a, b) => {
  const out = []
  for (let k = a; k !== b; k = (k + 1) % segs.length) out.push(segs[k])
  return out
}
const inChain = (segs, a, b, idx) => {
  for (let k = a; k !== b; k = (k + 1) % segs.length) if (k === idx) return true
  return false
}

/**
 * Cuts one big crescent into { arc, arm } along the chord between its two notch anchors.
 * The arm piece is closed with the plain chord; the arc piece is closed with a strip pushed
 * `SEAM_OVERLAP` px into the arm (along the arm axis), so when both are opaque the join is
 * covered by solid fill from both sides instead of two half-covered antialiased edges.
 */
function splitCrescent(segs, cuts, box) {
  const toComp = (p) => [
    box.x0 + ((p[0] - REF_BOX.x0) / REF_BOX.w) * box.w,
    box.y0 + ((p[1] - REF_BOX.y0) / REF_BOX.h) * box.h,
  ]
  const radius = box.w * 0.04
  const span = box.w * 0.006
  const a = snapToCorner(segs, toComp(cuts.notchA), radius, span)
  const b = snapToCorner(segs, toComp(cuts.notchB), radius, span)
  const tipPoint = toComp(cuts.tip)
  const tip = nearestAnchor(segs, tipPoint)
  if (a === b) throw new Error('both cut anchors snapped to the same corner')
  const A = segs[a].p0
  const B = segs[b].p0
  if (!containsPoint(segs, mul(add(A, B), 0.5))) throw new Error('cut chord leaves the shape')

  const armIsAB = inChain(segs, a, b, tip)
  const [from, to] = armIsAB ? [a, b] : [b, a] // arm = chain(from -> to)
  const armChain = chain(segs, from, to)
  const arcChain = chain(segs, to, from)
  const X = segs[from].p0
  const Y = segs[to].p0
  const arm = [...armChain, line(Y, X)]

  // Arm axis: from the chord midpoint toward the arm tip.
  const axis = unit(sub(tipPoint, mul(add(X, Y), 0.5)))
  const shift = mul(axis, SEAM_OVERLAP)
  // arcChain runs Y -> X, so it closes X -> X' -> Y' -> Y.
  const arc = [
    ...arcChain,
    line(X, add(X, shift)),
    line(add(X, shift), add(Y, shift)),
    line(add(Y, shift), Y),
  ]
  return { arc, arm }
}

/** Splits the symbol's 4 subpaths into crescent ("arc") groups and the S (two arm pieces). */
function buildSymbolGroups(subpaths, box) {
  const ranked = subpaths
    .map((sp) => ({ segs: sp.segs, area: areaOf(sp.segs), box: bboxOf(sp.segs) }))
    .sort((p, q) => q.area - p.area)
  if (ranked.length !== 4) throw new Error(`expected 4 symbol subpaths, got ${ranked.length}`)
  const arcs = []
  const sPieces = []
  for (const big of ranked.slice(0, 2)) {
    const side = big.box.cx < box.cx ? 'left' : 'right'
    const { arc, arm } = splitCrescent(big.segs, REF_CUTS[side], box)
    arcs.push(arc)
    sPieces.push(arm)
  }
  for (const small of ranked.slice(2)) arcs.push(small.segs)
  return {
    arcs,
    sPieces,
    // Whole-symbol outlines (uncut) for the highlight matte.
    whole: subpaths.map((sp) => sp.segs),
  }
}

/** Orders arcs clockwise starting at 12 o'clock (screen y points down, so atan2 grows clockwise). */
function orderClockwise(arcs, centre) {
  const angleOf = (segs) => {
    const c = segs.reduce((acc, s) => add(acc, s.p0), [0, 0])
    const m = mul(c, 1 / segs.length)
    const deg = (Math.atan2(m[1] - centre[1], m[0] - centre[0]) * 180) / Math.PI
    return (deg + 90 + 360) % 360
  }
  return [...arcs].sort((p, q) => angleOf(p) - angleOf(q))
}

// ---------------------------------------------------------------------------------------------
// Wordmark split: one group per letter, counters stay with their letter
// ---------------------------------------------------------------------------------------------
const LETTER_NAMES = ['S', 'i', 'i-dot', 'n', 'e', 'v', 'a']

function buildLetterGroups(subpaths) {
  const shapes = subpaths
    .map((sp) => ({ segs: sp.segs, area: areaOf(sp.segs), box: bboxOf(sp.segs) }))
    .sort((p, q) => q.area - p.area)
  const groups = []
  for (const s of shapes) {
    // A counter's bbox sits fully inside its letter's bbox. The i-dot does not: it floats above
    // the stem, so it correctly becomes its own group.
    const host = groups.find(
      (g) =>
        s.box.x0 >= g.box.x0 &&
        s.box.x1 <= g.box.x1 &&
        s.box.y0 >= g.box.y0 &&
        s.box.y1 <= g.box.y1,
    )
    if (host) host.members.push(s.segs)
    else groups.push({ box: s.box, area: s.area, members: [s.segs] })
  }
  // Left-to-right; where two groups share a column (i and its dot) the bigger one (stem) first.
  groups.sort((p, q) =>
    Math.abs(p.box.cx - q.box.cx) < 60 ? q.area - p.area : p.box.cx - q.box.cx,
  )
  if (groups.length !== LETTER_NAMES.length) {
    throw new Error(`expected ${LETTER_NAMES.length} letter groups, got ${groups.length}`)
  }
  return groups.map((g, k) => ({ name: LETTER_NAMES[k], members: g.members }))
}

// ---------------------------------------------------------------------------------------------
// Gradients
// ---------------------------------------------------------------------------------------------
function colorAt(stops, t) {
  if (t <= stops[0].offset) return stops[0].color
  for (let k = 1; k < stops.length; k++) {
    if (t <= stops[k].offset) {
      const a = stops[k - 1]
      const b = stops[k]
      const f = b.offset === a.offset ? 1 : (t - a.offset) / (b.offset - a.offset)
      return a.color.map((c, ch) => c + (b.color[ch] - c) * f)
    }
  }
  return stops[stops.length - 1].color
}

/**
 * Picks 4-6 stops that reproduce the SVG's (33-stop) ramp: start with the end points and keep
 * inserting a stop where the current piecewise-linear approximation is furthest off.
 */
function sampleStops(stops, { min = 4, max = 6, tolerance = 1.5 } = {}) {
  const chosen = [0, 1]
  const approx = () => chosen.map((offset) => ({ offset, color: colorAt(stops, offset) }))
  for (;;) {
    const cur = approx()
    let worst = { err: 0, t: 0.5 }
    for (let k = 1; k < 200; k++) {
      const t = k / 200
      const want = colorAt(stops, t)
      const got = colorAt(cur, t)
      const err = Math.max(...want.map((c, ch) => Math.abs(c - got[ch])))
      if (err > worst.err && !chosen.includes(t)) worst = { err, t }
    }
    if ((worst.err <= tolerance && chosen.length >= min) || chosen.length >= max) {
      return { stops: cur, maxError: worst.err }
    }
    chosen.push(worst.t)
    chosen.sort((p, q) => p - q)
  }
}

function lottieGradient(grad, xf) {
  const { stops, maxError } = sampleStops(grad.stops)
  const k = stops.flatMap((s) => [
    round3(s.offset),
    ...s.color.map((c) => Math.round((c / 255) * 10000) / 10000),
  ])
  return {
    start: roundPt(xf(grad.p1)),
    end: roundPt(xf(grad.p2)),
    colors: { p: stops.length, k },
    maxError,
  }
}

// ---------------------------------------------------------------------------------------------
// Lottie construction
// ---------------------------------------------------------------------------------------------
const frames = (ms) => round3((ms / 1000) * FPS)

const EASE = {
  expoOut: [0.16, 1, 0.3, 1],
  quintOut: [0.22, 1, 0.36, 1],
  cubicOut: [0.33, 1, 0.68, 1],
  inOut: [0.45, 0, 0.55, 1],
  sweep: [0.45, 0.05, 0.35, 1],
}

const stat = (k) => ({ a: 0, k })

/**
 * Keyframed property. Each step's `ease` shapes the segment that STARTS at that step.
 * Uses the s+e keyframe form (widest player compatibility); the last keyframe holds.
 */
function animated(steps) {
  const k = steps.map((step, idx) => {
    const kf = { t: round3(step.t), s: step.v }
    const next = steps[idx + 1]
    if (next) {
      const [x1, y1, x2, y2] = step.ease
      const fill = (n) => step.v.map(() => n)
      kf.e = next.v
      kf.i = { x: fill(x2), y: fill(y2) }
      kf.o = { x: fill(x1), y: fill(y1) }
    }
    return kf
  })
  return { a: 1, k }
}

const identityTr = () => ({
  ty: 'tr',
  p: stat([0, 0]),
  a: stat([0, 0]),
  s: stat([100, 100]),
  r: stat(0),
  o: stat(100),
  sk: stat(0),
  sa: stat(0),
})

function shapeGroup(name, outlines, gradient) {
  return {
    ty: 'gr',
    nm: name,
    it: [
      ...outlines.map((runs) => ({ ty: 'sh', nm: 'path', ks: stat(toLottiePath(runs)) })),
      {
        ty: 'gf',
        nm: 'gradient',
        o: stat(100),
        r: 2, // even-odd: counters (holes) stay holes
        t: 1, // linear
        s: stat(gradient.start),
        e: stat(gradient.end),
        g: { p: gradient.colors.p, k: stat(gradient.colors.k) },
      },
      identityTr(),
    ],
  }
}

let layerIndex = 0
function layer(name, ks, shapes, { ip = 0, op, td, tt } = {}) {
  const l = {
    ddd: 0,
    ind: ++layerIndex,
    ty: 4,
    nm: name,
    sr: 1,
    ks: {
      o: ks.o ?? stat(100),
      r: ks.r ?? stat(0),
      p: ks.p ?? stat([0, 0, 0]),
      a: ks.a ?? stat([0, 0, 0]),
      s: ks.s ?? stat([100, 100, 100]),
    },
    ao: 0,
    shapes,
    ip,
    op,
    st: 0,
    bm: 0,
  }
  if (td) l.td = td
  if (tt) l.tt = tt
  return l
}

/** Opacity ramp 0 -> 100 over the first `share` of a move that starts at `t` and lasts `dur`. */
const fadeIn = (t, dur, share = 0.55) =>
  animated([
    { t, v: [0], ease: EASE.cubicOut },
    { t: t + dur * share, v: [100] },
  ])

function buildComposition({ name, size, padding, symbolSrc, wordmarkSrc, op, sweepEnd }) {
  layerIndex = 0
  // 1. Everything into comp space with one uniform scale + translation.
  const allSegs = [...symbolSrc.subpaths, ...(wordmarkSrc?.subpaths ?? [])].flatMap((s) => s.segs)
  const srcBox = bboxOf(allSegs)
  const scale = Math.min(
    (size * (1 - 2 * padding)) / srcBox.w,
    (size * (1 - 2 * padding)) / srcBox.h,
  )
  const xf = (p) => [(p[0] - srcBox.cx) * scale + size / 2, (p[1] - srcBox.cy) * scale + size / 2]
  const toComp = (subpaths) => subpaths.map((sp) => ({ segs: sp.segs.map((s) => mapSeg(s, xf)) }))

  const symSubs = toComp(symbolSrc.subpaths)
  const symBox = unionBox(symSubs.map((sp) => bboxOf(sp.segs)))
  const centre = [symBox.cx, symBox.cy]
  const split = buildSymbolGroups(symSubs, symBox)
  const arcs = orderClockwise(split.arcs, centre)

  const symGrad = lottieGradient(symbolSrc.gradient, xf)
  const gradients = [symGrad]
  const centre3 = [round1(centre[0]), round1(centre[1]), 0]

  // 2. Crescent arcs: sweep in clockwise, 40 ms apart, -40deg -> 0, 85% -> 100%.
  const ARC_STAGGER = frames(40)
  const ARC_DUR = frames(550) - 3 * ARC_STAGGER // last arc lands exactly at 0.55 s
  const arcLayers = arcs.map((outline, k) => {
    const t = round3(k * ARC_STAGGER)
    return layer(
      `arc-${k + 1}`,
      {
        o: fadeIn(t, ARC_DUR),
        r: animated([
          { t, v: [-40], ease: EASE.expoOut },
          { t: t + ARC_DUR, v: [0] },
        ]),
        s: animated([
          { t, v: [85, 85, 100], ease: EASE.expoOut },
          { t: t + ARC_DUR, v: [100, 100, 100] },
        ]),
        p: stat(centre3),
        a: stat(centre3),
      },
      [shapeGroup(`arc-${k + 1}`, [refit(outline)], symGrad)],
      { op },
    )
  })

  // 3. The S: 0.25 s -> 0.75 s, 60% -> 104% -> 100%.
  const S0 = frames(250)
  const S1 = frames(250 + 350) // overshoot peak
  const S2 = frames(750)
  const sLayer = layer(
    's',
    {
      o: fadeIn(S0, S2 - S0, 0.4),
      s: animated([
        { t: S0, v: [60, 60, 100], ease: EASE.quintOut },
        { t: S1, v: [104, 104, 100], ease: EASE.inOut },
        { t: S2, v: [100, 100, 100] },
      ]),
      p: stat(centre3),
      a: stat(centre3),
    },
    [
      shapeGroup(
        's',
        split.sPieces.map((o) => refit(o)),
        symGrad,
      ),
    ],
    { op },
  )

  // 4. Wordmark letters: rise 24 px, 45 ms stagger, 0.7 s -> 1.3 s.
  const letterLayers = []
  if (wordmarkSrc) {
    const wordSubs = toComp(wordmarkSrc.subpaths)
    const wordGrad = lottieGradient(wordmarkSrc.gradient, xf)
    gradients.push(wordGrad)
    const letters = buildLetterGroups(wordSubs)
    const L_START = frames(700)
    const L_STAGGER = frames(45)
    const L_DUR = frames(600) - (letters.length - 1) * L_STAGGER
    letters.forEach((letter, k) => {
      const t = round3(L_START + k * L_STAGGER)
      letterLayers.push(
        layer(
          `letter-${letter.name}`,
          {
            o: fadeIn(t, L_DUR, 0.6),
            p: animated([
              { t, v: [0, 24, 0], ease: EASE.expoOut },
              { t: t + L_DUR, v: [0, 0, 0] },
            ]),
          },
          [
            shapeGroup(
              `letter-${letter.name}`,
              letter.members.map((m) => refit(m)),
              wordGrad,
            ),
          ],
          { op },
        ),
      )
    })
  }

  // 5. Highlight sweep: a soft white 25% band travelling over the symbol, clipped to the symbol
  // outline by an alpha track matte. The matte is the final-position symbol; by 0.6 s every arc
  // has landed and the S is within ~2% of its final scale, so the clip lines up to sub-pixel.
  const SWEEP0 = frames(600)
  const radius = symBox.w / 2
  const bandW = round1(radius * 0.7)
  const bandH = round1(radius * 3.2)
  const matte = layer(
    'sweep-matte',
    {},
    [
      {
        ty: 'gr',
        nm: 'symbol',
        it: [
          ...split.whole.map((o) => ({ ty: 'sh', nm: 'path', ks: stat(toLottiePath(refit(o))) })),
          { ty: 'fl', nm: 'fill', c: stat([1, 1, 1, 1]), o: stat(100), r: 2 },
          identityTr(),
        ],
      },
    ],
    { ip: SWEEP0, op: sweepEnd, td: 1 },
  )
  const band = layer(
    'sweep-band',
    {
      r: stat(22),
      p: animated([
        {
          t: SWEEP0,
          v: [round1(centre[0] - radius - bandW), round1(centre[1]), 0],
          ease: EASE.sweep,
        },
        { t: sweepEnd, v: [round1(centre[0] + radius + bandW), round1(centre[1]), 0] },
      ]),
    },
    [
      {
        ty: 'gr',
        nm: 'band',
        it: [
          { ty: 'rc', nm: 'band', d: 1, s: stat([bandW, bandH]), p: stat([0, 0]), r: stat(0) },
          {
            ty: 'gf',
            nm: 'band-gradient',
            o: stat(100),
            r: 1,
            t: 1,
            s: stat([round1(-bandW / 2), 0]),
            e: stat([round1(bandW / 2), 0]),
            // 3 white colour stops followed by 3 alpha stops: 0% -> 25% -> 0% across the band.
            g: { p: 3, k: stat([0, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0.5, 0.25, 1, 0]) },
          },
          identityTr(),
        ],
      },
    ],
    { ip: SWEEP0, op: sweepEnd, tt: 1 },
  )

  // Layer order is top-first. The matte must sit directly above the layer it clips.
  const ordered = [matte, band, ...letterLayers, sLayer, ...arcLayers.reverse()]
  ordered.forEach((l, k) => (l.ind = k + 1))

  const json = {
    v: '5.12.2',
    fr: FPS,
    ip: 0,
    op,
    w: size,
    h: size,
    nm: name,
    ddd: 0,
    assets: [],
    layers: ordered,
    markers: [],
  }
  return {
    json,
    stats: {
      arcs: arcs.length,
      sGroups: 1,
      sPieces: split.sPieces.length,
      letters: letterLayers.length,
      scale,
      gradientError: Math.max(...gradients.map((g) => g.maxError)),
      gradientStops: gradients.map((g) => g.colors.p),
    },
  }
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------
function main() {
  const stacked = parseSvg(`${SVG_DIR}sineva-stacked-original.svg`)
  const symbolOnly = parseSvg(`${SVG_DIR}sineva-symbol-original.svg`)
  const stackedSymbol = stacked.paths.find((p) => p.id === 'symbol')
  const stackedWord = stacked.paths.find((p) => p.id === 'wordmark')
  if (!stackedSymbol || !stackedWord)
    throw new Error('stacked SVG must contain #symbol and #wordmark')

  const full = buildComposition({
    name: 'Sineva logo intro',
    size: 600,
    padding: 0.12,
    symbolSrc: {
      subpaths: stackedSymbol.subpaths,
      gradient: stacked.gradients[stackedSymbol.gradient],
    },
    wordmarkSrc: {
      subpaths: stackedWord.subpaths,
      gradient: stacked.gradients[stackedWord.gradient],
    },
    op: 90, // 1.5 s: motion ends at 1.3 s, then a short hold on the final frame
    sweepEnd: frames(1000),
  })

  const symbolPath = symbolOnly.paths.find((p) => p.id === 'symbol')
  const symbol = buildComposition({
    name: 'Sineva symbol intro',
    size: 400,
    padding: 0.06, // tighter than the stacked logo: this one sits in a navbar/loader slot
    symbolSrc: {
      subpaths: symbolPath.subpaths,
      gradient: symbolOnly.gradients[symbolPath.gradient],
    },
    op: 60, // 1.0 s
    sweepEnd: frames(950),
  })

  mkdirSync(OUT_DIR, { recursive: true })
  const outputs = [
    ['sineva-logo-intro.json', full],
    ['sineva-symbol-intro.json', symbol],
  ]
  for (const [file, { json, stats }] of outputs) {
    writeFileSync(`${OUT_DIR}${file}`, JSON.stringify(json))
    console.log(file, JSON.stringify(stats))
  }

  // The repo runs `prettier --check .`, which would reject minified JSON. Format with the repo's
  // own prettier (already a devDependency) when it is installed.
  const prettier = `${ROOT}node_modules/prettier/bin/prettier.cjs`
  if (existsSync(prettier)) {
    execFileSync(
      process.execPath,
      [prettier, '--write', ...outputs.map(([f]) => `${OUT_DIR}${f}`)],
      {
        cwd: ROOT,
        stdio: 'inherit',
      },
    )
  } else {
    console.warn('prettier not found: JSON left minified; run `npx prettier --write public/lottie`')
  }
}

// Only build when executed directly, so the helpers stay importable for debugging.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()

export {
  bboxOf,
  parsePathData,
  parseSvg,
  refit,
  snapToCorner,
  windowedTurn,
  anchorTurns,
  containsPoint,
}
