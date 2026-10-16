# Panduan admin Sineva

Panduan singkat untuk Admin dan Editor yang mengelola situs Sineva tanpa bantuan developer.

> Menu dan tombol admin berbahasa Indonesia. **Situs publik tersedia dalam dua bahasa**: Inggris
> (alamat tanpa awalan, mis. `/services`) dan Indonesia (di bawah `/id`, mis. `/id/layanan`).
> Setiap editor punya pilihan bahasa **en** dan **id**; isi keduanya. Bahasa yang kosong tidak
> diisi otomatis dari bahasa lain, jadi halamannya tidak tampil di bahasa itu.

## 1. Masuk dan keluar

1. Buka `/admin/login`, masukkan email dan password.
2. Salah password 5 kali membuat akun terkunci 15 menit. Tunggu, lalu coba lagi. Pesan kesalahan
   sengaja tidak menyebut penyebabnya.
3. Keluar lewat menu akun (nama Anda di kanan atas) > **Keluar**.
4. Tidak ada pendaftaran admin dari situs. Akun Admin pertama dibuat operator; Admin membuat akun
   Editor di **Sistem > Pengguna**.

## 2. Apa yang boleh dilakukan Editor

| Area | Editor | Admin |
| --- | --- | --- |
| Halaman, Layanan, Produk, Karya, Blog, Kategori, FAQ, Tim, Media | Ya | Ya |
| Pengaturan situs: Kontak, Template WhatsApp, Media sosial | Ya | Ya |
| Pengaturan situs: Brand, Penerusan lead, Fitur situs, Analitik, Verifikasi | Tidak | Ya |
| SEO kanonis dan "Jangan indeks" per halaman | Tidak | Ya |
| Pengaturan SEO, Email, Redirect | Tidak | Ya |
| Lead, Waitlist, angka lead di Dasbor | Tidak | Ya |
| Pengguna, Log audit | Tidak | Ya |

Menu yang tidak boleh Anda buka tidak tampil, dan server juga menolaknya.

## 3. Aturan menulis konten publik

Ikuti [docs/design/copywriting.md](design/copywriting.md). Ringkasnya:

- **Tanpa em dash (—) atau en dash (–).** Admin menolak simpan dan menawarkan tombol
  **Ganti tanda baca**. Pakai koma atau titik.
- Tidak ada angka, klien, logo atau testimoni yang dikarang. Tulis hanya hal yang benar dan sudah
  disetujui.
- Huruf kapital hanya di awal kalimat (sentence case), kalimat pendek, tanpa jargon.
- Setiap gambar wajib punya **teks alternatif (alt)** yang menjelaskan isi gambar, bukan nama file.
  Upload baru meminta alt dalam dua bahasa. Media lama tanpa alt Indonesia tetap bisa dipakai,
  tetapi gambarnya tidak tampil di halaman berbahasa Indonesia sampai alt `id` diisi.
- Aturan tanda baca dan isi yang sama berlaku untuk teks berbahasa Indonesia.
- Penghitung karakter berubah kuning saat hampir penuh dan merah bila lewat batas; simpan diblokir.

## 4. Mengubah isi halaman

1. **Konten > Halaman**, pilih halaman (Beranda, Produk, Layanan, Tentang, Kontak, Terima kasih,
   404, Privasi, Indeks blog, Indeks karya).
2. Setiap bagian tampil berurutan seperti di situs. Susunan bagian tidak bisa diubah, hanya isinya.
3. Bagian opsional punya tombol **Tampilkan bagian ini**.
4. Pose Sino dan ikon dipilih dari daftar, bukan diunggah.
5. Klik **Pratinjau perubahan** untuk melihat halaman asli dengan isian yang belum disimpan
   (berlaku 10 menit, tidak mengubah situs).
6. Klik **Simpan perubahan**. Halaman langsung tampil di situs.
7. Bagian **SEO** di bawah: judul meta (maks. 60), deskripsi meta (maks. 160) dan gambar OG.
   Pratinjau hasil Google dan kartu sosial tampil di bawahnya.

## 5. Pengaturan situs

**Pengaturan > Situs**: kontak publik, nomor WhatsApp (format `+62…`), jam operasional, alamat,
media sosial, dan pesan WhatsApp per konteks. Placeholder yang boleh dipakai: `{site}` (semua),
`{product}` (pesan produk), `{service}` (pesan per layanan). Di bawah setiap pesan ada pratinjau
tautan `wa.me`. Kolom yang dikosongkan tidak tampil di situs.

Khusus Admin: nama situs dan nama produk, gambar OG bawaan, logo, email penerima lead, notifikasi
waitlist, **Fitur situs** (matikan intro logo, Sino 3D atau bar CTA bila situs terasa berat tanpa
deploy), analitik dan token verifikasi.

## 6. Layanan, Produk, FAQ dan Tim

- **Layanan**: buat layanan baru sebagai draf, isi slug (alamat `/services/<slug>`), masalah yang
  diselesaikan (3 sampai 4), hasil kerja, proses dan label CTA. Nyalakan **Terbitkan di situs**
  lalu simpan. Urutan diubah dengan panah di daftar lalu **Simpan urutan**. Layanan terbit harus
  dibatalkan publikasinya sebelum dihapus. Mengubah slug layanan terbit membuat redirect otomatis.
- **Produk**: status peluncuran (**Segera hadir** atau **Tersedia**), kartu kemampuan Sino dan tab
  jenis bisnis. Terbitkan kemampuan hanya yang sudah dikonfirmasi tim produk.
- **FAQ**: satu pustaka. Pilih di mana pertanyaan tampil (Beranda, Produk, Ringkasan layanan, atau
  layanan tertentu). Urutan diatur dari tampilan **Semua**.
- **Tim**: nama, foto, jabatan dan bio. Anggota tampil di halaman Tentang hanya bila **Tampilkan
  di halaman Tentang** menyala dan orangnya sudah setuju.

## 7. Menulis dan menerbitkan artikel

1. **Konten > Koleksi > Blog > Artikel** > **Tambah artikel**.
2. Isi slug, judul, ringkasan, sampul (kit sampul Sino atau gambar dari Media), kategori, penulis
   (anggota tim) atau nama byline, isi artikel dan SEO.
3. **Simpan draf** sesering mungkin. Draf boleh belum lengkap dan **tidak mengubah situs**.
4. **Pratinjau draf** membuka artikel seperti di situs (hanya untuk Anda, tidak terindeks).
5. **Terbitkan** menampilkan draf tersimpan di situs. Setelah terbit, perubahan baru tetap draf
   sampai Anda **Terbitkan ulang**. **Batalkan publikasi** menyembunyikan artikel tanpa menghapus
   draf.
6. Kategori dikelola di **Blog > Kategori**. Kategori atau penulis yang masih dipakai artikel tidak
   dapat dihapus.
7. Artikel ditulis per bahasa. Artikel yang hanya ada dalam bahasa Inggris tidak tampil di blog
   Indonesia (dan sebaliknya). Tombol ganti bahasa pada artikel membuka daftar blog bahasa lain.

## 8. Menambah karya

**Konten > Koleksi > Karya** memakai alur draf yang sama dengan artikel. Pilih **Jenis proyek**:
**Proyek demo internal** tampil dengan label "Internal demo project". Tulis hanya hasil yang nyata
dan terverifikasi. Halaman Karya muncul sendiri di situs setelah ada karya yang terbit.

## 9. Media

**Konten > Media**: unggah gambar, isi alt dan keterangan, atur titik fokus. Media yang masih
dipakai tidak bisa dihapus; daftar pemakaian tampil di detailnya.

## 10. Lead (Admin)

1. **Prospek > Lead**: saring menurut status, kebutuhan, jenis bisnis dan tanggal.
2. Buka lead untuk melihat pesannya. **Balas lewat WhatsApp** membuka percakapan.
3. Ubah **Status** (Baru, Dihubungi, Berpotensi, Berhasil, Tidak lanjut) dan **Catatan internal**,
   lalu **Simpan tindak lanjut**.

## 11. Waitlist (Admin)

**Prospek > Waitlist** menampilkan pendaftar. **Unduh CSV** mengekspor daftar sesuai filter. Simpan
file dengan aman dan hapus setelah selesai dipakai.

## 12. Permintaan penghapusan data (UU PDP)

Bila seseorang meminta datanya dihapus:

1. Cari datanya di **Lead** dan/atau **Waitlist** memakai email yang ia sebut.
2. Waitlist: klik **Hapus** pada barisnya dan ketik email untuk konfirmasi.
3. Lead: buka lead, klik **Hapus lead** dan ketik email untuk konfirmasi.
4. Balas pemohon bahwa permintaannya sudah diproses. Ekspor CSV lama yang memuat datanya juga harus
   dihapus.

## 13. Area khusus Admin

- **Pengaturan > SEO**: template judul (harus memuat `{title}`), deskripsi bawaan, izin indeks
  situs, token Search Console.
- **Pengaturan > Email**: Resend API (disarankan) atau SMTP, pengirim, rahasia (disimpan terenkripsi,
  tidak pernah ditampilkan lagi), template email per jenis, dan **Kirim email uji**. Bila tertulis
  **Diatur oleh environment**, pengaturan koneksi berasal dari server.
- **Pengaturan > Redirect**: arahkan alamat lama ke alamat baru (301 atau 308). Redirect dibuat
  otomatis saat slug yang terbit berubah. Putaran dan rantai panjang ditolak.
- **Sistem > Log audit**: siapa mengubah apa dan kapan (tanpa nilai rahasia atau data lead).
- **Dasbor**: angka lead dan waitlist, grafik dan aktivitas terbaru.

## 14. Profil saya

Menu akun > **Profil saya**: ubah nama dan avatar, ganti password (sesi di perangkat lain otomatis
keluar), lihat dan keluarkan sesi aktif, atur kepadatan tabel dan sidebar.
