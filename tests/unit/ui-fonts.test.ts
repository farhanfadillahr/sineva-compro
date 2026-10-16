import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const fonts = read('src/styles/fonts.ts')
const css = read('src/app/globals.css')
const layouts = {
  public: read('src/app/(public)/[locale]/layout.tsx'),
  admin: read('src/app/(admin)/layout.tsx'),
}

// next/font is evaluated by the Next compiler, so it cannot run under Vitest. These assertions pin
// the configuration the performance budget depends on (self-hosted, swap, two subsets).
describe('font configuration', () => {
  it('loads Plus Jakarta Sans and Geist Mono through next/font/google', () => {
    expect(fonts).toMatch(/from 'next\/font\/google'/)
    expect(fonts).toMatch(/Plus_Jakarta_Sans\(/)
    expect(fonts).toMatch(/Geist_Mono\(/)
  })

  it('uses latin and latin-ext subsets with display swap on both fonts', () => {
    expect(fonts.match(/subsets: \['latin', 'latin-ext'\]/g)).toHaveLength(2)
    expect(fonts.match(/display: 'swap'/g)).toHaveLength(2)
  })

  it('does not request static weights, which would download one file per weight', () => {
    expect(fonts).not.toMatch(/weight: \[/)
  })

  it('publishes the CSS variables that --font-sans and --font-mono read', () => {
    expect(fonts).toContain("variable: '--font-plus-jakarta-sans'")
    expect(fonts).toContain("variable: '--font-geist-mono'")
    expect(css).toMatch(/--font-sans:\s*var\(--font-plus-jakarta-sans\)/)
    expect(css).toMatch(/--font-mono:\s*var\(--font-geist-mono\)/)
  })

  it.each(Object.entries(layouts))(
    'applies both font variables on the <html> of the %s layout',
    (_name, layout) => {
      expect(layout).toMatch(/from '@\/styles\/fonts'/)
      expect(layout).toMatch(/<html[^>]*className=/)
      expect(layout).toContain('plusJakartaSans.variable')
      expect(layout).toContain('geistMono.variable')
    },
  )
})
