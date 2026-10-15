# CPR-25 | [I18n] Routing dua bahasa & slug lokal

**Status:** rancangan dan rencana disetujui Founder pada 15 Oktober 2026, metode Native. Implementasi lokal tersedia; bukti dan batas framework dicatat di [validasi CPR-25](../../architecture/cpr-25-i18n-validation.md). Review independen tuntas; satu Important diperbaiki dan satu Minor format dokumen ditunda. PR #4 tersedia; belum merge/deploy.

**Tujuan:** pengunjung membuka URL dan teks yang konsisten dalam Indonesia/Inggris; fondasi siap dipakai halaman Compro dan fitur konten berikutnya. Acuan: [CPR-25](https://linear.app/sineva-tech/issue/CPR-25/i18n-routing-dua-bahasa-and-slug-lokal), PRD §6, §9.4 dan FR-I18N-01–06.

## Pendekatan

Gunakan **next-intl 4.14.9 yang sudah terpasang**, dengan satu konfigurasi locale/pathname dan helper navigasi bersama. Ini menghindari duplikasi rute dan terjemahan. Alternatif routing/negosiasi bahasa manual memerlukan lebih banyak logika sendiri tanpa kebutuhan khusus saat ini.

Bahasa hanya `id` dan `en`, default `id`, dengan prefix selalu terlihat. Contoh; seluruh pemetaan tetap mengikuti tabel PRD §6:

| Halaman           | Indonesia               | Inggris                |
| ----------------- | ----------------------- | ---------------------- |
| Beranda           | `/id`                   | `/en`                  |
| Layanan           | `/id/layanan`           | `/en/services`         |
| Tentang           | `/id/tentang-kami`      | `/en/about`            |
| Detail portofolio | `/id/portofolio/[slug]` | `/en/portfolio/[slug]` |

## Perilaku routing

- Kunjungan `/`: cookie `NEXT_LOCALE` yang valid → negosiasi `Accept-Language` → `id`. Varian `en-US`/`en-GB` dipetakan ke `en`; bobot bahasa diperhatikan, bahasa berbobot nol tidak dipilih. Header kosong/tidak valid/tidak cocok → `id`; cookie tidak valid diabaikan.
- URL yang sudah menyebut `/id` atau `/en` menentukan bahasa halaman, meskipun cookie/browser berbeda. Redirect personal tidak boleh dibagikan melalui cache publik atau membentuk loop.
- Proxy Next.js mengatur routing publik. `/admin`, `/api`, internal Next dan aset tidak diprefix atau dialihkan oleh i18n. Locale/URL tidak dikenal menghasilkan 404; atribut `<html lang>` mengikuti bahasa publik, admin tetap Indonesia.
- Cookie pilihan bahasa menggunakan path `/`, SameSite Lax dan Secure di production; terpisah dari cookie autentikasi. Tombol pindah bahasa beserta interaksinya tetap CPR-34.

## Pemisahan teks dan konten

Teks UI disimpan di `messages/id.json` dan `messages/en.json`; hanya kamus locale aktif yang dimuat. Tidak menggabungkan kamus Indonesia sebagai fallback Inggris. Key hilang dianggap kesalahan yang ditangkap pengujian; penanganan runtime tidak mengambil pesan dari bahasa lain. Nama brand tidak diterjemahkan.

Konten bisnis tetap di PostgreSQL per `(entity_id, locale)`. Pemetaan slug memakai identitas entitas dan locale tujuan, bukan menerjemahkan/mengganti string slug secara otomatis. Kontrak resolver membedakan URL tujuan yang tersedia dari terjemahan tidak tersedia; hanya konten terbit yang boleh menjadi target publik. Slug tidak dikenal/draft/terjemahan detail tidak tersedia → 404 saat diakses langsung. Untuk artikel tanpa padanan, kontrak perpindahan bahasa mengarah ke daftar blog tujuan sesuai PRD; tombolnya dibuat pada CPR-34.

**Penajaman scope yang disetujui:** karena model konten belum ada, CPR-25 membuat konfigurasi rute, shell halaman berbahasa tepat dan kontrak resolver slug yang diuji dengan fixture. Schema, constraint unik slug `(jenis konten, locale, slug)`, query publik serta integrasi resolver dengan data nyata dilaksanakan bersama tiket Services/Portfolio/Blog. Tidak membuat tabel konten generik atau artikel/portofolio fiktif untuk meluluskan tes. Founder menyetujui pembagian ini; deskripsi/acceptance tiket diselaraskan tanpa menghapus kebutuhan persistence dari produk.

Dengan pembagian tersebut, “semua URL berfungsi” pada tahap ini berarti rute statis/shell tersedia dalam dua bahasa, sedangkan rute detail terdaftar dan mempunyai perilaku 404 yang benar sampai data terbit tersedia. Ini belum menyatakan halaman marketing, publikasi dan lookup database selesai.

## Batas dan verifikasi

UI mengikuti desain sementara dan logo yang ada; desain final menunggu instruksi Founder. Admin custom/Better Auth dipertahankan. Tidak mengaktifkan CI, memakai layanan berbayar, menambah CRUD konten atau mengerjakan SEO lengkap/tombol bahasa pada tiket ini. Branch berasal dari main yang sudah memuat CPR-24; perubahan CPR-10 yang ditunda tidak dibawa.

Uji lokal mencakup prioritas URL/cookie/header, header berbobot dan malformed, seluruh mapping PRD, query string saat redirect, isolasi `/admin`/API/aset, kesesuaian key kamus dan bahasa HTML, unknown locale/slug, slug berbeda untuk entitas sama, serta target draft/tidak tersedia. Jalankan regresi login/admin, lint/typecheck/build dan HTTP production setelah implementasi; baseline main saat rancangan dibuat **77 unit tests lulus**.

**Konfirmasi tombol bahasa:** Founder menegaskan tombol switch tetap tersedia nantinya. CPR-34 membuat tombol ID/EN di header, navigasi ke halaman padanan, penyimpanan pilihan di cookie dan fallback artikel satu bahasa ke daftar blog tujuan. CPR-25 menyiapkan kontrak yang dipakai tombol tersebut; tombol belum dinyatakan selesai pada tiket ini.

**Self-review:** scope routing dipisahkan dari CRUD dan desain final; pembagian persistence disetujui eksplisit. Kontrak slug dinamis dibedakan dari pathname statis; tidak ada fallback lintas bahasa, konten publik buatan, atau klaim verifikasi implementasi yang belum dilakukan.

**Acuan teknis:** [konfigurasi routing](https://next-intl.dev/docs/routing/configuration), [negosiasi locale/proxy](https://next-intl.dev/docs/routing/middleware), [navigasi dan parameter dinamis](https://next-intl.dev/docs/routing/navigation), serta panduan internationalization/proxy pada Next.js 16.4.0 yang terpasang. Dokumentasi next-intl diperiksa melalui Context7.
