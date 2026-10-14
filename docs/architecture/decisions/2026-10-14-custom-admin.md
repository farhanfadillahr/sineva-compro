# ADR — Mengganti headless CMS dengan admin custom

**Tanggal:** 14 Oktober 2026. **Status:** keputusan produk disetujui Founder; implementasi fondasi pengganti berjalan pada salinan kerja CPR-7.

## Keputusan

Founder menolak headless CMS dan memilih **admin custom dalam Next.js, tetap bisa mengedit konten, blog, dan lead**. Keputusan ini menggantikan D1, D6 dan D8 Rev. 1 yang memakai Payload. Chatbot tetap dikembangkan terpisah.

Website publik dan admin `/admin` berada dalam satu aplikasi Next.js modular monolith. PostgreSQL menyimpan konten/terjemahan, akun/session, lead dan waitlist. Layout tetap di kode; admin mengelola isi dan SEO tanpa deploy ulang. Kebutuhan admin tidak dihapus, dan Payload tidak diganti dengan headless CMS lain.

Library rancangan: Drizzle ORM + node-postgres untuk data/migration dan Better Auth untuk autentikasi melalui adapter Drizzle. Library tersebut tidak menyediakan panel CMS; schema domain, UI, kebijakan Admin/Editor, bootstrap operator dan lockout menjadi tanggung jawab aplikasi. [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [Better Auth Next.js](https://better-auth.com/docs/integrations/next), [adapter Drizzle](https://better-auth.com/docs/adapters/drizzle).

Library dipilih sebagai keputusan teknis rancangan, bukan klaim bahwa Founder memilih merek library. Library terpin telah dipasang pada salinan kerja implementasi; bukan berarti admin konten lengkap sudah tersedia. Versi stabil yang kompatibel dan advisory diperiksa sebelum manifest dikunci.

## Konsekuensi

Konten ID/EN, blog/rich text, draft/publish/preview, R2, SEO, Admin/Editor, mini-CRM, ekspor waitlist dan email tetap dalam v1. Form, daftar, dashboard, upload, izin dan publikasi yang sebelumnya berasal dari CMS kini dibangun dan diuji sendiri. Estimasi tiket admin mencakup schema, query/action, UI dan test.

Signup publik ditutup; Admin pertama dibuat melalui perintah operator. Admin hanya memenuhi §9 PRD, tanpa platform CMS generik, page builder, atau public content CRUD API.

Alternatif yang tidak dipilih: melanjutkan headless CMS, konten hanya di file repo tanpa admin, atau CMS konvensional terpisah. Brand/logo, VPS/Coolify, dan pemisahan chatbot tetap mengikuti keputusan sebelumnya.

## Transisi

Fondasi lama ada pada commit `a7f00fb`, draft [PR #1](https://github.com/farhanfadillahr/sineva-compro/pull/1). PR tetap draft dan tidak boleh di-merge sebagai implementasi Rev. 2. Rencana/setup lama adalah arsip; test lama hanya evidence fondasi lama.

CPR-7 menginventarisasi data, menghapus integrasi/dependency/generated files Payload, membuat migration aplikasi, lalu membuktikan database/session dan shell admin custom. Tidak otomatis menghapus database/volume/data developer. Bila data perlu dipertahankan, gunakan database pengganti dengan export-import/pemetaan yang direview. Password hash/session Payload tidak diasumsikan kompatibel dengan Better Auth.

Catatan revisi awal hanya mengubah dokumen. Eksekusi CPR-7 berikutnya telah mengganti source/dependency serta menerapkan migration pada database aplikasi lokal yang baru, tanpa menghapus database lama. Belum commit/push, merge atau deploy implementasi pengganti.

## Acuan

- [PRD Rev. 2](../../prd/2026-10-14-company-profile-prd.md): `FR-ADM-01`–`06`, pemetaan ID historis.
- [Arsitektur](../README.md) dan [rencana CPR-7 aktif](../../superpowers/plans/2026-10-14-cpr-7-foundation.md).
- [Rencana lama](../../superpowers/plans/2026-10-14-cpr-7-payload-foundation-superseded.md), [setup lama](../payload-foundation-setup-superseded.md), [verifikasi historis](../foundation-validation.md).
- Linear: `[CMS]` → `[Admin]`, M2 menjadi **Admin & Halaman**; identifier dan relasi tiket dipertahankan.
