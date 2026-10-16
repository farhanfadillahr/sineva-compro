import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// The Services pages take every word from the content source (or messages). Page code that holds
// a sentence is a bug: it would ship untranslated and outside the admin. Parsed with the
// TypeScript compiler so class names, comments and import paths do not count.
const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIR = join(ROOT, 'src/components/pages/services')
const LIST_PAGE = join(ROOT, 'src/app/(public)/[locale]/services/page.tsx')
const DETAIL_PAGE = join(ROOT, 'src/app/(public)/[locale]/services/[slug]/page.tsx')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

const files = [...sourceFiles(DIR).filter((f) => /\.tsx?$/.test(f)), LIST_PAGE, DETAIL_PAGE]
const rel = (f: string) => f.replace(ROOT, '')

const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'title', 'placeholder', 'aria-description'])
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

describe('no hardcoded marketing copy in the Services page code', () => {
  it('has source to scan', () => {
    expect(files.length).toBeGreaterThanOrEqual(8)
    expect(files.some((f) => f.endsWith('service-detail-view.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('services-list-view.tsx'))).toBe(true)
    expect(files).toContain(LIST_PAGE)
    expect(files).toContain(DETAIL_PAGE)
  })

  it('contains no sentence, JSX text, or literal alt, aria-label and title', () => {
    expect(files.flatMap(findings)).toEqual([])
  })

  it('contains no em dash or en dash, in code or comments', () => {
    expect(files.filter((f) => /[–—]/.test(readFileSync(f, 'utf8'))).map(rel)).toEqual([])
  })
})

describe('Services page code stays within its lane', () => {
  it('does not import the fixtures: it codes against the content contract only', () => {
    const offenders = files.filter((f) =>
      /tests\/fixtures|fixture-source|createFixtureContentSource/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders.map(rel)).toEqual([])
  })

  it('reads content only through getContentSource', () => {
    expect(readFileSync(join(DIR, 'get-services-model.ts'), 'utf8')).toContain('getContentSource')
  })

  it('has no page for Web Development (it is part of AI Build)', () => {
    const dir = join(ROOT, 'src/app/(public)/[locale]/services')
    expect(readdirSync(dir).sort()).toEqual(['[slug]', 'page.tsx'])
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
