# Sineva Tech — Logo vektor

[Buka file Figma](https://www.figma.com/design/vdG8pTacFcbDnEUb8cjBDM?node-id=7-2)

| Aset | SVG | PNG transparan 1024 × 1024 |
|---|---|---|
| Simbol, warna asli | [SVG](svg/sineva-symbol-original.svg) | [PNG](png/sineva-symbol-original.png) |
| Simbol, dark mode | [SVG](svg/sineva-symbol-dark.svg) | [PNG](png/sineva-symbol-dark.png) |
| Simbol + tulisan, warna asli | [SVG](svg/sineva-stacked-original.svg) | [PNG](png/sineva-stacked-original.png) |
| Simbol + tulisan, dark mode | [SVG](svg/sineva-stacked-dark.svg) | [PNG](png/sineva-stacked-dark.png) |

Kedua PNG sumber di folder `source/` tetap utuh. Tracing mengikuti kontur sumber,
termasuk bentuk huruf, proporsi, penempatan, ruang kosong, dan kanvas 5225 × 5225.
Tulisan berupa path, sehingga tidak memerlukan font tambahan. SVG tidak berisi
gambar raster atau latar belakang.

Versi warna asli dan dark mode menggunakan path yang identik. Dark mode hanya
mengganti warna gradasi dengan teal terang; tidak mengubah bentuk atau susunan.
Latar putih/gelap di Figma dan `previews/preview.png` hanya untuk melihat kontras, bukan
bagian dari logo yang diekspor.

Pemeriksaan render pada ukuran sumber menghasilkan kecocokan siluet (IoU)
99,969% untuk simbol dan 99,921% untuk logo dengan tulisan. Selisih rata-rata
warna asli kurang dari 0,16 pada skala RGB 0–255. Path dan alpha versi normal
serta dark mode identik. Kontras warna terang minimal 8,28:1 pada latar `#0B1620`.
Rincian dan hash sumber tercatat di [trace-report.json](reports/trace-report.json).

Struktur aset:

```text
assets/brand/logos/
├── source/       PNG sumber dari pembuat logo
├── svg/          Logo vektor warna asli dan dark mode
├── png/          Ekspor transparan 1024 × 1024
├── previews/     Pratinjau perbandingan
├── reports/      Hasil verifikasi dan hash sumber
└── README.md
```

Paket unduhan berada di `exports/sineva-logo-assets.zip` dari root repo dan
diabaikan Git, karena isinya salinan aset yang sudah disimpan di sini.

Figma berisi enam layer vektor dalam empat frame aset. Simbol dan tulisan dapat
dipilih serta diubah warnanya secara terpisah. Pilih frame bernama `.svg` untuk
mengekspor logo transparan, bukan panel pratinjau yang berisi latar dan label.

Tracing dapat dijalankan kembali dengan `python3 scripts/vectorize_logos.py`
dari root repo; membutuhkan NumPy dan Pillow. Perintah ini meregenerasi SVG
di `svg/` serta laporan tracing dasar di `reports/`, tanpa menulis ke Figma. PNG dan hasil verifikasi
render yang disertakan dibuat dari SVG memakai ImageMagick/RSVG.
