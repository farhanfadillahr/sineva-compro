import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import manifest from '../../src/app/manifest'

const root = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url))
const css = readFileSync(root('src/app/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

// First declaration of a custom property, with `var(--x)` chains followed to a literal value.
function token(name: string): string {
  const raw = css.match(new RegExp(`${name}\\s*:\\s*([^;{}]+);`))?.[1].trim()
  if (!raw) throw new Error(`token ${name} not found in globals.css`)
  const alias = raw.match(/^var\((--[a-z0-9-]+)\)$/)
  return alias ? token(alias[1]) : raw.toLowerCase()
}

describe('web app manifest', () => {
  const m = manifest()

  it('names the app Sineva and opens it standalone at the root', () => {
    expect(m.name).toBe('Sineva')
    expect(m.short_name).toBe('Sineva')
    expect(m.start_url).toBe('/')
    expect(m.display).toBe('standalone')
  })

  // The splash screen shows the canvas behind the icon; the browser chrome takes the brand
  // action color. Both come from the design tokens so a rebrand has one place to change.
  it('takes its colors from the design tokens', () => {
    expect(m.background_color?.toLowerCase()).toBe(token('--color-canvas'))
    expect(m.theme_color?.toLowerCase()).toBe(token('--color-action-primary'))
  })

  it.each([192, 512])('lists a %i px icon for both the any and maskable purposes', async (size) => {
    const entries = (m.icons ?? []).filter((icon) => icon.sizes === `${size}x${size}`)
    expect(entries.map((icon) => icon.purpose).sort()).toEqual(['any', 'maskable'])
    for (const icon of entries) {
      expect(icon.type).toBe('image/png')
      expect(icon.src).toBe(`/brand/icon-${size}.png`)
      const meta = await sharp(root(`public${icon.src}`)).metadata()
      expect([meta.width, meta.height]).toEqual([size, size])
    }
  })
})
