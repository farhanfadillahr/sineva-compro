# CPR-15 | [Content] Outline konten Company Profile Sineva Tech

> **Superseded for v1 (PRD Rev. 3, 2026-10-15).** Page structure now follows [docs/design/page-patterns.md](../design/page-patterns.md). Content-sourcing rules in §19 (no invented facts) still apply.

**Status:** outline lengkap disetujui Founder pada 15 Oktober 2026. CPR-15 selesai. Persetujuan mencakup struktur dan arahan konten; copy final dan materi perusahaan tetap mengikuti tiket serta konfirmasi pada §19.

**Acuan:** [PRD Rev. 2](../prd/2026-10-14-company-profile-prd.md), [rancangan CPR-15](../superpowers/specs/2026-10-15-cpr-15-content-outline-design.md), [tiket CPR-15](https://linear.app/sineva-tech/issue/CPR-15/cpr-15-content-susun-outline-konten-per-halaman).

## 1. Cara menggunakan outline

Dokumen ini menentukan isi dan prioritas setiap bagian untuk wireframe CPR-20 dan copywriting CPR-19/21. Faishal tetap menentukan desain visual pada CPR-18; urutan di bawah mengikuti kebutuhan PRD dan dapat dikomposisikan saat wireframe tanpa menghilangkan bagian wajib.

Judul dalam tanda kutip adalah **judul kerja/usulan**, bukan copy final. Label sumber:

- **PRD:** kebutuhan atau fakta produk yang sudah disepakati.
- **Usulan:** arah pesan, judul, atau visual untuk direview.
- **Materi Founder:** fakta, aset, atau keputusan operasional yang harus diberikan sebelum publikasi.

Tujuan utama adalah konsultasi jasa, melalui Kontak atau WhatsApp. Waitlist chatbot menjadi tujuan sekunder. Website tidak menawarkan daftar harga atau akses ke produk chatbot yang sudah aktif. Nama brand tetap **Sineva Tech** pada kedua bahasa.

Outline ditulis dalam Indonesia; kolom URL EN menjadi acuan struktur terjemahan, bukan naskah Inggris final. Konten inti wajib lengkap ID/EN sebelum launch. Artikel dapat diterbitkan satu bahasa; jangan menampilkan konten Indonesia sebagai pengganti konten Inggris.

## 2. Pesan untuk tiga segmen

Ketiganya setara; tidak menyebut salah satu sebagai fokus eksklusif.

| Segmen                | Kebutuhan menurut PRD                                         | Arah pesan usulan                                                                                               | Bukti/materi yang diperlukan                                                                                                      | Arah CTA                                                              |
| --------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| UMKM dan bisnis lokal | Website, sistem sederhana, otomasi WhatsApp, kejelasan biaya. | Mulai dari kebutuhan usaha sehari-hari; jelaskan apa yang dibuat dan bagaimana dipakai dengan bahasa sederhana. | Demo internal berlabel; contoh deliverable dan ruang lingkup yang disetujui. Tidak menjanjikan kenaikan omzet.                    | Konsultasi Gratis → Kontak; WhatsApp konteks umum.                    |
| Perusahaan            | Sistem internal, integrasi, solusi AI, proses kerja jelas.    | Pahami alur kerja dan kebutuhan integrasi sebelum menentukan solusi.                                            | Contoh proses, ruang lingkup, dokumentasi dan proyek yang bisa diverifikasi. Tidak mengklaim sertifikasi atau kepatuhan tertentu. | Bahas kebutuhan sistem → Kontak; pilih layanan jika konteksnya jelas. |
| Startup               | MVP, mitra teknologi, kualitas teknis dan stack.              | Diskusikan prioritas produk dan ruang lingkup tahap awal yang realistis.                                        | Demo yang dapat dicoba dan keputusan teknis yang memang digunakan. Tidak menjanjikan durasi MVP sebelum scoping.                  | Diskusikan kebutuhan produk → Kontak.                                 |

Visual: ilustrasi usaha, alur tim, dan pengembangan produk yang setara secara bobot; tidak membutuhkan foto klien rekaan. Ilustrasi dekoratif memakai alt kosong; diagram informatif membutuhkan ringkasan makna dalam teks.

## 3. Elemen global

Berlaku pada semua halaman publik, termasuk halaman utilitas; admin menggunakan shell operasional sendiri.

| Bagian / referensi            | Tujuan dan isi                                                                                                                                  | CTA/tujuan                                                                                                               | Gambar, sumber dan kondisi                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header — FR-GLB-01            | Identitas dan akses Layanan, Portofolio, Produk, Blog, Tentang Kami; pilihan ID/EN dan tema; menu mobile. Tidak membutuhkan heading tersendiri. | Logo → Beranda; Konsultasi Gratis → Kontak. Bahasa → halaman padanan; artikel tanpa padanan → daftar blog bahasa tujuan. | Logo web yang sudah tersedia, alt mengidentifikasi Sineva Tech. Navigasi mengikuti locale aktif. Sumber: PRD dan aset brand.                                     |
| WhatsApp melayang — FR-GLB-02 | Jalur kontak cepat yang konsisten, dengan label aksesibel; tidak menutupi konten/form.                                                          | Nomor dari pengaturan situs; template umum/Web/AI/chatbot sesuai halaman dan bahasa.                                     | Ikon cukup; label menjelaskan tindakan. Nomor dan template final: Materi Founder.                                                                                |
| Footer — FR-GLB-03            | Ringkasan jasa, navigasi, dua layanan, email, WhatsApp, alamat, legalitas, sosial, Kebijakan Privasi, hak cipta.                                | Tautan internal mengikuti locale; email/sosial memakai tujuan terverifikasi.                                             | Logo asli. Alamat/legalitas kosong disembunyikan; tautan kontak/sosial yang belum ada tidak diisi data contoh. Sumber ringkasan: PRD; detail: Materi Founder.    |
| Tema — FR-GLB-05              | Pilihan terang/gelap dengan label status yang jelas, logo terbaca di kedua tema.                                                                | Kontrol tema di header/menu; tetap terjangkau di mobile.                                                                 | Tidak membutuhkan ilustrasi. Pilihan tersimpan; kunjungan awal mengikuti sistem dan transisi mengikuti reduced motion. Perilaku implementasi tetap tiket layout. |

Tidak membuat slogan, alamat, status legalitas, atau akun sosial seolah sudah terverifikasi. Padanan teks tombol, label dan pesan UI final masuk kamus ID/EN, terpisah dari konten halaman.

## 4. Beranda

**URL:** ID `/id` · EN `/en`. **Sumber:** PRD §7.2; pesan di bawah Usulan.

| Bagian / referensi              | Tujuan, judul kerja dan poin pesan                                                                                                                                     | CTA/tujuan                                                                 | Gambar/alt dan kondisi                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero — FR-HOME-01               | “Website dan otomasi untuk kebutuhan bisnis Anda”. Kenalkan dua jasa, manfaat yang dituju dan ajakan berdiskusi; hindari jargon serta janji hasil terukur.             | Konsultasi Gratis → Kontak; Lihat Layanan → daftar Layanan.                | Diagram orisinal website + alur input/proses/hasil. Alt menjelaskan diagram jika membawa informasi. Jangan gunakan screenshot produk yang belum ada. |
| Untuk siapa — FR-HOME-02        | “Untuk usaha dan tim yang ingin berkembang”. Tiga kartu UMKM, Perusahaan, Startup berisi masalah dan arah bantuan dari §2.                                             | Tautan konsultasi opsional → Kontak; jangan membuat halaman industri baru. | Ilustrasi setara, boleh dekoratif karena pesan ada dalam teks. Ketiga segmen selalu tersedia.                                                        |
| Layanan — FR-HOME-03            | “Dua layanan, sesuai kebutuhan Anda”. Ringkasan Web Development dan AI & Otomasi; jelaskan perbedaannya.                                                               | Setiap kartu → detail jasa yang sesuai.                                    | Ikon/diagram website dan otomasi; alt menjelaskan hanya bila informatif. Selalu tampil; konten dua bahasa wajib.                                     |
| Portofolio pilihan — FR-HOME-04 | “Lihat contoh pekerjaan kami”. Maksimal tiga item unggulan, ringkasan dan jenis proyek terlihat.                                                                       | Kartu → detail portofolio; Lihat semua → daftar Portofolio.                | Cover asli proyek, alt menjelaskan tampilan. Hanya konten terbit locale aktif; seluruh bagian disembunyikan bila kosong.                             |
| Proses — FR-HOME-05             | “Dari kebutuhan ke pengerjaan”. Konsultasi → Proposal → Pengerjaan → Pendampingan; satu poin aktivitas tiap langkah, tanpa janji waktu/dukungan yang belum disepakati. | Tidak perlu CTA tambahan; alur berakhir pada CTA penutup.                  | Diagram empat tahap, teks memuat urutannya; ornamen dekoratif tidak perlu alt informatif.                                                            |
| Chatbot — FR-HOME-06            | “Kenali rencana produk chatbot Sineva”. Label “Segera hadir”; produk dikembangkan terpisah; arah manfaat masih usulan dan harus dikonfirmasi.                          | Form waitlist sesuai §15; tautan detail → Produk Chatbot.                  | Ilustrasi konsep berlabel, bukan UI produk aktif. Tidak menawarkan coba gratis/login produk.                                                         |
| Artikel terbaru — FR-HOME-07    | “Catatan dan wawasan teknologi”. Tiga artikel terbaru dalam bahasa halaman.                                                                                            | Kartu → artikel; Semua artikel → Blog.                                     | Cover artikel terbit dengan alt kontekstual. Sembunyikan bagian jika tidak ada artikel pada locale aktif.                                            |
| CTA penutup — FR-HOME-08        | “Mari bahas kebutuhan Anda”. Ajak pengunjung menjelaskan kebutuhan atau bertanya saat belum yakin layanan.                                                             | Konsultasi Gratis → Kontak; WhatsApp konteks umum.                         | Tidak perlu gambar; ajakan tetap jelas tanpa dekorasi.                                                                                               |

Materi yang dibutuhkan: konfirmasi headline dan ringkasan jasa, konten showcase CPR-16/55, artikel terbit, serta rencana manfaat chatbot dari Founder/tim CBT.

## 5. Layanan — daftar

**URL:** ID `/id/layanan` · EN `/en/services`. **Referensi:** FR-SVC-01.

| Bagian      | Tujuan, judul kerja dan poin pesan                                                                                                        | CTA/tujuan                                                  | Gambar/alt, kondisi dan asal                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Pengantar   | “Pilih titik awal yang sesuai”. Jelaskan jasa custom ditentukan dari kebutuhan; dua layanan dapat dibahas bersama tanpa paket harga baru. | Belum yakin? → Kontak dengan pilihan layanan “Belum yakin”. | Tanpa gambar; Usulan dari dua jasa pada PRD.                                                    |
| Dua layanan | Kartu Web Development dan AI & Otomasi: masalah utama, ringkasan hasil pekerjaan dan sasaran penggunaan.                                  | Pelajari layanan → detail masing-masing.                    | Ikon atau diagram orisinal; semua informasi inti juga dalam teks. Keduanya wajib lengkap ID/EN. |

## 6. Layanan — Web Development

**URL:** ID `/id/layanan/web-development` · EN `/en/services/web-development`.
**Referensi:** FR-SVC-02–04. **CTA utama:** ID `/id/kontak?layanan=web-development`; EN `/en/contact?layanan=web-development`.

| Bagian       | Tujuan, judul kerja dan poin pesan                                                                                                                                                                      | CTA/tujuan                                                           | Gambar/alt, kondisi dan asal                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Pengantar    | “Website yang mendukung kebutuhan bisnis”. Arahkan pembaca dari kebutuhan ke ruang lingkup website/aplikasi web yang dibahas.                                                                           | Konsultasi Gratis → CTA utama; WhatsApp konteks Web Development.     | Ilustrasi halaman website berlabel konsep atau screenshot karya nyata. Usulan; bukan portofolio tersirat.                      |
| Masalah      | “Apa yang ingin Anda perbaiki?”. Kandidat: informasi usaha sulit ditemukan, website tidak menjelaskan layanan, pengelolaan konten menyulitkan, kebutuhan sistem web baru.                               | Tidak perlu CTA; mengantar ke deliverable.                           | Tanpa gambar; poin berdasarkan kebutuhan PRD, relevansinya dikonfirmasi Founder.                                               |
| Yang didapat | “Ruang lingkup yang disepakati bersama”. Kandidat deliverable: struktur halaman, tampilan responsif, pengembangan fitur, pengelolaan konten bila diperlukan, dokumentasi/serah terima.                  | Tidak perlu CTA terpisah.                                            | Skema halaman → admin → tampilan publik, label “Ilustrasi alur”. Daftar ini usulan layanan, bukan paket yang sudah dijanjikan. |
| Proses       | Konsultasi → Proposal → Pengerjaan → Pendampingan; jelaskan kebutuhan materi, review pekerjaan dan serah terima secara singkat.                                                                         | Tidak perlu CTA tambahan.                                            | Diagram empat tahap, urutan ada di teks. Batas revisi/dukungan menunggu Founder.                                               |
| Teknologi    | “Teknologi mengikuti kebutuhan”. Kelompokkan frontend, backend dan penyimpanan; tampilkan hanya kompetensi yang dikonfirmasi. Stack Compro bukan bukti seluruh layanan memakai stack yang sama.         | Tidak perlu CTA.                                                     | Logo teknologi hanya setelah daftar terverifikasi; nama teks cukup.                                                            |
| FAQ          | Pertanyaan: materi apa yang perlu disiapkan, bagaimana ruang lingkup/biaya ditentukan, apakah website bisa diperbarui, bagaimana tahapan review dan dukungan. Jawaban final menunggu kebijakan layanan. | Ajak bertanya lewat CTA penutup, tidak menambah tombol tiap jawaban. | Tanpa gambar. Jawaban terlihat harus sama dengan konten FAQPage; implementasi structured data pada tiket SEO.                  |
| Penutup      | “Ceritakan kebutuhan website Anda”. Ringkas langkah awal tanpa kepastian harga/durasi sebelum konsultasi.                                                                                               | CTA utama dan WhatsApp konteks Web Development.                      | Tidak perlu gambar.                                                                                                            |

## 7. Layanan — AI & Otomasi

**URL:** ID `/id/layanan/ai-otomasi` · EN `/en/services/ai-automation`.
**Referensi:** FR-SVC-02–04. **CTA utama:** ID `/id/kontak?layanan=ai-automation`; EN `/en/contact?layanan=ai-automation`. Nilai query adalah identitas layanan, bukan terjemahan slug; gunakan kontrak yang sama pada tiket form.

| Bagian       | Tujuan, judul kerja dan poin pesan                                                                                                                                | CTA/tujuan                                                    | Gambar/alt, kondisi dan asal                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Pengantar    | “Mulai dari alur kerja yang ingin dipermudah”. Jelaskan bahwa otomasi dan solusi AI disesuaikan kebutuhan; bukan selalu chatbot dan bukan akses ke produk CBT.    | Konsultasi Gratis → CTA utama; WhatsApp konteks AI & Otomasi. | Diagram input → proses → hasil dengan label “Ilustrasi alur”.                                                  |
| Masalah      | “Pekerjaan berulang yang menyita perhatian”. Kandidat: input data berulang, informasi tersebar, tindak lanjut manual, kebutuhan integrasi.                        | Tidak perlu CTA.                                              | Diagram opsional, teks menjelaskan masalah. Usulan; tanpa klaim penghematan jam/persen.                        |
| Yang didapat | “Alur yang dirancang sesuai kebutuhan”. Kandidat: pemetaan proses, rancangan integrasi, workflow otomasi/AI bila sesuai, pengujian dan panduan penggunaan.        | Tidak perlu CTA tambahan.                                     | Skenario contoh form masuk → data ditata → notifikasi tim. Tegaskan konsep, bukan integrasi yang sudah dijual. |
| Proses       | Empat tahap PRD; jelaskan pemahaman data/akses, penetapan batas solusi, review hasil dan pendampingan.                                                            | Tidak perlu CTA.                                              | Diagram empat tahap; jangan menjanjikan AI menggantikan keputusan manusia.                                     |
| Teknologi    | “Integrasi mengikuti sistem yang Anda gunakan”. Bahas kategori API, workflow, model AI dan penyimpanan sesuai kebutuhan.                                          | Tidak perlu CTA.                                              | Tidak mencantumkan vendor/logo atau jaminan dukungan integrasi sebelum Founder mengonfirmasi.                  |
| FAQ          | Pertanyaan: apakah perlu memakai AI, sistem apa yang dapat diintegrasikan, data/akses apa yang dibutuhkan, bagaimana hasil diuji, bagaimana pemeliharaan dibahas. | Pertanyaan lanjutan → CTA penutup.                            | Tanpa gambar. Jawaban dan FAQPage konsisten; tidak mengarang kebijakan privasi layanan.                        |
| Penutup      | “Bahas proses yang ingin Anda permudah”. Ajak membawa contoh alur saat konsultasi.                                                                                | CTA utama dan WhatsApp konteks AI & Otomasi.                  | Tidak perlu gambar.                                                                                            |

Seluruh kandidat deliverable, teknologi, dan jawaban layanan adalah **Usulan**. Founder perlu mengonfirmasi kemampuan, batas pekerjaan dan kebijakan sebelum CPR-19 menulis copy final.

## 8. Portofolio — daftar

**URL:** ID `/id/portofolio` · EN `/en/portfolio`. **Referensi:** FR-PF-01 dan FR-PF-03.

| Bagian               | Tujuan, judul kerja dan poin pesan                                                                                                             | CTA/tujuan                                     | Gambar/alt, kondisi dan asal                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Pengantar dan filter | “Jelajahi contoh pekerjaan Sineva”. Jelaskan beda showcase internal dan proyek klien. Filter Semua / Web / AI; UI diterjemahkan sesuai locale. | Filter mengubah daftar pada halaman yang sama. | Tidak memerlukan hero gambar.                                                             |
| Grid karya           | Judul, ringkasan, jenis proyek, layanan terkait. Showcase wajib berlabel “Proyek demo internal”; jangan menyebut nama klien yang tidak ada.    | Kartu → detail portofolio pada bahasa aktif.   | Cover dari proyek nyata, alt menggambarkan layar/fitur. Hanya versi terbit.               |
| Kondisi kosong       | Jelaskan belum ada karya pada daftar/filter yang dipilih, tanpa kartu fiktif.                                                                  | Reset filter → Semua; konsultasi → Kontak.     | Tanpa gambar. Kondisi pengembangan ini tidak menggugurkan syarat launch minimal dua item. |

Sumber karya: CPR-16 menentukan topik; CPR-55 memasukkan materi. Tidak menetapkan judul showcase atau hasil proyek dalam CPR-15.

## 9. Portofolio — template detail

**URL:** ID `/id/portofolio/[slug]` · EN `/en/portfolio/[slug]`. **Referensi:** FR-PF-02–03.

| Bagian                | Tujuan, judul kerja dan poin pesan                                                                                                | CTA/tujuan                                                                      | Gambar/alt, kondisi dan asal                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Ringkasan             | Judul proyek, ringkasan, jenis proyek dan konteks. Label demo internal dekat judul, tetap terlihat pada kedua bahasa.             | Lihat demo → URL demo valid, tab baru dengan petunjuk; opsional jika tersedia.  | Cover asli; alt menyebut tampilan proyek. Materi pemilik proyek, bukan ilustrasi AI yang menyerupai bukti. |
| Tantangan             | Jelaskan masalah atau skenario yang diuji. Pada showcase gunakan skenario internal, bukan kisah klien tersirat.                   | Tidak perlu CTA.                                                                | Diagram kondisi awal jika diperlukan, alt menjelaskan alur.                                                |
| Solusi                | Uraikan pendekatan dan fitur yang benar-benar dibuat; hubungkan dengan masalah.                                                   | Tidak perlu CTA.                                                                | Screenshot dan galeri asli, caption/alt per layar. Hilangkan galeri tambahan bila tidak tersedia.          |
| Hasil                 | Ceritakan hasil yang dapat dibuktikan: fitur berjalan, alur teruji, tautan demo. Angka hanya dengan metode dan sumber yang jelas. | Tautan demo opsional bila tersedia.                                             | Bukti asli; tanpa before/after atau persentase rekaan.                                                     |
| Teknologi dan layanan | Stack yang benar dipakai; kaitkan ke Web Development atau AI & Otomasi sesuai data proyek.                                        | Layanan terkait → detail layanan.                                               | Nama teknologi cukup; logo opsional.                                                                       |
| Penutup               | “Punya kebutuhan serupa?”. Ajak membahas kebutuhan, tanpa menjanjikan hasil yang identik.                                         | Kontak dengan layanan terkait bila satu layanan jelas; WhatsApp konteks sesuai. | Tidak perlu gambar.                                                                                        |

Konten detail yang belum terbit atau locale-nya tidak tersedia tidak ditampilkan sebagai halaman publik buatan; akses langsung mengikuti 404 yang disepakati. Konten inti portofolio tetap wajib lengkap dua bahasa sebelum launch.

## 10. Produk Chatbot

**URL:** ID `/id/produk/chatbot` · EN `/en/products/chatbot`. **Referensi:** FR-PRD-01.

| Bagian                  | Tujuan, judul kerja dan poin pesan                                                                                                | CTA/tujuan                                                                        | Gambar/alt, kondisi dan asal                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Status dan nilai utama  | “Chatbot Sineva — Segera hadir”. Jelaskan rencana nilai produk untuk bisnis dengan bahasa sederhana; produk belum tersedia.       | Gabung waitlist → form pada halaman. WhatsApp menggunakan konteks Produk Chatbot. | Ilustrasi konsep berlabel. Materi manfaat spesifik dari Founder/tim CBT.                                          |
| Fitur yang direncanakan | Kelompokkan kandidat kemampuan setelah tim CBT mengonfirmasi; setiap poin ditandai sebagai rencana, bukan fitur aktif.            | Tidak perlu CTA per fitur.                                                        | Diagram konsep opsional. Jangan mengarang kanal integrasi, model AI, harga, tanggal rilis atau screenshot produk. |
| Waitlist                | “Dapatkan kabar saat produk siap”. Jelaskan pendaftaran minat tidak memberikan akses produk sekarang.                             | Form §15; sukses tetap di konteks waitlist, bukan halaman terima kasih kontak.    | Tanpa gambar.                                                                                                     |
| FAQ                     | Pertanyaan: apakah sudah tersedia, bagaimana mendapat kabar, apakah ada tanggal peluncuran, bagaimana data pendaftaran digunakan. | Tautan Kebijakan Privasi dan kontak bila perlu.                                   | Jawaban yang belum dikonfirmasi dicatat sebagai kebutuhan materi, bukan ditampilkan sebagai kepastian.            |

Produk tetap proyek terpisah; halaman ini tidak menyediakan widget chatbot atau demo fungsional.

## 11. Blog — daftar

**URL:** ID `/id/blog` · EN `/en/blog`. **Referensi:** FR-BLOG-01 dan FR-BLOG-04.

| Bagian                 | Tujuan, judul kerja dan poin pesan                                                                                                          | CTA/tujuan                                                            | Gambar/alt, kondisi dan asal                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Pengantar dan kategori | “Wawasan untuk keputusan teknologi”. Ringkasan jenis tulisan; kategori diambil dari data terbit, bukan kategori rekaan yang dianggap final. | Filter lewat `?kategori=`; halaman tetap Blog.                        | Tidak perlu gambar hero.                                                                           |
| Daftar dan paginasi    | Judul, ringkasan, cover dan metadata relevan; sembilan artikel per halaman.                                                                 | Kartu → artikel; navigasi halaman → daftar berikut/sebelumnya.        | Cover artikel, alt sesuai isi. Hanya bahasa aktif; canonical filter tetap daftar utama sesuai PRD. |
| Kondisi kosong         | Belum ada artikel dalam bahasa/kategori ini; jangan otomatis menampilkan artikel bahasa lain.                                               | Reset kategori → daftar utama; Beranda bila daftar seluruhnya kosong. | Tanpa gambar. Tidak membutuhkan kartu placeholder publik.                                          |

## 12. Blog — template artikel

**URL:** ID `/id/blog/[slug]` · EN `/en/blog/[slug]`. **Referensi:** FR-BLOG-02–04.

| Bagian          | Tujuan, judul kerja dan poin pesan                                                                                            | CTA/tujuan                                                                                   | Gambar/alt, kondisi dan asal                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Pembuka         | Judul, cover, penulis, tanggal terbit, estimasi waktu baca dan konteks tulisan.                                               | Kategori/Blog → daftar relevan.                                                              | Cover berlisensi atau buatan tim; kredit bila perlu dan alt sesuai gambar. Metadata dari artikel nyata.    |
| Isi             | Pembuka → uraian/solusi → rangkuman sesuai topik; dukung heading, daftar, tautan, gambar, kutipan dan blok kode bila relevan. | Tautan sumber dan bacaan lanjutan yang memang mendukung isi; CTA layanan hanya bila relevan. | Gambar/caption/alt per aset; contoh kode atau kutipan bersumber. Tidak perlu menulis artikel di tiket ini. |
| Bagikan         | Label tindakan jelas dan pemberitahuan salin berhasil.                                                                        | WhatsApp, LinkedIn, salin tautan ke artikel aktif.                                           | Ikon dekoratif dilengkapi label.                                                                           |
| Artikel terkait | Maksimal tiga artikel terbit kategori sama pada bahasa aktif; tampilkan sebanyak yang tersedia.                               | Kartu → artikel terkait.                                                                     | Cover asli. Sembunyikan bagian bila tidak ada artikel terkait; jangan menduplikasi artikel saat ini.       |

Artikel tanpa padanan bahasa tidak menampilkan terjemahan palsu; switch bahasa menuju daftar Blog bahasa tujuan. Artikel tidak terbit/tidak tersedia di URL langsung mengikuti 404.

## 13. Tentang Kami

**URL:** ID `/id/tentang-kami` · EN `/en/about`. **Referensi:** FR-ABT-01–02.

| Bagian            | Tujuan, judul kerja dan poin pesan                                                                                                                       | CTA/tujuan                        | Gambar/alt, kondisi dan asal                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Cerita            | “Kenali Sineva Tech”. Jelaskan jasa Web Development, AI & Otomasi dan arah produk SaaS. Kisah pendirian, tahun dan pengalaman memerlukan materi Founder. | Lihat Layanan → daftar Layanan.   | Foto tim/aktivitas asli jika tersedia; jangan memakai foto stok sebagai tim Sineva.                                  |
| Visi, misi, nilai | Calon tema: solusi yang relevan, komunikasi jelas, pengerjaan yang dapat ditinjau. Ini arah usulan; pernyataan resmi ditentukan Founder.                 | Tidak perlu CTA per nilai.        | Teks cukup; ikon boleh dekoratif. Jangan mengklaim budaya/rekam jejak tanpa fakta.                                   |
| Tim               | Nama, jabatan dan bio sesuai data yang disetujui untuk publikasi.                                                                                        | Tidak membutuhkan CTA personal.   | Foto asli dengan persetujuan; alt nama/profil sesuai konteks. Tampil hanya jika pengaturan mengizinkan dan data ada. |
| Penutup           | “Mari kenali kebutuhan Anda”. Hubungkan cerita ke konsultasi jasa.                                                                                       | Kontak dan WhatsApp konteks umum. | Tidak perlu gambar.                                                                                                  |

## 14. Kontak dan terima kasih

### 14.1 Kontak

**URL:** ID `/id/kontak` · EN `/en/contact`. **Referensi:** FR-CTC-01 dan FR-LEAD-01–13.

| Bagian            | Tujuan, judul kerja dan poin pesan                                                                                                                  | CTA/tujuan                                                                    | Gambar/alt, kondisi dan asal                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Pengantar         | “Ceritakan kebutuhan Anda”. Terima pembaca yang sudah tahu layanan maupun yang masih mencari arah. Hindari janji balasan dalam jumlah jam tertentu. | Isi form pada halaman; WhatsApp konteks sesuai layanan bila sudah dipilih.    | Tanpa gambar agar form jelas.                                            |
| Form              | Kumpulkan informasi yang diperlukan untuk konsultasi; field dan state di bawah. Persetujuan jelas dan tidak tercentang otomatis.                    | Kirim kebutuhan → penyimpanan lead, lalu URL terima kasih setelah sukses.     | Tidak memerlukan gambar.                                                 |
| Kontak alternatif | Email, WhatsApp, jam operasional; alamat bila sudah diisi. Tidak menawarkan booking call sebagai fitur v1.                                          | Email publik dan WhatsApp terverifikasi; Privasi → halaman Kebijakan Privasi. | Ikon dekoratif; detail dari Materi Founder. Alamat kosong disembunyikan. |

| Field               | Wajib | Arahan isi/helper                                                                                                   |
| ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------- |
| Nama                | Ya    | Nama orang yang dapat dihubungi.                                                                                    |
| Email               | Ya    | Alamat email untuk tindak lanjut; format divalidasi.                                                                |
| Nomor WhatsApp      | Ya    | Nomor aktif; normalisasi server ke format `62…` sesuai PRD.                                                         |
| Nama perusahaan     | Tidak | Tidak menghalangi individu/startup mengirim.                                                                        |
| Jenis bisnis        | Ya    | UMKM / Perusahaan / Startup / Lainnya.                                                                              |
| Layanan diminati    | Ya    | Web Development / AI & Otomasi / Belum yakin. Prefill URL boleh dipilih ulang.                                      |
| Perkiraan budget    | Tidak | < Rp10 jt / Rp10–50 jt / Rp50–150 jt / > Rp150 jt / Belum tahu. Ini informasi kebutuhan, bukan daftar harga Sineva. |
| Kebutuhan           | Ya    | Arahkan menjelaskan masalah/tujuan, minimal 20 karakter.                                                            |
| Persetujuan Privasi | Ya    | Persetujuan eksplisit dengan tautan Kebijakan Privasi; naskah final mengikuti CPR-17.                               |

| Kondisi form                       | Arahan pesan dan tindakan                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Awal                               | Label dan field opsional/wajib jelas; layanan dapat terisi dari konteks.                                                            |
| Validasi gagal                     | Pesan dekat field dalam bahasa halaman; jelaskan cara memperbaiki, isian tidak hilang.                                              |
| Sedang mengirim                    | Indikasi proses dengan label jelas; hindari kiriman tidak sengaja berulang.                                                         |
| Data berhasil tersimpan            | Arahkan ke Terima kasih. Jangan menyatakan email sudah diterima ketika sistem hanya mengetahui data tersimpan.                      |
| Email gagal setelah data tersimpan | Tetap alur sukses; jangan meminta pengunjung mengirim ulang. Penanganan operasional tetap tiket email.                              |
| Penyimpanan gagal                  | Sampaikan belum berhasil, pertahankan isian, sediakan coba lagi dan WhatsApp sebagai cadangan.                                      |
| Verifikasi/rate limit gagal        | Arahan mencoba verifikasi lagi atau menunggu sesuai hasil server; WhatsApp sebagai alternatif. Jangan menjanjikan bypass anti-spam. |
| Honeypot                           | Tidak membuat pesan khusus yang mengungkap deteksi bot; perilaku server mengikuti PRD.                                              |

### 14.2 Terima kasih

**URL:** ID `/id/kontak/terima-kasih` · EN `/en/contact/thank-you`. **Referensi:** FR-CTC-02.

| Bagian     | Tujuan, judul kerja dan poin pesan                                                                                                                  | CTA/tujuan                                                                       | Gambar/alt, kondisi dan asal                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Konfirmasi | “Terima kasih, kebutuhan Anda sudah tercatat”. Dipakai pada alur kiriman kontak sukses; jelaskan langkah berikutnya tanpa SLA yang belum disetujui. | WhatsApp konteks umum/layanan yang diketahui; Kembali ke Beranda → locale aktif. | Ikon sukses dekoratif cukup. Jangan menampilkan detail lead atau mengklaim email terkirim. Halaman tidak diindeks sesuai PRD. |

Copy harus membedakan sukses kontak dari sukses waitlist; keberadaan URL terima kasih sendiri bukan bukti kiriman baru berhasil.

## 15. Waitlist — pola bersama

**Lokasi:** Beranda dan Produk Chatbot. **Referensi:** FR-WL-01–03. Satu kontrak isi untuk dua lokasi, dengan konteks halaman asal yang sesuai.

| Elemen              | Arahan isi                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Pengantar           | Produk “Segera hadir”; ajak mendapat kabar saat siap, tanpa tanggal atau janji akses.                                                           |
| Email               | Wajib, label jelas; tidak menampilkan alamat orang lain.                                                                                        |
| Jenis bisnis        | Opsional; gunakan pilihan bisnis yang konsisten dengan form kontak.                                                                             |
| Persetujuan         | Wajib, eksplisit, tautan Kebijakan Privasi; tidak tercentang otomatis.                                                                          |
| CTA                 | “Gabung waitlist”; tindakan pendaftaran minat, bukan pembelian atau aktivasi akun chatbot.                                                      |
| Validasi/pengiriman | Pesan field dan status mengirim pada bahasa aktif. Data gagal disimpan → tetap simpan isian dan beri cara mencoba lagi.                         |
| Sukses/duplikasi    | Pesan sukses yang sama untuk email baru dan email yang sudah terdaftar; tidak mengungkap keanggotaan. Tidak mengalihkan ke terima kasih kontak. |
| Anti-spam           | Honeypot, Turnstile dan rate limit sama dengan kontak; teks error mengikuti kondisi server.                                                     |
| Administrasi        | Ekspor CSV hanya Admin; bukan CTA publik atau materi marketing.                                                                                 |

## 16. Kebijakan Privasi

**URL:** ID `/id/kebijakan-privasi` · EN `/en/privacy-policy`. **Referensi:** FR-PRV-01; PRD §13.4.
Ini kerangka editorial berdasarkan PRD, bukan naskah hukum final atau pernyataan bahwa praktik production sudah diverifikasi. Naskah final ditangani CPR-17.

| Bagian / judul kerja          | Poin yang harus dijelaskan                                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identitas dan tanggal berlaku | Pihak pengelola dan kontak publik yang benar; identitas legal hanya setelah dikonfirmasi.                                                                                                                              |
| Data yang dikumpulkan         | Field kontak dan waitlist; metadata operasional sesuai sistem nyata. Konfirmasi pemakaian analytics/anti-spam sebelum mendeskripsikannya.                                                                              |
| Tujuan penggunaan             | Konsultasi/tindak lanjut dan kabar produk sesuai persetujuan; jangan menambah penggunaan pemasaran yang tidak disepakati.                                                                                              |
| Akses dan layanan pendukung   | Siapa yang mengakses data dan layanan yang benar-benar memprosesnya; akses internal data lead/waitlist sesuai peran Admin.                                                                                             |
| Masa simpan                   | Catat default PRD: lead 24 bulan sejak interaksi terakhir; waitlist sampai 12 bulan setelah peluncuran atau permintaan penghapusan. Default ini menunggu review legal/kesesuaian operasional, bukan kesimpulan CPR-15. |
| Hak dan permintaan            | Cara meminta akses/penghapusan melalui email publik dan penanganan manual oleh Admin menurut PRD.                                                                                                                      |
| Perubahan dan kontak          | Tanggal berlaku/perubahan dan kontak permintaan yang dikonfirmasi.                                                                                                                                                     |

CTA hanya tautan email permintaan serta navigasi, bukan promosi. Tidak memerlukan gambar. Konten inti dua bahasa dan kontak valid wajib tersedia sebelum publikasi.

## 17. Halaman 404

**URL:** rute tidak ditemukan dalam konteks locale ID/EN; bukan URL marketing baru. **Referensi:** FR-GLB-04.

Judul kerja: “Halaman belum ditemukan”. Pesan singkat bahwa alamat mungkin tidak tersedia; jangan menebak alasan spesifik. Tautan pemulihan: Beranda, Layanan, Kontak, semuanya pada bahasa aktif. Tidak membutuhkan gambar; ilustrasi dekoratif opsional dan tidak menggantikan petunjuk. Tidak menampilkan konten detail draft atau bahasa lain untuk mengisi kekosongan.

## 18. Admin

**URL:** `/admin` beserta login/dashboard yang sudah ada; hanya antarmuka Indonesia. Dicatat untuk kelengkapan sitemap. Tujuannya operasional autentikasi dan pengelolaan konten/lead berdasarkan peran, tanpa hero marketing, materi promosi, signup publik, atau terjemahan UI EN. Teks operasional terperinci tetap tiket admin; CPR-15 tidak mengubah alur atau kewenangan.

## 19. Data Founder dan keputusan sebelum copy final

| Materi/keputusan                                                      | Pemilik/tiket lanjutan                                            | Dampak jika belum tersedia                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Headline, ringkasan dua layanan, kandidat deliverable/teknologi/FAQ   | Founder; CPR-19/21                                                | Tetap arahan kerja, tidak diterbitkan sebagai janji layanan.                                   |
| Batas revisi, pendampingan, estimasi dan komunikasi konsultasi        | Founder                                                           | Tidak mengisi angka, durasi atau jaminan sendiri. Empat tahap proses tetap sesuai PRD.         |
| WhatsApp, email publik/inbox, jam operasional, sosial                 | Founder; CPR-29/54                                                | Kontak final harus diverifikasi sebelum launch; jangan menaruh data contoh di publik.          |
| Cerita pendirian, visi/misi/nilai, bio/foto tim dan izin publikasinya | Founder/tim; CPR-28/54                                            | Copy Tentang dan bagian Tim belum final; tim bisa disembunyikan sesuai pengaturan.             |
| Alamat dan legalitas                                                  | Founder; CPR-29                                                   | Sembunyikan bila kosong, jangan mengarang.                                                     |
| Topik, demo, aset dan bukti hasil showcase                            | Founder; CPR-16/55                                                | Bagian dinamis boleh kosong selama pengembangan; minimal dua karya terbit tetap syarat launch. |
| Rencana manfaat/fitur chatbot dan jawaban FAQ                         | Founder/tim CBT                                                   | Tidak mengiklankan fitur/harga/tanggal sebagai sudah pasti.                                    |
| Artikel, kategori, cover, penulis, kredit sumber                      | Tim konten; CPR-31/54                                             | Blog memakai empty state dan bagian artikel Beranda disembunyikan bila belum ada konten.       |
| Naskah privasi dan verifikasi kebijakan data nyata                    | Founder; CPR-17                                                   | Outline topik saja; persetujuan dan kebijakan final belum dianggap selesai.                    |
| Desain sistem, wireframe, UI final                                    | Faishal pada CPR-18; penanggung jawab CPR-20/22 sesuai assignment | Outline memberi kebutuhan isi; tidak menetapkan layout/gerak/komponen visual final.            |

Tidak ada pertanyaan bisnis yang menghalangi review **struktur** outline; materi di atas merupakan masukan sebelum copy final/publikasi. Jangan memperlakukan kekosongan data sebagai izin untuk membuat fakta sendiri.

## 20. Matriks cakupan dan handoff

| Cakupan PRD                                    | Lokasi outline     |
| ---------------------------------------------- | ------------------ |
| §3 tiga segmen setara                          | §2                 |
| §6 seluruh sitemap, URL ID/EN, admin           | §4–18              |
| FR-GLB-01–03 dan FR-GLB-05                     | §3                 |
| FR-GLB-04                                      | §17                |
| FR-HOME-01–08                                  | §4                 |
| FR-SVC-01                                      | §5                 |
| FR-SVC-02–04                                   | §6–7               |
| FR-PF-01–03                                    | §8–9               |
| FR-PRD-01                                      | §10                |
| FR-BLOG-01–04                                  | §11–12             |
| FR-ABT-01–02                                   | §13                |
| FR-CTC-01–02                                   | §14                |
| FR-PRV-01                                      | §16                |
| FR-LEAD-01–03                                  | §3, §6–7, §10, §14 |
| FR-LEAD-04–13                                  | §14–15             |
| FR-WL-01–03                                    | §15                |
| §10 dua bahasa, ketiadaan fallback dan padanan | §1, §3, §9, §11–12 |
| Materi yang memerlukan konfirmasi              | §19                |

Pemeriksaan penulis:

- [x] Lima belas entri sitemap PRD §6 terwakili, termasuk dua detail layanan, template detail dinamis, 404 dan admin.
- [x] Semua kelompok kebutuhan halaman/global PRD §7 memiliki rujukan.
- [x] Dua layanan dan tiga segmen dibedakan; chatbot tetap produk mendatang terpisah.
- [x] CTA memiliki tujuan; kebutuhan gambar, empty state dan sumber materi dicatat.
- [x] Usulan dan materi belum tersedia dibedakan dari fakta produk.
- [x] URL dan aturan bahasa diperiksa terhadap PRD dan registry CPR-25.
- [x] Founder menyetujui outline lengkap ini pada 15 Oktober 2026.

**Handoff:** CPR-20 memakai outline untuk wireframe; CPR-19 menulis copy final Indonesia; CPR-21 menulis padanan Inggris; CPR-17 menyusun naskah privasi; CPR-54/55 memasukkan materi final. Persetujuan outline tidak menyelesaikan tiket-tiket tersebut. CPR-15 selesai setelah review dan persetujuan Founder.
