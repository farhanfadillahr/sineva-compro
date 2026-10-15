# CPR-24 — Bukti pengelolaan Editor dan lockout

Tanggal: 15 Oktober 2026 (Asia/Jakarta). Metode: Native sesuai persetujuan Founder. Base merged CPR-7 `641d867d863010ccbc96780d9930335f837de5a2`; UI/services pada `fcdcec6cfdda83dc97ad1600d67396288169ec04`; perbaikan review dan source final pada `7ea9bb3`. Status bukti: tes otomatis final lulus dan seluruh temuan review ditangani; Founder memilih melewati submission UI ganti password dan memakai bukti tes otomatis. Ini bukan bukti merge/deploy.

## Cakupan yang diuji

- Unit **77/77**: role/capability, lockout kelima/expiry/reset, parser login bounded 8 KiB, normalisasi/whitelist/credential bounds, input Users dan aturan fondasi.
- PostgreSQL final **34/34**: migration/constraint/FK cascade, bootstrap/CLI, lima kegagalan multi-IP dan konkuren, valid-versus-fifth race, expiry/success reset, locked valid password, generic unknown/banned/wrong/locked, CSRF/callback/IP limiter, lock timeout/release, rollback session insert, Users Admin/Editor/anon, role/banned/revoked/expired fresh, literal search/pagination, duplicate email, atomic user/credential, password revocation rollback, ban/password-versus-login races, action real-auth guard dan payload/duplicate/File spoofing; regresi email reassignment setelah lookup kosong, repeated failed BEGIN recovery, active socket error sanitization/discard, dan demosi aktor selama mutation menunggu row lock.
- HTTP production **11/11**: actual Next auth route, signup/operator closure, dashboard/logout/expired/forged session, persisted lockout dan oversized/malformed body, Admin Users pages/noindex/safe fields serta anon/Editor direct route denial. Pemeriksaan denial mencakup tidak adanya form/DTO target di HTML/RSC; metadata judul halaman statis bukan data akun.
- Lint, typecheck, formatter repo, build production, `db:check` lulus. `auth:generate` menghasilkan schema library byte-identik; `db:generate` no-op setelah migration `0001_auth_lockout`.

Command: `npm test`, `npm run test:database`, `npm run test:integration`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:check`, `npm run auth:generate`, `npm run db:generate`. Suite DB dan HTTP dijalankan bergantian pada database test loopback tervalidasi. Run awal production HTTP memakai `npm run test:server -- --production` dengan origin `http://127.0.0.1:3001`. Setelah perbaikan review, seluruh DB suite diulang pada instance disposable Compose `cpr24-verify` loopback 5435 (nama DB tervalidasi sama), lalu build dan HTTP 11/11 dijalankan dari salinan Git byte-identik source commit `7ea9bb3` pada origin/server 3002. Node_modules terpasang disalin, `.env` tidak disalin; env proses memakai DB test baru. Ini menjaga fixture/browser pending pada 3001. Warning Next tentang dua lockfile hanya timbul pada checkout nested sementara; config produk tidak diubah. Server test final, container/network dan salinan build sementara telah dibersihkan.

## Browser production lokal

Browser UI/services commit `fcdcec6` (form tidak berubah pada fix `7ea9bb3`) melalui browser bawaan Codex pada `http://localhost:3001`, runtime process override origin localhost dan DB test yang sama; `.env` tidak diubah.

Lulus: Admin login/logout; create Editor melalui Server Action (pending state terlihat); edit nama/email (success feedback); nonaktif/aktif (status dan tombol berubah); search empty state; Editor login tanpa Users; direct Users menampilkan penolakan tanpa form/data; setelah lima HTTP credential failures dari IP test berbeda, password benar pada browser ditolak generik; expiry hanya fixture disetel lewat SQL, lalu browser login berhasil. IP limiter/CSRF tidak dinonaktifkan.

Responsive: 390×844 dan 1440×1000. Lebar dokumen 390 pada viewport 390, table scroll berada di container. Label input terhubung, password pengganti kosong, fokus Tab pada tombol Cari terlihat dengan outline. Tidak ditemukan console JavaScript/hydration warning/error selama alur positif dan denial route; hasil HTTP negatif yang sengaja dipicu dicatat terpisah dari error JavaScript.

Screenshot chat: `cpr24-users-desktop.png`, `cpr24-editor-mobile.png`, `cpr24-password-handoff.png` pada direktori visualisasi chat, di luar repo. Tidak menyimpan screenshot password/token.

Founder memilih “Lewati tes UI password; gunakan bukti tes otomatis” melalui chat. Ganti password telah lulus tes action/library/transaksi/revokasi dan form browser dirender kosong; submission browser sengaja tidak dijalankan dan tidak diklaim lulus. Ini pengecualian acceptance yang disetujui, bukan bukti manual.

## Migration dan data

Developer DB `sineva_compro_app` diinventaris sebelum migration: **0 user, 0 session**. Migration `0001_auth_lockout` aditif diterapkan eksplisit melalui `npm run db:migrate`; hanya tabel aplikasi/FK/check baru. Database dan volume Payload lama tetap dipertahankan. Test prepare dua kali lulus, journal mencegah reapply.

Dua akun fixture browser pada `sineva_compro_app_test` telah dihapus hanya berdasarkan ID/email miliknya; FK mencabut session dan lockout terkait. File credential ignored mode 600 telah dihapus. Tidak ada credential yang dicetak atau dimasukkan ke Git. Tidak ada migration remote/production, email nyata, merge atau deploy.

## Review independen

Reviewer fresh-context membaca range `641d867..fcdcec6` terhadap spec/plan, semua source/tests dan kontrak Better Auth 1.7.7/Drizzle terpasang. Tidak menjalankan shared DB atau melihat credential ignored. Tidak ada Critical; verdict awal “No” dengan dua Important dan satu Minor. Severity socket error dinaikkan menjadi Important karena exception mentah melampaui safe-failure/log contract.

Ketiga temuan direproduksi sebelum fix: race email baru menghasilkan HTTP 200/session saat target locked, tiga failed BEGIN menahan tiga checkout, active socket event melempar detail mentah. Commit `7ea9bb3` mengatasinya: hook menolak session kecuali userId sama dengan row target yang telah dikunci; factory pool memiliki wrapper transaction yang menjamin release/discard dari acquisition sampai BEGIN/rollback/commit; client error listener selalu memakai kategori tetap dan menolak commit pada connection fault. Keempat regresi (termasuk demosi saat wait) GREEN, full unit 77/77, DB 34/34 dan HTTP production 11/11 GREEN. Perbaikan diverifikasi oleh regresi/suite, tanpa mengklaim reviewer melakukan persetujuan kedua.

Tidak ada minor yang ditunda. Rulings coordinator:

| Keputusan                                                                                           | Alasan                                                                  | Biaya bila keliru                                       |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Parser FormData/page interrupt/feedback dipisah menjadi file kecil                                  | Memisahkan client/server dan menghindari duplikasi                      | Tambahan file untuk dirawat                             |
| Socket error dinilai Important                                                                      | Mencegah exception/log transport mentah                                 | Tambahan regression/guard                               |
| Akuisisi/release pool dimiliki aplikasi; discard setiap exception transaction                       | BEGIN di luar finally Drizzle dan state rollback dapat tidak pasti      | Reconnect lebih sering untuk transaksi gagal            |
| Session harus sesuai row yang dikunci, termasuk target kosong                                       | Mencegah email baru muncul di lookup library lalu melampaui lockout     | Login mungkin perlu diulang saat email diubah bersamaan |
| Browser acceptance dipenuhi coordinator; password submission kemudian dilewati atas pilihan Founder | Aturan computer-use credential dan bukti otomatis dipertahankan         | Submission UI password tidak diverifikasi secara manual |
| Bukti/README kemudian direview coordinator                                                          | Di luar head reviewer yang dipin                                        | Dokumentasi readiness bisa tidak tepat jika salah       |
| Deployment/credential ignored tetap di luar review ini                                              | Tidak ada deploy/akses production yang dikerjakan                       | Deployment perlu verifikasi sendiri                     |
| Endpoint fitur mendatang tidak dibuat; capability matrix diuji                                      | Scope CPR-24 tanpa dummy API                                            | Fitur mendatang wajib menerapkan guard masing-masing    |
| Full DB/HTTP final di instance/salinan disposable terpisah                                          | Mempertahankan pending fixture browser dan contract bootstrap DB kosong | Resource lokal sementara, kemudian dibersihkan          |

PR semula dibuat draft sambil menunggu handoff. Setelah Founder menyetujui skip submission UI password, acceptance tersebut ditutup dengan bukti otomatis dan pengecualian eksplisit; PR dapat diajukan untuk review tanpa mengklaim tes manual yang tidak dilakukan. Tidak ada izin merge/deploy yang ditambahkan.

## Penutupan setelah keputusan Founder

Setelah skip UI password disetujui, build production di worktree utama diperbarui ke source final dan preview test `http://localhost:3001` dipulihkan. Verifikasi ulang pada DB test asli: PostgreSQL **34/34**, HTTP production **11/11**, unit **77/77**, lint/typecheck/format/build lulus. Setelah fixture suite dibersihkan, DB test berisi **0 user, 0 session dan 0 lockout**. PR #2 diajukan untuk review dengan pengecualian manual yang dicatat; Linear tetap In Progress sampai integrasi.
