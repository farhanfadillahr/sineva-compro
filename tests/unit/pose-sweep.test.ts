import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Source scan, like the Home one in animated-pose-source.test.tsx, for the pages that came after
// it: Services (overview and detail), Product, and the pages that show a pose still. Every Sino
// pose must go through AnimatedPose (mascot-sino.md section 5.1). The only plain image allowed is
// the LCP hero poster, which HeroSplit draws as a priority image on purpose.
// Vitest runs from the repository root; `import.meta.url` is unusable under jsdom.
const ROOT = process.cwd()
const PAGES = join(ROOT, 'src/components/pages')

const read = (path: string) => readFileSync(path, 'utf8')
const rel = (path: string) => path.replace(`${ROOT}/`, '')
const stripComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(path) ? [path] : []
  })
}

const POSE_PAGE_DIRS = ['services', 'product', 'contact', 'not-found'].map((d) => join(PAGES, d))
const files = POSE_PAGE_DIRS.flatMap(sourceFiles)
const code = (file: string) => stripComments(read(file))

describe('every pose on Services, Product, Contact and 404 goes through AnimatedPose', () => {
  it('has source to scan', () => {
    expect(files.length).toBeGreaterThan(20)
    for (const dir of POSE_PAGE_DIRS) expect(sourceFiles(dir).length, rel(dir)).toBeGreaterThan(0)
  })

  it('imports next/image nowhere in these pages (a bare Image would skip the motion)', () => {
    const offenders = files.filter((f) => /from\s+['"]next\/image['"]/.test(code(f))).map(rel)
    expect(offenders).toEqual([])
  })

  it('renders no raw <img> and never names a pose file directly', () => {
    for (const file of files) {
      expect(code(file), rel(file)).not.toMatch(/<img\b/)
      expect(code(file), rel(file)).not.toMatch(/mascot\/poses/)
    }
  })

  it('does not use the plain SectionImage, which is reserved for the LCP poster in HeroSplit', () => {
    const users = files.filter((f) => /\bSectionImage\b/.test(code(f))).map(rel)
    expect(users).toEqual([])
  })

  it('draws a pose only through PoseImage or the section blocks that wrap AnimatedPose', () => {
    // Anything that resolves a pose key to a file must hand the result to one of these.
    const resolvers = files.filter((f) => /\bposeImage\(/.test(code(f)))
    expect(resolvers.length).toBeGreaterThan(0)
    for (const file of resolvers) {
      expect(code(file), rel(file)).toMatch(/<(HeroSplit|FinalCta|TaskCardGrid|TwoPaths)\b/)
    }
  })

  it('marks as priority only the HeroSplit poster on the Services pages', () => {
    const withPriority = files.filter((f) => /^\s*priority\s*$/m.test(code(f))).map(rel)
    expect(withPriority).toEqual([
      'src/components/pages/services/service-detail-view.tsx',
      'src/components/pages/services/services-list-view.tsx',
    ])
    for (const file of withPriority) expect(code(join(ROOT, file))).toMatch(/<HeroSplit\b/)
  })

  it.each([
    ['services/service-cards-section.tsx'],
    ['services/services-list-view.tsx'],
    ['contact/thank-you-view.tsx'],
    ['not-found/not-found-view.tsx'],
  ])('%s draws its pose with PoseImage', (name) => {
    expect(code(join(PAGES, name))).toMatch(/<(?:PoseImage|JourneySteps)\b/)
  })
})

describe('the blocks the Services and Product pages compose animate their stills', () => {
  const SECTIONS = join(ROOT, 'src/components/sections')

  it.each(['hero-split.tsx', 'final-cta.tsx', 'task-card-grid.tsx'])(
    '%s uses AnimatedPose',
    (name) => {
      expect(code(join(SECTIONS, name))).toMatch(/<AnimatedPose\b/)
    },
  )

  it('HeroSplit keeps the poster a plain priority image only when the page asks for priority', () => {
    const hero = code(join(SECTIONS, 'hero-split.tsx'))
    expect(hero).toMatch(/priority\s*\?/)
    expect(hero).toMatch(/<AnimatedPose\b/)
  })
})
