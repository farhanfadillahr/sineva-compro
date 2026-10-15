# CPR-10 | [Infra] Setup CI GitHub Actions

**Tanggal:** 15 Oktober 2026. **Status:** rancangan disetujui Founder pada 15 Oktober 2026; CI dikerjakan terlebih dahulu, proteksi `main` menyusul ketika paket mendukung. Workflow dan runner telah dibuat dan sedang diverifikasi; proteksi repository belum diterapkan.

**Acuan:** [CPR-10](https://linear.app/sineva-tech/issue/CPR-10/infra-setup-ci-github-actions), PRD §14.3, dan `origin/main` pada `0156c0e997db79558adba11d874e17a75b7b0c6b` (hasil merge CPR-24).

## Tujuan dan pemahaman bersama

Jalankan pemeriksaan yang sudah tersedia secara otomatis pada setiap PR Compro ke `main`, agar kegagalan format, type, aturan auth, database dan HTTP production terlihat sebelum merge. Foundation dan akun Editor tetap memakai admin custom Next.js/Better Auth, tanpa headless CMS. Tidak mengubah UI, library produk atau struktur data.

Founder telah mengarahkan bahwa desain final belum tersedia. UI sementara mengikuti identitas Sineva Tech; implementasi desain final menunggu instruksi/referensi Founder. Preferensi ini dicatat di AGENTS dan PRD, tanpa membuat desain baru dalam CPR-10.

## Fakta repo yang diperiksa

- Repository `farhanfadillahr/sineva-compro` private; default branch `main`. GitHub Actions aktif dan kebijakan repository mengizinkan actions. Tidak ada direktori `.github` atau workflow CI saat rancangan dibuat.
- Runtime Node 24.21.0 dari `.nvmrc`, dependency exact dan `package-lock.json` sudah tersedia. PostgreSQL aplikasi menggunakan versi 17.11-bookworm.
- Perintah repo: `format:check`, `lint`, `typecheck`, `test`, `db:check`, `test:prepare`, `test:database`, `build`, `test:server -- --production`, `test:integration`.
- Baseline unit 77/77 lulus pada branch CPR-10. Bukti CPR-24 juga mencakup DB 34 dan HTTP 11; angka tersebut bukan klaim bahwa workflow GitHub baru sudah dijalankan.
- Suite DB dan HTTP berbagi contract bootstrap database kosong dan harus berurutan. HTTP suite memerlukan server production yang sudah dibuild, sehingga HTTP tidak boleh dijalankan sebelum build.
- `readTestEnv` hanya menerima loopback dan database bernama `sineva_compro_app_test`, serta menetapkan origin `http://127.0.0.1:3001`. Batas ini dipertahankan.
- Pembacaan REST branch protection menghasilkan HTTP 403 dengan pesan bahwa repo private memerlukan GitHub Pro atau repository public untuk fitur tersebut. Rancangan tidak membuat repo public, membeli paket, atau berpura-pura proteksi sudah aktif.

## Pilihan pendekatan

1. **Direkomendasikan: satu job verifikasi, memakai script repo yang ada.** Semua tahap memakai checkout, dependencies dan service PostgreSQL disposable yang sama; sequential run menghindari konflik fixture. Job/status check bernama stabil `verify`. Biaya: gagal di tahap awal menghentikan tahap berikutnya; durasi satu job lebih panjang daripada matrix.
2. **Job terpisah lint/test/build dengan gate agregator.** Potensi lebih cepat, tetapi install/build dan service DB berulang, perlu koordinasi artifact serta aggregator yang tidak salah meluluskan job skip/cancel. Tidak sebanding dengan ukuran repo saat ini.
3. **Runner pada VPS aplikasi.** Tidak dipilih: coupling ke deployment, persistent credentials dan risiko menjalankan kode PR pada host aplikasi tidak diperlukan untuk CI ini.

Tidak membuat E2E Playwright, Lighthouse, deployment atau integrasi layanan eksternal pada CPR-10; tiket QA/Infra terkait tetap terpisah.

## Workflow dan urutan eksekusi

Tambahkan `.github/workflows/ci.yml` dengan event `pull_request` ke `main`, `push` ke `main`, dan `workflow_dispatch`. Tidak memakai `pull_request_target`. Tidak menambahkan path filter atau pengecualian PR draft yang bisa membuat required check tidak dijalankan.

Satu job Linux GitHub-hosted runner memakai Node dari `.nvmrc`. Action dipin ke full commit SHA resmi yang diverifikasi pada implementasi; komentar boleh mencatat release tag yang cocok. Npm download cache memakai lockfile; tidak menyimpan `node_modules`, credential, database atau `.next` hasil tes sebagai cache lintas job.

Urutan tahap:

1. Checkout tanpa menyimpan credential Git, setup Node/npm cache, `npm ci`.
2. Format, lint, typecheck, unit, dan validasi journal migration.
3. Migration melalui `test:prepare`, lalu suite `test:database`.
4. Build production dari source yang sama.
5. Start production test server, tunggu readiness dengan deadline, lalu suite `test:integration`.
6. Hentikan server pada sukses/gagal/cancel; service/runner disposable dibersihkan GitHub.

Perbedaan urutan terhadap ringkasan lama PRD/tiket dijelaskan di dokumentasi: integration SQL berada sebelum build, sedangkan integration HTTP production harus sesudah build. Tidak menjalankan DB dan HTTP secara paralel.

Concurrency dibatasi per PR/ref dan workflow; run lama dapat dibatalkan saat commit baru datang. Timeout job 20 menit, readiness server 30 detik dengan retry terukur. Workflow tidak menganggap canceled atau skipped sebagai hasil verifikasi sukses. Tidak ada `continue-on-error` pada quality gate.

## Database dan environment test

Service PostgreSQL disposable memiliki health check `pg_isready`, user `sineva` dan database `sineva_compro_app_test`. Port host test disediakan ke loopback runner agar validator yang sudah ada tetap berlaku. Runner tidak bergantung pada `.env` developer atau database lokal orang lain.

`DATABASE_URL` dan `TEST_DATABASE_URL` pada job menunjuk service test yang sama; `BETTER_AUTH_URL`/`TEST_BASE_URL` memakai `http://127.0.0.1:3001`. Credential database dan auth secret khusus CI disposable, bukan secret produksi dan tidak dipakai ulang di aplikasi yang diterbitkan. `BETTER_AUTH_SECRET` memenuhi validator minimal 32 karakter.

Jika diperlukan untuk lifecycle server, buat helper Node kecil di `scripts/` yang menjalankan server melalui runtime test yang sudah ada, mengawasi readiness/early exit, menjalankan HTTP tests, dan meneruskan exit code. Helper memakai `readTestEnv` dan tidak menjadi fallback ke DB developer. Jangan menonaktifkan rate limit, origin check, lockout, atau redaksi log agar CI hijau.

## Izin dan artifact

Token workflow dibatasi `contents: read`. Tidak memberikan write token, membaca production secrets, mengaktifkan auto-merge atau mengunggah `.env`/cookie/password/token/hash/row database. Kegagalan mencatat nama tahap, status proses dan diagnostik server yang aman; tidak mencetak environment atau URL DB bercredential.

Workflow job tidak diberi kemampuan mengubah proteksi repository. Konfigurasi proteksi, jika paket repository mendukungnya, dilakukan operator melalui tooling terautentikasi setelah run `verify` pertama terdaftar dan hijau.

## Proteksi main dan batasan paket

Target penuh: PR wajib, check `verify` wajib sukses, branch harus mutakhir terhadap `main`, force-push/deletion ditolak, dan aturan berlaku juga untuk admin. Karena pemilik repo juga pembuat PR, tidak mensyaratkan approval reviewer lain yang belum tersedia; aturan kualitas dan keputusan Founder tetap berlaku.

**Keputusan Founder — 15 Oktober 2026:** “Setujui — CI dulu, proteksi menyusul (rekomendasi)”. Implementasi workflow dilanjutkan; acceptance enforcement merge tetap unchecked dan CPR-10 belum dapat dinyatakan Done atas scope awal.

Pilihan yang telah direview:

- **CI dulu, proteksi ditunda:** implementasikan workflow, buktikan di GitHub, catat branch-protection sebagai acceptance belum terpenuhi. CPR-10 tidak diberi status Done atas scope awal; pekerjaan proteksi dilanjutkan ketika paket mendukung. Prosedur manual memeriksa CI sebelum merge tidak disebut pengganti enforcement server.
- **Lengkapi paket yang mendukung proteksi:** Founder menangani pilihan/pembelian paket di akun GitHub, lalu operator memeriksa ulang dan mengaktifkan aturan setelah CI pertama hijau. Tidak ada pembelian, publikasi repository atau perubahan visibilitas oleh asisten.

API 403 yang telah dikonfirmasi adalah batasan produk saat ini, bukan penolakan izin dari browser. Workflow CI tetap dapat dibuat. Tidak ada janji bahwa GitHub akan memblokir merge merah sebelum proteksi benar-benar terpasang dan diuji.

## Verifikasi dan hasil yang diserahkan

- Workflow YAML valid, lint/typecheck/format dan suite repo tetap lulus; bila helper dibuat, tes lifecycle membuktikan success, readiness timeout, server early exit, propagasi kegagalan test dan cleanup proses tanpa DB developer.
- Service fresh menjalankan migration, suite database, build, production HTTP secara berurutan pada Linux. Job tidak memerlukan secret aplikasi produksi.
- Publish PR dengan judul `CPR-10 | [Infra] Setup CI GitHub Actions`, attach ke chat, lalu periksa run/check pada exact commit yang dipush. Jangan mengklaim local run sebagai bukti Actions hijau.
- Buktikan negative gate melalui perubahan test/workflow terkontrol di branch PR: check gagal, pulihkan source, check kembali hijau. Jangan merge commit probe; bukti mencatat revision/runs yang sesuai dan tidak memalsukan status lewat API.
- Jika proteksi tersedia, periksa konfigurasi aktual dan bukti penolakan merge check yang belum sukses, tanpa menggabungkan PR probe gagal. Jika tidak tersedia, acceptance tersebut tetap unchecked dan status terbatas dicatat eksplisit.
- README/PRD/tiket menjelaskan urutan test yang benar, nama required check, lifecycle, keterbatasan paket dan bukti run.
- Perubahan disiapkan untuk review independen sebelum ready; tidak merge/deploy tanpa instruksi Founder.

## Self-review spec

Satu scope CI, tanpa modifikasi fitur produk atau runtime dependency. Origin/DB sesuai validator yang sudah tersedia. Lifecycle/failure/cancel bukan hanya happy path. Urutan SQL/build/HTTP konsisten. Proteksi tidak diklaim sebagai fitur yang tersedia sebelum paket mendukung; Founder menyetujui CI dahulu dengan acceptance proteksi tetap terbuka.

## Sumber primer yang diperiksa

- [Protected branches dan dukungan paket](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
- [Service PostgreSQL pada runner](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).
- [Pin action ke full commit SHA](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/find-and-customize-actions).
- [Risiko pull_request_target](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target).
- [Workflow yang dilewati dan status pending](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs).

Dokumentasi Actions dibaca melalui Context7 dan GitHub Docs. Akses repository/Actions serta penolakan fitur proteksi dikonfirmasi melalui GitHub API read-only pada akun/repo aktual. Ini tidak menyatakan bahwa implementasi workflow atau proteksi telah diuji.
