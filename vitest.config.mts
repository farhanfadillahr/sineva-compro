import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    server: { deps: { inline: ['next-intl'] } },
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    clearMocks: true,
  },
})
