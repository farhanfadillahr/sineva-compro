# Custom media admin (CPR-23)

Pekerjaan ini berada di `development`, dengan satu agen dan PR tersendiri. Main disinkronkan sebelum implementasi melalui PR #48. Website publik statis Faishal tidak diganti oleh modul ini; tiket konten berikutnya memakai kontrak media untuk menghubungkan konten database.

## Setup lokal

1. Ikuti [runbook SeaweedFS](seaweedfs.md) untuk gateway dan bucket. Gunakan identity **app** yang hanya memiliki izin media, bukan bootstrap atau backup.
2. Isi environment server pada `.env` privat, jangan commit credential atau menambah prefix `NEXT_PUBLIC_`:

| Variable | Isi |
| --- | --- |
| `STORAGE_ENDPOINT` | Endpoint S3 gateway, lokal `http://127.0.0.1:8333` |
| `STORAGE_CONFIRM_ORIGIN` | Origin yang sama persis, sesudah target diperiksa; diwajibkan oleh guard untuk production/remote |
| `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY` | Credential identity app, dari secret manager atau file privat hasil CPR-67 |
| `MEDIA_PREFIX` | `local`/`test` untuk loopback; `preview-<id>` atau `production` untuk remote |
| `MEDIA_PUBLIC_ORIGIN` | Opsional, origin CDN tanpa path, query atau credential; harus sama saat build dan runtime |
| `ADMIN_ENABLED` | `true` untuk menguji admin pada production build staging; deployment main tetap memakai kebijakan fase publik statis |

3. Jalankan migration `0003_cpr23_media.sql` melalui `npm run db:migrate`. SQL hanya menambah tabel, index, check dan FK media; tidak menghapus atau mengubah tabel konten/auth yang ada. `npm run db:check` memeriksa metadata migration.
4. Buka `/admin/media` dengan akun Admin atau Editor. Upload satu file per request; UI menerima beberapa pilihan sebagai antrean. Alt per locale aktif harus diisi sebelum upload. Pilih detail untuk mengedit alt/caption/kredit/fokus atau mengganti binary dengan jenis media yang sama.

## Batas upload

Image JPEG/PNG/WebP/AVIF maksimal 10 MiB dan sisi terpanjang 6000 px. Gambar multi-frame ditolak agar proses normalisasi tidak diam-diam membuang frame. MP4/WebM maksimal 20 MiB; PDF maksimal 10 MiB. SVG ditolak. Signature diperiksa dari byte; nama file tidak menentukan format. MIME yang diklaim tetapi tidak cocok ditolak. Sharp harus berhasil decode gambar, membatasi pixel, mengoreksi orientasi dan encode ulang tanpa EXIF/XMP. Metadata yang tersimpan memakai dimensi, hash dan warna dominan hasil bersih.

Endpoint membaca stream dengan batas 20 MiB ditambah overhead multipart terbatas, termasuk bila Content-Length palsu atau tidak tersedia. Metadata JSON memiliki batas terpisah. Mutasi memeriksa sesi/role dan Origin sebelum membaca body, kemudian memeriksa kembali principal dalam transaksi. Alt, caption dan kredit memakai validator copy bersama; focal point 0..1. Library dan preview tidak dicache publik.

## Kontrak untuk tiket konten

Gunakan `MediaService.withReferences(headers, owner, refs, callback)` untuk mengubah satu dokumen beserta semua referensinya. `owner` berisi entity/ID/label yang ditentukan service konten; `refs` adalah seluruh daftar field media dokumen tersebut, dengan ID media dan status publish. Jangan membentuk label, entity atau field dari data yang tidak tervalidasi. Editor tidak dapat memasang referensi untuk settings.

Wrapper mengunci owner dan baris media, memeriksa alt semua locale aktif, menyalin versi privat ke bucket publik jika diperlukan, menyimpan usage, lalu memanggil callback dengan transaksi dan DTO publik per field. **Callback harus menulis dokumen menggunakan transaksi itu dan mengaudit perubahan dokumen di transaksi yang sama.** Validasi schema dokumen, termasuk field yang wajib berupa gambar, tetap tanggung jawab service dokumen. Jangan menulis dokumen melalui koneksi lain atau mempublikasikannya sesudah wrapper selesai. Daftar referensi kosong melepas semua pemakaian owner.

Copy, audit atau callback yang gagal membatalkan perubahan database. Cleanup hanya menghapus key baru yang tidak terikat record terkomit. Bila status commit tidak dapat dipastikan karena database tidak tersedia, object dipertahankan untuk pemeriksaan operator, sehingga kompensasi tidak merusak publikasi yang mungkin sudah berhasil. Copy yang berhasil tetapi tidak dikomit tidak mendapat route delivery publik.

Mengganti file mempertahankan ID media, memakai key acak/hash baru dan membersihkan versi **privat** sebelumnya setelah commit. Bila masih dipakai konten terbit, versi baru disalin sebelum perubahan dikomit. Delivery publik lama tetap immutable agar halaman/cache lama tidak rusak. Menghapus media yang memiliki usage ditolak dengan daftar lokasi pemakaian. Penghapusan dari pustaka memakai soft-delete; cleanup privat berlangsung sesudah commit dan menyimpan `cleanup_pending` bila perlu retry. DELETE terhadap ID yang sudah soft-delete dapat diulang oleh operator. Arsip publik tidak dipurge otomatis; tentukan retensi dan invalidasi CDN sebelum penghapusan fisiknya.

## Delivery dan pemilih gambar

Draft preview hanya dapat diminta akun berizin; route mengarahkan ke presigned GET berumur maksimal 120 detik. UI memakai gambar tanpa optimizer untuk preview privat. Jangan menyalin URL preview ke dokumen publik.

Setelah publish, `getPublicMedia` mengembalikan URL, alt, dimensi, blur placeholder nullable dan warna dominan. Query dibatasi prefix lingkungan serta locale aktif; tidak mengembalikan ID media, bucket, key atau path storage sebagai field. `media_delivery` menyediakan identifier URL acak terpisah dari ID media dan key S3. Route `/api/media/public/<asset>` melayani hanya delivery yang sudah terkomit, termasuk HEAD dan byte range, dengan tipe hasil validasi dan `nosniff`. PDF dikirim sebagai attachment.

Tanpa `MEDIA_PUBLIC_ORIGIN`, URL memakai origin aplikasi untuk verifikasi lokal. Host CDN yang dikonfigurasi perlu meneruskan `/api/media/public/*` ke aplikasi, bukan membuka bucket privat. Remote pattern Next image hanya mengizinkan host tersebut dan path delivery publik. `PublishedMediaImage` memakai DTO image untuk responsive `next/image`; optimizer tetap menolak preview privat walaupun pemanggil memiliki cookie admin. Jangan mengaktifkan `dangerouslyAllowLocalIP` untuk mengakali host lokal: URL relatif aplikasi sudah mendukung uji optimizer.

`MediaPicker` menampilkan image terhalaman dan pencarian. `ImageField` menyediakan pemilihan, alt locale aktif dan focal point pointer/keyboard. Komponen tidak menulis dokumen secara otomatis; consumer menyimpan ID melalui service kontennya. Fitur gallery multi-field/rich text menggunakan callback picker yang sama, dengan validasi dokumen masing-masing.

## Seed

`npm run db:seed -- --module=media` tidak membuat data palsu pada mode base. `--demo` membuat satu **fixture metadata yang ditandai demo**, tanpa melakukan mutasi S3 atau mengaku memiliki binary nyata. UI menjelaskan status contoh, tidak menampilkan preview rusak, dan publish ditolak sampai file diganti dengan upload nyata. `--purge-demo` idempotent dan hanya menghapus fixture yang seluruh identitas/metadata-nya belum diedit serta tidak memiliki usage/delivery. Seed tidak menghapus file remote. Guard database remote/production tetap berlaku; jangan menambah flag bypass untuk data production.

## Verifikasi

Tes kontrak store, sniffing/batas/EXIF, byte stream, lifecycle, audit rollback, locale dan seed dibuat dengan bukti gagal lalu lulus untuk perilaku yang ditambahkan. Database verifikasi PostgreSQL 17 terisolasi menerapkan migration dari kosong. Tes adapter berjalan terhadap Compose SeaweedFS 4.48: put/get/head/delete/list/copy, presigned GET/PUT nonempty, multipart 6 MiB dan cleanup prefix sendiri.

Gunakan Node dari `.nvmrc`. Unit: `npm test -- --maxWorkers=2`; batas worker menghindari kontensi tes kompresi asset Sino. Database: `npm run test:prepare` lalu `npm run test:database`, dengan DB test **kosong dari akun QA manual**. Akun browser harus berada di DB aplikasi terpisah. HTTP: jalankan `npm run test:server -- --production` dan `npm run test:integration` dengan `TEST_AUTH_URL`/`TEST_BASE_URL` loopback yang sama. Media HTTP suite memerlukan SeaweedFS lokal dan identity app. Tes storage: `npm run test:storage` dengan direktori credential privat CPR-67; tidak menjalankan operasi pada backend production.

Lanjutkan dengan lint, typecheck, format, build dan scan semua JS client terhadap nilai credential serta nama env storage. Periksa juga manifest/import publik agar library khusus admin tidak masuk route publik. Simpan screenshot QA lokal setelah upload/edit/replace dan pemeriksaan overflow mobile. VPS, domain, CDN production dan kebijakan purge arsip tetap memerlukan pekerjaan operasional yang terpisah dari pembuktian lokal tiket ini.

### Hasil lokal, 16 Oktober 2026

- Unit: 159 file, 2.567 tes lulus; setelah perapihan kontrol upload, empat tes interaksi media diulang dan lulus. Database: 15 file, 59 tes lulus. HTTP production: 10 file, 66 tes lulus. Storage Compose: dua file/dua tes lulus, mencakup matrix CPR-67 dan kontrak adapter CPR-23.
- Migration diterapkan ke database aplikasi/test kosong. `db:check` lulus; generate schema ulang menyatakan tidak ada drift. Lint, typecheck, format dan production build lulus. Sharp 0.35.5 dipin langsung; versi/lisensi Apache-2.0 dicek lewat registry npm.
- Scan build client: 43 chunk JS tidak memuat nilai credential atau nama env storage yang diperiksa; 15 manifest route publik dan 94 modul sumber yang terjangkau tidak mengimpor komponen/library khusus admin atau AWS SDK.
- Browser: akun QA memakai DB aplikasi terpisah. Upload dengan alt wajib, edit alt/caption/kredit, slider keyboard, replace, reload, picker, pencarian/empty state/tombol kembali telah diperiksa. Pada 320 px, landscape dan portrait tidak membuat halaman/drawer overflow; pesan simpan berada di dalam modal. Desktop 1440 px juga diperiksa. Fixture sepenuhnya lokal, tidak menjadi konten publik perusahaan.
