# Perbaikan hasil QA admin dan landing (17 Oktober 2026)

Pelaksanaan Native, satu agen. Sumber: QA manual seluruh halaman admin di Chrome terhadap `development` (`90762b6`), dibandingkan dengan situs publik. `main` sudah termuat di `development`, jadi tidak perlu sinkronisasi. Lima tiket CPR, satu branch dan satu PR per tiket ke `development`, ditumpuk berurutan (T1 sampai T5) karena merge dilakukan Farhan. Tidak ada perubahan CI.

## T1 (CPR-102). Aksi konfirmasi admin dan dialog

**Masalah.** `ConfirmAction` merender `<form hidden>` miliknya sendiri. Di editor, ia dipasang lewat `side` dan `secondaryActions` milik `CmsForm`, yang keduanya berada di dalam `<form>` editor. Form bersarang membuat `requestSubmit()` gagal ("A React form was unexpectedly submitted", CSP memblokir `form-action javascript:`). Terbukti dengan klik nyata: Terbitkan artikel tetap draf, Hapus FAQ tidak terjadi. Pola yang sama dipakai Terbitkan ulang, Batalkan publikasi, Hapus pada Blog, Karya, FAQ, Tim, Kategori, Kemampuan, Jenis bisnis dan Layanan.

**Perbaikan.**
- `ConfirmAction` tidak lagi memakai form tersembunyi. Setelah konfirmasi, aksi dipanggil langsung lewat `startTransition(() => submit(formData))` milik `useActionState`, sehingga tidak ada form yang bisa bersarang. Tombol pemicu dan dialog tetap di tempatnya.
- Tes komponen: `ConfirmAction` di dalam `<form>` tetap mengirim aksinya, dan tidak ada `<form>` bersarang di DOM.
- `.dialog` mendapat `margin: auto` agar dialog modal kembali di tengah (reset global membuat margin 0 sehingga dialog menempel di kiri atas). Varian drawer tetap di sisi kanan.
- **Nonaktifkan akun** memakai dialog konfirmasi seperti aksi berisiko lain.

## T2 (CPR-103). Situs ikut segar setelah perubahan Media dan Redirect

**Media.** `PATCH /admin/media/api/[id]` dan `PUT .../file` tidak memanggil revalidasi. Alt baru tersimpan, tetapi halaman publik tetap memakai alt lama sampai halaman pemakainya disimpan ulang. Setelah commit metadata, penggantian file dan hapus, baca `media_usage` untuk media tersebut, petakan `entity` dan `entity_id` ke `ContentChange` (halaman, layanan, artikel, karya, tim, pengaturan, kemampuan, jenis bisnis), lalu panggil `revalidateChange`. Pemetaan murni diberi unit test seperti `invalidation.ts`.

**Redirect.** `resolveRedirect` menyimpan seluruh tabel di memori modul selama 30 detik. Proxy berjalan terpisah dari kode render, dan dokumentasi Next 16 melarang bergantung pada modul atau global bersama, sehingga `invalidateRedirectCache()` dari aksi admin tidak pernah menyentuh cache proxy. Akibatnya redirect basi sampai 30 detik, termasuk jeda ketika halaman layanan aktif diarahkan ke 404. Perbaikan: cache dihapus, proxy mencari satu baris per request lewat unique index `redirect_from_path_unique`. Biaya satu query terindeks per request halaman diterima demi kebenaran. Kegagalan lookup tetap tidak menjatuhkan halaman.

**Peringatan pg.** Log dev menampilkan `client.query()` dipanggil saat client masih menjalankan query (deprecated di pg 9). Cari sumbernya. Bila berasal dari kode kita (mis. `Promise.all` di dalam satu transaksi), jadikan berurutan.

## T3 (CPR-104). Template judul SEO diterapkan di situs

**Masalah.** `Template judul` di Pengaturan SEO hanya dipakai validasi dan pratinjau admin. Situs memakai `title.absolute` dari judul meta yang sudah berisi "| Sineva", sehingga mengubah template tidak berdampak, dan pratinjau bisa berbeda dari situs bila editor lupa menulis brand.

**Keputusan jangka panjang.** Brand diatur sekali di template, editor menulis judul pendek.
- Layout publik memakai `title.template` dari template per locale (`{title}` menjadi `%s`) dan `default` nama situs. Halaman mengirim judul meta tanpa brand. `openGraph.title` dan `twitter.title` diisi judul yang sudah dirender agar kartu sosial sama dengan tab browser.
- Migrasi satu kali: hapus akhiran ` | <nama situs>` dari judul meta di `page_content`, `service_translation`, `post_translation`, `portfolio_translation` dan sumber konten statis. Migrasi idempoten dan hanya menyentuh akhiran yang persis sama.
- Batas 60 karakter dihitung pada judul hasil template. Penghitung di editor menampilkan sisa karakter setelah template. Pratinjau Google selalu menerapkan template, sama dengan situs.
- Tes metadata untuk halaman beranda, layanan, artikel dan karya pada kedua locale.

## T4 (CPR-105). Form kontak dan waitlist tersambung ke admin

**Masalah.** `contact-form.tsx` dan `waitlist-form.tsx` hanya membuka WhatsApp atau mailto. `submitContact` dan `joinWaitlist` sudah ada tetapi tidak pernah dipanggil, jadi Lead, Waitlist, grafik Dasbor, notifikasi email dan anti-spam tidak pernah menerima data (database 0 lead dan 0 waitlist).

**Perbaikan (keputusan Farhan: simpan dulu, lalu WhatsApp).**
- Form kontak menambah kolom yang diwajibkan skema server: email kerja dan nomor WhatsApp. Form waitlist menambah email; jenis bisnis dipetakan ke `segment`.
- Saat submit: validasi klien memakai skema bersama. Tab WhatsApp dibuka sinkron di dalam handler (agar tidak diblokir sebagai popup), server action dipanggil paralel. Setelah action selesai, kunjungan ke halaman terima kasih. Bila action ditolak (rate limit, anti-spam, validasi server), tampilkan pesan dan pertahankan isian; WhatsApp yang sudah terbuka tetap menjadi jalur cadangan.
- Copy EN dan ID baru mengikuti `docs/design/copywriting.md` (tanpa em dash/en dash). Tautan kebijakan privasi di dekat persetujuan.
- Tes: unit untuk pemetaan field dan alur submit (action dipanggil, WhatsApp dibuka, error ditampilkan). Verifikasi manual di Chrome: lead dan waitlist muncul di admin. Pengiriman email tetap `mock` di lokal.

## T5 (CPR-106). Perbaikan UX admin

- **Pratinjau terlihat.** Saat Draft Mode aktif, situs publik menampilkan bar kecil "Mode pratinjau" dengan tombol keluar. Halaman pratinjau tetap noindex.
- **Visibilitas tim.** Anggota tampil di Tentang hanya bila tiga hal menyala: fitur "Tampilkan bagian tim" di Pengaturan situs, bagian tim di Halaman > Tentang, dan "Tampilkan di halaman Tentang" pada anggota. Daftar Tim menampilkan status gabungan dengan checklist ketiganya beserta tautan ke tempat mengubahnya.
- **Log audit terbaca.** Kolom pelaku dan target menampilkan nama/label, bukan ID mentah. ID tetap tersedia sebagai teks sekunder kecil untuk penelusuran.
- **Status produk konsisten.** Tautan footer "Join the waitlist" mengikuti status (Tersedia: ajakan mencoba produk). Form Status produk menampilkan pengingat label konten yang masih menyebut waitlist (mis. CTA kedua Beranda) dengan tautan ke editornya.

## Verifikasi per PR

`npm run lint`, `npm run typecheck`, `npm test`, dan `npm run test:database` bila menyentuh query. Verifikasi manual di Chrome terhadap dev server lokal untuk alur yang diubah, termasuk pengecekan halaman publik EN dan ID. Data uji dibersihkan setelahnya.
