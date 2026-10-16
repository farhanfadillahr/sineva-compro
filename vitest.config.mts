import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Two projects instead of per-file `@vitest-environment` docblocks: the environment is decided by
// the file extension, so a new component test cannot silently run under `node` because someone
// forgot the pragma. `.test.ts` stays on the fast node environment; only `.test.tsx` pays for jsdom.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    clearMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          server: { deps: { inline: ['next-intl'] } },
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['tests/unit/**/*.test.tsx'],
          // Vitest runs without globals, so Testing Library cannot register its own auto-cleanup.
          setupFiles: ['tests/helpers/ui-setup.ts'],
        },
      },
    ],
  },
})
