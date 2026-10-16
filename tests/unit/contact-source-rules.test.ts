import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { CONTACT_INTERESTS, CONTACT_SEGMENTS } from '@/lib/contact-message'
import en from '../../messages/en.json'

// The Contact pages take every word from the content source or the `Contact` messages. Page code
// that holds a sentence would ship untranslated and outside the admin. Parsed with the TypeScript
// compiler so class names, comments and import paths do not count (same method as the Home rules).
const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CONTACT_DIR = join(ROOT, 'src/components/pages/contact')
const ROUTE_DIR = join(ROOT, 'src/app/(public)/[locale]/contact')
const PAGE_FILES = [join(ROUTE_DIR, 'page.tsx'), join(ROUTE_DIR, 'thank-you/page.tsx')]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

const files = [...sourceFiles(CONTACT_DIR).filter((f) => /\.tsx?$/.test(f)), ...PAGE_FILES]
const rel = (f: string) => f.replace(ROOT, '')
const read = (f: string) => readFileSync(f, 'utf8')

const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'title', 'placeholder', 'aria-description'])
// The builder's own option values ("Small business", "AI Build" ...) are wire values that the
// message composer validates against, not words shown to a visitor: the labels are in messages.
const WIRE_VALUES = new Set<string>([...CONTACT_SEGMENTS, ...CONTACT_INTERESTS])
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
      !WIRE_VALUES.has(node.text) &&
      SENTENCE.test(node.text.trim())
    ) {
      out.push(`${rel(file)}: string "${node.text}"`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

describe('no hardcoded copy in the Contact page code', () => {
  it('has source to scan', () => {
    expect(files.some((f) => f.endsWith('contact-form.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('contact-view.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('thank-you-view.tsx'))).toBe(true)
    expect(files).toEqual(expect.arrayContaining(PAGE_FILES))
  })

  it('contains no sentence, JSX text, or literal alt, aria-label and title', () => {
    expect(files.flatMap(findings)).toEqual([])
  })

  it('contains no em dash or en dash, in code or comments', () => {
    expect(files.filter((f) => /[–—]/.test(read(f))).map(rel)).toEqual([])
  })

  it('the Contact messages have no em dash or en dash and no empty string', () => {
    const walk = (value: unknown): string[] =>
      typeof value === 'string'
        ? [value]
        : Object.values(value as Record<string, unknown>).flatMap(walk)
    const strings = walk(en.Contact)
    expect(strings.length).toBeGreaterThan(30)
    for (const text of strings) {
      expect(text.trim()).not.toBe('')
      expect(text).not.toMatch(/[–—]/)
    }
  })
})

describe('the form never talks to a server (phase 1 is static)', () => {
  const formFiles = sourceFiles(CONTACT_DIR).filter((f) => /\.tsx?$/.test(f))
  // Comments are stripped first: the code explains what it avoids, and that must not trip the scan.
  const code = (file: string) =>
    ts.transpileModule(read(file), {
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        target: ts.ScriptTarget.ES2022,
        removeComments: true,
      },
    }).outputText

  it('uses no network or storage API', () => {
    const FORBIDDEN =
      /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie|['"]use server['"]/
    expect(formFiles.filter((f) => FORBIDDEN.test(code(f))).map(rel)).toEqual([])
  })

  it('sets no form action and imports no server action, database or fixtures', () => {
    const FORBIDDEN =
      /\baction\s*=|\bformAction\b|useActionState|useFormStatus|next\/server|features\/(auth|users)|lib\/db|tests\/fixtures|fixture-source|createFixtureContentSource/
    expect(formFiles.filter((f) => FORBIDDEN.test(code(f))).map(rel)).toEqual([])
  })

  it('reads content only through getContentSource', () => {
    expect(read(join(CONTACT_DIR, 'get-contact-model.ts'))).toContain('getContentSource')
  })
})

describe('the route files', () => {
  it('Contact exports metadata from the page SEO fields and 404s without content', () => {
    const page = read(PAGE_FILES[0]!)
    expect(page).toContain('generateMetadata')
    expect(page).toContain('buildContactMetadata')
    expect(page).toContain('notFound')
  })

  it('Thank you exports the noindex metadata builder', () => {
    const page = read(PAGE_FILES[1]!)
    expect(page).toContain('generateMetadata')
    expect(page).toContain('buildThankYouMetadata')
  })
})
