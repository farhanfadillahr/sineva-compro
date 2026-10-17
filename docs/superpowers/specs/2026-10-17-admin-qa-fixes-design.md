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

**Keputusan jangka panjang.** Brand diatur sekali di admin (Pengaturan > SEO > Template judul, per locale), editor menulis judul pendek. Tidak ada brand yang ditulis per halaman.
- Semua builder metadata memakai `renderTitle` (template per locale) sebagai `title.absolute`, dan judul yang sama untuk `openGraph.title` serta `twitter.title`, karena Next.js tidak menerapkan template ke keduanya. Judul yang masih membawa teks template di sekelilingnya tidak diberi brand dua kali.
- Migrasi idempoten `0019` membuang akhiran ` | Sineva` dari judul meta di `page_content`, `service_translation`, serta draf dan versi terbit `post_translation` dan `portfolio_translation`. Konten statis tidak diubah karena dipakai bersama deployment statis di `main`; seed membuang akhirannya saat menulis ke database.
- Batas 60 karakter adalah batas potong Google, bukan aturan: kolom tetap maks. 60, dan pratinjau Google menghitung panjang judul hasil template yang sedang aktif dari admin lalu memberi peringatan bila lebih dari 60. Pratinjau memakai fungsi yang sama dengan situs (`applyTitleTemplate`).
- Tes: `renderTitle`, `applyTitleTemplate` (termasuk judul yang menyebut brand di tengah), pratinjau admin, seed tanpa akhiran, dan kesetaraan DTO database dengan konten statis.

## T4 (CPR-105). Form kontak dan waitlist tersambung ke admin

**Masalah.** `contact-form.tsx` dan `waitlist-form.tsx` hanya membuka WhatsApp atau mailto. `submitContact` dan `joinWaitlist` sudah ada tetapi tidak pernah dipanggil, jadi Lead, Waitlist, grafik Dasbor, notifikasi email dan anti-spam tidak pernah menerima data (database 0 lead dan 0 waitlist).

**Perbaikan (keputusan Farhan: simpan dulu, lalu WhatsApp).**
- Form kontak menambah email kerja dan nomor WhatsApp (label, helper dan error dari microcopy copywriting.md, EN dan ID). Validasi klien memakai `validateContactSubmission`, aturan yang sama dengan server. Form waitlist menambah email; jenis bisnis di halaman Produk adalah industri, bukan segmen waitlist, jadi `segment` dikirim kosong (opsional) dan jenis bisnis tetap ikut di pesan WhatsApp. Pemetaan keduanya masih keputusan terbuka (lihat gotcha CPR-79).
- Anti-spam CPR-49 mewajibkan token: komponen `TurnstileWidget` (render eksplisit, reset setelah gagal, test key di luar production, CSP sudah mengizinkan) dan `Honeypot` dipakai kedua form. Production butuh `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile, berjalan di Vercel tanpa DNS Cloudflare).
- Server action baru `saveContact` (validasi, anti-spam, simpan dan email sama dengan `submitContact`, tanpa redirect): form membuka WhatsApp di dalam gesture submit, menyimpan lead, lalu ke halaman terima kasih. Bila tab diblokir, form tetap di halaman untuk panel cadangan dan lead tetap tersimpan, sekali saja.
- Server action dioper sebagai prop dari halaman server (`saveLead`, `join`), sehingga modul klien tidak pernah mengimpor kode server.
- Teks helper waitlist "Nothing is saved on this website" diganti karena tidak lagi benar. Teks persetujuan kontak adalah konten halaman (admin) dan perlu disesuaikan oleh pemilik konten.

## T5 (CPR-106). Perbaikan UX admin

- **Pratinjau terlihat.** Saat Draft Mode aktif dan sesi admin sah (`isPreviewRequest`), situs publik menampilkan bar "Mode pratinjau" dengan tombol "Keluar dari pratinjau" (POST ke `/admin/preview/exit`). Pengunjung tidak pernah melihatnya.
- **Visibilitas tim.** Daftar Tim menampilkan status gabungan dan checklist tiga syarat (fitur situs, bagian Halaman > Tentang, anggota yang ditampilkan) beserta tautan ke tempat mengubahnya.
- **Log audit terbaca.** Nama pelaku menjadi tautan yang memfilter riwayatnya (tidak perlu menyalin ID); ID pelaku pindah ke tooltip, ID entitas panjang dipendekkan dengan ID lengkap di tooltip. Resolusi nama setiap entitas (judul artikel, nama file) membutuhkan join ke banyak tabel dan ditunda.
- **Status produk konsisten.** Footer dan kartu promo di menu Product (desktop dan mobile) menyembunyikan "Join the waitlist" saat produk Tersedia. Form Status produk mengingatkan label konten yang masih menyebut waitlist dengan tautan ke editor Beranda dan Produk.
- **Temuan demo:** toast sukses dinaikkan di atas bar aksi sticky agar tidak menutupi tombol simpan; breadcrumb `new` menjadi "Tambah baru" kecuali di Pengguna ("Tambah Editor"). Dugaan editor teks tanpa nama aksesibel keliru (probe berjalan sebelum editor dimuat) dan tidak diubah.

## Verifikasi per PR

`npm run lint`, `npm run typecheck`, `npm test`, dan `npm run test:database` bila menyentuh query. Verifikasi manual di Chrome terhadap dev server lokal untuk alur yang diubah, termasuk pengecekan halaman publik EN dan ID. Data uji dibersihkan setelahnya.
