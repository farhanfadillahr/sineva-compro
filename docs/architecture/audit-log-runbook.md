# CPR-87: log audit admin

Log audit tersedia di `/admin/audit` di layout admin yang terlindungi. Bahasa UI Indonesia, tabel hanya baca, tanpa ekspor atau aksi hapus. Query `listAuditLog` memverifikasi sesi dan role Admin sendiri, termasuk saat digunakan oleh activity feed dashboard. Editor dan anonim ditolak. Menu navigasi bersama mengikuti CPR-80.

## Data dan transaksi

`src/features/audit/schema.ts` mendefinisikan `audit_log`; migration SQL hasil Drizzle Kit adalah `drizzle/0002_cpr87_audit_log.sql`. Kolom: UUID log, FK actor, nama entitas, ID internal entitas, tindakan, array nama field, waktu UTC, dan penanda demo. Indeks mendukung urutan terbaru serta filter actor/entitas. Waktu pada UI ditampilkan sebagai WIB. Urutan waktu diikat dengan UUID agar paginasi deterministik ketika waktu sama.

Actor hanya menyimpan ID akun; query Admin menggabungkan nama akun saat ini. Email staf, snapshot nama, password/hash, token sesi, header, IP, nilai sebelum/sesudah, judul konten, catatan dan data pribadi lead tidak disimpan. Saat akun dihapus, FK menjadi `NULL`, log tetap ada dan UI menampilkan `Akun telah dihapus`. ID entitas tetap ID internal, bukan email, nomor telepon, nama atau teks formulir.

`writeAudit(tx, actor, entry)` menerima transaksi yang sama dengan mutasi. `actor` harus berasal dari `loadPrincipal`/guard server pada layanan pemanggil. Helper memvalidasi metadata terhadap daftar entitas, tindakan dan nama field yang diperbolehkan di `input.ts`, serta menolak key tambahan seperti `values`, `before`, `after` dan `actorId`. Helper bukan endpoint publik dan bukan pengganti guard izin fitur. Ia tidak membuka transaksi terpisah atau menelan kegagalan: jika insert audit gagal, layanan harus menggagalkan seluruh transaksi.

```ts
await database.transaction(async (tx) => {
  const actor = assertCapability(await loadPrincipal(tx, env, headers), 'content:write')
  // Validasi input, otorisasi resource dan tulis perubahan domain dengan tx.
  await writeAudit(tx, actor, {
    entity: 'pages',
    entityId: internalPageId,
    action: 'update',
    changedFields: ['data'],
  })
})
// Revalidasi cache hanya sesudah transaksi commit.
```

Users sudah mengaudit pembuatan Editor (termasuk penetapan role), perubahan nama/email, aktivasi/nonaktivasi, dan penggantian password. Update nama/email mencatat hanya field yang berubah, tanpa log untuk update identitas yang identik. CPR-24 tidak menyediakan promosi role atau penghapusan akun melalui admin; tiket yang menambah mutasi tersebut wajib memanggil helper yang sama. Bootstrap operator bukan mutasi admin melalui service Users.

## Filter dan activity feed

`listAuditLog(database, env, headers, input)` menerima `actor` (ID akun persis), `entity` (nama entitas persis), `page` dan `pageSize`. Default 20 baris, maksimum 100. Filter digabung dengan AND. UI menyimpan filter di URL dan mereset halaman ketika form filter diterapkan. Halaman di luar hasil diarahkan ke halaman terakhir. Hitungan dan hasil dibaca pada snapshot `repeatable read` yang sama. Hasil tidak dimasukkan ke cache publik.

Contoh URL: `/admin/audit?entity=users&page=1&pageSize=20`. Dashboard Admin dapat memanggil query ini dengan `pageSize: 5`. Tidak tersedia query activity feed tanpa guard atau endpoint publik.

## Migration dan seed lokal

Gunakan env lokal yang menunjuk database baru yang memang boleh diubah. Tidak ada migration saat aplikasi mulai dan tidak ada `db push`.

Pada database kosong, lakukan migration lalu bootstrap Admin pertama **sebelum** demo. Bootstrap sengaja menolak menambah Admin ketika sudah ada akun; actor demo juga termasuk akun. Jika demo terlanjur dibuat, purge demo milik tiket ini lalu jalankan bootstrap. Jangan menghapus akun lain untuk memaksa bootstrap.

```bash
npm run db:migrate && npm run db:seed -- --demo
npm run db:seed
npm run db:seed -- --module=audit --demo
npm run db:seed -- --module=audit --purge-demo
```

`base` idempotent dan aman untuk semua environment. Audit tidak membutuhkan baris struktural, jadi base tidak mengarang peristiwa. `--demo` menjalankan base lalu membuat satu actor `[Demo] Audit actor` ber-ID prefix `demo:`, email `example.com`, role Editor, diblokir, tanpa credential/session. Satu log demo ditandai `is_demo=true` dan ber-ID stabil. Pengulangan tidak menambah atau menimpa baris. Actor dan marker dibuat dalam satu transaksi di bawah advisory lock per modul.

`--purge-demo` memakai guard yang sama dengan `--demo`. Keduanya ditolak untuk target non-loopback atau `NODE_ENV=production` kecuali operator memberikan **kedua** opsi `--confirm-database=<nama>` dan `--allow-demo-on-remote`. Tidak ada URL atau kredensial dalam output CLI. Base tetap dapat dijalankan pada target remote/production tanpa override demo.

Purge hanya menghapus marker audit milik CPR-87 yang terbukti demo. Actor dihapus hanya bila marker membuktikan ia dibuat oleh seed ini, identitasnya masih cocok, dan tidak memiliki credential, session atau log lain. Actor/record yang sudah ada pada ID cadangan tidak diadopsi atau dihapus. Konflik menolak transaksi. Actor demo yang kemudian dipakai oleh catatan nyata atau diubah dibiarkan tetap ada; operator harus meninjau konflik ID secara manual sebelum menjalankan demo lagi. Tidak ada opsi force-delete. Baris demo milik modul/tiket lain tidak disentuh.

Untuk tabel CMS berikutnya, tambahkan modul `SeedModule` dengan `base`, `demo`, `purgeDemo` ke registry `scripts/seed/runner.ts` dan nama modul ke parser opsi. Gunakan ID/key stabil, penanda demo, transaksi dan pemeriksaan kepemilikan. Jangan membuat credential default atau menghapus actor/record yang mungkin sudah dipakai tabel lain. Sebelum menambah FK ke akun demo, perluas pemeriksaan referensi purge agar tidak ada data domain yang berubah akibat penghapusan akun.

## Checklist review untuk tiket admin berikutnya

- Guard izin fitur dan resource pada service/query, termasuk pemanggilan langsung.
- Semua perubahan domain dan `writeAudit` memakai `tx` yang sama. Audit gagal berarti perubahan gagal.
- Perluas registry entitas/field dengan nama schema statis bila diperlukan. Jangan menaruh nilai input, nama orang, secret, pesan error atau data lead dalam metadata.
- Bedakan field yang benar-benar berubah; tetap audit penggantian secret tanpa menyimpan nilainya.
- Test database membuktikan commit, rollback, audit failure dan role denial. Test exclusion memakai nilai sensitif sentinel, bukan hanya nama kolom.
- Migration hasil generator direview; modul base/demo/purge idempotent dan guard target diuji.
- Revalidasi cache/pengiriman pekerjaan hanya setelah commit. Query audit/feed tetap Admin-only.

## Verifikasi

```bash
npm run db:check
npm run test:prepare
npm test
npm run test:database
npm run typecheck
npm run lint
```

Suite DB memakai `readTestEnv`: hanya hostname loopback dan nama `sineva_compro_app_test`. Gunakan cluster terisolasi; test membuat trigger kegagalan sementara pada cluster itu. Test tidak memerlukan Docker atau layanan eksternal. `tests/unit/audit*` memeriksa metadata, guard seed dan UI; `tests/database/audit*` memeriksa transaksi, instrumentasi Users, otorisasi, filter dan kepemilikan seed.

Cluster native yang diinisialisasi dengan timezone host dapat memakai `Asia/Jakarta`. Fixture expiry sesi auth lama memakai SQL `now()` pada kolom tanpa timezone dan mengasumsikan koneksi UTC. Untuk verifikasi suite lama pada cluster tersebut, jalankan `PGOPTIONS='-c timezone=UTC' npm run test:database` serta opsi koneksi sesi yang sama pada server test. Ini tidak mengubah konfigurasi cluster. Timestamp audit sendiri memakai `timestamptz` dan tidak bergantung pada asumsi fixture tersebut. Jalankan suite DB dan pemeriksaan HTTP berurutan: test CLI bootstrap memerlukan database tanpa akun saat test itu berjalan.

## Kebijakan retensi: menunggu keputusan owner

Log berisi identitas staf dan ID internal yang dapat dikaitkan dengan akun. Periode retensi, akses operasional, penanganan penghapusan akun, arsip/backup dan dasar kebijakan privasi belum ditetapkan owner. CPR-87 tidak menetapkan durasi hukum, tidak mengklaim kepatuhan UU PDP, tidak menjadwalkan purge produksi, dan tidak menyediakan penghapusan massal log. `--purge-demo` hanya mengelola fixture demo, bukan kebijakan retensi. Keputusan owner harus dicatat sebelum menambahkan pekerjaan retensi yang destruktif.
