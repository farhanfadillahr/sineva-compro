import { describe, expect, it } from 'vitest'

const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['localhost', '127.0.0.1'].includes(base.hostname) || base.protocol !== 'http:') {
  throw new Error('HTTP tests require a loopback test server')
}

async function html(path: string) {
  const response = await fetch(new URL(path, base))
  expect(response.status).toBe(200)
  return response.text()
}

describe('public layout shell over HTTP', () => {
  it('serves skip link, header, footer and the floating WhatsApp button on every public page', async () => {
    for (const path of ['/', '/about', '/privacy-policy']) {
      const page = await html(path)
      // The skip link comes before the header so it is the first Tab stop.
      expect(page.indexOf('Skip to content')).toBeGreaterThan(-1)
      expect(page.indexOf('Skip to content')).toBeLessThan(page.indexOf('<header'))
      expect(page).toContain('<footer')
      expect(page).toContain('data-slot="floating-whatsapp"')
      // Exactly one skip-link target: the page's own <main>, not a layout wrapper as well.
      expect(page.match(/id="main-content"/g)).toHaveLength(1)
    }
  })

  it('renders no language switcher while only one locale is enabled', async () => {
    expect(await html('/')).not.toContain('data-slot="language-switcher"')
  })

  it('shows only the social accounts and legal lines that exist in site settings', async () => {
    const page = await html('/')
    expect(page).toContain('aria-label="Sineva on Instagram"')
    expect(page).not.toContain('aria-label="Sineva on TikTok"')
    expect(page).not.toContain('data-slot="footer-address"')
    expect(page).not.toContain('data-slot="footer-legal"')
  })

  it('links WhatsApp to a wa.me URL without the plus sign', async () => {
    expect(await html('/')).toMatch(/href="https:\/\/wa\.me\/\d+\?text=/)
  })
})
