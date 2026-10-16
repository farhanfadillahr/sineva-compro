import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'exports/**',
    // vendored three.js draco decoder (minified third-party code, not ours to lint)
    'public/draco/**',
    '.superpowers/**',
    'next-env.d.ts',
  ]),
])
