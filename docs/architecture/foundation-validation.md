# CPR-7 — Catatan implementasi dan verifikasi

Tanggal: 14 Oktober 2026. Branch:
`farhanfadillahrafi/cpr-7-infra-inisialisasi-kerangka-nextjs-payload-v3`.

Implementasi fondasi tersedia; CPR-7 masih **In Progress** karena pemeriksaan UI
admin belum dapat diselesaikan. Jangan menganggap catatan ini sebagai persetujuan
merge atau deployment.

## Bukti yang sudah tersedia

- Node 24.21.0, Next 16.4.0, React 19.2.6, seluruh paket Payload langsung 3.90.2.
- PostgreSQL 17.11-bookworm: developer loopback 5434 (5432 sudah digunakan),
  test loopback 5433; kedua service healthy.
- Setup `.env`: permission 600, overwrite ditolak, isi sebelumnya tetap sama.
- Migration awal berhasil diterapkan pada database developer dan test.
- Unit test konfigurasi: 14/14 lulus, setelah kegagalan awal sebelum helper dibuat.
- HTTP integration development: 4/4 lulus; `/` dan `/admin` 200,
  read/create Users anonim 403.
- `npm ci` berhasil; `npm ls --all` bersih; regenerasi types/import map tidak
  mengubah file yang telah di-commit.
- Lint, typecheck, dan format check lulus setelah instalasi ulang.
- PNG sumber logo sama dengan base commit `393b487`.

Build production dan HTTP production sedang diverifikasi; hasil final harus
dicatat sebelum acceptance tersebut dinyatakan terpenuhi.

## Pemeriksaan UI yang masih diperlukan

Browser Codex menolak localhost karena saved permission/managed policy, termasuk
setelah pengguna memberi persetujuan. Pemeriksaan ini belum dilakukan:

1. Buat admin pertama pada database developer melalui `/admin`.
2. Logout/login dan pastikan `/admin/create-first-user` tidak membuat akun kedua.
3. Restart PostgreSQL, tunggu healthy, lalu login kembali dengan akun yang sama.
4. Pada production server lokal dengan database test, buat akun test melalui UI,
   logout/login, buka dashboard dan dokumen Users, lalu periksa styling serta
   console/hydration.

Tes HTTP anonim yang lulus tidak membuktikan keempat pemeriksaan tersebut.

## Keputusan eksekusi dan risikonya

- Worktree Git manual dipakai karena tool native tidak mengenali cwd chat yang
  berada di parent repo. Risiko: checkout ini tidak terdaftar sebagai worktree
  managed Codex; tetap dapat dikelola melalui Git.
- Baseline Next/Payload dinaikkan ke 16.4.0/3.90.2 setelah advisory ditemukan.
  Risiko: perubahan minor framework dapat membutuhkan penyesuaian integrasi;
  quality gate dan migration menguji kompatibilitasnya.
- Override undici 7.29.1, Sass 1.105.1, dan DOMPurify 3.4.17 mengatasi pin
  transitif yang masih rentan. Risiko: override perlu dipelihara dan dihapus saat
  paket induk memperbarui versi; migration/build perlu diuji saat upgrade.
- ESLint 9.39.5 dipertahankan karena plugin Next tidak kompatibel dengan ESLint 10.
  Risiko: tooling deprecated sampai kombinasi plugin yang kompatibel tersedia.
- Peer development Vite, esbuild dan YAML, dipasang exact agar dependency graph
  valid. Risiko: dua dependency development tambahan perlu dipelihara.

Audit runtime memiliki lima temuan moderate pada tooling migration esbuild;
audit seluruh dependency juga memiliki lima temuan high pada tooling glob ESLint.
Server esbuild tidak dijalankan dan lint hanya memproses source repo. Tidak
menerapkan rekomendasi downgrade framework atau `audit fix --force`; evaluasi
ulang pada upgrade dependency. Rincian dan sumber advisory ada di README.

Disk penuh sempat menghalangi instalasi. Pembersihan cache build Docker telah
disetujui pengguna; image/container/volume tidak dihapus oleh pembersihan tersebut.
