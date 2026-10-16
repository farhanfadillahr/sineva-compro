import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { POSE_FILES } from '@/components/pages/home/poses'
import { ABOUT_POSES } from '@/components/pages/about/about-model'

// The About page takes every word from the content source (or messages). Page code that holds a
// sentence is a bug: it would ship untranslated and outside the admin. Parsed with the TypeScript
// compiler so class names, comments and import paths do not count.
// jsdom replaces the global URL, so the root comes from the working directory (the repo root).
const ROOT = process.cwd()
const ABOUT_DIR = join(ROOT, 'src/components/pages/about')
const PAGE_FILE = join(ROOT, 'src/app/(public)/[locale]/about/page.tsx')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

const files = [...sourceFiles(ABOUT_DIR).filter((f) => /\.tsx?$/.test(f)), PAGE_FILE]
const rel = (f: string) => f.replace(ROOT, '')
const read = (f: string) => readFileSync(f, 'utf8')

const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'title', 'placeholder', 'aria-description'])
// A sentence or a capitalised phrase: two or more words, starting with a capital letter, or any
// text that ends like a sentence. Tailwind class lists start lowercase and never end in a full stop.
const SENTENCE = /^[A-Z][\p{L}'’-]*(\s+[\p{L}0-9'’,.-]+)+[.!?]?$|[\p{L}]{2,}\s+[\p{L}]{2,}.*[.!?]$/u

function findings(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    read(file),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX,
  )
  const out: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && node.text.trim() !== '') {
      out.push(`${rel(file)}: JSX text "${node.text.trim()}"`)
    }
    if (
      ts.isJsxAttribute(node) &&
      TEXT_ATTRIBUTES.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      node.initializer.text !== ''
    ) {
      out.push(`${rel(file)}: ${node.name.getText(source)}="${node.initializer.text}"`)
    }
    const isModuleSpecifier =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier
    if (isModuleSpecifier) return
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      SENTENCE.test(node.text.trim())
    ) {
      out.push(`${rel(file)}: string "${node.text}"`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

describe('no hardcoded marketing copy in the About page code', () => {
  it('has source to scan', () => {
    expect(files.length).toBeGreaterThanOrEqual(6)
    expect(files.some((f) => f.endsWith('about-view.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('team-section.tsx'))).toBe(true)
    expect(files).toContain(PAGE_FILE)
  })

  it('contains no sentence, JSX text, or literal alt, aria-label and title', () => {
    expect(files.flatMap(findings)).toEqual([])
  })

  it('contains no em dash or en dash (copywriting.md rule 1), in code or comments', () => {
    expect(files.filter((f) => /[–—]/.test(read(f))).map(rel)).toEqual([])
  })

  it('the scan itself catches a sentence (guard against a regex that matches nothing)', () => {
    expect(SENTENCE.test('Meet the people behind it')).toBe(true)
    expect(SENTENCE.test('Sino replies to customers.')).toBe(true)
    expect(SENTENCE.test('flex flex-col gap-4')).toBe(false)
    expect(SENTENCE.test('/contact')).toBe(false)
  })
})

describe('About page code stays within its lane', () => {
  it('does not import the fixtures: it codes against the content contract only', () => {
    const offenders = files.filter((f) =>
      /tests\/fixtures|fixture-source|createFixtureContentSource/.test(read(f)),
    )
    expect(offenders.map(rel)).toEqual([])
  })

  it('reads content only through getContentSource', () => {
    expect(read(join(ABOUT_DIR, 'get-about-model.ts'))).toContain('getContentSource')
  })

  it('imports no static image file, so a missing asset can never fail the build', () => {
    const offenders = files.filter((f) =>
      /import\s[^;]*from\s+['"][^'"]+\.(png|jpe?g|webp|avif|gif|svg)['"]/.test(read(f)),
    )
    expect(offenders.map(rel)).toEqual([])
  })

  it('is static: no server action, no network request, nothing stored', () => {
    const offenders = files.filter((f) =>
      /['"]use server['"]|\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/.test(
        read(f),
      ),
    )
    expect(offenders.map(rel)).toEqual([])
  })

  it('renders no structured data: Organization JSON-LD belongs to another page task', () => {
    const offenders = files.filter((f) => /ld\+json|application\/ld|jsonLd/i.test(read(f)))
    expect(offenders.map(rel)).toEqual([])
  })

  it('does not use the realtime Sino canvas', () => {
    const offenders = files.filter((f) =>
      /sino-canvas|SinoHero|heroCanvas|mascot\/sino/.test(read(f)),
    )
    expect(offenders.map(rel)).toEqual([])
  })
})

describe('About poses', () => {
  it('maps every pose the page uses to a still that exists in public/mascot/poses', () => {
    for (const [slot, pose] of Object.entries(ABOUT_POSES)) {
      const file = POSE_FILES[pose]
      expect(file, `${slot}: pose ${pose}`).toBeTruthy()
      expect(existsSync(join(ROOT, 'public/mascot/poses', `${file}.webp`)), file).toBe(true)
    }
  })
})
