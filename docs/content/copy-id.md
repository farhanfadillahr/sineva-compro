# CPR-19 | [Content] Copywriting Bahasa Indonesia

**Status:** draft untuk review Founder, 15 Oktober 2026. Bukan naskah final yang sudah disetujui. Data perusahaan, kemampuan layanan spesifik, proyek, artikel dan rencana fitur chatbot masih memerlukan materi/konfirmasi.

**Acuan:** [outline yang disetujui](outline.md), [PRD Rev. 2](../prd/2026-10-14-company-profile-prd.md), [metadata ID](seo-id.json), [CPR-19](https://linear.app/sineva-tech/issue/CPR-19/cpr-19-content-copywriting-bahasa-indonesia).

**Informasi Founder:** pada 15 Oktober 2026, Founder menyatakan profil/visi-misi, email publik, dan fitur chatbot belum tersedia. Founder mengonfirmasi nomor WhatsApp publik **085199368510**. Visi/misi di bawah tetap usulan, bukan fakta perusahaan yang telah disetujui.

## 1. Panduan pemakaian

Gunakan bahasa “kami” untuk Sineva Tech dan “Anda” untuk pengunjung. Nama layanan publik konsisten: **Web Development** dan **AI & Otomasi**. Hindari janji durasi, harga, kapasitas integrasi, keamanan atau hasil bisnis yang belum disetujui.

Teks dalam tabel **Naskah** merupakan usulan copy untuk review. Keterangan **Catatan internal** tidak masuk halaman publik. Variabel `{{...}}` adalah kontrak pengisian data, bukan teks yang boleh terlihat di website; field yang belum memiliki nilai harus menahan publikasi bagian terkait atau mengikuti aturan sembunyi pada outline.

Struktur mengikuti outline §3–18. Dokumen ini tidak mengubah UI, Figma, database atau kamus aplikasi. Bagian privasi adalah pengantar; isi kebijakan final tetap CPR-17. Artikel dan kasus portofolio membutuhkan materi asli; template bukan konten final karya yang sudah terbit.

## 2. Global dan pengaturan situs

| Elemen                      | Naskah                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Nama publik                 | Sineva Tech                                                                                                                          |
| Ringkasan perusahaan/footer | Sineva Tech menyediakan layanan Web Development serta AI & Otomasi. Ceritakan kebutuhan Anda, lalu kita bahas langkah pengerjaannya. |
| Navigasi                    | Layanan · Portofolio · Produk · Blog · Tentang Kami                                                                                  |
| CTA utama                   | Konsultasi Gratis                                                                                                                    |
| CTA WhatsApp                | Hubungi via WhatsApp                                                                                                                 |
| Label WhatsApp melayang     | Konsultasi lewat WhatsApp                                                                                                            |
| Label bahasa                | Bahasa                                                                                                                               |
| Pilihan bahasa              | Indonesia · English                                                                                                                  |
| Label tema                  | Tema tampilan                                                                                                                        |
| Tindakan tema               | Gunakan tema gelap · Gunakan tema terang                                                                                             |
| Menu mobile                 | Buka menu · Tutup menu                                                                                                               |
| Footer layanan              | Layanan Kami                                                                                                                         |
| Footer kontak               | Hubungi Kami                                                                                                                         |
| Footer sosial               | Temukan Kami                                                                                                                         |
| Tautan privasi              | Kebijakan Privasi                                                                                                                    |
| Hak cipta                   | © {{tahun}} Sineva Tech.                                                                                                             |

Catatan internal: email publik, nomor WhatsApp, jam operasional, alamat, legalitas dan tautan sosial memakai data Founder. Alamat/legalitas kosong disembunyikan; jangan mencetak variabel mentah atau nilai contoh. Copyright memakai tahun yang berlaku. Admin tetap berbahasa Indonesia; copy operasional admin terperinci di luar tiket ini.

Kontak yang sudah dikonfirmasi Founder:

| Data                           | Nilai                                               |
| ------------------------------ | --------------------------------------------------- |
| WhatsApp untuk ditampilkan     | 0851-9936-8510                                      |
| Format internasional untuk URL | 6285199368510                                       |
| Tautan dasar                   | [WhatsApp Sineva Tech](https://wa.me/6285199368510) |

Nomor ini dipakai untuk global, Kontak, CTA layanan dan template WhatsApp §14. Implementasi menambahkan pesan konteks yang di-encode; variabel email `{{url_whatsapp_umum}}` memakai nomor yang sama. Nomor bersumber dari konfirmasi Founder, belum diuji dengan mengirim pesan. Email publik dan inbox lead belum tersedia.

## 3. Beranda

| Bagian                 | Naskah                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero: judul            | Website dan otomasi untuk kebutuhan bisnis Anda                                                                                                       |
| Hero: pengantar        | Kami membantu UMKM, perusahaan, dan startup membahas kebutuhan website, aplikasi web, serta otomasi. Mulai dari masalah yang ingin Anda selesaikan.   |
| Hero: CTA              | Konsultasi Gratis · Lihat Layanan                                                                                                                     |
| Segmen: judul          | Temukan titik awal untuk bisnis Anda                                                                                                                  |
| UMKM: judul            | UMKM & Bisnis Lokal                                                                                                                                   |
| UMKM: isi              | Ingin mengenalkan usaha lewat website atau merapikan pekerjaan harian? Ceritakan kebutuhan Anda agar kita dapat membahas solusi dan ruang lingkupnya. |
| Perusahaan: judul      | Perusahaan                                                                                                                                            |
| Perusahaan: isi        | Bahas kebutuhan sistem internal, integrasi, dan pemanfaatan AI berdasarkan alur kerja tim Anda.                                                       |
| Startup: judul         | Startup                                                                                                                                               |
| Startup: isi           | Diskusikan ide produk, prioritas fitur, dan kebutuhan pengembangan tahap awal bersama kami.                                                           |
| Layanan: judul         | Apa yang bisa kita kerjakan bersama?                                                                                                                  |
| Web: isi               | Website dan aplikasi web dengan struktur, tampilan, serta fitur yang dibahas sesuai kebutuhan bisnis Anda.                                            |
| AI: isi                | Otomasi pekerjaan berulang dan solusi AI yang dirancang berdasarkan proses serta sistem yang Anda gunakan.                                            |
| Layanan: CTA           | Pelajari Web Development · Pelajari AI & Otomasi                                                                                                      |
| Portofolio: judul      | Kenali pekerjaan kami                                                                                                                                 |
| Portofolio: pengantar  | Lihat konteks, pendekatan, dan hasil setiap proyek. Proyek demo internal memiliki label agar Anda dapat membedakannya dari proyek klien.              |
| Portofolio: CTA        | Lihat Portofolio                                                                                                                                      |
| Proses: judul          | Empat langkah pengerjaan                                                                                                                              |
| Konsultasi             | Ceritakan kebutuhan, kendala, dan tujuan Anda. Kita bahas titik awalnya bersama.                                                                      |
| Proposal               | Kita sepakati ruang lingkup, hasil pekerjaan, biaya, dan tahapan sebelum pengerjaan dimulai.                                                          |
| Pengerjaan             | Kami mengerjakan ruang lingkup yang disepakati dan meninjau hasilnya bersama Anda.                                                                    |
| Pendampingan           | Kami membahas penggunaan serta tindak lanjut sesuai kesepakatan proyek.                                                                               |
| Chatbot: label         | Segera hadir                                                                                                                                          |
| Chatbot: judul         | Kami sedang mempersiapkan chatbot Sineva                                                                                                              |
| Chatbot: isi           | Daftarkan email Anda untuk menerima kabar saat produk siap.                                                                                           |
| Chatbot: CTA           | Gabung Waitlist · Kenali Rencana Produk                                                                                                               |
| Artikel: judul         | Catatan dari tim Sineva                                                                                                                               |
| Artikel: pengantar     | Baca tulisan kami seputar website, pengembangan aplikasi, AI, dan otomasi.                                                                            |
| Artikel: CTA           | Lihat Semua Artikel                                                                                                                                   |
| CTA akhir: judul       | Mari bahas kebutuhan Anda                                                                                                                             |
| CTA akhir: isi         | Sudah punya rencana atau masih mencari titik awal? Ceritakan kebutuhan bisnis Anda kepada kami.                                                       |
| CTA akhir: tombol      | Konsultasi Gratis · Hubungi via WhatsApp                                                                                                              |
| Label ilustrasi konsep | Ilustrasi alur layanan                                                                                                                                |

Tujuan CTA dan kondisi tampil mengikuti outline §4. Portofolio pilihan maksimal tiga item; artikel tiga terbaru pada locale aktif. Kedua bagian disembunyikan jika tidak ada konten terbit. Usulan proses membutuhkan persetujuan Founder atas batas pengerjaan/pendampingan, tanpa SLA tersirat.

## 4. Layanan: daftar

**Judul:** Layanan teknologi untuk kebutuhan bisnis Anda

**Pengantar:** Pilih layanan yang ingin Anda bahas. Jika belum yakin, ceritakan proses atau masalah yang Anda hadapi saat konsultasi.

| Kartu           | Naskah                                                                                                                               | CTA                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Web Development | Bahas website atau aplikasi web yang Anda butuhkan, mulai dari informasi yang ingin ditampilkan hingga fitur dan pengelolaan konten. | Pelajari Web Development |
| AI & Otomasi    | Kenali pekerjaan berulang dan kebutuhan integrasi yang dapat dibahas untuk otomasi atau solusi AI.                                   | Pelajari AI & Otomasi    |

**CTA bagi yang belum yakin:** Belum tahu harus mulai dari mana? · Konsultasi Gratis

Tujuan: detail masing-masing layanan atau Kontak dengan pilihan “Belum yakin”.

## 5. Layanan: Web Development

### Pengantar dan masalah

**Judul:** Bangun website sesuai kebutuhan bisnis Anda

**Pengantar:** Website Anda perlu menjelaskan bisnis dan membantu pengunjung mengambil langkah berikutnya. Kita bahas isi, fitur, serta pengelolaannya sebelum menentukan ruang lingkup pekerjaan.

**CTA:** Konsultasi Gratis · Hubungi via WhatsApp

**Judul masalah:** Apa yang ingin Anda perbaiki?

- Calon pelanggan kesulitan menemukan informasi tentang usaha Anda.
- Website belum menjelaskan layanan atau langkah untuk menghubungi tim.
- Tim membutuhkan cara memperbarui konten.
- Bisnis membutuhkan aplikasi web untuk proses tertentu.

### Hasil pekerjaan dan proses

**Judul:** Tentukan hasil pekerjaan sejak awal

**Pengantar:** Kita pilih hasil pekerjaan berdasarkan kebutuhan Anda. Ruang lingkup dapat mencakup:

| Hasil pekerjaan usulan | Naskah                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Struktur dan konten    | Susunan halaman serta alur informasi yang membantu pengunjung memahami bisnis Anda. |
| Tampilan responsif     | Tampilan untuk penggunaan lewat ponsel maupun desktop.                              |
| Pengembangan fitur     | Fitur dan integrasi yang tercantum dalam ruang lingkup proyek.                      |
| Pengelolaan konten     | Kebutuhan admin untuk memperbarui isi, jika termasuk kesepakatan.                   |
| Serah terima           | Panduan penggunaan dan materi serah terima sesuai ruang lingkup.                    |

**Judul proses:** Mulai dari kebutuhan, lanjut ke pengerjaan

Gunakan empat langkah di Beranda: Konsultasi, Proposal, Pengerjaan, Pendampingan.

**Judul teknologi:** Pilih teknologi berdasarkan kebutuhan

**Isi:** Kita bahas teknologi dengan mempertimbangkan fitur, sistem yang sudah Anda gunakan, dan kebutuhan pengelolaan setelah serah terima.

Catatan internal: daftar kemampuan dan logo teknologi menunggu konfirmasi Founder. Isi di atas tidak menjanjikan seluruh deliverable sebagai satu paket tetap.

### FAQ

| Pertanyaan                                                      | Jawaban                                                                                                                                                                                            |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apa yang perlu saya siapkan saat konsultasi?                    | Ceritakan bisnis, tujuan website, dan kendala yang ingin Anda selesaikan. Jika ada, bawa contoh website, daftar halaman, atau gambaran fitur. Kita dapat membahas bagian yang belum Anda tentukan. |
| Bagaimana biaya dan waktu pengerjaan ditentukan?                | Kita bahas kebutuhan dan ruang lingkup terlebih dahulu. Proposal menjelaskan biaya serta tahapan pengerjaan untuk Anda tinjau sebelum memulai.                                                     |
| Apakah saya bisa memperbarui isi website?                       | Jika Anda membutuhkan pengelolaan konten, sampaikan saat konsultasi. Kita akan memasukkan kebutuhan admin dan panduan penggunaannya ke dalam pembahasan ruang lingkup.                             |
| Apakah Sineva bisa membuat aplikasi web selain company profile? | Ceritakan alur dan fitur aplikasi yang Anda butuhkan. Kami akan meninjau kebutuhan tersebut sebelum mengusulkan ruang lingkup dan pendekatan pengerjaan.                                           |
| Bagaimana proses review dan dukungan setelah serah terima?      | Kita bahas tahapan review, penyerahan, dan kebutuhan pendampingan dalam kesepakatan proyek. Sampaikan kebutuhan revisi atau pemeliharaan agar ruang lingkupnya jelas sejak awal.                   |

**Penutup:** Ceritakan kebutuhan website Anda. Mari bahas halaman, fitur, dan proses yang perlu didukung.

CTA Kontak menggunakan `?layanan=web-development`; WhatsApp memakai template konteks web.

## 6. Layanan: AI & Otomasi

### Pengantar dan masalah

**Judul:** Bahas alur kerja yang ingin Anda permudah

**Pengantar:** Mulai dari pekerjaan yang tim Anda lakukan berulang. Kita petakan proses, data, dan sistem yang terlibat untuk membahas kebutuhan otomasi atau AI.

**CTA:** Konsultasi Gratis · Hubungi via WhatsApp

**Judul masalah:** Pekerjaan mana yang menyita waktu tim?

- Tim menyalin data yang sama ke beberapa tempat.
- Informasi tersebar di beberapa sistem.
- Tindak lanjut bergantung pada pengecekan manual.
- Tim ingin menilai apakah AI sesuai untuk proses tertentu.

### Hasil pekerjaan dan proses

**Judul:** Tentukan alur dan batas solusinya

| Hasil pekerjaan usulan  | Naskah                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Pemetaan proses         | Gambaran input, langkah kerja, hasil yang dibutuhkan, dan bagian yang memerlukan peninjauan manusia. |
| Rancangan integrasi     | Pembahasan akses serta pertukaran data antar sistem yang terlibat.                                   |
| Workflow atau solusi AI | Pengerjaan alur yang telah disepakati, dengan batas penggunaan yang jelas.                           |
| Pengujian dan panduan   | Pemeriksaan skenario serta panduan penggunaan sesuai ruang lingkup proyek.                           |

**Judul proses:** Pahami prosesnya sebelum memilih alat

Gunakan empat langkah di Beranda. Konsultasi membahas alur dan data; Proposal menetapkan batas; Pengerjaan mencakup review skenario; Pendampingan mengikuti kesepakatan.

**Judul teknologi:** Mulai dari sistem yang Anda gunakan

**Isi:** Ceritakan aplikasi, sumber data, dan akses yang tersedia. Kita tinjau kebutuhan integrasi serta pilihan teknologi sebelum menentukan solusi.

**Contoh diagram:** Form masuk → Data ditata → Tim menerima pemberitahuan

**Caption:** Ilustrasi alur layanan. Integrasi dan perilaku akhir mengikuti ruang lingkup proyek.

Catatan internal: jangan mencantumkan vendor/integrasi yang belum dikonfirmasi atau mengubah ilustrasi menjadi klaim fitur aktif.

### FAQ

| Pertanyaan                                            | Jawaban                                                                                                                                                                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apakah setiap otomasi perlu menggunakan AI?           | Kita perlu melihat prosesnya terlebih dahulu. Sebagian kebutuhan dapat dibahas sebagai otomasi berbasis aturan, sementara kebutuhan lain mungkin memerlukan AI. Pilihan alat mengikuti masalah yang ingin Anda selesaikan. |
| Apakah sistem yang kami gunakan bisa diintegrasikan?  | Kirim gambaran sistem dan pertukaran data yang Anda butuhkan. Kami perlu meninjau akses, dokumentasi, dan batas sistem tersebut sebelum memastikan pendekatannya.                                                          |
| Data dan akses apa yang perlu kami siapkan?           | Mulai dengan menjelaskan sumber data, alur kerja, dan pihak yang terlibat. Kebutuhan akses serta cara penanganannya dibahas sebelum pengerjaan; jangan mengirim password atau data rahasia lewat form kontak.              |
| Bagaimana hasil otomasi atau AI ditinjau?             | Kita sepakati skenario dan hasil yang diharapkan dalam ruang lingkup. Pembahasan juga mencakup penanganan kegagalan dan bagian yang memerlukan peninjauan manusia.                                                         |
| Apakah layanan ini sama dengan produk chatbot Sineva? | Layanan AI & Otomasi membahas kebutuhan custom bisnis Anda. Produk chatbot Sineva dikembangkan sebagai produk terpisah dan saat ini berstatus “Segera hadir”.                                                              |
| Bagaimana pemeliharaannya?                            | Ceritakan kebutuhan operasional dan pendampingan Anda. Lingkup pemeliharaan dibahas dalam kesepakatan proyek, termasuk sistem atau layanan pihak ketiga yang terlibat.                                                     |

**Penutup:** Bawa satu contoh proses yang ingin Anda permudah. Kita bahas bagian yang perlu dikerjakan dan hasil yang Anda butuhkan.

CTA Kontak menggunakan `?layanan=ai-automation`; WhatsApp memakai konteks AI & Otomasi.

## 7. Portofolio

### Daftar

**Judul:** Kenali pekerjaan kami

**Pengantar:** Lihat konteks, solusi, dan hasil setiap proyek. Showcase yang kami buat untuk mendemonstrasikan pendekatan memiliki label “Proyek demo internal”.

**Filter:** Semua · Web · AI

**Label jenis:** Proyek demo internal · Proyek klien

**Kartu:** `{{judul_proyek}}` · `{{ringkasan_proyek}}` · Lihat Proyek

**Daftar kosong:** Belum ada proyek yang dapat ditampilkan.

**Filter kosong:** Belum ada proyek pada kategori ini. · Lihat Semua Proyek

**CTA konsultasi:** Punya kebutuhan yang ingin Anda bahas? · Konsultasi Gratis

### Template detail

| Bagian              | Naskah tetap / data nyata                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Judul dan ringkasan | {{judul_proyek}} · {{ringkasan_proyek}}                                                                |
| Jenis               | Proyek demo internal / Proyek klien, sesuai data.                                                      |
| Tantangan           | “Tantangan” → {{tantangan}}                                                                            |
| Solusi              | “Pendekatan dan solusi” → {{solusi}}                                                                   |
| Hasil               | “Hasil pekerjaan” → {{hasil_terverifikasi}}                                                            |
| Teknologi           | “Teknologi yang digunakan” → {{teknologi}}                                                             |
| Galeri              | “Lihat detail pekerjaan” → {{galeri_asli_dan_caption}}                                                 |
| Demo                | Lihat Demo · Dibuka di tab baru                                                                        |
| Layanan terkait     | “Layanan terkait” → tautan layanan dari proyek.                                                        |
| Penutup             | Punya kebutuhan serupa? Ceritakan konteks bisnis Anda agar kita dapat membahas pendekatan yang sesuai. |
| CTA                 | Konsultasi Gratis · Hubungi via WhatsApp                                                               |

Catatan internal: isi tantangan/solusi/hasil bukan placeholder untuk diterbitkan. Tunggu CPR-16/55 dan bukti asli. Jangan menyatakan hasil komersial dari demo internal. Sembunyikan demo/galeri tambahan jika tidak tersedia; jangan membuat URL proyek palsu.

## 8. Produk Chatbot dan waitlist

**Label:** Segera hadir

**Judul:** Kami sedang mempersiapkan chatbot Sineva

**Pengantar:** Daftarkan minat Anda untuk menerima kabar saat produk siap. Kami akan membagikan informasi produk melalui email yang Anda daftarkan.

**Judul bagian rencana:** Rencana produk

Catatan internal: nama fitur, manfaat spesifik, integrasi, harga, dan tanggal rilis menunggu Founder/tim CBT. Bagian rencana fitur belum memiliki copy final dan tidak boleh berisi fitur rekaan. Pengantar di atas dapat direview terpisah.

### FAQ produk

| Pertanyaan                                                  | Jawaban                                                                                                                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apakah chatbot Sineva sudah bisa digunakan?                 | Belum. Kami sedang mempersiapkan produk chatbot Sineva. Anda dapat bergabung ke waitlist untuk menerima kabar saat produk siap.                            |
| Bagaimana cara mendapat kabar tentang peluncuran?           | Daftarkan email Anda melalui form waitlist di halaman ini.                                                                                                 |
| Apakah sudah ada tanggal peluncuran?                        | Kami belum mengumumkan tanggal peluncuran. Informasi berikutnya akan kami bagikan kepada pendaftar waitlist.                                               |
| Apakah bergabung ke waitlist memberi akses produk sekarang? | Pendaftaran mencatat minat Anda untuk mendapat kabar produk. Akses penggunaan belum tersedia pada tahap ini.                                               |
| Untuk apa email saya digunakan?                             | Kami menggunakan email pendaftaran untuk menyampaikan kabar terkait produk chatbot. Anda dapat membaca penjelasan pengelolaan data pada Kebijakan Privasi. |

Catatan internal: jawaban tanggal rilis dan cakupan pengiriman email perlu dikonfirmasi tim produk sebelum publikasi.

### Form bersama: Beranda dan Produk

| Elemen/state                    | Naskah                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Judul                           | Dapatkan kabar saat chatbot Sineva siap                                                                   |
| Email                           | Email                                                                                                     |
| Placeholder email               | nama@perusahaan.com                                                                                       |
| Jenis bisnis                    | Jenis bisnis (opsional)                                                                                   |
| Pilihan                         | UMKM · Perusahaan · Startup · Lainnya                                                                     |
| Persetujuan                     | Saya menyetujui penggunaan data pendaftaran untuk menerima kabar produk chatbot sesuai Kebijakan Privasi. |
| CTA                             | Gabung Waitlist                                                                                           |
| Sedang mengirim                 | Mendaftarkan…                                                                                             |
| Email tidak valid               | Masukkan alamat email yang valid.                                                                         |
| Persetujuan kosong              | Berikan persetujuan sebelum mendaftar.                                                                    |
| Sukses, termasuk email duplikat | Terima kasih. Pendaftaran Anda sudah tercatat.                                                            |
| Gagal simpan                    | Pendaftaran belum berhasil. Isian Anda tetap tersedia. Silakan coba lagi.                                 |

Catatan internal: contoh email hanyalah placeholder input. Data nyata harus lolos validasi. Form memakai pesan anti-spam §12; sukses tidak membuka halaman terima kasih kontak. CSV hanya ada untuk Admin, tanpa CTA publik.

## 9. Blog

### Daftar

**Judul:** Catatan dari tim Sineva

**Pengantar:** Tulisan seputar website, pengembangan aplikasi, AI, dan otomasi untuk membantu Anda memahami pilihan teknologi bisnis.

**Filter:** Kategori · Semua Kategori

**Kartu:** `{{judul_artikel}}` · `{{ringkasan_artikel}}` · Baca Artikel

**Paginasi:** Sebelumnya · Berikutnya · Halaman {{halaman}} dari {{total_halaman}}

**Daftar kosong:** Belum ada artikel dalam bahasa ini.

**Kategori kosong:** Belum ada artikel pada kategori ini. · Lihat Semua Artikel

### Template artikel

**Metadata:** Ditulis oleh {{nama_penulis}} · {{tanggal_terbit}} · {{menit_baca}} menit baca

**Label isi:** `{{judul_artikel}}` · `{{isi_artikel}}`

**Bagikan:** Bagikan artikel · Bagikan ke WhatsApp · Bagikan ke LinkedIn · Salin Tautan

**Status salin:** Tautan berhasil disalin. / Tautan belum tersalin. Silakan coba lagi.

**Terkait:** Artikel terkait · Baca Artikel

Catatan internal: penulis, tanggal, ringkasan, kategori, cover, isi, caption dan kredit harus berasal dari artikel nyata. Tampilkan sembilan artikel per halaman daftar, maksimal tiga terkait kategori sama. Kategori/terkait kosong dan artikel tanpa terjemahan mengikuti outline; tidak mengisi dengan bahasa lain.

## 10. Tentang Kami

**Judul:** Kenali Sineva Tech

**Pengantar:** Sineva Tech adalah perusahaan teknologi dengan layanan Web Development serta AI & Otomasi. Kami juga sedang mempersiapkan produk chatbot yang dikembangkan terpisah.

**Cerita:** Kami memulai pembicaraan dari kebutuhan bisnis Anda: informasi apa yang perlu disampaikan, proses mana yang ingin diperbaiki, dan hasil pekerjaan apa yang dibutuhkan. Dari sana, kita bahas ruang lingkup serta langkah pengerjaannya.

### Usulan visi, misi dan nilai untuk review

| Elemen                        | Naskah usulan                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Visi                          | Menjadi mitra teknologi yang membantu bisnis membangun dan menggunakan solusi sesuai kebutuhannya. |
| Misi 1                        | Memahami konteks dan tujuan bisnis sebelum menentukan pendekatan teknologi.                        |
| Misi 2                        | Mengembangkan website, aplikasi web, dan otomasi dengan ruang lingkup yang disepakati.             |
| Misi 3                        | Menjaga komunikasi selama pengerjaan dan membahas kebutuhan penggunaan setelah serah terima.       |
| Nilai: Pahami kebutuhan       | Kami mendengarkan konteks Anda sebelum mengusulkan pekerjaan.                                      |
| Nilai: Jelaskan ruang lingkup | Kita bahas hasil pekerjaan, tahapan, dan batasnya agar keputusan proyek memiliki dasar yang jelas. |
| Nilai: Tinjau bersama         | Kita meninjau pekerjaan dan membahas tindak lanjut sesuai kesepakatan.                             |

**Tim:** Kenali tim kami · `{{nama}}` · `{{jabatan}}` · `{{bio_terverifikasi}}`

**Penutup:** Ingin mengenal cara kami bekerja? Ceritakan kebutuhan Anda dan mari mulai percakapannya.

**CTA:** Lihat Layanan · Konsultasi Gratis

Catatan internal: visi/misi/nilai di atas belum menjadi pernyataan resmi. Cerita pendirian, pengalaman, profil dan foto tim memerlukan materi Founder. Jangan menambahkan tahun pendirian, jumlah klien atau pengalaman tim tanpa fakta. Bagian Tim mengikuti pengaturan situs dan ketersediaan data.

## 11. Kontak

**Judul:** Ceritakan kebutuhan Anda

**Pengantar:** Jelaskan bisnis, rencana, atau proses yang ingin Anda perbaiki. Jika belum yakin layanan yang dibutuhkan, pilih “Belum yakin” dan ceritakan konteksnya.

**Arahan form:** Isi kolom bertanda wajib agar kami dapat meninjau kebutuhan dan menghubungi Anda.

| Field               | Label/helper/placeholder                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Nama, wajib         | Nama · Nama Anda                                                                                                      |
| Email, wajib        | Email · nama@perusahaan.com                                                                                           |
| WhatsApp, wajib     | Nomor WhatsApp · Nomor aktif yang dapat kami hubungi                                                                  |
| Perusahaan          | Nama perusahaan (opsional)                                                                                            |
| Jenis bisnis, wajib | Jenis bisnis · Pilih jenis bisnis · UMKM / Perusahaan / Startup / Lainnya                                             |
| Layanan, wajib      | Layanan yang diminati · Pilih layanan · Web Development / AI & Otomasi / Belum yakin                                  |
| Budget              | Perkiraan budget (opsional) · Pilih perkiraan budget · < Rp10 jt / Rp10–50 jt / Rp50–150 jt / > Rp150 jt / Belum tahu |
| Kebutuhan, wajib    | Kebutuhan Anda · Ceritakan tujuan dan kendala Anda, minimal 20 karakter. Hindari mengirim password atau data rahasia. |
| Persetujuan, wajib  | Saya menyetujui penggunaan data yang saya kirim untuk menindaklanjuti kebutuhan ini sesuai Kebijakan Privasi.         |
| CTA                 | Kirim Kebutuhan                                                                                                       |
| CTA alternatif      | Hubungi via WhatsApp                                                                                                  |
| Kontak langsung     | Email · WhatsApp · Jam operasional · Alamat, jika tersedia.                                                           |

### Pesan validasi dan status

| Kondisi                     | Naskah                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Nama kosong                 | Isi nama Anda.                                                                                                        |
| Email kosong/tidak valid    | Masukkan alamat email yang valid.                                                                                     |
| WhatsApp kosong/tidak valid | Masukkan nomor WhatsApp yang valid.                                                                                   |
| Pilihan wajib belum diisi   | Pilih jenis bisnis Anda. / Pilih layanan yang ingin Anda bahas.                                                       |
| Kebutuhan terlalu singkat   | Ceritakan kebutuhan Anda dalam minimal 20 karakter.                                                                   |
| Persetujuan kosong          | Berikan persetujuan sebelum mengirim kebutuhan Anda.                                                                  |
| Pilihan/teks ditolak server | Periksa kembali isian pada kolom ini.                                                                                 |
| Sedang mengirim             | Mengirim kebutuhan…                                                                                                   |
| Gagal simpan                | Kebutuhan Anda belum berhasil dikirim. Isian Anda tetap tersedia. Silakan coba lagi atau hubungi kami lewat WhatsApp. |
| Berhasil sebelum redirect   | Terima kasih. Kebutuhan Anda sudah tercatat.                                                                          |
| Link kontak alternatif      | Lanjutkan lewat WhatsApp                                                                                              |

Catatan internal: state sukses baru setelah penyimpanan berhasil. Kegagalan email setelah data tersimpan tetap sukses; jangan meminta kirim ulang atau mengklaim email telah diterima. Pesan validasi mengikuti alasan nyata dari server dan bahasa halaman.

## 12. Pesan anti-spam bersama

| Kondisi                      | Naskah                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Verifikasi diperlukan        | Selesaikan verifikasi sebelum mengirim.                                             |
| Verifikasi gagal/kedaluwarsa | Verifikasi belum berhasil. Silakan lakukan verifikasi kembali.                      |
| Rate limit                   | Terlalu banyak percobaan. Silakan coba lagi nanti atau hubungi kami lewat WhatsApp. |
| Gangguan verifikasi          | Verifikasi belum tersedia. Silakan coba lagi atau gunakan WhatsApp.                 |

Catatan internal: jangan mencetak perkiraan waktu tunggu yang tidak diberikan sistem. Honeypot tidak memiliki pesan deteksi khusus. Teks ini tidak menentukan implementasi anti-spam atau mengubah aturan server.

## 13. Terima kasih, Privasi, 404

### Terima kasih

**Judul:** Terima kasih, kebutuhan Anda sudah tercatat

**Isi:** Tim Sineva akan meninjau informasi yang Anda kirim untuk menindaklanjuti kebutuhan Anda. Jika ingin melanjutkan percakapan, Anda dapat menghubungi kami melalui WhatsApp.

**CTA:** Lanjutkan lewat WhatsApp · Kembali ke Beranda

Catatan internal: dipakai dalam alur kontak sukses; URL terima kasih bukan bukti kiriman baru berhasil jika dibuka langsung. Jangan tampilkan informasi lead atau janji waktu respons; halaman tidak diindeks.

### Kebijakan Privasi

**Judul:** Kebijakan Privasi

**Pengantar usulan:** Halaman ini menjelaskan data yang dikumpulkan melalui website Sineva Tech, tujuan penggunaannya, masa simpan, serta cara mengajukan permintaan terkait data Anda.

**Tanggal:** Berlaku sejak {{tanggal_berlaku}}

**Heading isi:** Identitas pengelola · Data yang kami kumpulkan · Tujuan penggunaan · Akses dan layanan pendukung · Masa simpan · Permintaan terkait data · Perubahan kebijakan · Hubungi kami

**CTA permintaan:** Hubungi kami melalui email

Catatan internal: body kebijakan dan persetujuan final menunggu CPR-17 serta verifikasi praktik nyata. Jangan menerbitkan daftar heading sebagai kebijakan lengkap. Alamat email dan identitas pengelola harus terisi dan benar.

### 404

**Judul:** Halaman belum ditemukan

**Isi:** Halaman yang Anda cari tidak tersedia. Anda dapat kembali ke Beranda, melihat layanan kami, atau menghubungi Sineva Tech.

**CTA:** Kembali ke Beranda · Lihat Layanan · Hubungi Kami

Tautan memakai locale aktif; jangan mengisi halaman detail kosong dengan data fiktif atau bahasa lain.

## 14. Template WhatsApp

Simpan sebagai teks biasa. Isi nomor dari pengaturan; pembentukan URL memakai encoding yang benar pada tiket implementasi. Jangan memasukkan email, nomor, budget, atau isi form pengunjung ke template tanpa kebutuhan yang disepakati.

| Konteks         | Pesan                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Umum            | Halo Sineva Tech, saya ingin berkonsultasi tentang kebutuhan teknologi untuk bisnis saya.          |
| Web Development | Halo Sineva Tech, saya ingin berkonsultasi tentang website atau aplikasi web untuk bisnis saya.    |
| AI & Otomasi    | Halo Sineva Tech, saya ingin berkonsultasi tentang AI dan otomasi untuk bisnis saya.               |
| Produk Chatbot  | Halo Sineva Tech, saya ingin mengetahui rencana produk chatbot Sineva yang berstatus segera hadir. |

Hero/global/Kontak tanpa layanan memakai Umum. Detail layanan memakai konteksnya. Portofolio mengikuti layanan terkait bila jelas; jika tidak, Umum. Terima kasih mengikuti konteks yang diketahui atau Umum. Nomor tujuan masih membutuhkan materi Founder.

## 15. Email kontak

Template bahasa Indonesia ini untuk kontak berbahasa Indonesia. Template Inggris dibuat pada CPR-21; jangan kirim balasan Indonesia sebagai fallback kontak Inggris.

### Notifikasi internal ke inbox lead

**Subjek:** Lead baru dari website Sineva Tech

Halo Tim Sineva,

Ada kebutuhan baru dari form kontak website.

- Nama: {{nama}}
- Email: {{email}}
- WhatsApp: {{whatsapp}}
- Perusahaan: {{perusahaan_atau_tidak_diisi}}
- Jenis bisnis: {{jenis_bisnis}}
- Layanan: {{layanan}}
- Perkiraan budget: {{budget_atau_tidak_diisi}}
- Bahasa: Indonesia
- Halaman asal: {{halaman_asal}}
- Waktu kirim: {{waktu_kirim_dengan_zona}}

**Kebutuhan yang dikirim:**

{{kebutuhan}}

**Tindak lanjut:** Buka lead di admin Sineva Tech: {{url_admin_lead}}

Catatan internal: penerima adalah inbox lead yang disetujui Founder; bukan seluruh Editor. Tautan memakai origin aplikasi tepercaya, memerlukan login/izin Admin, dan tidak membawa data pribadi dalam URL. Variabel teks harus di-escape saat render HTML; input pengguna tidak dimasukkan sebagai header/subjek email.

### Balasan otomatis ke calon klien

**Subjek:** Kebutuhan Anda sudah kami terima | Sineva Tech

Halo {{nama}},

Terima kasih telah menghubungi Sineva Tech. Kebutuhan Anda sudah tercatat dan tim kami akan meninjau informasi yang Anda kirim.

Jika ingin menambahkan informasi atau melanjutkan percakapan, hubungi kami lewat WhatsApp: {{url_whatsapp_umum}}.

Salam,

Tim Sineva Tech

**Footer email:** Informasi pengelolaan data: {{url_kebijakan_privasi}}.

Catatan internal: email dikirim setelah data tersimpan. Jangan mengulang kebutuhan, budget atau seluruh detail pribadi dalam balasan. Nama pengirim, alamat pengirim/domain, inbox lead, dan URL kontak menunggu konfigurasi terverifikasi. Tidak mengklaim SLA atau email waitlist yang tidak diminta PRD.

## 16. Metadata dan data yang belum final

[seo-id.json](seo-id.json) memuat title dan description untuk 14 halaman/template publik, termasuk dua template dinamis. Admin dicatat pada sitemap operasional dan tidak menjadi target SEO marketing.

Title statis dibatasi 60 karakter; description statis 160 karakter. Template proyek/artikel membutuhkan judul/ringkasan nyata sebelum dapat dinyatakan final. Suffix ` | Sineva Tech` memakai 14 karakter, sehingga judul dinamis memiliki anggaran 46 karakter bila suffix dipertahankan. Jika judul konten lebih panjang, tulis SEO title tersendiri yang tetap bermakna; jangan memotong otomatis di tengah kata. Description dinamis maksimal 160 karakter.

| Kebutuhan                                                     | Status dan tindak lanjut                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Naskah halaman umum, dua jasa/FAQ, pesan WhatsApp, email      | Draft tersedia, menunggu review Founder terhadap penawaran dan bahasa.                     |
| WhatsApp publik                                               | Dikonfirmasi Founder: 085199368510; tautan menggunakan 6285199368510.                      |
| Email publik, inbox, jam operasional, alamat/legalitas/sosial | Menunggu data Founder; tidak diisi data contoh.                                            |
| Visi/misi/nilai, cerita/profil tim                            | Usulan copy tersedia; data biografi/foto dan persetujuan pernyataan resmi belum ada.       |
| Fitur chatbot                                                 | Menunggu rencana yang disetujui Founder/tim CBT; belum memiliki copy final.                |
| Proyek/hasil/cover/gallery dan SEO detail                     | Menunggu CPR-16/55 serta materi asli. Template tersedia.                                   |
| Artikel/penulis/cover/kategori dan SEO detail                 | Menunggu materi artikel; template tersedia.                                                |
| Kebijakan Privasi dan persetujuan                             | Pengantar/heading serta usulan label tersedia; body final tetap CPR-17 dan review Founder. |
| Caption dan alt aset                                          | Tulis berdasarkan gambar final; jangan membuat deskripsi gambar yang belum ada.            |
| Publikasi/input admin                                         | Belum dilakukan; CPR-54/55 dan tiket halaman/admin berikutnya.                             |

**Acceptance CPR-19:** belum selesai. Copy statis dan metadata tersedia untuk review, tetapi materi khusus, metadata dinamis, dan persetujuan Founder masih diperlukan sebelum semua bagian dapat disebut final. Dokumen tidak mengubah status CPR-18 yang ditangani Faishal.
