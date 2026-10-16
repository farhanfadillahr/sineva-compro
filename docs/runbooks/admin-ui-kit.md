# Admin UI kit (CPR-80)

Integrasi: `development` sebagai staging, mengikuti [keputusan Founder](../architecture/decisions/2026-10-16-development-staging.md). Perubahan ini tidak mempromosikan admin ke main atau mengganti sumber konten publik statis Faishal.

## Penggunaan

- `src/components/admin/` berisi shell, navigasi, tabel, form, editor dan feedback khusus admin. Import dari route admin saja. Button, Input dan Badge memakai primitive bersama dari `src/components/ui/`; warna menggunakan token desain yang ada.
- Layout protected mendapatkan principal melalui `requirePrincipal()` sebelum merender shell. Penyembunyian menu berdasarkan role hanya bantuan navigasi; query/action tetap wajib memeriksa sesi dan izin di server.
- Sidebar memiliki tree tiga tingkat, navigasi keyboard dan penyimpanan expanded state yang menangani kegagalan localStorage. Lebar desktop 248 px, rail 64 px di bawah 1280 px, drawer di bawah 768 px. Topbar 56 px; header halaman menjadi ringkas setelah scroll 80 px. `FormLayout` menyediakan panel samping 320 px.
- `DataTable` menerima satu halaman hasil query server. Sorting, pencarian, filter, density dan pagination berjalan melalui URL. Consumer wajib menerapkan sort/filter yang diizinkan pada query server, bukan mengirim semua baris ke browser. `lastPageRedirect` mengarahkan halaman di luar rentang ke halaman terakhir.
- Tabel generik menawarkan ukuran 20/50/100. Integrasi Users tetap 20/50 sesuai batas service yang sudah ada; ukuran 100 tidak memperluas batas tersebut. Pencarian dan tombol kembali browser telah diverifikasi pada daftar Users nyata di database uji lokal.
- Form mencakup batas karakter, pemeriksaan copy, slug, locale tabs, pilihan, secret write-only dan kontrol tanggal. Counter menggunakan constraint validation browser untuk memblokir submit yang terlalu panjang. Endpoint consumer tetap harus memvalidasi ulang payload. Tab locale tidak ditampilkan bila hanya satu locale aktif.
- `SortableList` mendukung pointer, keyboard dan tombol naik/turun tanpa drag. Perubahan urutan diumumkan melalui status pembaca layar. Date picker berbahasa Indonesia, minggu dimulai Senin.
- `RichTextEditor` memakai Tiptap dengan output JSON, toolbar, slash menu, paste teks bersih, word count dan pemeriksaan copy. Callback pencarian tautan internal dan pemilihan gambar disediakan sebagai titik integrasi. Consumer bertanggung jawab atas otorisasi pencarian dan validasi URL/data; validasi schema JSON serta renderer publik tetap CPR-31, integrasi media CPR-23.
- Dialog/drawer memakai modal native dengan focus trap, Escape dan pengembalian fokus. Konfirmasi destruktif membutuhkan nama persis. Toast sukses menggunakan loader Lottie light yang sudah ada; reduced motion menampilkan tanda statis dan menonaktifkan transisi/shimmer admin.
- `/admin/ui` adalah galeri komponen dengan autentikasi untuk development lokal. Route mengembalikan 404 dalam production, termasuk untuk Admin yang sudah login. Data pada galeri tidak disimpan.

Navigasi ke halaman yang belum diimplementasikan disiapkan untuk tiket consumer. Command palette, notifikasi, profil pengguna, grafik dashboard, SEO panel dan media picker tidak diselesaikan oleh tiket kit ini. Search trigger menerima implementasi consumer; keadaan belum tersedia diberi penjelasan.

## Dependency dan lisensi

Versi dipin dalam package dan lockfile; versi dan lisensi diperiksa ulang melalui `npm view` pada 16 Oktober 2026, serta dibandingkan dengan metadata paket yang terpasang.

| Paket | Versi | Lisensi |
| --- | --- | --- |
| `@tanstack/react-table` | 9.3.1 | MIT |
| `@dnd-kit/core` | 6.3.1 | MIT |
| `@dnd-kit/sortable` | 10.0.0 | MIT |
| `@dnd-kit/utilities` | 3.2.2 | MIT |
| `@tiptap/core`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit` | 3.32.0 | MIT |
| `react-day-picker` | 10.0.2 | MIT |
| `date-fns` | 4.4.0 | MIT |
| `lucide-react` | 1.57.0 | ISC |

Recharts dan command palette belum ditambahkan. Tidak ada migration database dalam CPR-80.

## Bukti verifikasi, 16 Oktober 2026

- Unit: 115 file, 1.956 tes lulus. Database: 13 file, 51 tes lulus pada PostgreSQL disposable. HTTP production: 9 file, 62 tes lulus. Lint, typecheck, format dan production build lulus.
- Tes HTTP baru memeriksa redirect Users dari halaman di luar rentang sambil mempertahankan filter/ukuran halaman, serta penolakan galeri UI dalam production.
- Regresi yang diperbaiki dengan bukti gagal kemudian lulus mencakup dua tab stop akibat label sidebar berulang dan alternatif reorder melalui tombol.
- Browser lokal: login dan daftar Users, pencarian/empty state/tombol kembali, drawer dan tree keyboard, popover/Escape/fokus, kalender Indonesia, rich text/word count, reorder melalui tombol dan keyboard, serta toast telah diperiksa. Fixture berada di database lokal terisolasi.
- Lebar 1440 px, 1024 px dan 320 px diperiksa. Sidebar mengikuti breakpoint; halaman 320 px tidak memiliki overflow horizontal. Topbar mobile yang sebelumnya terbungkus telah diperbaiki dan diukur kembali.
- Isolasi bundle: 15 manifest route publik tidak mereferensikan komponen admin. Traversal 81 modul sumber dari 15 client entry publik tidak menemukan import library khusus admin; 16 script yang dimuat oleh 14 halaman HTML publik tidak memiliki marker library admin yang diperiksa. Pemeriksaan ini berlaku pada build tersebut, bukan jaminan untuk import baru di tiket berikutnya.

Untuk mengulang, gunakan Node sesuai `package.json`, jalankan setup environment dan database test terisolasi, lalu `npm test`, `npm run test:prepare`, `npm run test:database`, `npm run lint`, `npm run typecheck`, `npm run format:check`, dan `npm run build`. Untuk HTTP production, jalankan `npm run test:server` dan `npm run test:integration` pada URL loopback yang sama melalui `TEST_AUTH_URL` dan `TEST_BASE_URL`. Pemeriksaan jalur Cloudflare memakai `CLIENT_IP_MODE=cloudflare` serta `CLOUDFLARE_ORIGIN_LOCKED=true` khusus proses test, bukan sebagai bukti firewall production.

## Penyelarasan brand dan regresi, 17 Oktober 2026

Basis pemeriksaan: `development` 55c3312 (termasuk Makefile/setup terbaru), sudah memuat `main` 0bc43f8. Perubahan development terbaru meliputi CMS konten, dashboard, profil, prospek dan dukungan bahasa Indonesia. Keterangan dependency dan cakupan kit di atas merupakan kondisi pengiriman 16 Oktober; consumer berikutnya sudah menambahkan profil, Recharts dan integrasi CMS.

- Login, shell, form lama Pengguna/Log audit, panel CMS dan grafik mengikuti token semantik landing page: font, warna, radius, bayangan, tombol dan tema terang/gelap. Login tetap memakai alur autentikasi yang sama.
- Status dokumen dipindah ke modul murni bersama. Sebelumnya daftar Blog yang dirender server memanggil ekspor dari editor client dan menghasilkan error 500 saat ada artikel. Browser production lokal membuktikan daftar Blog dan editor kembali terbuka; daftar Karya juga terbuka, dengan keadaan kosong pada fixture ini.
- Filter GET Lead/Waitlist menonaktifkan pemulihan nilai otomatis browser agar pilihan filter sesuai URL dan hasil ketika pengguna menekan Back. Diuji dari tiga baris demo, filter satu baris, lalu Back kembali ke Semua/tiga baris pada kedua daftar.
- Grid dashboard dapat menyusut sampai lebar 320 px. Area grafik membatasi overflow tooltip Recharts yang menyimpan koordinat lama setelah resize. Skenario desktop dengan tooltip kemudian diperkecil ke 320 px menghasilkan lebar dokumen 320 px.

Verifikasi lokal pada Node 24/PostgreSQL 17: 197 file/2.981 tes unit dan 34 file/115 tes database lulus; build production, typecheck, lint dan format lulus. Dua tes status dokumen mencakup terjemahan belum tersedia, draf, terbit dan perubahan isi/slug, termasuk kesetaraan urutan properti JSON.

Browser production lokal: login/logout/login ulang akun QA, tema terang/gelap, dashboard dan alternatif tabel dengan keyboard, navigasi drawer/tree, Blog/editor, Karya, filter Lead/Waitlist, simpan pengaturan situs tanpa perubahan isi, profil dan tampilan form Pengguna. Login/dashboard/profil diperiksa pada lebar 320 px; desktop pada 1440 px. Ini pemeriksaan alur yang disebutkan, bukan seluruh kombinasi form. Ganti password dan upload media tidak diuji ulang melalui UI pada pekerjaan ini. Tidak ada pengiriman email atau verifikasi deployment Vercel.

Pemeriksaan build memindai 67 chunk client terhadap nilai rahasia lokal dan nama environment storage, serta 15 manifest publik dan 110 modul sumber yang terjangkau dari 23 client entry publik; tidak ditemukan kebocoran yang diperiksa atau dependensi admin dalam graf publik. Suite HTTP production tidak dijalankan ulang pada pekerjaan penyelarasan ini.

## Konsistensi dimensi dan alignment, 17 Oktober 2026

Tindak lanjut review Founder setelah PR #97, berbasis `development` 3318a92. Kontrol sebelumnya bercampur 36/40/48 px; pagination memakai select native setinggi 18,5 px. Posisi teks Koleksi/Blog/Artikel terukur 70/56/56 px karena selector membaca wrapper daftar sebagai kedalaman submenu. Pada lebar tablet, selector yang sama juga menyembunyikan daftar menu tingkat pertama.

- `--admin-control-height: 40px` menjadi acuan button, input satu baris, select, pagination dan aksi ikon. Login mempertahankan target 44 px untuk field dan submit. Ikon kontrol 16 px; ikon navigasi 18 px. Tombol ikon memakai kotak 40 × 40 px, termasuk avatar akun berukuran 24 px di dalamnya.
- Indentasi mengikuti `aria-level`, dengan posisi label desktop 52/68/84 px. Hanya grup anak (`treeGroup`) yang menjadi flyout pada rail; menu tingkat pertama tetap terlihat. Ketiga tingkat tetap mendukung keyboard.
- Filter Lead memakai enam kolom sama lebar pada desktop, tiga kolom pada tablet, satu kolom pada mobile. Filter lainnya dan toolbar tabel menyelaraskan tombol dengan bagian bawah field. Keterangan filter audit dipindah ke bawah agar tidak menggeser input pertama.
- Dropdown akun dan pilihan kolom memakai tinggi baris 40 px, padding dan ikon seragam; judul pilihan kolom berada di dalam popup. Checkbox/radio memakai warna brand. Drawer menetapkan batas lebar eksplisit agar tidak dibatasi maksimum bawaan dialog browser.
- KPI mengikuti susunan 4/2/1 kolom dengan tinggi seragam. Aksi grafik memakai tombol ikon berlabel aksesibel; judul dan tombol grafik memakai tinggi header sama, dengan isi grid ditambatkan ke atas agar bar dan donut tidak menggeser baseline header.

Verifikasi: suite unit 197 file/2.981 tes lulus; setelah penyesuaian visual terakhir, 8 file/31 tes komponen admin dan grafik juga lulus. Production build, typecheck, lint dan format lulus. Tidak ada perubahan schema, query, role atau autentikasi; suite database dan HTTP tidak diulang untuk perubahan presentasi ini.

Browser production lokal memverifikasi lebar 1440, 1024 dan 320 px: filter Lead sama tinggi/lebar per baris, filter Audit memiliki baseline sama, rail tablet terlihat dan flyout dapat dibuka dengan keyboard, drawer mobile selebar viewport, dropdown kolom bisa menyembunyikan/menampilkan kolom, toggle grafik tetap berjalan dengan keyboard, serta kontrol editor artikel setinggi 40 px. Tema terang dan gelap diperiksa. Topbar memakai permukaan solid agar backdrop blur tidak merambat ke judul halaman ketika dropdown akun dibuka. Screenshot dan pengukuran disimpan lokal sebagai bukti review.
