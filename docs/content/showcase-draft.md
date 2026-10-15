# CPR-16 | [Content] Draft topik showcase portofolio

**Status:** draft usulan, 15 Oktober 2026. Founder meminta draft terlebih dahulu; topik, penanggung jawab, jadwal dan tiket demo belum ditetapkan. CPR-16 belum selesai; Q4 PRD tetap terbuka.

**Acuan:** [PRD §2, FR-PF-03 dan Q4](../prd/2026-10-14-company-profile-prd.md), [outline portofolio](outline.md), [CPR-16](https://linear.app/sineva-tech/issue/CPR-16/content-tetapkan-topik-showcase-portofolio).

## Usulan dua showcase awal

Pilih satu studi kasus website dan satu demo proses operasional agar calon klien dapat melihat contoh Web Development serta otomasi. Keduanya memakai label **“Proyek demo internal”**. Draft ini membahas calon materi portofolio; aplikasi demo baru merupakan pekerjaan terpisah dari Compro.

| Kandidat                                            | Layanan terkait                                                    | Sasaran                                                                             | Status nyata                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Website company profile Sineva Tech                 | Web Development                                                    | Usaha dan perusahaan yang membutuhkan website dua bahasa dengan pengelolaan konten. | Fondasi aplikasi tersedia. Halaman publik, pengelolaan konten lengkap dan studi kasus belum selesai. |
| Dashboard pesanan UMKM dengan simulasi alur otomasi | Web Development; AI & Otomasi untuk bagian otomasi berbasis aturan | UMKM F&B yang ingin melihat contoh pencatatan dan tindak lanjut pesanan.            | Ide demo; belum dibangun dan belum punya tiket implementasi.                                         |

## 1. Website company profile Sineva Tech

**Judul kerja:** Website dua bahasa dengan admin konten untuk Sineva Tech.

**Skenario:** Sineva membutuhkan tempat untuk menjelaskan dua layanan, mengenalkan rencana produk, mengumpulkan minat konsultasi, serta mengelola konten dalam Indonesia dan Inggris.

**Fokus demo yang diusulkan:**

- Halaman layanan pada dua bahasa dan perpindahan ke halaman padanannya.
- Alur pengelolaan konten lewat admin custom dalam aplikasi Next.js.
- Form konsultasi dan alur pencatatan lead, setelah implementasinya benar-benar tersedia.
- Tampilan responsif dan tema terang/gelap, setelah dapat ditunjukkan dan diuji.

**Bukti untuk studi kasus:** screenshot asli halaman, diagram alur publik/admin, daftar teknologi yang benar digunakan, serta hasil pemeriksaan yang dapat ditelusuri. Fitur yang masih direncanakan tidak masuk daftar hasil pekerjaan.

**Arah narasi:** kebutuhan internal → keputusan struktur dan pengelolaan konten → hasil yang bisa diperiksa. Tidak mengklaim kenaikan konversi atau hasil komersial sebelum ada pengukuran.

**Demo:** website publik setelah deployment. Demonstrasi admin hanya memakai lingkungan/data uji, tanpa membuka akun atau data lead production.

**Penanggung jawab:** usulan tim Compro; nama pemilik studi kasus ditetapkan Founder. Pengerjaan fitur tetap mengikuti tiket CPR yang sudah ada, tidak diduplikasi sebagai proyek pembangunan website baru.

**Tiket lanjutan yang diusulkan:** penyiapan studi kasus, screenshot dan bukti demo setelah fitur relevan selesai. Tiket tersebut belum dibuat pada tahap draft ini.

**Kapan siap:** setelah halaman dan alur yang disebut pada studi kasus selesai, punya bukti pemeriksaan serta URL yang dapat ditinjau. Tanggal kalender belum ditetapkan.

## 2. Dashboard pesanan UMKM dan simulasi otomasi

**Judul kerja:** Dari pesanan masuk ke daftar tindak lanjut.

**Skenario fiktif:** usaha F&B menerima permintaan pesanan dan membutuhkan tampilan untuk meninjau serta memperbarui statusnya. Semua nama pelanggan, nomor, produk dan transaksi memakai data simulasi.

**Lingkup demo yang diusulkan:**

- Form input pesanan contoh: pelanggan simulasi, item, jumlah dan catatan.
- Dashboard daftar/filter serta detail pesanan dengan status Baru → Diproses → Selesai.
- Aturan demonstrasi: kiriman valid menambah pesanan dan entri pada daftar tindak lanjut; perubahan status tercatat pada aktivitas demo.
- Tampilan hasil notifikasi simulasi yang berlabel jelas; tidak mengirim pesan kepada orang lain.
- Skenario input tidak valid, daftar kosong dan reset data demo.

**Batas:** tidak ada pembayaran nyata, integrasi WhatsApp aktif, kredensial pihak ketiga atau data pelanggan asli. AI belum diperlukan untuk contoh aturan ini. Jangan menamai hasilnya “integrasi WhatsApp” atau “solusi AI” bila yang dibangun hanya simulasi otomasi.

Usulan awal PRD menyebut dashboard pesanan WhatsApp. Kandidat ini mempersempitnya menjadi simulasi mandiri supaya tidak bergantung pada setup kanal eksternal. Perubahan topik ini masih usulan yang perlu disetujui; Q4 belum diubah atau ditutup.

**Bukti untuk studi kasus:** URL demo, screenshot asli, diagram input → validasi → pencatatan → tindak lanjut, serta rekaman skenario yang benar berjalan. Hasil dijelaskan sebagai perilaku demo, bukan penghematan jam atau omzet UMKM.

**Penanggung jawab:** developer demo ditetapkan Founder; belum menjadi assignment Faishal atau team CBT. Rekomendasi teknis ditentukan saat tiket demo dirancang, tanpa mengambil alih repo chatbot.

**Tiket lanjutan yang diusulkan:** pembangunan demo pada project/repo terpisah, disusul penyusunan materi studi kasus. Keduanya belum dibuat pada tahap draft.

**Kapan siap:** setelah pemilik demo, ruang lingkup dan kapasitas pengerjaan disepakati. Estimasi kalender menunggu perencanaan oleh pemilik, bukan janji publik.

## Kandidat cadangan

Chatbot FAQ/booking untuk klinik fiktif tetap kandidat masa depan sesuai usulan PRD. Rencana fitur dan kesiapan team CBT belum tersedia; kandidat ini tidak dipilih sebagai dependensi dua showcase awal dalam draft. Jadwal, kemampuan chatbot dan integrasi tidak diasumsikan sudah ada.

## Paket materi tiap karya

Setelah topik dan demo siap, kumpulkan judul/ringkasan ID/EN, label jenis proyek, tantangan, solusi, hasil yang dapat dibuktikan, teknologi, cover/galeri asli beserta caption/alt, URL demo dan layanan terkait. Screenshot menampilkan data simulasi. CPR-55 memakai paket ini untuk input portofolio.

Studi kasus Sineva dan dashboard demo harus tetap dibedakan dari proyek klien. Demo yang belum dibuat tidak diterbitkan sebagai karya selesai. Syarat launch minimal dua portofolio terbit tetap mengikuti PRD.

## Keputusan yang masih terbuka

- [ ] Founder menyetujui minimal dua topik.
- [ ] Tiap topik punya pemilik bernama, ruang lingkup final dan perkiraan kesiapan.
- [ ] Tiket demo/studi kasus yang diperlukan dibuat pada team/project yang disepakati.
- [ ] Q4 PRD ditutup setelah keputusan di atas, dengan referensi tiket.

Draft ini tidak mengisi atau mencentang acceptance tersebut sebagai selesai.
