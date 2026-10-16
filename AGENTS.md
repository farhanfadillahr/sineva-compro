## Design system (Rev. 3)

Before any public UI, copy, animation or mascot work, read [`docs/design/README.md`](docs/design/README.md) and follow its reading order. Brand name is "Sineva". Public site: English, light theme only, no em dash or en dash in copy.

## Arah produk aktif

Ikuti PRD Rev. 3 dan `docs/architecture/decisions/2026-10-14-custom-admin.md`: website publik dan admin custom terintegrasi dalam Next.js, tanpa headless CMS. Integrasi Payload telah diganti pada salinan kerja fondasi; dokumentasi/setup/test lama berlabel historis. Jangan mengembalikan dependency/route CMS atau memakai hasil test historis sebagai bukti fondasi baru. Schema aplikasi memakai migration di `drizzle/`; database/volume lama dipertahankan.

## Git conventions

Ikuti [`CONTRIBUTING.md`](CONTRIBUTING.md) untuk nama branch, commit, dan judul PR. Gunakan prefix branch seperti `feat/`, `fix/`, `docs/`, atau `chore/` tanpa nama pribadi; semua commit dan judul PR memakai Conventional Commits.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
