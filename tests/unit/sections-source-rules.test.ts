import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const SECTIONS_DIR = fileURLToPath(new URL('../../src/components/sections', import.meta.url))

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

const files = sourceFiles(SECTIONS_DIR)
const tsxFiles = files.filter((f) => f.endsWith('.tsx'))
const rel = (f: string) => f.replace(SECTIONS_DIR, 'sections')

// Same colour rules as the ui kit (tests/unit/ui-no-hardcoded-color.test.ts): the blocks use
// semantic tokens only. CSS modules are scanned too, so keyframes cannot smuggle a colour in.
const FORBIDDEN = [
  { name: 'hex colour', pattern: /#[0-9a-fA-F]{3,6}\b/ },
  { name: 'rgb()/rgba()', pattern: /\brgba?\s*\(/i },
  { name: 'hsl()/hsla()', pattern: /\bhsla?\s*\(/i },
  {
    name: 'Tailwind palette colour',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?\b/,
  },
]

describe('no hardcoded colour in src/components/sections', () => {
  it('has source to scan', () => {
    expect(tsxFiles.length).toBeGreaterThanOrEqual(8)
  })

  it.each(FORBIDDEN)('contains no $name', ({ pattern }) => {
    const offenders = files
      .filter((file) => /\.(tsx?|css)$/.test(file))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, index) => ({ file, line: index + 1, text: line }))
          .filter(({ text }) => pattern.test(text))
          .map(({ file: f, line, text }) => `${rel(f)}:${line}  ${text.trim()}`),
      )
    expect(offenders).toEqual([])
  })
})

// Blocks take every word from props (the page passes messages/en.json or DB content), so a
// literal sentence in JSX is a bug. Parsed with the TypeScript compiler instead of a regex so
// strings inside class names and comments do not count.
const TEXT_ATTRIBUTES = new Set(['alt', 'aria-label', 'title', 'placeholder', 'aria-description'])

describe('no hardcoded copy in src/components/sections', () => {
  const offenders: string[] = []
  for (const file of tsxFiles) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TSX,
    )
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node) && node.text.trim() !== '') {
        offenders.push(`${rel(file)}: JSX text "${node.text.trim()}"`)
      }
      if (
        ts.isJsxAttribute(node) &&
        TEXT_ATTRIBUTES.has(node.name.getText(source)) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer)
      ) {
        offenders.push(`${rel(file)}: ${node.name.getText(source)}="${node.initializer.text}"`)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }

  it('has no literal text in JSX and no literal alt, aria-label or title', () => {
    expect(offenders).toEqual([])
  })

  it('contains no em dash or en dash (copywriting.md rule 1), in code or comments', () => {
    const hits = files.filter((f) => /[–—]/.test(readFileSync(f, 'utf8'))).map(rel)
    expect(hits).toEqual([])
  })
})

describe('section blocks are server components unless they need the browser', () => {
  // Client-only behaviour lives in small child components (CPR-75): these are the only files
  // allowed to opt in, and the public blocks themselves stay server components.
  const CLIENT_ALLOWED = new Set([
    'sections/_internal/hero-entrance.tsx',
    'sections/_internal/faq-accordion.tsx',
    'sections/_internal/sticky-steps-story.tsx',
    'sections/sticky-cta-bar.tsx',
  ])
  it('only the expected files use "use client"', () => {
    const clients = tsxFiles
      .filter((f) => /^\s*['"]use client['"]/m.test(readFileSync(f, 'utf8')))
      .map(rel)
      .sort()
    expect(clients).toEqual([...CLIENT_ALLOWED].sort())
  })
})
