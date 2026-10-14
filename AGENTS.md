## Arah produk aktif

Ikuti PRD Rev. 2 dan `docs/architecture/decisions/2026-10-14-custom-admin.md`: website publik dan admin custom terintegrasi dalam Next.js, tanpa headless CMS. Integrasi Payload pada branch fondasi adalah implementasi lama yang direncanakan untuk diganti. Jangan melanjutkan setup/fitur Payload atau memakai hasil test historis sebagai bukti fondasi baru. Perubahan dokumentasi ini belum menjalankan penggantian source/database.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
