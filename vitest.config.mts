import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    server: { deps: { inline: ['next-intl'] } },
    include: ['tests/unit/**/*.test.ts'],
    clearMocks: true,
  },
})
