# Development sebagai staging

Status: disetujui Founder pada 16 Oktober 2026.

Perubahan publik statis Faishal tetap berada di `main`. Pekerjaan Farhan untuk admin custom, konten yang dapat diedit, database, media dan integrasi dilanjutkan di `development`. Sumber konten statis tetap tersedia selama adapter query database belum selesai. Admin dibangun dalam Next.js dengan Better Auth dan Drizzle/PostgreSQL, sesuai keputusan tanpa headless CMS.

## Alur per tiket

1. Sebelum mengerjakan setiap tiket, ambil `main` dan `development` terbaru dari origin. Perbarui checkout lokal main dengan fast-forward bila branch yang aktif adalah main dan salinan kerja bersih; pertahankan pekerjaan lokal yang belum di-commit.
2. Pastikan commit main yang baru diambil sudah menjadi ancestor development. Jika belum, gabungkan main ke branch sinkronisasi dari development, tinjau konflik dan jalankan pemeriksaan integrasi sebelum PR ke development di-merge. Gunakan merge commit untuk PR sinkronisasi agar ancestry main tercatat; jangan squash merge sinkronisasi. Jangan menimpa perubahan rekan atau memakai force push.
3. Ambil `origin/development` yang sudah diperbarui sebagai dasar branch tiket Farhan. Assign tiket In Progress ke Farhan, implementasikan dan verifikasi bagian tersebut.
4. Commit dan push pada branch tiket, lalu buat satu PR per tiket dengan base `development`. PR fitur dapat memakai squash; aturan merge commit di atas khusus sinkronisasi main.
5. Merge ke `development` setelah pemeriksaan lulus, sesuai izin langsung dari Founder. Card yang masih menunggu kebutuhan eksternal tetap mencatat acceptance yang belum terpenuhi.
6. Promosi dari `development` ke `main` memerlukan instruksi Founder berikutnya. Sinkronisasi rutin hanya membawa perubahan main ke development, tidak mempromosikan pekerjaan staging ke main.

PR #28 (CPR-67) dan #30 (CPR-68) sudah ter-merge ke main sebelum perubahan alur ini; riwayat dipertahankan. Development dibuat dari main `e08ed80`; PR #32 (CPR-87) menjadi perubahan pertama yang di-merge langsung ke development. PRD dan perilaku publik pada main tidak diubah oleh keputusan branch ini.

## Lingkungan

Branch staging belum berarti server staging sudah tersedia. VPS, domain dan Coolify masih menunggu kesiapan Founder; verifikasi saat ini memakai layanan lokal terisolasi. Lingkungan staging nantinya harus memiliki database, secret dan prefix media tersendiri, tanpa memakai data atau volume production. Jangan menyalakan pengiriman email nyata atau mengalihkan situs main ke database development secara implisit. Pengaturan `ADMIN_ENABLED` dari fase publik statis tetap dipertahankan: production default off, development default on. Server staging yang menjalankan production build untuk menguji admin perlu `ADMIN_ENABLED=true` secara eksplisit; jangan mengaktifkannya pada deployment main secara implisit.

Pekerjaan dilanjutkan dengan satu agen sesuai permintaan penghematan biaya. CPR-10 GitHub Actions tetap ditunda. Review dan pengujian dilakukan secara lokal sampai alur CI tersebut diaktifkan oleh Founder.
