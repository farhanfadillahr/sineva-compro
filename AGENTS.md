## Arah produk aktif

Ikuti PRD Rev. 2 dan `docs/architecture/decisions/2026-10-14-custom-admin.md`: website publik dan admin custom terintegrasi dalam Next.js, tanpa headless CMS. Integrasi Payload telah diganti pada salinan kerja fondasi; dokumentasi/setup/test lama berlabel historis. Jangan mengembalikan dependency/route CMS atau memakai hasil test historis sebagai bukti fondasi baru. Schema aplikasi memakai migration di `drizzle/`; database/volume lama dipertahankan.

## Arahan desain Founder

Desain final belum tersedia. Gunakan UI sementara buatan asisten yang mengikuti identitas Sineva Tech, logo yang sudah ada, dan perilaku responsif. Pisahkan token dan komponen agar mudah disesuaikan. Implementasi desain final mengikuti instruksi atau referensi Founder berikutnya; jangan menganggap UI sementara sebagai desain final yang disetujui.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
