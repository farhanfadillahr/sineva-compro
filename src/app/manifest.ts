import type { MetadataRoute } from 'next'

// Values mirror the design tokens in globals.css: `--color-canvas` (the splash background, the
// same white the icons are drawn on) and `--color-action-primary` (the brand teal for the browser
// chrome). Next.js cannot read CSS here, so tests/unit/manifest.test.ts fails if they drift.
const BACKGROUND_COLOR = '#ffffff'
const THEME_COLOR = '#00686d'

// One PNG per size serves both purposes. It is drawn at 60 percent on a solid background, which
// leaves the maskable safe zone clear and still looks right unmasked. Listed twice rather than as
// `purpose: 'any maskable'`, which launchers handle inconsistently.
const iconSizes = [192, 512] as const

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sineva',
    short_name: 'Sineva',
    start_url: '/',
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: iconSizes.flatMap((size) =>
      (['any', 'maskable'] as const).map((purpose) => ({
        src: `/brand/icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose,
      })),
    ),
  }
}
