# Verifikasi fondasi admin custom — CPR-7

**Tanggal:** 14–15 Oktober 2026. **Status:** implementasi tersedia di salinan kerja; review independen selesai dan dua temuan Important diperbaiki dengan regresi RED→GREEN. Acceptance browser production lokal lulus pada 15 Oktober 2026. Publikasi source/metadata PR masih tertunda; CPR-7 tetap In Progress dan PR #1 tetap draft.

## Revisi yang diperiksa

Checkout: `/Users/farhanfadillahr/Documents/data/SinevaTech/.worktrees/cpr-7-foundation`. Base/HEAD dokumentasi `cf4db5dab2ce8a2e9b7faca88c6f7efc2234c891`; hasil di bawah memeriksa perubahan source **yang belum di-commit/push**, termasuk file baru. Bukan hasil source yang sekarang berada di remote PR.

[PRD Rev. 2](../prd/2026-10-14-company-profile-prd.md), [arsitektur](README.md), [ADR](decisions/2026-10-14-custom-admin.md), [rencana](../superpowers/plans/2026-10-14-cpr-7-foundation.md), dan [draft PR #1](https://github.com/farhanfadillahr/sineva-compro/pull/1).

Node 24.21.0; Next 16.4.0; React 19.2.6; Better Auth/adapter/CLI 1.7.7; Drizzle ORM 0.45.4 / Kit 0.31.11; pg 8.23.1; PostgreSQL 17.11-bookworm. Dependency langsung exact dan lockfile dilacak.

## Hasil pemeriksaan

| Pemeriksaan                | Bukti / hasil                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalasi bersih dan graph | `npm ci`, `npm ls --all`: lulus                                                                                                                                                                           |
| Unit                       | `npm test`: 50/50; environment auth/test, input bootstrap, Principal, kemampuan, target driver dan redaksi log session                                                                                    |
| PostgreSQL/CLI             | `npm run test:database`: 9/9; koneksi terbatas waktu, DB tidak ada, rollback credential, bootstrap konkuren dan dua proses CLI, signup, session/logout, cookie palsu                                      |
| HTTP development           | `npm run test:integration`: 6/6                                                                                                                                                                           |
| HTTP production            | Build final berhasil, `npm run test:server -- --production`, lalu `npm run test:integration`: 7/7, termasuk session expired                                                                               |
| Kualitas                   | lint, typecheck, format dan `git diff --check`: lulus                                                                                                                                                     |
| Build production           | `npm run build`: lulus; `/` statis; admin/login/auth handler dinamis                                                                                                                                      |
| Generator                  | `npm run auth:generate`: schema byte-identik; `npm run db:generate`: tidak ada perubahan; `npm run db:check`: lulus                                                                                       |
| Migration ulang            | `npm run db:migrate` dan `npm run test:prepare`: lulus tanpa menerapkan ulang initial migration                                                                                                           |
| Persistensi                | Akun fixture, session dan password login bertahan setelah restart container PostgreSQL developer; logout mencabut session                                                                                 |
| Source CMS                 | Nol referensi Payload pada source/scripts/tests/manifest/lockfile/config/env aktif                                                                                                                        |
| Brand                      | Aset sumber/tracing tidak berubah; SVG publik identik dengan SVG simbol asli                                                                                                                              |
| Browser visual             | **Lulus 15 Oktober 2026** pada `http://localhost:3001`: login/logout/login, proteksi route, styling 390/1440 px, label/fokus, console tanpa warning/error, session dan login setelah restart DB developer |
| Review kode independen     | Selesai; nol Critical/Minor, dua Important direproduksi dan diperbaiki; regresi unit dan suite DB/kualitas lulus                                                                                          |

Tes otomatis pada tabel dijalankan 14 Oktober 2026. Tes HTTP production memeriksa homepage, redirect anonim ke login custom, API Users legacy 404, signup 400/operator create-user 404, cookie login sebenarnya, dashboard berizin, redirect login untuk session aktif, pencabutan session saat logout, cookie palsu dan session expired. Tes itu memeriksa respons server; bukti interaksi UI berasal dari pemeriksaan browser terpisah pada 15 Oktober 2026 di bawah.

Fixture expired sempat gagal karena `pg` menulis Date dengan zona waktu lokal ke kolom timestamp tanpa timezone, sedangkan Drizzle memetakannya sebagai UTC. Diagnostic clock PostgreSQL menunjukkan expiry masih 25.140 detik ke depan. Fixture diperbaiki memakai Drizzle dan mengassert expiry database sebelum meminta protected page; cookie yang sebelumnya valid kemudian ditolak. Tidak ada perubahan algoritma expiry aplikasi.

## Verifikasi browser — 15 Oktober 2026

User membuka dan meminta pemeriksaan `http://localhost:3001` di Browser bawaan Codex; pembacaan halaman pada origin itu diizinkan. Server memakai hasil build production yang sudah diuji, dengan `BETTER_AUTH_URL=http://localhost:3001` hanya pada environment proses. `.env`, source, trusted-origin policy dan port listener loopback tidak diubah. Origin proses disamakan dengan URL browser agar pemeriksaan cookie/CSRF sah.

- Homepage menampilkan kerangka publik Sineva Tech; `/admin` anonim mengarah ke `/admin/login`.
- Akun sintetis dibuat lewat CLI operator pada database test kosong. Password salah menampilkan pesan generik; tombol login memiliki keadaan loading. Login valid menampilkan identitas dan peran Administrator pada dashboard.
- Logout mengarah ke login; membuka `/admin` kembali tetap ditolak. Login ulang berhasil. Membuka halaman login saat sesi aktif mengarah ke dashboard.
- Login dan dashboard diperiksa pada viewport 390×844 dan 1440×1000. Tidak ada overflow horizontal; label Email/Password terhubung dengan input, tab keyboard berpindah Email → Password → Masuk, dan fokus tombol terlihat.
- Console browser tidak mencatat warning/error pada alur yang diamati; tidak muncul error hydration. Ini pemeriksaan smoke UI pada dua ukuran layar, bukan audit aksesibilitas lengkap.
- Untuk persistensi, akun sintetis berbeda dibuat lewat CLI pada database developer aplikasi yang sebelumnya kosong. Hanya container `cpr-7-foundation-postgres-1` direstart. Setelah healthy, database masih memiliki satu user dan satu session fixture, dashboard tetap terbuka setelah reload, dan logout/login dengan password yang sama berhasil.
- Semua akun fixture, session terkait dan file credential lokal telah dibersihkan; jumlah user/session database aplikasi developer/test kembali 0. Database lama dan volume developer dipertahankan. Viewport browser dikembalikan ke ukuran semula.

Bukti screenshot lokal: `cpr7-dashboard-desktop.png` dan `cpr7-login-desktop.png` pada artefak visualisasi chat. Tidak ada akun/password bawaan yang ditinggalkan. Homepage, dashboard dasar dan login ini tetap fondasi; UI marketing dan pengelolaan konten mengikuti tiket berikutnya.

## Data lokal dan migration

Inventory sebelum transisi: Users pada database lama developer/test masing-masing 0. Database `sineva_compro` dan `sineva_compro_test` serta volume developer tidak dihapus. Aplikasi memakai database baru `sineva_compro_app` (port loopback 5434) dan `sineva_compro_app_test` (port loopback 5433). Migration SQL baru `0000_auth_foundation` hanya diterapkan pada database aplikasi lokal itu.

Test runtime memvalidasi nama database test dan loopback, lalu mengganti `DATABASE_URL`/origin auth sebelum menjalankan migration atau server. Tidak ada fallback ke database developer/production. Suite DB dan HTTP dijalankan bergantian. Fixture dibersihkan berdasarkan ID/email miliknya, tanpa truncate/drop database atau menghapus akun developer.

Pemeriksaan persistensi 14 Oktober menggunakan satu akun sementara pada database developer baru, credential dalam file ignored mode 600, lalu restart hanya `cpr-7-foundation-postgres-1`. Setelah PostgreSQL siap: session lama dibaca, akun yang sama login dengan password, logout teruji, lalu akun/file fixture dihapus. Pemeriksaan browser 15 Oktober melengkapi bukti storage/library tersebut dengan session dan login UI setelah restart DB; fixture terpisah juga sudah dibersihkan. Jumlah akun developer aplikasi kembali 0.

Konfigurasi lama disimpan sebagai `.env.payload-legacy` ignored mode 600. Nilai credential tidak dicetak. Production, DNS, provider cloud, database chatbot dan volume aplikasi lain tidak menjadi target pemeriksaan.

## Bootstrap dan batas autentikasi

Admin pertama hanya dibuat melalui CLI operator dengan konfirmasi nama database dan input password tersembunyi atau stdin terkontrol. Signup publik tetap dinonaktifkan. Advisory lock pada koneksi khusus menyerialisasi bootstrap; pemeriksaan akun diulang setelah lock, dan pembuatan user/credential melalui Better Auth berada dalam satu transaksi Drizzle.

Regression atomicity dibuktikan dengan sengaja mengikat adapter di luar transaksi: kegagalan penulisan credential meninggalkan user parsial dan tes gagal. Setelah adapter dikembalikan ke transaksi, tes lulus. Trigger fixture dan user parsial hanya berada pada DB test dan sudah dibersihkan. Uji dua proses CLI juga menghasilkan tepat satu Admin dan satu credential.

Session aktif dibaca server; Principal hanya ID/nama/peran yang dikenal. Layout dan halaman dashboard masing-masing memakai guard. Handler HTTP membatasi endpoint pada login/logout/session dan signup yang dinonaktifkan; API operator/pengelolaan akun belum diekspos. CPR-24 melengkapi Users, kebijakan fitur dan lockout akun. Rate limit request library bukan lockout 5 kegagalan/15 menit.

## Review dan keputusan eksekusi

Reviewer independen memeriksa seluruh salinan kerja, termasuk source baru, migration dan lockfile. Dua Important diterima: query parameter `host` bisa mengubah target node-postgres setelah URL lolos pemeriksaan loopback; logger default Better Auth bisa mencetak raw token session dari DrizzleQueryError. Keduanya direproduksi dengan data sintetis sebelum perbaikan (delapan tes gagal), lalu diperbaiki: validator URL dipakai pada env/test/pool dan semua fixture; logger hanya mengeluarkan kategori tetap, tidak meneruskan pesan/argumen/error. Unit 50/50 dan DB 9/9 lulus. Tidak ada Minor yang ditunda atau review kedua.

Keputusan berikut dicatat berurutan dalam ledger eksekusi, beserta konsekuensinya:

1. Memakai worktree/branch CPR-7 yang sudah terisolasi dan terkait PR. Konsekuensi: nama branch historis masih mengandung Payload sampai diganti terpisah.
2. Membuat database aplikasi berdampingan dengan database lama. Konsekuensi: provisioning lokal harus menjelaskan nama database tambahan.
3. Mengikat API createUser library ke transaksi Drizzle eksplisit supaya user/credential atomik. Konsekuensi: kompatibilitas transaksi adapter harus dibuktikan; rollback dan concurrency sudah teruji.
4. Membatasi endpoint auth HTTP selama fondasi. Konsekuensi: fitur auth berikutnya harus menambah endpoint secara sengaja setelah kebijakan akses siap.
5. Parameter DB hanya menerima satu `sslmode=verify-full` atau `disable`. Konsekuensi: provider yang membutuhkan opsi TLS lain memerlukan perluasan konfigurasi yang direview sebelum deploy.
6. Visual yang belum dapat dinilai reviewer tetap acceptance terbuka sampai diperiksa langsung. Konsekuensi awal: tiket/PR belum boleh dianggap siap. Gate visual ditutup pada 15 Oktober setelah alur production diperiksa di Browser yang diizinkan; publikasi source/metadata PR masih menjadi pekerjaan tersisa.
7. Users, lockout dan izin domain lengkap tetap CPR-24. Konsekuensi: shell tidak boleh diluncurkan sebagai admin lengkap sebelum kontrol akses itu terbukti.
8. Marketing/konten/media/CRM/i18n/tema publik/deployment tetap tiket pemilik. Konsekuensi: fondasi ini belum merupakan website lengkap.
9. Diagnosis expiry diselesaikan coordinator melalui clock DB dan kode serializer terpasang; yang salah adalah fixture. Konsekuensi bila diagnosis keliru: bukti expiry akan lemah; tes final kini memastikan nilai DB expired dan respons protected menolak.
10. Publikasi source PR tetap menunggu commit/push implementasi. Konsekuensi: review hasil ini memakai checkout lokal; diff remote belum berisi source custom yang diuji.

## Dependency dan batas acceptance

Audit tanpa dev: empat moderate pada jalur tooling Drizzle/esbuild, nol high/critical. Audit penuh juga melaporkan lima high pada tooling lint `braces`. Tidak dilakukan downgrade/`audit fix --force`. Lihat [README](../../README.md#pemeriksaan-dependency); angka ini hasil tanggal pemeriksaan, bukan jaminan keamanan seluruh aplikasi.

Percobaan awal pada `http://127.0.0.1:3001` ditolak oleh kontrol izin browser. Setelah user secara eksplisit membuka dan meminta pemeriksaan `http://localhost:3001`, kontrol browser mengizinkan pembacaan origin yang dipilih user tersebut dan pemeriksaan UI fondasi di atas lulus. Tidak digunakan browser lain, raw CDP atau akses tidak langsung terhadap origin yang ditolak. Pekerjaan tersisa adalah commit/push source pengganti dan pembaruan metadata PR; belum merge/deploy.

Konten/blog/media/SEO, publikasi/preview, RBAC/lockout lengkap, lead/waitlist, i18n/tema publik, R2/Resend/analytics, CI dan deployment mengikuti tiket pemilik. Shell admin bukan admin konten lengkap atau bukti siap launch. [Bukti Payload](foundation-validation.md) tetap arsip dan tidak dihitung sebagai bukti implementasi ini.
