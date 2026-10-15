# CPR-10 — Bukti CI GitHub Actions

Status 15 Oktober 2026: implementasi dan verifikasi lokal selesai; GitHub runner belum dapat dimulai karena pembayaran akun/spending limit. Tidak ada klaim run GitHub hijau. Spec/plan disetujui Founder, metode Native, CI terlebih dahulu dan proteksi main menyusul.

## Runtime dan batas lingkungan

Base main `0156c0e997db79558adba11d874e17a75b7b0c6b`. Node proyek 24.21.0; Node global lokal 26.5.0 tidak digunakan untuk acceptance. Tidak ada perubahan fitur/UI/auth/schema atau dependency produk. Checkout utama dengan perubahan dokumen lokal dipertahankan.

## Bukti lokal yang sudah diperoleh

- Sebelum implementasi: 77 unit tests lulus.
- Tes baru RED: helper/CLI belum tersedia; log menunjukkan module yang belum ada.
- Setelah helper/CLI: 23 tes baru lulus; seluruh suite 100/100 pada Node 24.21.0. Mencakup port terpakai, startup timeout/exit/spawn, kegagalan HTTP, server mati saat tests, wrapper/descendant, TERM fallback, INT/TERM saat startup/tes, validasi DB/origin, dan redaksi credential.
- Lint, typecheck dan format-check lulus. Satu anomali cleanup diamati pada global Node 26 sebelum runtime diperbaiki; suite dan empat pengulangan terarah pada Node 24 lulus. Ini bukan klaim dukungan Node 26.

### Salinan source dan PostgreSQL baru (macOS)

`npm ci` → format/lint/typecheck → unit **100/100** → `db:check` → `test:prepare` → database **34/34** → build production → `test:http:production` **11/11**, seluruh perintah exit 0 pada Node 24.21.0. PostgreSQL tmpfs bernama `cpr10-verify`, port 5435, database `sineva_compro_app_test`; tidak memakai DB developer 5434 atau fixture preview 5433. Helper berhenti otomatis dan port dibebaskan. Preview lama milik agen dihentikan terkontrol selama tes port 3001, kemudian dipulihkan dengan origin localhost:3001.

Archive lokal berada di direktori scratch dalam worktree, sehingga Next memberi peringatan multiple-lockfiles/workspace-root; build dan HTTP tetap sukses. GitHub runner fresh tetap diperlukan sebagai bukti Linux/platform. `npm ci` melaporkan audit dependency bawaan (4 moderate, 5 high) dan deprecation tooling; tidak ada upgrade/downgrade atau audit-fix-force dalam scope ini.

## Workflow yang diterapkan

Satu job `verify` pada Ubuntu 24.04, timeout 20 menit, Node `.nvmrc`, cache download npm/lockfile, `npm ci`. PostgreSQL 17.11-bookworm disposable dengan health check; environment hanya database test loopback dan origin 127.0.0.1:3001. Urutan format/lint/types/unit/journal/migration/SQL/build/HTTP. Tidak ada production secret, upload artifact, write token, deploy atau auto-merge.

Action resmi dipin: checkout v7.0.1 `3d3c42e5aac5ba805825da76410c181273ba90b1`; setup-node v7.1.0 `949feb2413d6458794dcd2491c4babbbce0c15c1`. Ref dan runtime node24 diperiksa melalui API resmi GitHub pada 15 Oktober 2026.

## Bukti GitHub dan blocker akun

Draft [PR #3](https://github.com/farhanfadillahr/sineva-compro/pull/3), base `0156c0e997db79558adba11d874e17a75b7b0c6b`. [Run pertama 38686730990](https://github.com/farhanfadillahr/sineva-compro/actions/runs/38686730990) terpicu oleh event `pull_request` pada head `fc6be5aa79917c772b034ec0feb81e11941e108e`; hasil `startup_failure`, `jobs: []`, tidak ada check `verify` atau log runner. API tidak memberikan anotasi, sehingga pesan diperiksa pada halaman run melalui browser GitHub yang terautentikasi.

Anotasi menyatakan job tidak dimulai karena pembayaran akun terakhir gagal **atau** spending limit perlu dinaikkan, dan mengarahkan pemilik akun ke Billing & plans. Pesan tidak menetapkan mana dari dua kondisi itu yang berlaku. Ini blocker runner, terpisah dari batas paket untuk branch protection. Workflow belum diuji oleh runner Linux; tidak menyimpulkan YAML salah atau tes gagal dari startup failure ini.

Probe merah/pemulihan hijau/cancellation belum dijalankan karena semuanya bergantung pada runner yang dapat dimulai. Tidak membuat commit probe gagal yang tidak bisa dieksekusi. PR tetap draft. Pemilik akun perlu memeriksa Billing & plans; tidak ada pembelian, perubahan batas belanja, visibility atau secret oleh agen. Setelah runner tersedia, lanjutkan run `verify`, probe terkontrol, pemulihan dan verifikasi latest-head sebelum PR siap merge.

## Review independen

Reviewer fresh-context Dalton memeriksa `0156c0e..fc6be5a` secara read-only terhadap spec/plan, kode dan tes. Hasil: **tidak ada temuan Critical, Important, atau Minor**; tidak ada perilaku yang dikesampingkan dari penilaian. Reviewer menjalankan sendiri unit **100/100** pada Node 24.21.0 dari scratch archive, parse YAML, serta probe response readiness yang stall dan cleanup server tahan TERM. Reviewer tidak mengulang DB/build/HTTP; hasil tersebut adalah bukti implementer di atas.

Verdict: code review lulus, **tetap draft** sampai verifikasi GitHub terpenuhi. Review terikat head `fc6be5aa79917c772b034ec0feb81e11941e108e`; perubahan sesudahnya hanya dokumentasi status/evidence, tanpa perubahan runner/workflow/test/source aplikasi. Tidak diperlukan fix pass atau review kedua.

## Acceptance dan batas paket

- [ ] Workflow otomatis PR ke main dibuktikan dengan run GitHub.
- [ ] Integration memakai PostgreSQL fresh di runner GitHub.
- [ ] CI merah, pemulihan hijau, cancellation dan latest-head dibuktikan.
- [x] Review independen seluruh branch selesai (scope source/workflow pada fc6be5a; dokumentasi status terbaru diperiksa implementer).
- [ ] PR dengan CI gagal tidak bisa di-merge — **ditunda**, paket private repository mengembalikan 403 untuk branch protection.

Founder menyetujui CI dahulu. CPR-10 tetap belum Done atas scope awal sampai enforcement tersedia dan terbukti. Visibility/billing tidak diubah; tidak merge/deploy tanpa instruksi Founder.
