# Development sebagai staging

Status: disetujui Founder pada 16 Oktober 2026.

Perubahan publik statis Faishal tetap berada di `main`. Pekerjaan Farhan untuk admin custom, konten yang dapat diedit, database, media dan integrasi dilanjutkan di `development`. Sumber konten statis tetap tersedia selama adapter query database belum selesai. Admin dibangun dalam Next.js dengan Better Auth dan Drizzle/PostgreSQL, sesuai keputusan tanpa headless CMS.

## Alur per tiket

1. Ambil `origin/development` sebagai dasar branch tiket Farhan.
2. Assign tiket In Progress ke Farhan, implementasikan dan verifikasi bagian tersebut.
3. Commit dan push pada branch tiket, lalu buat PR dengan base `development`.
4. Merge ke `development` setelah pemeriksaan lulus, sesuai izin langsung dari Founder. Card yang masih menunggu kebutuhan eksternal tetap mencatat acceptance yang belum terpenuhi.
5. Promosi dari `development` ke `main` memerlukan instruksi Founder berikutnya. Perubahan berikutnya pada main tidak otomatis digabungkan ke development tanpa peninjauan integrasi.

PR #28 (CPR-67) dan #30 (CPR-68) sudah ter-merge ke main sebelum perubahan alur ini; riwayat dipertahankan. Development dibuat dari main `e08ed80`; PR #32 (CPR-87) menjadi perubahan pertama yang di-merge langsung ke development. PRD dan perilaku publik pada main tidak diubah oleh keputusan branch ini.

## Lingkungan

Branch staging belum berarti server staging sudah tersedia. VPS, domain dan Coolify masih menunggu kesiapan Founder; verifikasi saat ini memakai layanan lokal terisolasi. Lingkungan staging nantinya harus memiliki database, secret dan prefix media tersendiri, tanpa memakai data atau volume production. Jangan menyalakan pengiriman email nyata atau mengalihkan situs main ke database development secara implisit.

Pekerjaan dilanjutkan dengan satu agen sesuai permintaan penghematan biaya. CPR-10 GitHub Actions tetap ditunda. Review dan pengujian dilakukan secara lokal sampai alur CI tersebut diaktifkan oleh Founder.
