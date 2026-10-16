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
