# CPR-23: media custom admin

Pelaksanaan Native, satu agen, sesuai instruksi Founder untuk mengimplementasikan tiket dan langsung merge PR terverifikasi ke development. Main terbaru sudah disinkronkan melalui PR #48 sebelum branch tiket dibuat. Tidak ada perubahan ke sumber konten statis main atau penggunaan headless CMS.

## Tujuan dan pendekatan

Admin dan Editor mengunggah, mencari, memilih, mengganti dan memberi metadata media melalui custom admin. Binary disimpan di SeaweedFS dan metadata di PostgreSQL. Pilihan yang dipakai adalah upload melalui route server dengan batas body, sehingga autentikasi, sniffing dan pembersihan gambar selesai sebelum file disimpan. Direct browser PUT akan memerlukan quarantine/finalize tambahan; presigned PUT tetap diuji pada adapter, tetapi bukan jalur upload UI v1.

## Batas dan validasi

- JPEG/PNG/WebP/AVIF maksimal 10 MiB dan sisi terpanjang 6000 px; MP4/WebM maksimal 20 MiB; PDF maksimal 10 MiB. SVG ditolak. Satu file per request; UI mengantre beberapa request.
- Signature binary diperiksa tanpa mempercayai nama atau MIME yang dikirim. Gambar harus berhasil didecode dengan Sharp, diperiksa dimensinya, diorientasikan, lalu diencode ulang tanpa metadata EXIF/XMP. Hash dihitung dari hasil bersih; dimensi dan warna dominan disimpan.
- Alt diwajibkan untuk setiap locale aktif pada upload dan sebelum publish; metadata draft boleh dilengkapi kemudian. Caption/alt/credit memiliki batas dan memakai copy validator bersama. Focal point memakai rentang 0..1.
- Endpoint mutasi memeriksa origin yang sama, sesi serta role sebelum membaca body. Panjang body dibatasi selama streaming, termasuk request tanpa Content-Length. Validasi metadata diulang pada service; sesi/role dimuat ulang di transaksi.

## Struktur dan kontrak

`src/features/media/` memiliki schema, validasi upload/metadata, service mutasi, query admin/publik dan komponen library/picker. `src/lib/media/` memiliki kontrak MediaStore, fake dan adapter S3 server-only. Adapter memaksa path-style, endpoint eksplisit, credential dari environment server, serta prefix local/test/preview/production yang tidak saling melintasi. Adapter mencakup put/get/head/delete/list/copy/presigned GET/PUT dan multipart di atas 5 MiB, dengan abort saat gagal.

Tabel `media`, `media_translation`, `media_usage` dan `media_delivery` memiliki index, foreign key, unique dan check constraint. Pemakaian menyimpan identitas dokumen/field serta status publish, bukan URL dari input. Delivery mencatat URL publik immutable dengan identifier acak yang terpisah dari ID media, bucket dan object key. File draft tidak memiliki delivery publik.

## Lifecycle

Upload menulis object privat dengan UUID dan content hash. Bila transaksi metadata/audit gagal, object baru dibersihkan. Metadata dan audit memakai transaksi yang sama. Penggantian mempertahankan ID media, membuat key baru, dan menyalin versi baru ke publik bila media masih dipakai konten terbit. Versi publik lama dipertahankan untuk URL immutable yang mungkin masih ada pada halaman/cache lama; penghapusan fisik arsip publik menunggu kebijakan retensi, bukan dilakukan diam-diam.

`withMediaReferences` menjadi pembungkus transaksi bagi tiket konten berikutnya: kunci owner dan media dalam urutan tetap, validasi alt semua locale aktif, salin privat ke publik secara idempotent, simpan usage dan jalankan callback penulisan dokumen pada transaksi yang sama. Kegagalan copy/metadata/audit/callback membatalkan publikasi dan membersihkan object publik baru. Melepas referensi dan menghapus media memakai kunci baris yang sama agar tidak berlomba. Media yang masih dipakai ditolak dengan daftar lokasi pemakaian. Delete dari pustaka bersifat soft-delete; cleanup privat dilakukan setelah commit agar kegagalan audit tidak merusak file yang masih dirujuk.

## Delivery dan UI

Route publik hanya melayani delivery yang sudah dikomit; tidak menerima bucket atau key. URL dapat memakai host CDN eksplisit lewat `MEDIA_PUBLIC_ORIGIN`; tanpa host, memakai origin aplikasi untuk uji lokal. Next image remote pattern terbatas pada host/path tersebut; tidak mengaktifkan akses IP privat pada optimizer. Query publik hanya mengembalikan URL, alt, dimensi, blur placeholder dan warna dominan. Preview privat memiliki akses authenticated dan URL signed berumur pendek; secret tidak dikirim ke client.

Library memakai grid, pencarian/filter/pagination URL, dropzone/paste/antrean/progress/cancel, drawer detail, penggantian file, metadata dan usage. Image field/picker reusable memakai komponen kit CPR-80; focal point dapat dipilih dengan pointer dan kontrol angka/keyboard. Label admin Indonesia, token semantik, reduced motion. Tidak ada dokumen publik contoh palsu atau penggantian konten statis untuk membuktikan fitur.

## Verifikasi dan batas eksternal

Tes gagal lebih dahulu untuk kontrak store dan validasi upload, lalu tes database untuk otorisasi, audit rollback, publikasi, referensi dan seed idempotent/purge. Tes SeaweedFS Compose membuktikan semua operasi termasuk presigned PUT berisi data dan multipart, bukan hanya command mock. Tes HTTP production membuktikan akses/upload/body limits/preview/public delivery. UI diperiksa lokal dan bundle client dipindai terhadap credential/env storage. Migration SQL ditinjau sebelum dijalankan pada database terisolasi. VPS, domain dan CDN production tetap acceptance CPR-67 yang menunggu kebutuhan eksternal.
