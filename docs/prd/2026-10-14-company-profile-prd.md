# PRD — Website Company Profile Sineva Tech (v1)

| | |
|---|---|
| **Status** | Final — disetujui Founder |
| **Tanggal** | 14 Oktober 2026 |
| **Revisi** | Rev. 2 (14 Oktober 2026): headless CMS dihapus; Founder memilih admin custom dalam Next.js. Rev. 1: mode terang & gelap |
| **Pemilik** | Founder Sineva Tech |
| **Linear** | Team `CPR` (Compro) |
| **Proyek terkait** | Sineva Chatbot — team `CBT`, dikembangkan terpisah |

---

## 1. Ringkasan

Sineva Tech adalah perusahaan teknologi baru dengan model bisnis **gabungan**: jasa pengembangan custom (Web Development, AI & Otomasi) dan produk SaaS, dimulai dari chatbot.

Website company profile ("Compro") v1 punya satu tugas utama: **mengubah pengunjung menjadi calon klien jasa yang menghubungi Sineva untuk konsultasi**, lewat WhatsApp atau form kontak. Tugas keduanya adalah mengumpulkan waitlist untuk produk chatbot, yang belum diluncurkan.

Website tampil dalam dua bahasa (Indonesia dan Inggris) sejak hari pertama. Konten, blog, dan lead dikelola lewat **admin custom di `/admin` dalam aplikasi Next.js yang sama**, dengan data di PostgreSQL. Tidak menggunakan headless CMS.

**Status implementasi:** arah ini menggantikan rancangan Payload sebelumnya. Fondasi pengganti Next.js/admin custom telah dibuat pada salinan kerja branch CPR-7. Pengujian unit, database, HTTP production dan review independen lulus setelah perbaikan; verifikasi browser production lokal lulus pada 15 Oktober 2026, termasuk login setelah restart database developer. Implementasi pengganti belum di-commit/push; draft PR #1 belum boleh dianggap siap merge/launch.

## 2. Latar belakang

- Sineva Tech belum punya kehadiran online. Domain, portofolio, dan legalitas usaha belum ada.
- Logo sumber ada di folder `assets/brand/logos/source/` repo ini: `Sineva_Logo.png` (simbol) dan `Sineva_Stacked_Wordmark_With_Logo.png` (simbol + tulisan "Sineva"). Keduanya PNG transparan 5225×5225 px. Warnanya gradasi teal dari ±`#009EA6` (terang) ke ±`#08404D` (tua). File vektor dari pembuat tidak tersedia (jawaban Founder untuk Q7). Hasil tracing SVG dan PNG transparan versi warna asli serta dark mode tersedia di [`assets/brand/logos/`](../../assets/brand/logos/README.md) dan [Figma](https://www.figma.com/design/vdG8pTacFcbDnEUb8cjBDM?node-id=7-2); bentuk dan susunan mengikuti sumber, kedua varian hanya berbeda warna.
- Tanpa portofolio klien, kredibilitas dibangun dari **2–3 proyek showcase internal** yang bisa dicoba langsung.
- Produk chatbot dikembangkan terpisah dan kemungkinan belum siap saat Compro diluncurkan. Karena itu Compro hanya menampilkan chatbot sebagai produk yang "segera hadir".
- Pengerjaan dilakukan oleh tim campuran: Founder bersama Claude, ditambah anggota tim atau freelancer. Karena itu setiap pekerjaan harus punya acceptance criteria yang jelas.
- Tidak ada tenggat yang mendesak. Kualitas lebih diutamakan daripada kecepatan.

## 3. Target pengguna

Ketiga segmen di bawah diperlakukan **setara**. Bahasa website harus sederhana untuk pemilik UMKM, tapi tetap terlihat kredibel di mata korporat.

| Segmen | Kebutuhan khas | Yang mereka cari di website |
|---|---|---|
| **UMKM & bisnis lokal** | Website, sistem sederhana, otomasi WhatsApp | Bahasa sederhana, kontak cepat via WhatsApp, kepastian biaya |
| **Perusahaan menengah / korporat** | Sistem internal, integrasi, solusi AI | Portofolio, proses kerja yang jelas, profil perusahaan |
| **Startup** | MVP cepat, mitra teknologi | Kualitas teknis, kecepatan, stack yang dipakai |

Pengguna internal:
- **Admin** (Founder): mengelola semua konten dan data lead.
- **Editor** (penulis atau freelancer konten): mengelola konten saja.

## 4. Tujuan, non-tujuan, dan metrik sukses

### 4.1 Tujuan
1. Calon klien bisa memahami layanan Sineva dan menghubungi Sineva dalam beberapa klik.
2. Sineva terlihat kredibel walau belum punya portofolio klien.
3. Tim bisa memperbarui konten dan menulis artikel tanpa developer.
4. Setiap lead tercatat dan tidak ada yang hilang.

### 4.2 Non-tujuan (v1)
- Menjual atau menyediakan produk chatbot. Compro hanya menampilkan waitlist.
- Menampilkan daftar harga.
- Menjalankan iklan berbayar.

### 4.3 Kriteria siap luncur (Definition of Done v1)
- [ ] Semua halaman di §6 tayang dalam **ID dan EN** dengan konten final.
- [ ] Minimal **2 item portofolio** terbit.
- [ ] Form kontak, tombol WhatsApp, dan waitlist berfungsi di production. Email notifikasi dan balasan otomatis terkirim, dengan SPF/DKIM lolos.
- [ ] Semua event analytics di §12 tercatat di Umami.
- [ ] Lighthouse mobile ≥ 90 untuk Performance, Accessibility, Best Practices, dan SEO di 5 halaman kunci: Beranda, detail Layanan, detail Portofolio, Artikel, dan Kontak.
- [ ] Tidak ada pelanggaran aksesibilitas level *critical* atau *serious* (diperiksa dengan axe) di **mode terang dan gelap**.
- [ ] Sitemap sudah dikirim ke Google Search Console tanpa error indexing.
- [ ] Backup database berjalan otomatis, dan proses restore sudah diuji minimal sekali.
- [ ] Panduan admin (cara mengelola konten dan lead) sudah diserahkan.

### 4.4 Metrik setelah peluncuran
- **Metrik utama: tingkat konversi**, yaitu jumlah sesi yang memicu `whatsapp_click` atau `form_submit` dibagi total sesi.
- **Metrik pendukung:** jumlah lead per bulan (dirinci per segmen dan layanan), jumlah pendaftar waitlist, dan trafik organik.
- Target angkanya **ditetapkan setelah 30 hari data baseline**. Saat ini belum ada data trafik yang bisa dijadikan acuan.

## 5. Ruang lingkup

### 5.1 Termasuk (v1)
- Semua halaman di §6 dalam dua bahasa.
- Mode terang dan gelap di semua halaman publik (FR-GLB-05).
- Admin custom Next.js untuk model data dan pengaturan halaman di §9, beserta peran Admin dan Editor.
- Alur lead: WhatsApp, form kontak, waitlist, dan mini-CRM (§8).
- SEO teknis (§11), analytics (§12), dan target kualitas (§13).
- Infrastruktur VPS, CI/CD, backup, dan monitoring (§14).
- Halaman yang **menampilkan** showcase portofolio.

### 5.2 Tidak termasuk (v1)
| Item | Alasan / kapan |
|---|---|
| Pembuatan aplikasi demo showcase | Pekerjaan terpisah. Demo chatbot bergantung pada team `CBT` |
| Halaman harga | Jasa custom, harga ditentukan per proyek |
| Halaman karier | Belum ada rekrutmen |
| Halaman per industri | Bisa ditambah tanpa mengubah struktur |
| Page builder drag-and-drop | Layout tetap di kode sudah cukup |
| Headless CMS atau backend konten terpisah | Pengelolaan konten terintegrasi dalam aplikasi Next.js |
| Jadwal terbit otomatis | Belum diperlukan |
| GA4, piksel iklan, cookie banner | Ditambah saat mulai beriklan |
| Widget chatbot di website | Setelah produk chatbot diluncurkan |
| Booking jadwal call (Cal.com) | Tidak dipilih untuk v1 |

## 6. Sitemap dan URL

Bahasa default adalah `id`. Setiap bahasa punya slug sendiri.

| Halaman | ID | EN |
|---|---|---|
| Beranda | `/id` | `/en` |
| Layanan (daftar) | `/id/layanan` | `/en/services` |
| Layanan: Web Development | `/id/layanan/web-development` | `/en/services/web-development` |
| Layanan: AI & Otomasi | `/id/layanan/ai-otomasi` | `/en/services/ai-automation` |
| Portofolio (daftar) | `/id/portofolio` | `/en/portfolio` |
| Portofolio (detail) | `/id/portofolio/[slug]` | `/en/portfolio/[slug]` |
| Produk Chatbot | `/id/produk/chatbot` | `/en/products/chatbot` |
| Blog (daftar) | `/id/blog` | `/en/blog` |
| Blog (artikel) | `/id/blog/[slug]` | `/en/blog/[slug]` |
| Tentang Kami | `/id/tentang-kami` | `/en/about` |
| Kontak | `/id/kontak` | `/en/contact` |
| Terima kasih | `/id/kontak/terima-kasih` | `/en/contact/thank-you` |
| Kebijakan Privasi | `/id/kebijakan-privasi` | `/en/privacy-policy` |
| 404 | (versi ID) | (versi EN) |
| Admin custom (login dan dashboard) | `/admin` | — |

## 7. Kebutuhan fungsional per halaman

Setiap kebutuhan diberi ID agar bisa dirujuk dari tiket Linear.

### 7.1 Elemen global
- **FR-GLB-01 — Header:** logo, navigasi (Layanan, Portofolio, Produk, Blog, Tentang Kami), tombol pindah bahasa ID/EN, tombol pindah tema (FR-GLB-05), dan tombol CTA *Konsultasi Gratis* ke halaman Kontak. Di layar ≤ 1024 px, navigasi menjadi menu mobile, dan tombol bahasa serta tema tetap bisa dijangkau.
- **FR-GLB-02 — Tombol WhatsApp melayang** muncul di semua halaman publik. Pesan yang terisi otomatis mengikuti halaman asal (§8.1).
- **FR-GLB-03 — Footer:** ringkasan perusahaan, navigasi, daftar layanan, kontak (email, WhatsApp, alamat), data legalitas, media sosial, tautan Kebijakan Privasi, dan hak cipta. Data legalitas dan alamat **disembunyikan selama field-nya kosong di Pengaturan Situs**.
- **FR-GLB-04 — Halaman 404** tersedia dalam dua bahasa, dengan tautan ke Beranda, Layanan, dan Kontak.
- **FR-GLB-05 — Mode terang & gelap** tersedia di semua halaman publik:
  - Kunjungan pertama mengikuti pengaturan sistem perangkat pengunjung (`prefers-color-scheme`).
  - Tombol di header mengganti tema antara terang dan gelap. Pilihan pengunjung disimpan di perangkatnya dan dipakai lagi di kunjungan berikutnya, mengalahkan pengaturan sistem.
  - **Tidak ada kedipan tema** saat halaman dimuat. Halaman tidak boleh sempat tampil terang lalu berubah gelap.
  - Logo memakai varian yang terbaca di latar gelap. Tulisan "Sineva" berwarna teal tua hanya punya kontras 1,6 : 1 di latar gelap.
  - Animasi transisi tema dimatikan kalau pengunjung mengaktifkan `prefers-reduced-motion`.
  - Panel admin (`/admin`) memakai UI custom yang konsisten dengan design system. Mode terang/gelap admin tidak termasuk kebutuhan v1; tidak ada ketergantungan pada tema panel CMS.

### 7.2 Beranda
- **FR-HOME-01 — Hero:** judul nilai utama, subjudul, CTA utama *Konsultasi Gratis*, dan CTA kedua *Lihat Layanan*.
- **FR-HOME-02 — Untuk siapa:** 3 kartu (UMKM, Perusahaan, Startup). Setiap kartu berisi masalah khas segmen tersebut dan cara Sineva membantu.
- **FR-HOME-03 — Layanan:** ringkasan 2 layanan, masing-masing menuju halaman detailnya.
- **FR-HOME-04 — Portofolio pilihan:** maksimal 3 item portofolio bertanda "unggulan". **Bagian ini disembunyikan** kalau belum ada item.
- **FR-HOME-05 — Proses kerja:** 4 langkah, yaitu Konsultasi → Proposal → Pengerjaan → Pendampingan.
- **FR-HOME-06 — Teaser chatbot:** label "Segera hadir", deskripsi singkat, dan form waitlist (§8.3).
- **FR-HOME-07 — Artikel terbaru:** 3 artikel terbaru dalam bahasa halaman. **Bagian ini disembunyikan** kalau belum ada artikel.
- **FR-HOME-08 — CTA penutup:** ajakan konsultasi dengan tombol Kontak dan tombol WhatsApp.

### 7.3 Layanan
- **FR-SVC-01 — Halaman daftar** menampilkan 2 layanan beserta ringkasannya.
- **FR-SVC-02 — Halaman detail** berisi: masalah yang diselesaikan, apa yang didapat klien, proses, teknologi yang dipakai, FAQ, dan CTA.
- **FR-SVC-03 — CTA di halaman detail** mengarah ke Kontak dengan layanan sudah terpilih di form (contoh: `/id/kontak?layanan=web-development`).
- **FR-SVC-04 — FAQ** dikeluarkan juga sebagai structured data `FAQPage`.

### 7.4 Portofolio
- **FR-PF-01 — Halaman daftar** berupa grid dengan filter layanan: Semua, Web, dan AI.
- **FR-PF-02 — Halaman detail** berisi: ringkasan, tantangan, solusi, hasil, teknologi, galeri, tautan demo (dibuka di tab baru), layanan terkait, dan CTA.
- **FR-PF-03 — Label jenis proyek.** Setiap item punya field *jenis proyek* (Showcase internal / Proyek klien). Proyek showcase internal **wajib menampilkan label "Proyek demo internal"** supaya pengunjung tidak salah mengira itu proyek klien.

### 7.5 Produk Chatbot
- **FR-PRD-01 — Halaman "Segera hadir"** berisi: nilai utama chatbot, fitur yang direncanakan, form waitlist, dan FAQ. Semua kontennya dikelola dari admin custom.
- Halaman ini akan diganti menjadi halaman produk penuh setelah chatbot diluncurkan. Penggantian itu di luar lingkup v1.

### 7.6 Blog
- **FR-BLOG-01 — Halaman daftar:** filter kategori lewat parameter query (`?kategori=`), 9 artikel per halaman, dan paginasi. Canonical halaman yang difilter mengarah ke halaman daftar utama.
- **FR-BLOG-02 — Halaman artikel:** judul, cover, penulis, tanggal terbit, estimasi waktu baca, isi artikel, tombol bagikan (WhatsApp, LinkedIn, salin tautan), dan 3 artikel terkait dari kategori yang sama.
- **FR-BLOG-03 — Isi artikel (rich text)** mendukung heading, daftar, tautan, gambar, kutipan, dan blok kode.
- **FR-BLOG-04 — Artikel hanya tampil di bahasa yang versinya ada** (§10).

### 7.7 Tentang Kami
- **FR-ABT-01:** cerita perusahaan, visi & misi, dan nilai-nilai perusahaan.
- **FR-ABT-02:** bagian tim, diambil dari data Tim. Bagian ini bisa disembunyikan lewat Pengaturan Situs di admin.

### 7.8 Kontak
- **FR-CTC-01:** form kontak (§8.2), tombol WhatsApp, email, dan jam operasional. Alamat muncul kalau sudah diisi di admin.
- **FR-CTC-02 — Halaman terima kasih** dibuat di URL tersendiri, sehingga bisa diukur sebagai halaman tujuan konversi. Halaman ini berisi tombol WhatsApp untuk calon klien yang ingin respons lebih cepat.

### 7.9 Kebijakan Privasi
- **FR-PRV-01:** isi dikelola dari admin custom dan mencakup data apa yang dikumpulkan, tujuannya, masa simpan (§13.4), hak pemilik data, dan kontak untuk permintaan akses atau penghapusan data.

## 8. Alur lead

### 8.1 WhatsApp
- **FR-LEAD-01:** semua tombol WhatsApp membuka `https://wa.me/<nomor>?text=<pesan>`.
- **FR-LEAD-02:** template pesan **berbeda per konteks** (umum, Web Development, AI & Otomasi, Produk Chatbot) dan **per bahasa**. Contoh: *"Halo Sineva Tech, saya ingin konsultasi tentang AI & Otomasi."*
- **FR-LEAD-03:** nomor WhatsApp dan template pesan dikelola di Pengaturan Situs dalam admin.

### 8.2 Form kontak

| Field | Tipe | Wajib | Catatan |
|---|---|---|---|
| Nama | teks | ✅ | |
| Email | email | ✅ | divalidasi formatnya |
| No. WhatsApp | telepon | ✅ | dinormalisasi ke format `62…` |
| Nama perusahaan | teks | – | |
| Jenis bisnis | pilihan | ✅ | UMKM / Perusahaan / Startup / Lainnya |
| Layanan yang diminati | pilihan | ✅ | Web Development / AI & Otomasi / Belum yakin. Bisa terisi otomatis dari URL |
| Perkiraan budget | pilihan | – | < Rp10 jt / Rp10–50 jt / Rp50–150 jt / > Rp150 jt / Belum tahu |
| Kebutuhan | teks panjang | ✅ | minimal 20 karakter |
| Persetujuan Kebijakan Privasi | centang | ✅ | dilengkapi tautan ke Kebijakan Privasi |

**Perilaku setelah form dikirim:**
- **FR-LEAD-04:** semua input divalidasi di sisi klien **dan** di server.
- **FR-LEAD-05:** setelah lolos validasi dan anti-spam, data disimpan ke tabel Leads beserta bahasa, halaman asal, dan waktu kirim.
- **FR-LEAD-06:** email notifikasi dikirim ke inbox lead yang diatur di Pengaturan Situs.
- **FR-LEAD-07:** email balasan otomatis dikirim ke calon klien dalam bahasanya.
- **FR-LEAD-08:** pengunjung diarahkan ke halaman terima kasih.

**Penanganan error:**
- **FR-LEAD-09:** kalau pengiriman email gagal, data **tetap tersimpan**. Kegagalannya dicatat ke log dan ke Sentry, dan pengunjung tetap melihat halaman sukses.
- **FR-LEAD-10:** kalau penyimpanan data gagal, form menampilkan pesan error dalam bahasa halaman. Isian yang sudah diketik tidak hilang, dan tersedia tombol WhatsApp sebagai jalur cadangan.

**Anti-spam:**
- **FR-LEAD-11:** field honeypot. Kiriman yang terdeteksi bot dibuang diam-diam tanpa pesan error.
- **FR-LEAD-12:** verifikasi Cloudflare Turnstile di server.
- **FR-LEAD-13:** pembatasan maksimal 5 kiriman per IP per 10 menit.

### 8.3 Waitlist chatbot
- **FR-WL-01 — Field:** email (wajib), jenis bisnis (opsional), dan persetujuan (wajib). Proteksi anti-spam sama dengan form kontak.
- **FR-WL-02 — Email ganda:** kalau email sudah terdaftar, pengunjung tetap melihat pesan sukses, tapi data tidak diduplikasi. Ini mencegah orang mengecek apakah sebuah email sudah terdaftar.
- **FR-WL-03 — Ekspor:** Admin bisa mengekspor waitlist ke CSV.

### 8.4 Mini-CRM
- **FR-CRM-01 — Status lead:** *Baru → Dihubungi → Proposal → Deal / Tidak lanjut*. Lead baru otomatis berstatus *Baru*.
- **FR-CRM-02 — Catatan internal:** field teks per lead.
- **FR-CRM-03 — Tampilan daftar Leads di admin** bisa difilter berdasarkan status, layanan, jenis bisnis, dan tanggal.

## 9. Admin custom dan model data

**Prinsip: layout ada di kode, isi ada di PostgreSQL dan diedit lewat admin custom.** Setiap halaman punya bagian-bagian yang tetap. Teks, gambar, dan SEO di setiap bagian bisa diubah dari `/admin` tanpa deploy ulang. Schema, validasi, otorisasi, query publik, dan form admin dimiliki aplikasi; tidak ada collection/global, plugin SEO, atau API CRUD otomatis dari CMS.

### 9.1 Entitas data

| Entitas | Field utama | Dilokalkan |
|---|---|---|
| **Services** | judul, slug, ringkasan, ikon, masalah yang diselesaikan, apa yang didapat (array), proses (array), teknologi, FAQ (array), SEO | ✅ |
| **Portfolio** | judul, slug, jenis proyek, ringkasan, tantangan, solusi, hasil, teknologi, cover, galeri, URL demo, layanan terkait, unggulan, SEO | ✅ |
| **Posts** | judul, slug, ringkasan, cover, isi, kategori, penulis, tanggal terbit, SEO | ✅ |
| **Categories** | nama, slug | ✅ |
| **Team** | nama, jabatan, foto, bio | ✅ (bio, jabatan) |
| **Media** | file, alt text (**wajib**) | ✅ (alt) |
| **Leads** | field §8.2, status, catatan internal, bahasa, halaman asal | — |
| **Waitlist** | email, jenis bisnis, bahasa | — |
| **Users** | email, nama, peran (Admin / Editor) | — |

### 9.2 Pengaturan situs dan konten halaman

| Pengaturan / halaman | Isi |
|---|---|
| **Pengaturan Situs** | nomor WhatsApp, template pesan WhatsApp, inbox email lead, email publik, jam operasional, alamat, data legalitas, media sosial, SEO dan gambar OG bawaan, tampil/sembunyikan bagian Tim |
| **Beranda** | konten setiap bagian di FR-HOME-01 s.d. 08 |
| **Tentang Kami** | cerita, visi & misi, nilai |
| **Kontak** | teks pengantar dan teks halaman terima kasih |
| **Produk Chatbot** | nilai utama, fitur yang direncanakan, FAQ |
| **Kebijakan Privasi** | isi (rich text) dan tanggal berlaku |

### 9.3 Peran dan hak akses

| | Konten (Services, Portfolio, Posts, Categories, Team, Media, pengaturan/halaman) | Leads & Waitlist | Users |
|---|---|---|---|
| **Admin** | baca/tulis | baca/ubah/hapus/ekspor | kelola |
| **Editor** | baca/tulis | **tidak ada akses** | — |

- **FR-ADM-01:** Leads dan Waitlist **tidak memiliki REST API CRUD publik**. Pengunjung hanya dapat mengirim data lewat server action khusus yang sudah melewati validasi dan anti-spam; baca, ubah, hapus, dan ekspor memerlukan Admin di server.
- **FR-ADM-02:** Posts dan Portfolio punya status draft/terbit dan fitur preview sebelum diterbitkan. Draft dan preview hanya dapat dibuka Admin/Editor yang berhak, tidak diindeks dan tidak masuk cache publik.
- **FR-ADM-03:** setelah transaksi perubahan konten berhasil, halaman terkait di kedua bahasa diperbarui otomatis (on-demand revalidation), termasuk URL lama saat slug berubah, daftar, beranda, dan sitemap.
- **FR-ADM-04:** login admin terkunci sementara setelah 5 kali gagal. Counter disimpan di database dan diperbarui secara atomik; rate limit saja bukan pengganti lockout akun. Durasi awal lockout 15 menit, respons login tidak mengungkap apakah email terdaftar.
- **FR-ADM-05:** admin custom menyediakan login/logout, dashboard sesuai peran, daftar dan form tambah/edit konten, pemilih bahasa konten, validasi field, upload media, field SEO, draft/publish/preview, filter lead, catatan/status lead, dan ekspor waitlist. Admin dapat mengelola akun Editor. Bahasa antarmuka admin v1 adalah Indonesia; konten tetap ID/EN.
- **FR-ADM-06:** signup publik ditutup. Admin pertama dibuat melalui perintah bootstrap operator yang eksplisit, memakai library autentikasi, tanpa password bawaan atau endpoint bootstrap anonim. Setiap query, server action, upload, preview, dan ekspor admin memeriksa session dan peran di server; menyembunyikan menu bukan pemeriksaan izin.

**Pemetaan ID Rev. 1 → Rev. 2:** `FR-CMS-01` → `FR-ADM-01`, `FR-CMS-02` → `FR-ADM-02`, `FR-CMS-03` → `FR-ADM-03`, `FR-CMS-04` → `FR-ADM-04`. ID lama hanya berlaku pada catatan historis; tiket aktif memakai ID baru.

### 9.4 Penyimpanan dan publikasi konten

- Entitas memiliki ID stabil; terjemahan disimpan per `(entity_id, locale)`. Slug unik per jenis konten dan bahasa ditegakkan oleh constraint database. Pergantian bahasa memakai ID entitas yang sama, bukan menebak slug.
- Konten inti wajib lengkap ID/EN sebelum launch. Publikasi artikel dapat dilakukan per bahasa; tidak ada fallback lintas bahasa.
- Posts dan Portfolio memisahkan draft yang sedang diedit dari snapshot yang diterbitkan. Menyimpan draft tidak boleh mengubah isi publik sampai tindakan publish berhasil.
- Rich text disimpan sebagai dokumen terstruktur yang divalidasi dan dirender oleh aplikasi. HTML atau URL dari editor tidak dipercaya begitu saja.
- Email waitlist dinormalisasi dan memiliki constraint unik agar kiriman bersamaan tidak membuat duplikasi. Hanya konflik duplikasi yang dikenal diperlakukan sebagai sukses.

## 10. Aturan dua bahasa

- **FR-I18N-01:** lokal yang tersedia adalah `id` (default) dan `en`. Fallback antarbahasa **dimatikan**, sehingga teks Indonesia tidak pernah muncul di halaman Inggris.
- **FR-I18N-02 — Kunjungan ke `/`:** pengunjung diarahkan berdasarkan cookie pilihan bahasa kalau ada. Kalau tidak ada cookie, diarahkan ke `/en` bila bahasa browser Inggris, selain itu ke `/id`.
- **FR-I18N-03:** tombol pindah bahasa membuka **halaman padanan** di bahasa lain dan menyimpan pilihan itu di cookie. Kalau padanannya tidak ada (artikel satu bahasa), pengunjung diarahkan ke daftar blog bahasa tujuan.
- **FR-I18N-04:** konten inti (pengaturan/konten semua halaman, Services, Portfolio) **wajib lengkap dalam dua bahasa** sebelum diluncurkan. Ini diperiksa lewat checklist QA.
- **FR-I18N-05:** artikel blog boleh hanya satu bahasa. Artikel tanpa versi EN tidak tampil di `/en/blog`, sitemap EN, maupun `hreflang`.
- **FR-I18N-06:** teks antarmuka (label tombol, pesan error, dll.) disimpan di file terjemahan di repo, terpisah dari konten halaman di database.

## 11. SEO

- **FR-SEO-01:** meta title, meta description, dan gambar OG bisa diatur per dokumen, dengan nilai bawaan dari Pengaturan Situs.
- **FR-SEO-02:** setiap halaman punya `hreflang` (`id`, `en`, `x-default` → `/id`) dan canonical.
- **FR-SEO-03:** `sitemap.xml` mencakup kedua bahasa, beserta `robots.txt`. Halaman `/admin` dan halaman terima kasih tidak diindeks.
- **FR-SEO-04 — Structured data (JSON-LD):** Organization, Service, BlogPosting, FAQPage, dan BreadcrumbList.
- **FR-SEO-05:** halaman publik di-render statis dan diperbarui lewat on-demand revalidation (FR-ADM-03). Session, data admin, dan preview draft tidak masuk cache publik.

## 12. Analytics

Alat yang dipakai adalah **Umami Cloud (paket gratis)**. Umami tidak memakai cookie, jadi website tidak perlu cookie banner. Kalau batas paket gratis terlampaui, Umami bisa di-self-host di VPS lewat Coolify.

| Event | Properti | Dipicu saat |
|---|---|---|
| `whatsapp_click` | `location` (floating / hero / cta / contact / thank-you), `context`, `locale` | tombol WhatsApp diklik |
| `cta_click` | `cta`, `page`, `locale` | tombol CTA utama atau kedua diklik |
| `form_submit` | `service`, `business_type`, `locale` | form kontak berhasil dikirim |
| `waitlist_submit` | `locale` | waitlist berhasil dikirim |
| `lang_switch` | `from`, `to` | tombol pindah bahasa diklik |

## 13. Kebutuhan non-fungsional

### 13.1 Performa
- Lighthouse mobile ≥ 90 di 4 kategori untuk 5 halaman kunci (§4.3).
- Core Web Vitals: LCP < 2,5 detik, CLS < 0,1, INP < 200 ms.
- Gambar dioptimasi lewat `next/image` (format modern, ukuran responsif, lazy-load).

### 13.2 Aksesibilitas
- Memenuhi WCAG 2.1 AA: kontras warna, navigasi keyboard penuh, focus state terlihat, label pada setiap field form, dan alt text wajib.
- Kontras AA wajib terpenuhi di **kedua tema**. Teal terang brand (±`#009EA6`) hanya 3,3 : 1 di latar putih, jadi di mode terang warna ini tidak boleh dipakai untuk teks ukuran normal. Untuk teks dan tautan di mode terang, pakai teal yang lebih tua.
- Desain mobile-first. Lebar layar minimum yang didukung 360 px.

### 13.3 Keamanan
- HTTPS di semua halaman, dengan Cloudflare di depan server sebagai proxy dan CDN.
- Security header: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, dan Permissions-Policy.
- Semua secret disimpan di environment variable dan tidak pernah di-commit ke repo.
- Server: login SSH hanya dengan key, firewall hanya membuka port 22, 80, dan 443, serta update keamanan otomatis.

### 13.4 Privasi (UU PDP)
- Persetujuan eksplisit lewat centang sebelum data dikirim.
- Data pribadi hanya bisa dilihat oleh peran Admin.
- **Masa simpan (default, bisa diubah setelah review legal):** data Leads disimpan 24 bulan sejak interaksi terakhir. Data Waitlist disimpan sampai 12 bulan setelah chatbot diluncurkan, atau sampai pemiliknya meminta penghapusan.
- Permintaan akses atau penghapusan data diterima lewat email publik dan dipenuhi secara manual oleh Admin.

### 13.5 Kompatibilitas browser
Dua versi terakhir Chrome, Safari (macOS dan iOS), Firefox, Edge, serta Chrome Android.

### 13.6 Keandalan
- Backup database harian otomatis ke Cloudflare R2, disimpan selama 14 hari. Proses restore diuji sebelum peluncuran.
- Uptime dipantau dari layanan eksternal, bukan dari VPS yang sama.

## 14. Arsitektur teknis

### 14.1 Stack
- **Aplikasi:** Next.js (App Router) + TypeScript; website publik dan admin custom berada dalam satu aplikasi modular monolith. Tidak menggunakan headless CMS.
- **Styling:** Tailwind CSS, dengan design system yang diturunkan dari identitas brand.
- **i18n:** next-intl untuk routing dan teks antarmuka; terjemahan konten disimpan per bahasa di database aplikasi.
- **Database:** PostgreSQL, dengan Drizzle ORM + node-postgres untuk akses data dan migration SQL yang direview.
- **Autentikasi:** Better Auth untuk password/session; kebijakan Admin/Editor, bootstrap operator, dan lockout akun diterapkan dan diuji oleh aplikasi. Signup publik ditutup.
- **Media:** Cloudflare R2 (kompatibel S3).
- **Email:** Resend.
- **Anti-spam:** Cloudflare Turnstile.
- **Analytics:** Umami Cloud.
- **Pemantauan error:** Sentry (paket gratis).
- **Repo:** `sineva-compro` (Git), terpisah dari repo chatbot.

Versi dependensi langsung dikunci (*pin*) dan hanya dinaikkan secara sengaja. Angka final library pengganti diperiksa terhadap registry, peer dependency, dan advisory pada awal implementasi; tidak menyalin pin transitif Payload sebagai baseline baru.

Detail batas modul, struktur folder, keamanan, dan transisi ada di [arsitektur](../architecture/README.md), [keputusan admin custom](../architecture/decisions/2026-10-14-custom-admin.md), dan [rencana CPR-7](../superpowers/plans/2026-10-14-cpr-7-foundation.md).

### 14.2 Infrastruktur: VPS + Coolify

```
Pengunjung ──► Cloudflare (DNS, proxy/CDN, Turnstile)
                    │
                    ▼
              VPS (Coolify)
              ├── Container Next.js + admin custom (production)
              ├── Container preview per PR      (staging)
              ├── PostgreSQL production
              └── PostgreSQL staging
                    │
                    ├──► Cloudflare R2 (media + backup DB)
                    ├──► Resend (email)
                    ├──► Umami Cloud (analytics)
                    └──► Sentry (error)
```

- **Spesifikasi minimum VPS:** 2 vCPU, 4 GB RAM, 80 GB SSD, region Jakarta atau Singapura, Ubuntu LTS. RAM 4 GB dibutuhkan karena build Next.js bisa gagal kehabisan memori di RAM 2 GB.
- **Deploy:** Coolify otomatis men-deploy branch `main` ke production.
- **Preview per PR:** dibuat lewat fitur preview deployment Coolify; setiap PR memakai database terisolasi pada instance PostgreSQL staging serta prefix media sendiri. Preview tidak memakai data pribadi production.
- **Lingkungan kerja:** lokal (Postgres via Docker Compose) → preview (per PR) → production.

### 14.3 CI (GitHub Actions)
Dijalankan pada setiap PR, berurutan: lint → typecheck → unit & integration test → build → E2E (Playwright, dengan service Postgres) → Lighthouse CI terhadap hasil build production.

PR hanya boleh di-merge ke `main` kalau semua tahap lulus.

## 15. Strategi testing

| Level | Cakupan minimum |
|---|---|
| **Unit** | pembuat tautan WhatsApp, pemetaan slug antarbahasa, normalisasi nomor telepon, validasi form |
| **Integrasi** | server action Leads/Waitlist (validasi, honeypot, Turnstile, rate limit, email gagal ≠ data hilang, duplikasi konkuren waitlist); session/peran (Editor ditolak membaca Leads/Waitlist dan mengelola Users), signup publik ditolak, lockout akun, migration bersih, draft terpisah dari konten publik |
| **E2E** | kirim form kontak → halaman terima kasih; pindah bahasa di halaman layanan dan artikel; tautan WhatsApp; waitlist; 404; pilihan tema setelah reload; login/logout admin, edit/publish/preview konten ID/EN, filter/status lead dan ekspor oleh Admin, menu serta akses Editor |
| **Kualitas** | Lighthouse CI (ambang §13.1); pemeriksaan axe di 5 halaman kunci, di mode terang dan gelap |
| **Manual (pra-luncur)** | uji di perangkat iOS dan Android, pengiriman email (SPF/DKIM), restore backup |

Di CI dan di lingkungan lokal, Turnstile memakai *test key* resmi Cloudflare, dan pengiriman email diganti dengan adapter tiruan (mock) yang mencatat email tanpa benar-benar mengirimnya. Email sungguhan hanya dikirim dari preview dan production.

## 16. Milestone

| Milestone | Isi | Bergantung pada |
|---|---|---|
| **M0 — Fondasi** | PRD final, domain, repo, penggantian fondasi Next.js tanpa CMS, database/migration, session dasar dan shell admin custom, CI, VPS + Coolify, DNS Cloudflare, Resend | keputusan domain dan provider VPS |
| **M1 — Konten & Desain** | arsitektur konten, copywriting ID/EN, design system dari brand (tema terang & gelap, varian logo), wireframe, desain UI | file brand |
| **M2 — Admin & Halaman** | schema dan form admin custom, peran/lockout, media, konten/pengaturan halaman, routing dua bahasa, mode terang & gelap publik, semua halaman, blog, portofolio | M0, M1 |
| **M3 — Lead & Integrasi** | form kontak, WhatsApp, waitlist, email, anti-spam, mini-CRM, analytics | M2 |
| **M4 — Konten & QA** | input konten final, SEO dan structured data, aksesibilitas, performa, E2E, uji perangkat | M3, showcase siap |
| **M5 — Launch** | domain live, Search Console, monitoring, uji restore backup, panduan admin | M4 |

Format tampilan tiket: **`CPR-{nomor} | [MODUL] Aksi`**. `CPR-{nomor}` diberikan otomatis oleh Linear; field judul hanya `[MODUL] Aksi` agar nomor tidak diduplikasi. Daftar modul: `PRD`, `Infra`, `Admin`, `I18n`, `Layout`, `Home`, `Services`, `Portfolio`, `Product`, `Blog`, `About`, `Contact`, `Lead`, `SEO`, `Analytics`, `Design`, `Content`, `QA`, `Launch`, `Docs`.

## 17. Ketergantungan dan risiko

| Risiko / ketergantungan | Dampak | Mitigasi |
|---|---|---|
| Copywriting dua bahasa jadi hambatan | Peluncuran tertunda | M1 dimulai paralel dengan M0. Claude menyusun draft ID/EN, Founder mereview |
| Demo showcase belum siap | Portofolio kosong | Bisa diluncurkan dengan minimal 2 item. Demo chatbot bisa menyusul tanpa perlu deploy ulang (konten dari admin custom) |
| Legalitas usaha belum ada | Footer dan Kebijakan Privasi belum lengkap | Field disembunyikan selama kosong. Kebijakan Privasi memakai nama "Sineva Tech" dan email kontak sampai badan usaha resmi terbentuk |
| Beban operasional VPS | Downtime atau kehilangan data | Backup otomatis + uji restore, uptime monitor eksternal, update keamanan otomatis |
| Spam di form | Inbox penuh, data kotor | Honeypot + Turnstile + rate limit |
| Penggantian fondasi Payload yang sudah dibuat | Bukti fondasi lama tidak membuktikan arsitektur baru | PR lama tetap draft, integrasi CMS diganti melalui CPR-7 dan diuji ulang; data developer tidak dihapus otomatis |
| Pengembangan admin custom | Form, hak akses, rich text, dan publikasi membutuhkan pekerjaan tambahan | Gunakan library autentikasi yang terawat; scope admin v1 eksplisit di §9; schema + query + UI + test berada dalam tiket pemilik yang sama |
| Perubahan versi Next.js/library aplikasi | Build rusak | Versi dikunci, upgrade lewat PR terpisah |
| Penggunaan logo warna asli di latar gelap | Tulisan logo tidak terbaca di mode gelap | Gunakan SVG varian dark mode di `assets/brand/logos/svg/`. Tracing logo dan varian terang sudah tersedia; Q7 terjawab |
| Setiap komponen harus dirancang dan diuji di dua tema | Pekerjaan desain dan QA bertambah | Warna hanya lewat token tema (tanpa hardcode), axe dijalankan di kedua tema |

## 18. Catatan keputusan

| # | Keputusan | Alternatif yang ditolak |
|---|---|---|
| D1 (Rev. 2) | Next.js dengan admin custom terintegrasi; data PostgreSQL; tanpa headless CMS | Payload/headless CMS (keputusan Rev. 1 digantikan); konten hanya di repo; CMS konvensional terpisah |
| D2 | Hosting VPS + Coolify | Vercel Pro + Neon |
| D3 | Ajakan utama: konsultasi jasa (WhatsApp + form) | waitlist chatbot sebagai ajakan utama; dua jalur setara |
| D4 | Dua bahasa ID + EN sejak v1 | Indonesia saja |
| D5 | Kredibilitas lewat showcase internal berlabel jelas | profil tim saja; diluncurkan tanpa portofolio |
| D6 (Rev. 2) | Form custom → server action tervalidasi → tabel Leads/Waitlist milik aplikasi | API CRUD publik untuk data pribadi; plugin Form Builder |
| D7 | Umami tanpa cookie, tanpa cookie banner | GA4 + cookie banner |
| D8 (Rev. 2) | Layout tetap di kode; isi di database dan diedit lewat admin custom | page builder blocks; file konten repo sebagai satu-satunya editor |
| D9 | Linear: satu team per produk (`CPR`, `CBT`) | satu team dengan prefix di judul |
| D10 | Mode terang & gelap. Bawaannya mengikuti sistem, dan pengunjung bisa menggantinya lewat tombol | hanya mode terang |
| D11 | Drizzle untuk data/migration dan Better Auth untuk autentikasi; kebijakan domain dan UI admin dimiliki aplikasi | Menulis hashing/session sendiri; membuat layanan admin terpisah untuk v1 |

## 19. Pertanyaan terbuka

| # | Pertanyaan | Penanggung jawab | Paling lambat |
|---|---|---|---|
| Q1 | Nama domain yang dibeli | Founder | sebelum M0 selesai |
| Q2 | Provider dan region VPS | Founder + developer | sebelum M0 selesai |
| Q3 | Nomor WhatsApp Business dan inbox email untuk lead | Founder | sebelum M3 |
| Q4 | Topik 2–3 showcase. Usulan: (a) chatbot FAQ & booking untuk klinik fiktif, butuh `CBT`; (b) dashboard pesanan WhatsApp untuk UMKM F&B; (c) website Sineva Tech ini sendiri sebagai studi kasus | Founder | awal M1 |
| Q5 | Desain UI dibuat di Figma dulu atau langsung di kode | Founder | awal M1 |
| Q6 | Siapa yang mereview teks Kebijakan Privasi dari sisi legal | Founder | sebelum M4 |

**Q7 terjawab — 14 Oktober 2026:** Founder mengonfirmasi tidak ada file vektor
dari pembuat logo. Logo telah di-trace ke SVG dan dimasukkan ke Figma, berikut
versi terang untuk dark mode. Path kedua varian identik; hanya warna yang berbeda.
Aset dan hasil pemeriksaan tersedia di [`assets/brand/logos/`](../../assets/brand/logos/README.md).
