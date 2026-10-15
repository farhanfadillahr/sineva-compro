# CPR-25 — bukti routing ID/EN

Tanggal 15 Oktober 2026. Base main `0156c0e997db79558adba11d874e17a75b7b0c6b`; source yang diuji `db7b38efd5faad2b2e6361cf6bfef9420af5228c`. Metode Native sesuai persetujuan Founder. Belum merge/deploy. CI/CPR-10 tetap ditunda; verifikasi di bawah seluruhnya lokal.

## Hasil dan cakupan

| Pemeriksaan | Hasil |
| --- | --- |
| Node | 24.21.0, sesuai `.nvmrc` |
| `npm test` | 118/118, 12 files |
| `npm run test:database` | 34/34, 9 files |
| `npm run test:integration` | 52/52, 5 files, server production |
| `npm run typecheck` | next typegen + TypeScript lulus |
| `npm run lint` | lulus, nol warning |
| `npm run format:check` | lulus |
| `npm run db:check` | lulus; tidak ada migration baru |
| `npm run test:prepare` | migration test lulus |
| `npm run build` | production build lulus |

41 kasus HTTP baru mencakup 22 shell statis ID/EN sesuai PRD, delapan kombinasi cookie/header/default (bobot, q=0, locale tidak didukung, malformed), prioritas URL eksplisit/header palsu, query pada canonical redirect, unknown locale/slug, dan isolasi admin/API/logo. Regresi lama tetap menguji autentikasi, lockout lintas IP, penolakan body invalid, session revoked/expired, serta pembatasan Editor. Pengujian memakai HTTP nyata dan PostgreSQL, bukan mock auth.

Tes resolver memakai ekspektasi URL literal serta identitas/jenis/locale/status terbit, menolak slug traversal/URL/berkarakter tidak sah dan target duplikat. Tidak ada fixture konten yang dipublikasikan. Key kamus dan nilai string nonempty diuji; HTTP EN tidak memuat teks UI ID dan sebaliknya. Provider hanya menerima kamus aktif.

## Environment database dan proses

Docker Desktop/DB test5433 tidak merespons pada run ini. Container, volume dan DB developer5434 dipertahankan; tidak merestart shared Docker. Sebagai pengganti dipakai PostgreSQL **17.7 Homebrew**, cluster sementara milik verifikasi pada loopback5435, database `sineva_compro_app_test`, kredensial acak SCRAM. Batas: run ini belum membuktikan PostgreSQL17.11 image Compose; versi mayor sama. Tidak mengubah dependency produk atau `.env` pengguna.

Wrapper scratch mengoverride `TEST_DATABASE_URL` untuk `test:prepare`, `test:database` dan `test:server`; validator target loopback/nama test tetap dijalankan. Timezone cluster disamakan UTC seperti default container: run awal33/34 gagal pada fixture SQL expiry ketika initdb mewarisi Asia/Jakarta; setelah setting environment UTC, suite lengkap34/34 lulus tanpa perubahan source auth/test lama.

Database suite dan HTTP suite dijalankan berurutan. Server `npm run test:server -- --production` ready dalam135ms pada127.0.0.1:3001; origin Better Auth cocok. Fixtures dibersihkan oleh masing-masing suite berdasarkan ID. Proses dan cluster sementara dibersihkan setelah review; preview localhost dipulihkan secara terpisah. Status pemulihan final dicatat di bawah setelah selesai.

## Bukti browser

Built-in browser memeriksa build production yang sama melalui127.0.0.1:3001:

- `/id/layanan/ai-otomasi`: judul “AI & Otomasi”, pesan persiapan Indonesia, `html.lang=id`.
- `/en/about`: “About us”, pesan persiapan Inggris, `html.lang=en`.
- Setelah kunjungan EN, `/` berakhir di `/en`, konsisten dengan cookie pilihan.
- `/en/blog/unknown` dan `/id/blog/unknown`: pesan404 masing-masing bahasa; DOM sesudah hydration memiliki tepat satu html/body dan lang=en/id.
- `/admin/login`: form email/password Indonesia, lang=id, tetap tersedia tanpa prefix. Tidak memasukkan atau mengganti kredensial pengguna.

Browser hanya membuktikan skenario cookie pada profil yang ada; seluruh negosiasi header/default/malformed diuji secara deterministik pada HTTP matrix. Tombol switch belum dibuat sehingga belum diuji.

## Keputusan implementasi dan batas Next

1. Vitest menginline paket next-intl agar resolusi ESM `next/navigation` memakai runner sebenarnya. Tanpa ini import navigation gagal sebelum perilaku diuji; tidak memakai mock library atau mengubah versi dependency. Biaya jika salah: revisi konfigurasi resolver test.
2. Aktifkan opsi stabil `skipProxyUrlNormalize`: NextURL menormalisasi127.0.0.1 menjadi localhost, membuat rewrite next-intl terlihat eksternal dan redirect kembali ke URL ID yang sama. Opsi mempertahankan origin asli; seluruh URL localized/alias dan query kini lulus. Biaya jika salah: evaluasi handling URL mentah saat upgrade framework.
3. Next16.4 mengirim HTML transport sintetis `__next_error__` pada server `notFound()`; lang belum terpasang pada shell awal. DOM browser setelah hydration mempunyai layout/lang yang benar. Eksperimen route group tambahan tidak mengubah transport, lalu dibatalkan. HTTP tetap menguji404/noindex/teks terjemahan; browser memeriksa lang final. Tidak mengaktifkan flag experimental hanya untuk kosmetik404. Biaya jika salah: SSR404 sebelum hydration belum memiliki lang; evaluasi lagi bila dibutuhkan atau framework mendukungnya.
4. Regresi database memakai cluster lokal17.7 karena Docker tidak merespons. Biaya jika salah: perbedaan spesifik image17.11 belum diuji; jalankan ulang Compose saat Docker pulih.

## Handoff

Semua halaman masih shell sementara/noindex. Schema/constraint/query konten dan integrasi lookup slug nyata tetap CPR-27/30/31; detail belum terbit404. Tombol switch/header CPR-34, desain final menunggu Founder, SEO lengkap CPR-52. Admin custom dan Better Auth tidak berubah. Source/dependency/workflow CPR-10 tidak dibawa.

Review independen seluruh branch: menunggu hasil sebelum handoff PR. PR dan pemulihan preview dicatat setelah review.
