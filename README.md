# Sineva Tech — Company Profile

Company profile Sineva Tech v1: website publik ID/EN, blog/portofolio, konsultasi melalui WhatsApp/form, dan waitlist chatbot. Produk chatbot dikembangkan di repo/project terpisah.

**Arah aktif — PRD Rev. 2:** Next.js App Router + TypeScript, **admin custom di `/admin` tanpa headless CMS**, PostgreSQL, Drizzle ORM, Better Auth, Tailwind dan next-intl. Admin tetap mengelola konten, blog, media, SEO, akun, lead dan waitlist sesuai peran. R2, Resend, Turnstile, Umami, Sentry dan VPS/Coolify mengikuti PRD.

**Kondisi kode:** branch fondasi saat ini masih berisi implementasi Payload pada commit `a7f00fb`. Draft [PR #1](https://github.com/farhanfadillahr/sineva-compro/pull/1) telah digantikan arah arsitekturnya dan belum boleh di-merge sebagai implementasi Rev. 2. Dokumentasi ini tidak menyatakan admin custom atau library penggantinya sudah terpasang/berjalan.

## Dokumen aktif

- [PRD Rev. 2](docs/prd/2026-10-14-company-profile-prd.md)
- [Arsitektur dan struktur aplikasi target](docs/architecture/README.md)
- [Keputusan admin custom](docs/architecture/decisions/2026-10-14-custom-admin.md)
- [Rencana penggantian fondasi CPR-7](docs/superpowers/plans/2026-10-14-cpr-7-foundation.md)
- [Project Company Profile v1 di Linear](https://linear.app/sineva-tech/project/company-profile-v1-ee7ed9a91d26)
- [Aset logo dan varian dark mode](assets/brand/logos/README.md)

## Pengembangan berikutnya

Ikuti rencana CPR-7 untuk menghapus integrasi CMS, membangun database/migration, autentikasi/session, bootstrap operator dan shell admin. Form konten, media, blog, publikasi, mini-CRM dan ekspor dilanjutkan dalam tiket fitur masing-masing.

Arsitektur memakai modul fitur dengan query/action server berizin; tidak membuat API konten CRUD generik. Session/data pribadi tidak masuk cache publik. Admin v1 berbahasa Indonesia; konten tetap dua bahasa. Layout berada di kode dan isi dikelola lewat admin tanpa deploy ulang.

Versi library pengganti dipilih/pin exact setelah pemeriksaan registry, peer dependency dan advisory. Node/Next/React fondasi lama dapat dipertahankan jika kompatibel. Setup dan perintah baru dicatat setelah benar-benar tersedia; jangan menjalankan migration lama untuk menyiapkan schema baru.

## Arsip fondasi lama

- [Setup Payload pada commit lama](docs/architecture/payload-foundation-setup-superseded.md)
- [Rencana Payload yang digantikan](docs/superpowers/plans/2026-10-14-cpr-7-payload-foundation-superseded.md)
- [Bukti verifikasi dan batas hasil lama](docs/architecture/foundation-validation.md)

Arsip hanya menjelaskan pekerjaan sebelumnya. Database/volume dan data developer tidak otomatis dihapus saat transisi. Bukti test lama tidak membuktikan fondasi admin custom.
