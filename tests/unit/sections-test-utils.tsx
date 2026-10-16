// Shared helpers for the section block tests: axe in jsdom, matchMedia per query, local images.
import axe from 'axe-core'
import { vi } from 'vitest'
import type { MediaAsset } from '@/features/content/types'

/**
 * Run axe on a rendered container and return only critical and serious violations (the gate in
 * accessibility-performance.md). Colour contrast is switched off because jsdom does no layout or
 * cascade of the real stylesheet, so the rule would only ever report "incomplete". The `region`
 * rule is off because a block is a fragment, not a whole page with landmarks.
 */
export async function criticalAxeViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  return results.violations
    .filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)
}

/** matchMedia that answers per query, so a test can be "desktop" and "reduced motion" at once. */
export function stubMedia(matching: Record<string, boolean>) {
  const impl = (query: string) => ({
    matches: matching[query] ?? false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  })
  window.matchMedia = vi.fn(impl) as unknown as typeof window.matchMedia
}

export const REDUCED = '(prefers-reduced-motion: reduce)'
export const DESKTOP = '(min-width: 1024px)'

/** Local data URL image so next/image never needs a remote host in tests. */
export function image(alt: string, width = 800, height = 600): MediaAsset {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"/>`
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    width,
    height,
    alt,
    blurDataUrl: null,
  }
}
