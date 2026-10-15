import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const UI_DIR = fileURLToPath(new URL('../../src/components/ui', import.meta.url))

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sourceFiles(path) : [path]
  })
}

// Components may only use semantic tokens (docs/design/tokens.md). A hex or functional colour in
// the component source, including inside a comment, would be copy-pasted into the next component.
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

describe('no hardcoded colour in src/components/ui', () => {
  it('has component source to scan', () => {
    expect(existsSync(UI_DIR)).toBe(true)
    expect(sourceFiles(UI_DIR).filter((file) => /\.tsx?$/.test(file)).length).toBeGreaterThan(10)
  })

  it.each(FORBIDDEN)('contains no $name', ({ pattern }) => {
    const offenders = sourceFiles(UI_DIR)
      .filter((file) => /\.(tsx?|css)$/.test(file))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, index) => ({ file, line: index + 1, text: line }))
          .filter(({ text }) => pattern.test(text))
          .map(({ file: f, line, text }) => `${f.replace(UI_DIR, 'ui')}:${line}  ${text.trim()}`),
      )
    expect(offenders).toEqual([])
  })
})
