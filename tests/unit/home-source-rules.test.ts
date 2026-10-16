import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// The Home page takes every word from the content source (or messages). Page code that holds a
// sentence is a bug: it would ship untranslated and outside the admin. Parsed with the TypeScript
// compiler so class names, comments and import paths do not count.
const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const HOME_DIR = join(ROOT, 'src/components/pages/home')
const PAGE_FILE = join(ROOT, 'src/app/(public)/[locale]/page.tsx')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

const files = [...sourceFiles(HOME_DIR).filter((f) => /\.tsx?$/.test(f)), PAGE_FILE]
const rel = (f: string) => f.replace(ROOT, '')

const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'title', 'placeholder', 'aria-description'])
// A sentence or a capitalised phrase: two or more words, starting with a capital letter, or any
// text that ends like a sentence. Tailwind class lists start lowercase and never end in a full stop.
const SENTENCE = /^[A-Z][\p{L}'’-]*(\s+[\p{L}0-9'’,.-]+)+[.!?]?$|[\p{L}]{2,}\s+[\p{L}]{2,}.*[.!?]$/u

function findings(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
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

describe('no hardcoded marketing copy in the Home page code', () => {
  it('has source to scan', () => {
    expect(files.length).toBeGreaterThanOrEqual(5)
    expect(files.some((f) => f.endsWith('home-view.tsx'))).toBe(true)
    expect(files).toContain(PAGE_FILE)
  })

  it('contains no sentence, JSX text, or literal alt, aria-label and title', () => {
    expect(files.flatMap(findings)).toEqual([])
  })

  it('contains no em dash or en dash (copywriting.md rule 1), in code or comments', () => {
    expect(files.filter((f) => /[–—]/.test(readFileSync(f, 'utf8'))).map(rel)).toEqual([])
  })

  it('the scan itself catches a sentence (guard against a regex that matches nothing)', () => {
    expect(SENTENCE.test('Book a free consultation')).toBe(true)
    expect(SENTENCE.test('Sino replies to customers.')).toBe(true)
    expect(SENTENCE.test('flex flex-col gap-4')).toBe(false)
    expect(SENTENCE.test('/products/ai-agents#waitlist')).toBe(false)
    expect(SENTENCE.test('Home')).toBe(false)
  })
})

describe('Home page code stays within its lane', () => {
  it('does not import the fixtures: it codes against the content contract only', () => {
    const offenders = files.filter((f) =>
      /tests\/fixtures|fixture-source|createFixtureContentSource/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders.map(rel)).toEqual([])
  })

  it('reads content only through getContentSource', () => {
    expect(readFileSync(join(HOME_DIR, 'get-home-model.ts'), 'utf8')).toContain('getContentSource')
  })

  it('imports no static image file, so a missing asset can never fail the build', () => {
    const offenders = files.filter((f) =>
      /import\s[^;]*from\s+['"][^'"]+\.(png|jpe?g|webp|avif|gif|svg)['"]/.test(
        readFileSync(f, 'utf8'),
      ),
    )
    expect(offenders.map(rel)).toEqual([])
  })
})
