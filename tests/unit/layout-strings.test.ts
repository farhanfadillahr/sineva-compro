import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import en from '../../messages/en.json'

const LAYOUT_DIR = fileURLToPath(new URL('../../src/components/layout', import.meta.url))
const files = readdirSync(LAYOUT_DIR).filter((name) => name.endsWith('.tsx'))

// Attributes that carry text a visitor reads or hears.
const TEXT_ATTRIBUTES = new Set(['aria-label', 'aria-description', 'alt', 'title', 'placeholder'])

/** Text a person would read: contains a letter. Punctuation and whitespace alone are layout. */
const isUserFacing = (text: string) => /\p{L}/u.test(text)

function findHardcodedStrings(file: string, text: string): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && isUserFacing(node.text)) {
      found.push(`${file}: text "${node.text.trim()}"`)
    }
    if (
      ts.isJsxAttribute(node) &&
      TEXT_ATTRIBUTES.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      isUserFacing(node.initializer.text)
    ) {
      found.push(`${file}: ${node.name.getText(source)}="${node.initializer.text}"`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

describe('layout components take their text from messages', () => {
  it('has component files to scan', () => {
    expect(files.length).toBeGreaterThan(5)
  })

  it('contains no hardcoded user-facing string in JSX', () => {
    const found = files.flatMap((file) =>
      findHardcodedStrings(file, readFileSync(join(LAYOUT_DIR, file), 'utf8')),
    )
    expect(found).toEqual([])
  })

  it('catches hardcoded text and attributes (the scanner itself works)', () => {
    const found = findHardcodedStrings(
      'x.tsx',
      '<button aria-label="Open menu" className="size-4">Open</button>',
    )
    expect(found).toEqual(['x.tsx: aria-label="Open menu"', 'x.tsx: text "Open"'])
  })

  it('ignores punctuation, icons and expressions', () => {
    expect(
      findHardcodedStrings('x.tsx', '<p alt="">{t("a")} · <b aria-label={label}>→</b></p>'),
    ).toEqual([])
  })
})

describe('navigation, footer and WhatsApp messages', () => {
  it('uses sentence case for CTAs from the copy lexicon', () => {
    expect(en.Nav.bookConsultation).toBe('Book a free consultation')
    expect(en.Nav.chatOnWhatsapp).toBe('Chat on WhatsApp')
    expect(en.Nav.productMenu.promo.title).toBe('Join the waitlist')
  })

  it('says "Sineva", never the old two-word brand name', () => {
    expect(JSON.stringify(en)).not.toMatch(/Sineva Tech/)
  })
})
