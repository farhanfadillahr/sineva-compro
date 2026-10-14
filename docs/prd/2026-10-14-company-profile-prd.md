# PRD — Website Company Profile Sineva Tech (v1)

| | |
|---|---|
| **Status** | Draft — menunggu review Founder |
| **Tanggal** | 14 Oktober 2026 |
| **Pemilik** | Founder Sineva Tech |
| **Linear** | Team `CPR` (Compro) |
| **Proyek terkait** | Sineva Chatbot — team `CBT`, dikembangkan terpisah |

---

## 1. Ringkasan

Sineva Tech adalah perusahaan teknologi baru dengan model bisnis **gabungan**: jasa pengembangan custom (Web Development, AI & Otomasi) dan produk SaaS, dimulai dari chatbot.

Website company profile ("Compro") v1 punya satu tugas utama: **mengubah pengunjung menjadi calon klien jasa yang menghubungi Sineva untuk konsultasi**, lewat WhatsApp atau form kontak. Tugas keduanya adalah mengumpulkan waitlist untuk produk chatbot, yang belum diluncurkan.

Website tampil dalam dua bahasa (Indonesia dan Inggris) sejak hari pertama. Kontennya dikelola lewat CMS, termasuk blog.

## 2. Latar belakang

- Sineva Tech belum punya kehadiran online. Domain, portofolio, dan legalitas usaha belum ada. Logo dan identitas brand sudah ada.
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
- [ ] Tidak ada pelanggaran aksesibilitas level *critical* atau *serious* (diperiksa dengan axe).
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
- CMS (Payload) dengan koleksi dan global di §9, beserta peran Admin dan Editor.
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
| Admin CMS | `/admin` | — |

## 7. Kebutuhan fungsional per halaman

Setiap kebutuhan diberi ID agar bisa dirujuk dari tiket Linear.

### 7.1 Elemen global
- **FR-GLB-01 — Header:** logo, navigasi (Layanan, Portofolio, Produk, Blog, Tentang Kami), tombol pindah bahasa ID/EN, dan tombol CTA *Konsultasi Gratis* ke halaman Kontak. Di layar ≤ 1024 px, navigasi menjadi menu mobile.
- **FR-GLB-02 — Tombol WhatsApp melayang** muncul di semua halaman publik. Pesan yang terisi otomatis mengikuti halaman asal (§8.1).
- **FR-GLB-03 — Footer:** ringkasan perusahaan, navigasi, daftar layanan, kontak (email, WhatsApp, alamat), data legalitas, media sosial, tautan Kebijakan Privasi, dan hak cipta. Data legalitas dan alamat **disembunyikan selama field-nya kosong di CMS**.
- **FR-GLB-04 — Halaman 404** tersedia dalam dua bahasa, dengan tautan ke Beranda, Layanan, dan Kontak.

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
- **FR-PRD-01 — Halaman "Segera hadir"** berisi: nilai utama chatbot, fitur yang direncanakan, form waitlist, dan FAQ. Semua kontennya dikelola dari CMS.
- Halaman ini akan diganti menjadi halaman produk penuh setelah chatbot diluncurkan. Penggantian itu di luar lingkup v1.

### 7.6 Blog
- **FR-BLOG-01 — Halaman daftar:** filter kategori lewat parameter query (`?kategori=`), 9 artikel per halaman, dan paginasi. Canonical halaman yang difilter mengarah ke halaman daftar utama.
- **FR-BLOG-02 — Halaman artikel:** judul, cover, penulis, tanggal terbit, estimasi waktu baca, isi artikel, tombol bagikan (WhatsApp, LinkedIn, salin tautan), dan 3 artikel terkait dari kategori yang sama.
- **FR-BLOG-03 — Isi artikel (rich text)** mendukung heading, daftar, tautan, gambar, kutipan, dan blok kode.
- **FR-BLOG-04 — Artikel hanya tampil di bahasa yang versinya ada** (§10).

### 7.7 Tentang Kami
- **FR-ABT-01:** cerita perusahaan, visi & misi, dan nilai-nilai perusahaan.
- **FR-ABT-02:** bagian tim, diambil dari koleksi Tim. Bagian ini bisa disembunyikan lewat pengaturan di CMS.

### 7.8 Kontak
- **FR-CTC-01:** form kontak (§8.2), tombol WhatsApp, email, dan jam operasional. Alamat muncul kalau sudah diisi di CMS.
- **FR-CTC-02 — Halaman terima kasih** dibuat di URL tersendiri, sehingga bisa diukur sebagai halaman tujuan konversi. Halaman ini berisi tombol WhatsApp untuk calon klien yang ingin respons lebih cepat.

### 7.9 Kebijakan Privasi
- **FR-PRV-01:** isi dikelola dari CMS dan mencakup data apa yang dikumpulkan, tujuannya, masa simpan (§13.4), hak pemilik data, dan kontak untuk permintaan akses atau penghapusan data.

## 8. Alur lead

### 8.1 WhatsApp
- **FR-LEAD-01:** semua tombol WhatsApp membuka `https://wa.me/<nomor>?text=<pesan>`.
- **FR-LEAD-02:** template pesan **berbeda per konteks** (umum, Web Development, AI & Otomasi, Produk Chatbot) dan **per bahasa**. Contoh: *"Halo Sineva Tech, saya ingin konsultasi tentang AI & Otomasi."*
- **FR-LEAD-03:** nomor WhatsApp dan template pesan dikelola di global Pengaturan Situs.

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
- **FR-LEAD-05:** setelah lolos validasi dan anti-spam, data disimpan ke koleksi Leads beserta bahasa, halaman asal, dan waktu kirim.
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

## 9. Model konten (Payload CMS)

**Prinsip: layout ada di kode, isi ada di CMS.** Setiap halaman punya bagian-bagian yang tetap. Teks, gambar, dan SEO di setiap bagian bisa diubah dari `/admin`.

### 9.1 Koleksi

| Koleksi | Field utama | Dilokalkan |
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

### 9.2 Global

| Global | Isi |
|---|---|
| **Pengaturan Situs** | nomor WhatsApp, template pesan WhatsApp, inbox email lead, email publik, jam operasional, alamat, data legalitas, media sosial, SEO dan gambar OG bawaan, tampil/sembunyikan bagian Tim |
| **Beranda** | konten setiap bagian di FR-HOME-01 s.d. 08 |
| **Tentang Kami** | cerita, visi & misi, nilai |
| **Kontak** | teks pengantar dan teks halaman terima kasih |
| **Produk Chatbot** | nilai utama, fitur yang direncanakan, FAQ |
| **Kebijakan Privasi** | isi (rich text) dan tanggal berlaku |

### 9.3 Peran dan hak akses

| | Konten (Services, Portfolio, Posts, Team, Media, global) | Leads & Waitlist | Users |
|---|---|---|---|
| **Admin** | baca/tulis | baca/ubah/hapus/ekspor | kelola |
| **Editor** | baca/tulis | **tidak ada akses** | — |

- **FR-CMS-01:** Leads dan Waitlist **tidak bisa dibuat lewat REST API publik**. Data hanya masuk lewat server action yang sudah melewati validasi dan anti-spam. Hak *create* di koleksi tersebut dibatasi untuk Admin.
- **FR-CMS-02:** Posts dan Portfolio punya status draft/terbit dan fitur preview sebelum diterbitkan.
- **FR-CMS-03:** saat konten diterbitkan atau diubah, halaman terkait di kedua bahasa diperbarui otomatis (on-demand revalidation).
- **FR-CMS-04:** login admin terkunci sementara setelah 5 kali gagal.

## 10. Aturan dua bahasa

- **FR-I18N-01:** lokal yang tersedia adalah `id` (default) dan `en`. Fallback antarbahasa **dimatikan**, sehingga teks Indonesia tidak pernah muncul di halaman Inggris.
- **FR-I18N-02 — Kunjungan ke `/`:** pengunjung diarahkan berdasarkan cookie pilihan bahasa kalau ada. Kalau tidak ada cookie, diarahkan ke `/en` bila bahasa browser Inggris, selain itu ke `/id`.
- **FR-I18N-03:** tombol pindah bahasa membuka **halaman padanan** di bahasa lain dan menyimpan pilihan itu di cookie. Kalau padanannya tidak ada (artikel satu bahasa), pengunjung diarahkan ke daftar blog bahasa tujuan.
- **FR-I18N-04:** konten inti (semua global, Services, Portfolio) **wajib lengkap dalam dua bahasa** sebelum diluncurkan. Ini diperiksa lewat checklist QA.
- **FR-I18N-05:** artikel blog boleh hanya satu bahasa. Artikel tanpa versi EN tidak tampil di `/en/blog`, sitemap EN, maupun `hreflang`.
- **FR-I18N-06:** teks antarmuka (label tombol, pesan error, dll.) disimpan di file terjemahan di repo, bukan di CMS.

## 11. SEO

- **FR-SEO-01:** meta title, meta description, dan gambar OG bisa diatur per dokumen, dengan nilai bawaan dari Pengaturan Situs.
- **FR-SEO-02:** setiap halaman punya `hreflang` (`id`, `en`, `x-default` → `/id`) dan canonical.
- **FR-SEO-03:** `sitemap.xml` mencakup kedua bahasa, beserta `robots.txt`. Halaman `/admin` dan halaman terima kasih tidak diindeks.
- **FR-SEO-04 — Structured data (JSON-LD):** Organization, Service, BlogPosting, FAQPage, dan BreadcrumbList.
- **FR-SEO-05:** halaman publik di-render statis dan diperbarui lewat on-demand revalidation (FR-CMS-03).

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
- **Aplikasi:** Next.js (App Router) + TypeScript, dengan Payload CMS v3 terpasang di dalam aplikasi yang sama.
- **Styling:** Tailwind CSS, dengan design system yang diturunkan dari identitas brand.
- **i18n:** next-intl untuk routing dan teks antarmuka, serta fitur localization Payload untuk konten.
- **Database:** PostgreSQL.
- **Media:** Cloudflare R2 (kompatibel S3).
- **Email:** Resend.
- **Anti-spam:** Cloudflare Turnstile.
- **Analytics:** Umami Cloud.
- **Pemantauan error:** Sentry (paket gratis).
- **Repo:** `sineva-compro` (Git), terpisah dari repo chatbot.

Versi Next.js dan Payload dikunci (*pin*) dan hanya dinaikkan secara sengaja.

### 14.2 Infrastruktur: VPS + Coolify

```
Pengunjung ──► Cloudflare (DNS, proxy/CDN, Turnstile)
                    │
                    ▼
              VPS (Coolify)
              ├── Container Next.js + Payload  (production)
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
- **Preview per PR:** dibuat lewat fitur preview deployment Coolify dan memakai database staging.
- **Lingkungan kerja:** lokal (Postgres via Docker Compose) → preview (per PR) → production.

### 14.3 CI (GitHub Actions)
Dijalankan pada setiap PR, berurutan: lint → typecheck → unit & integration test → build → E2E (Playwright, dengan service Postgres) → Lighthouse CI terhadap hasil build production.

PR hanya boleh di-merge ke `main` kalau semua tahap lulus.

## 15. Strategi testing

| Level | Cakupan minimum |
|---|---|
| **Unit** | pembuat tautan WhatsApp, pemetaan slug antarbahasa, normalisasi nomor telepon, validasi form |
| **Integrasi** | server action Leads/Waitlist (validasi, honeypot, Turnstile, rate limit, email gagal ≠ data hilang, email ganda di waitlist); hak akses (Editor ditolak saat membaca Leads, REST publik ditolak saat membuat Leads) |
| **E2E** | kirim form kontak → halaman terima kasih; pindah bahasa di halaman layanan dan artikel; tautan WhatsApp berisi pesan yang benar; daftar waitlist; halaman 404 |
| **Kualitas** | Lighthouse CI (ambang §13.1); pemeriksaan axe di 5 halaman kunci |
| **Manual (pra-luncur)** | uji di perangkat iOS dan Android, pengiriman email (SPF/DKIM), restore backup |

Di CI dan di lingkungan lokal, Turnstile memakai *test key* resmi Cloudflare, dan pengiriman email diganti dengan adapter tiruan (mock) yang mencatat email tanpa benar-benar mengirimnya. Email sungguhan hanya dikirim dari preview dan production.

## 16. Milestone

| Milestone | Isi | Bergantung pada |
|---|---|---|
| **M0 — Fondasi** | PRD final, domain, repo, kerangka Next.js + Payload, CI, VPS + Coolify, DNS Cloudflare, Resend | keputusan domain dan provider VPS |
| **M1 — Konten & Desain** | arsitektur konten, copywriting ID/EN, design system dari brand, wireframe, desain UI | file brand |
| **M2 — CMS & Halaman** | koleksi dan global, peran, routing dua bahasa, semua halaman, blog, portofolio | M0, M1 |
| **M3 — Lead & Integrasi** | form kontak, WhatsApp, waitlist, email, anti-spam, mini-CRM, analytics | M2 |
| **M4 — Konten & QA** | input konten final, SEO dan structured data, aksesibilitas, performa, E2E, uji perangkat | M3, showcase siap |
| **M5 — Launch** | domain live, Search Console, monitoring, uji restore backup, panduan admin | M4 |

Konvensi tiket Linear: `CPR-{nomor}` diberikan otomatis oleh Linear, dan judul tiket ditulis dengan format `[MODUL] Aksi`. Daftar modul: `PRD`, `Infra`, `CMS`, `I18n`, `Layout`, `Home`, `Services`, `Portfolio`, `Product`, `Blog`, `About`, `Contact`, `Lead`, `SEO`, `Analytics`, `Design`, `Content`, `QA`, `Launch`, `Docs`.

## 17. Ketergantungan dan risiko

| Risiko / ketergantungan | Dampak | Mitigasi |
|---|---|---|
| Copywriting dua bahasa jadi hambatan | Peluncuran tertunda | M1 dimulai paralel dengan M0. Claude menyusun draft ID/EN, Founder mereview |
| Demo showcase belum siap | Portofolio kosong | Bisa diluncurkan dengan minimal 2 item. Demo chatbot bisa menyusul tanpa perlu deploy ulang (konten dari CMS) |
| Legalitas usaha belum ada | Footer dan Kebijakan Privasi belum lengkap | Field disembunyikan selama kosong. Kebijakan Privasi memakai nama "Sineva Tech" dan email kontak sampai badan usaha resmi terbentuk |
| Beban operasional VPS | Downtime atau kehilangan data | Backup otomatis + uji restore, uptime monitor eksternal, update keamanan otomatis |
| Spam di form | Inbox penuh, data kotor | Honeypot + Turnstile + rate limit |
| Perubahan versi Payload/Next.js | Build rusak | Versi dikunci, upgrade lewat PR terpisah |

## 18. Catatan keputusan

| # | Keputusan | Alternatif yang ditolak |
|---|---|---|
| D1 | Next.js + Payload CMS dalam satu repo | Next.js + Sanity; Astro + CMS hosted |
| D2 | Hosting VPS + Coolify | Vercel Pro + Neon |
| D3 | Ajakan utama: konsultasi jasa (WhatsApp + form) | waitlist chatbot sebagai ajakan utama; dua jalur setara |
| D4 | Dua bahasa ID + EN sejak v1 | Indonesia saja |
| D5 | Kredibilitas lewat showcase internal berlabel jelas | profil tim saja; diluncurkan tanpa portofolio |
| D6 | Form sebagai koleksi khusus (bukan plugin Form Builder) | plugin Form Builder Payload |
| D7 | Umami tanpa cookie, tanpa cookie banner | GA4 + cookie banner |
| D8 | Layout tetap di kode, isi di CMS | page builder blocks |
| D9 | Linear: satu team per produk (`CPR`, `CBT`) | satu team dengan prefix di judul |

## 19. Pertanyaan terbuka

| # | Pertanyaan | Penanggung jawab | Paling lambat |
|---|---|---|---|
| Q1 | Nama domain yang dibeli | Founder | sebelum M0 selesai |
| Q2 | Provider dan region VPS | Founder + developer | sebelum M0 selesai |
| Q3 | Nomor WhatsApp Business dan inbox email untuk lead | Founder | sebelum M3 |
| Q4 | Topik 2–3 showcase. Usulan: (a) chatbot FAQ & booking untuk klinik fiktif, butuh `CBT`; (b) dashboard pesanan WhatsApp untuk UMKM F&B; (c) website Sineva Tech ini sendiri sebagai studi kasus | Founder | awal M1 |
| Q5 | Desain UI dibuat di Figma dulu atau langsung di kode | Founder | awal M1 |
| Q6 | Siapa yang mereview teks Kebijakan Privasi dari sisi legal | Founder | sebelum M4 |
