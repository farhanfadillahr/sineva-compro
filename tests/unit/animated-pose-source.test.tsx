import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Source scans for AnimatedPose (mascot-sino.md section 5.1, motion.md sections 9 and 10). jsdom
// evaluates no stylesheet, so the "transform and opacity only" rule is checked on the CSS text,
// and "every pose goes through AnimatedPose" on the component sources.
// Vitest runs from the repository root. `import.meta.url` cannot be used here: the jsdom
// environment replaces URL with a class that fileURLToPath rejects.
const ROOT = process.cwd()
const MOTION_DIR = join(ROOT, 'src/components/motion')
const SECTIONS_DIR = join(ROOT, 'src/components/sections')
const HOME_DIR = join(ROOT, 'src/components/pages/home')

const read = (path: string) => readFileSync(path, 'utf8')
const rel = (path: string) => path.replace(`${ROOT}/`, '')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

const css = read(join(MOTION_DIR, 'animated-pose.module.css'))
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const cssCode = stripComments(css)

/** Every `@keyframes name { ... }` body. Braces nest one level (the percent selectors). */
function keyframeBodies(source: string): string[] {
  const bodies: string[] = []
  const re = /@keyframes\s+[\w-]+\s*\{/g
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let depth = 1
    let i = re.lastIndex
    for (; i < source.length && depth > 0; i++) {
      if (source[i] === '{') depth++
      if (source[i] === '}') depth--
    }
    bodies.push(source.slice(re.lastIndex, i - 1))
  }
  return bodies
}

/** Property names declared inside a block of CSS text. */
const declaredProperties = (block: string) =>
  [...block.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]!).filter((p) => !p.startsWith('--'))

const LAYOUT_PROPERTIES =
  /(^|[\s,])(width|height|min-width|max-width|min-height|max-height|top|left|right|bottom|inset|margin|margin-\w+|padding|padding-\w+|box-shadow|border|border-width|font-size|line-height|gap|flex-basis)(?=[\s,;]|$)/

describe('animated-pose.module.css only animates transform and opacity (motion.md section 10)', () => {
  it('has keyframes to scan', () => {
    expect(keyframeBodies(cssCode).length).toBeGreaterThanOrEqual(2)
  })

  it('declares nothing but transform and opacity (plus timing) inside any @keyframes', () => {
    const allowed = new Set(['transform', 'opacity', 'animation-timing-function'])
    for (const body of keyframeBodies(cssCode)) {
      const props = declaredProperties(body)
      expect(props.length).toBeGreaterThan(0)
      for (const prop of props) expect(allowed.has(prop), `keyframe property "${prop}"`).toBe(true)
    }
  })

  it('transitions and will-change name only transform and opacity', () => {
    const values = [
      ...cssCode.matchAll(/(?:transition(?:-property)?|will-change)\s*:\s*([^;]+);/g),
    ].map((m) => m[1]!)
    expect(values.length).toBeGreaterThan(0)
    for (const value of values) {
      expect(value, `"${value}"`).not.toMatch(LAYOUT_PROPERTIES)
      expect(value, `"${value}"`).not.toMatch(/\ball\b/)
    }
  })

  it('never mentions a layout property in any transition or animation shorthand', () => {
    const values = [...cssCode.matchAll(/(?:transition|animation)(?:-property)?\s*:\s*([^;]+);/g)]
    for (const [, value] of values) expect(value, `"${value}"`).not.toMatch(LAYOUT_PROPERTIES)
  })

  it('uses a transform on the layers that move (var-driven, so float, parallax and hover compose)', () => {
    expect(cssCode).toMatch(/translate3d\(0,\s*var\(--pose-parallax/)
    expect(cssCode).toMatch(/var\(--pose-lift/)
    expect(cssCode).toMatch(/rotate\(var\(--pose-rotate/)
  })
})

describe('animated-pose.module.css implements the documented values', () => {
  it('rises 24 px, then settles with a 1 degree overshoot on --ease-bounce', () => {
    expect(cssCode).toMatch(/24px/)
    expect(cssCode).toMatch(/rotate\(1deg\)/)
    expect(cssCode).toMatch(/var\(--ease-bounce/)
  })

  it('floats 6 px over 6 s', () => {
    expect(cssCode).toMatch(/translate3d\(0,\s*-6px,\s*0\)|translateY\(-6px\)/)
    expect(cssCode).toMatch(/\b6s\b/)
  })

  it('lifts 6 px and tilts 2 degrees on hover', () => {
    expect(cssCode).toMatch(/--pose-lift:\s*-6px/)
    expect(cssCode).toMatch(/--pose-rotate:\s*calc\(var\(--pose-tilt[^)]*\)\s*\*\s*2deg\)/)
  })

  it('floats only while in view (so offscreen poses cost nothing)', () => {
    expect(cssCode).toMatch(/\[data-inview=['"]true['"]\]/)
  })

  it('is static under prefers-reduced-motion: no animation, no transition, no transform', () => {
    const start = cssCode.indexOf('@media (prefers-reduced-motion: reduce)')
    expect(start).toBeGreaterThan(-1)
    const block = cssCode.slice(start)
    expect(block).toMatch(/animation:\s*none/)
    expect(block).toMatch(/transition:\s*none/)
    expect(block).toMatch(/transform:\s*none/)
  })
})

describe('AnimatedPose stays CSS plus IntersectionObserver (no GSAP, no canvas)', () => {
  const files = readdirSync(MOTION_DIR)
    .filter((f) => f.startsWith('animated-pose'))
    .map((f) => join(MOTION_DIR, f))

  it('has its files', () => {
    expect(files.map((f) => f.split('/').pop())).toEqual(
      expect.arrayContaining([
        'animated-pose.tsx',
        'animated-pose.module.css',
        'animated-pose-math.ts',
      ]),
    )
  })

  it('imports no animation library and never touches a canvas', () => {
    for (const file of files) {
      const text = stripComments(read(file))
      expect(text, rel(file)).not.toMatch(/gsap|lottie|three|canvas/i)
    }
  })

  it('registers its scroll listener as passive and drives it through requestAnimationFrame', () => {
    const text = read(join(MOTION_DIR, 'animated-pose.tsx'))
    expect(text).toMatch(/passive:\s*true/)
    expect(text).toMatch(/requestAnimationFrame/)
    expect(text).toMatch(/cancelAnimationFrame/)
  })
})

describe('every pose on Home goes through AnimatedPose', () => {
  const sectionFiles = sourceFiles(SECTIONS_DIR).filter((f) => /\.tsx?$/.test(f))
  const homeFiles = sourceFiles(HOME_DIR).filter((f) => /\.tsx?$/.test(f))
  const files = [...sectionFiles, ...homeFiles]
  const imports = (file: string, what: RegExp) => what.test(stripComments(read(file)))

  it('has source to scan', () => {
    expect(sectionFiles.length).toBeGreaterThan(8)
    expect(homeFiles.length).toBeGreaterThan(8)
  })

  it('renders pose stills with next/image only inside AnimatedPose, the LCP helper, and covers', () => {
    // section-image.tsx is the plain (priority-capable) image used for the hero poster and the
    // About scene. post-card.tsx and work-card.tsx draw CMS media covers, never a Sino pose.
    const ALLOWED = new Set([
      'src/components/sections/_internal/section-image.tsx',
      'src/components/pages/home/post-card.tsx',
      'src/components/pages/home/work-card.tsx',
    ])
    const offenders = files
      .filter((f) => imports(f, /from\s+['"]next\/image['"]/))
      .map(rel)
      .filter((f) => !ALLOWED.has(f))
    expect(offenders).toEqual([])
  })

  it('uses the plain SectionImage only in the hero block (the poster is the LCP element)', () => {
    const users = files
      .filter((f) => !f.endsWith('section-image.tsx'))
      .filter((f) => imports(f, /\bSectionImage\b/))
      .map(rel)
    expect(users).toEqual(['src/components/sections/hero-split.tsx'])
  })

  it('keeps the hero poster a priority image and animates only a non-priority still', () => {
    const hero = stripComments(read(join(SECTIONS_DIR, 'hero-split.tsx')))
    expect(hero).toMatch(/priority/)
    expect(hero).toMatch(/AnimatedPose/)
    const section = stripComments(read(join(SECTIONS_DIR, '_internal/section-image.tsx')))
    expect(section).toMatch(/preload:\s*true/)
    expect(section).toMatch(/fetchPriority:\s*'high'/)
  })

  it.each([
    ['sections/two-paths.tsx', join(SECTIONS_DIR, 'two-paths.tsx')],
    ['sections/task-card-grid.tsx', join(SECTIONS_DIR, 'task-card-grid.tsx')],
    ['sections/final-cta.tsx', join(SECTIONS_DIR, 'final-cta.tsx')],
    ['home/pose-image.tsx', join(HOME_DIR, 'pose-image.tsx')],
  ])('%s renders its pose through AnimatedPose', (_name, file) => {
    expect(imports(file, /from\s+['"]@\/components\/motion\/animated-pose['"]/)).toBe(true)
    expect(imports(file, /<AnimatedPose\b/)).toBe(true)
  })

  it('Home draws every pose key through PoseImage (which is AnimatedPose), never a bare Image', () => {
    const users = homeFiles.filter((f) => imports(f, /<PoseImage\b/))
    expect(users.map(rel).sort()).toEqual([
      'src/components/pages/home/home-view.tsx',
      'src/components/pages/home/meet-sino-section.tsx',
      'src/components/pages/home/post-card.tsx',
    ])
    for (const file of users) expect(imports(file, /from\s+['"]\.\/pose-image['"]/)).toBe(true)
  })

  it('no longer hand-rolls the old per-pose hover nudge or float class', () => {
    for (const name of ['two-paths.tsx', 'task-card-grid.tsx', 'final-cta.tsx']) {
      const text = stripComments(read(join(SECTIONS_DIR, name)))
      expect(text, name).not.toMatch(/-translate-y-1\.5|group-hover\/task:(-)?rotate|floatStyles/)
    }
  })
})
