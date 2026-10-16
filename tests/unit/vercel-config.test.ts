import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The Vercel project was created from the CLI with the "Other" preset, which served only
// public/ and answered NOT_FOUND for every page. Pinning the framework in the repo makes every
// deploy (CLI or Git) build and route the app as Next.js.
describe('vercel.json', () => {
  it('pins the Next.js framework preset', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { framework?: string }
    expect(config.framework).toBe('nextjs')
  })
})
