# CPR-24 | [Admin] Pengguna, hak akses, dan lockout login

**Tanggal:** 15 Oktober 2026. **Status:** rancangan untuk review Founder; belum merupakan implementasi atau bukti fitur selesai.

**Acuan:** [PRD Rev. 2 §9.3](../../prd/2026-10-14-company-profile-prd.md), [CPR-24](https://linear.app/sineva-tech/issue/CPR-24/admin-kelola-pengguna-peran-admineditor-and-lockout-login), dan fondasi CPR-7 yang telah merged ke `main` pada `641d867d863010ccbc96780d9930335f837de5a2`.

## Tujuan dan batas

Founder dapat mengelola akun penulis/freelancer tanpa memberikan akses ke data lead. Editor tetap dapat mengelola konten melalui tiket fitur berikutnya. Pengguna anonim tidak mendapat akses admin, dan percobaan login berulang tidak melewati lockout akun melalui permintaan HTTP langsung atau permintaan konkuren.

Keputusan produk yang sudah ada: Next.js admin custom, Better Auth 1.7.7, PostgreSQL/Drizzle, dua peran `admin`/`editor`, signup tertutup, bootstrap Admin melalui operator, lockout 15 menit setelah lima kegagalan berturut-turut. Bahasa UI admin adalah Indonesia.

Usulan detail pengelolaan akun untuk review: Admin dapat membuat Editor dengan password awal, mengubah nama/email Editor, menonaktifkan/mengaktifkan Editor, dan mengganti password Editor. UI tidak membuat/mempromosikan Admin, tidak mengubah akun Admin, dan tidak menghapus akun secara permanen. Pembatasan target diperiksa server; field role dari client ditolak. Email undangan dan forgot-password mandiri menunggu integrasi email, bukan dibuat secara parsial dalam CPR-24.

Tidak termasuk form konten, upload R2, preview konten, Leads/Waitlist/CSV, email nyata, CI/deployment, atau perubahan logo. CPR-24 menyiapkan dan membuktikan guard yang wajib dipakai tiket-tiket tersebut; tidak membuat endpoint kosong untuk fitur yang belum ada.

## Pilihan pendekatan

1. **Direkomendasikan: kebijakan aplikasi pada batas server dengan transaksi PostgreSQL.** Better Auth tetap mengelola credential/session. Fitur Users memakai server query/action berizin; batas login HTTP menerapkan lockout dan memanggil handler library. Transaksi dan lock database menyatukan pemeriksaan serta hasil autentikasi. Konsekuensi: binding adapter pada transaksi dan kegagalan di tengah operasi harus dibuktikan lewat regresi.
2. **Hooks library sebelum/sesudah login.** Lebih sedikit perubahan pada route, tetapi kepemilikan lock dan pembersihan ketika handler gagal menjadi tersebar. Counter atomik saja tidak menjamin permintaan valid yang konkuren tidak melampaui batas kelima.
3. **Endpoint login terpisah atau rate limit saja.** Ditolak: jalur handler library bisa melewati kebijakan, atau batas per IP tidak memenuhi lockout akun pada PRD.

## Fitur Users dan alur UI

- `/admin/users`: daftar pengguna dengan nama, email, peran, dan status aktif; hanya Admin dapat membaca. Pencarian nama/email dan pagination dibatasi server, dengan proyeksi field aman tanpa hash/token.
- `/admin/users/new`: form nama, email dan password awal 12–128 karakter. Role dibuat sebagai `editor` di server. Password tidak dikembalikan sebagai hasil action, disimpan dalam URL, atau dicetak pada log.
- `/admin/users/[id]`: form nama/email serta tindakan terpisah aktif/nonaktif dan ganti password untuk target Editor. Nama/email divalidasi dan email dinormalisasi; constraint unik database menjadi perlindungan terakhir untuk konflik konkuren.
- Admin ditampilkan sebagai akun yang tidak dapat diubah melalui form Editor. Tindakan terhadap ID akun Admin, diri sendiri, atau role tak dikenal ditolak server.
- Nonaktif menggunakan ban library dan pencabutan session. Penggantian password menggunakan API library dan pencabutan seluruh session target dalam transaksi yang sama. Aktif kembali tidak memulihkan session lama.
- Editor tidak melihat menu Users. Akses langsung ke halaman Users ditolak; pemanggilan query/action secara langsung juga ditolak. Form memiliki label, error aman, status loading, dan navigasi keyboard sesuai shell CPR-7.

Tabel/session/credential auth tetap berasal dari generator Better Auth. Fitur Users memiliki validasi, query, service transaksi, action, dan komponen sendiri di `src/features/users/`; konfigurasi library tetap di `src/lib/auth/`.

## Otorisasi server

`Principal` tetap hanya ID, nama dan role yang dikenal. Session dibaca server dengan cookie cache dimatikan; status banned dan peran pengguna terkini menjadi bagian pemeriksaan. Session revoked/expired, pengguna nonaktif, role kosong/tak dikenal dan pengguna yang sudah tidak ada gagal tertutup.

Capability yang dipertahankan:

| Capability        | Admin | Editor |
| ----------------- | ----- | ------ |
| `content:write`   | Ya    | Ya     |
| `users:manage`    | Ya    | Tidak  |
| `leads:manage`    | Ya    | Tidak  |
| `waitlist:export` | Ya    | Tidak  |

Setiap query/action Users memanggil guard sendiri. Service mutation mengonfirmasi ulang aktor dan target dalam transaksi; mengambil ID/role target dari database, bukan mempercayai hidden input. Target mutation dibatasi Editor. Operasi penggantian identitas/password/status diserialisasi terhadap target agar session lama dan login konkuren tidak mempertahankan akses yang sudah dicabut.

Guard bersama diuji dengan session Admin, Editor dan anonim. Role berubah pada database harus langsung memengaruhi permintaan berikutnya; role/session tidak masuk cache publik. Tiket upload, preview dan ekspor wajib memanggil capability pada batas server masing-masing saat diimplementasikan.

Handler HTTP auth tetap allowlist endpoint fondasi. Endpoint admin/operator library seperti create-user, set-role, set-user-password, impersonation dan user CRUD tidak dibuka sebagai API browser generik. Server action memanggil API library setelah guard aplikasi lulus; API tanpa headers hanya boleh berada pada bootstrap operator yang telah ada.

## Lockout akun dan konkurensi

Tambahkan schema aplikasi `auth_lockout` di fitur auth, terpisah dari schema library yang dihasilkan. State terkait ID pengguna melalui foreign key, dengan `failed_attempts` dan `locked_until` memakai waktu database. Migration bersifat aditif dan tidak mengubah password hash atau membuang data lama.

Aturan deterministik:

1. Email login dinormalisasi menggunakan aturan yang sama dengan akun. Request malformed tidak menjalankan operasi auth dan tidak menjadi kegagalan password.
2. Seluruh POST login email/password melewati satu policy runner. Jalur UI dan HTTP langsung identik; tidak menambah jalur login alternatif.
3. Pemeriksaan state, verifikasi library, pembaruan counter dan pembuatan session untuk akun yang sama diserialisasi dalam transaksi. Lock menunggu dengan timeout terbatas; error lock/database menghasilkan kegagalan aman, tanpa meneruskan login di luar transaksi.
4. Empat kegagalan pertama menaikkan counter. Kegagalan kelima mengatur `locked_until = waktu database + 15 menit`. Percobaan selama lock tidak memperpanjang durasi atau menghasilkan session, walau password benar.
5. Setelah lock berakhir, counter direset sebelum evaluasi berikutnya. Login sukses pada akun yang tidak terkunci mereset counter. Error infrastruktur dan penolakan rate limit tidak dicatat sebagai kegagalan password.
6. Counter disimpan hanya untuk akun terdaftar; email tak terdaftar tetap diproses melalui mekanisme kegagalan credential library tanpa membuat baris account/lockout baru.
7. Password salah, email tak terdaftar, akun nonaktif dan akun terkunci mengembalikan status/struktur pesan generik yang sama. Tidak menampilkan keberadaan akun, hitungan gagal, waktu unlock atau identitas pengguna. Pemeriksaan timing memakai pekerjaan password dari library pada jalur terkunci; tidak membuat algoritma hashing sendiri atau memberi jaminan waktu konstan yang belum dibuktikan.

Transaksi mengikat Drizzle adapter pada transaction database yang sama, sebagaimana pola bootstrap CPR-7. Untuk login, response/session baru hanya dikembalikan setelah transaksi selesai. Adapter, rate-limit storage, nested transaction, penanganan error Response library, dan pembaruan counter diuji pada library/driver terpasang sebelum pola ini digunakan.

Operasi user management dan login menggunakan urutan lock yang konsisten. Verifikasi bahwa ban/password change yang bersamaan dengan login tidak meninggalkan session valid untuk password/akses lama merupakan bagian acceptance. Timeout harus melepaskan koneksi/lock; tidak menelan error dan melanjutkan auth.

## Konsistensi credential dan session

API yang diverifikasi tersedia pada Better Auth terpasang: `createUser`, `adminUpdateUser`, `banUser`, `unbanUser`, `setUserPassword`, dan `revokeUserSessions`. `banUser` mencabut session; `setUserPassword` sendiri tidak mencabut session sehingga service aplikasi harus menyatukan penggantian password dengan revokasi dalam transaksi.

Create Editor harus atomik untuk user dan credential, mengikuti regresi bootstrap CPR-7. Update email/password/status dan revokasi session juga atomik. Nama/email baru tidak mengubah role. Tidak meneruskan object `data` arbitrary dari client ke API library.

## Bukti yang diperlukan

- Unit: validasi nama/email/password, whitelist field, role/capability matrix, batas waktu/count lockout, dan mapping error generik.
- PostgreSQL: migration ulang, dua create Editor dengan email sama, rollback user/credential, lima kegagalan diserialisasi, burst login konkuren termasuk password benar di sekitar kegagalan kelima, timeout/release lock, reset sukses/unlock, serta ban/password reset bersamaan dengan login.
- HTTP production: login UI/direct handler melewati policy yang sama; signup/operator HTTP tetap ditutup; status/body kegagalan tidak membedakan akun; session revoked/expired dan role terbaru ditolak sesuai izin.
- Query/action: Admin sukses, Editor/anonim gagal; input ID/role/banned palsu tidak memperluas akses. Guard future-capability diuji tanpa membuat API Leads/Waitlist palsu.
- Browser production: Admin membuat/mengedit/nonaktif/mengaktifkan Editor dan mengganti password; Editor login, melihat dashboard tanpa Users, dan gagal membuka Users langsung; logout/login dan lockout. Periksa responsif, label/fokus dan console. Fixture hanya di DB test; file/password tidak dipublikasikan.
- Quality gate: unit/database/HTTP suites, lint/typecheck/format/build dan review independen atas otorisasi, konkurensi dan redaksi log sebelum PR siap review.

## Handoff dan sumber

Rancangan ini mengikuti scope akun Editor pada PRD; detail aktif/nonaktif dan penggantian password di atas merupakan usulan yang perlu disetujui Founder. Setelah rancangan disetujui, rencana implementasi akan memecah schema/policy, Users service/UI, integration/browser acceptance dan review menjadi pekerjaan yang dapat diverifikasi.

Dokumentasi resmi dan kode terpasang diperiksa melalui Context7 dan `node_modules`:

- [Better Auth admin plugin](https://better-auth.com/docs/plugins/admin).
- [Kode admin routes resmi](https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/admin/routes.ts).
- [Konsep transaksi adapter](https://github.com/better-auth/better-auth/blob/main/packages/core/src/context/transaction.ts).

Context7 tidak menyediakan pin dokumentasi 1.7.7 pada hasil resolusi; nama/perilaku API relevan dikonfirmasi terhadap paket 1.7.7 lokal. Ini tidak menyatakan bahwa callback handler telah diuji dalam transaksi; pembuktian runtime tersebut termasuk tes implementasi di atas.
