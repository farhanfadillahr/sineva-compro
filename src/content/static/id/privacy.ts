import type { RichTextDocument } from '../../../features/content/types'
import { bulletList, doc, heading, paragraph } from '../helpers'

// Indonesian translation of ../privacy.ts, section for section (CPR-17). Keep the two in step: a
// change of provider or data flow updates both.

export const privacyBody: RichTextDocument = doc(
  paragraph(
    'Kebijakan ini menjelaskan cara Sineva menangani data pribadi yang dikumpulkan melalui situs ini: apa yang kami kumpulkan, untuk apa, layanan apa yang membantu kami, berapa lama kami menyimpannya, dan cara Anda mengajukan permintaan terkait data Anda. Kebijakan ini berlaku untuk formulir kontak, daftar tunggu produk kami, cookie analitik, dan area admin kami.',
  ),
  paragraph(
    'Sineva bertanggung jawab atas data pribadi yang dijelaskan di sini. Untuk pertanyaan atau permintaan terkait privasi, kirim email ke sinevatech@gmail.com.',
  ),

  heading('Informasi yang Anda berikan'),
  paragraph(
    'Saat Anda mengirim formulir kontak, kami menyimpan nama, alamat email, nomor WhatsApp, jenis bisnis, bidang yang diminati, dan pesan Anda, ditambah nama perusahaan dan kisaran anggaran bila Anda mengisinya. Kami juga mencatat halaman tempat Anda mengirimnya, bahasa halaman, dan waktu Anda menyetujui kebijakan ini. Setelah tersimpan, situs membuka WhatsApp dengan pesan Anda yang sudah siap, sehingga Anda juga bisa menghubungi kami di sana.',
  ),
  paragraph(
    'Saat Anda bergabung dengan daftar tunggu produk kami, kami menyimpan alamat email, jenis bisnis bila Anda mengisinya, bahasa halaman, dan waktu Anda menyetujui. Bergabung dengan daftar tunggu tidak membuat akun dan tidak membuat produknya tersedia.',
  ),
  paragraph(
    'Mohon jangan menuliskan kata sandi, data pembayaran, atau informasi sensitif lainnya di dalam pesan.',
  ),

  heading('Informasi yang terkumpul otomatis'),
  paragraph(
    'Untuk melindungi formulir kami dari spam, Cloudflare Turnstile memeriksa browser Anda saat Anda memakainya, dan Cloudflare menerima alamat IP serta detail browser Anda untuk pemeriksaan itu. Kami juga menyimpan bentuk acak dari alamat IP Anda selama 24 jam untuk membatasi seberapa sering formulir bisa dikirim. Bentuk acak ini tidak bisa dikembalikan menjadi alamat IP Anda.',
  ),
  paragraph(
    'Penyedia hosting kami memproses detail permintaan seperti alamat IP, waktu, detail browser, dan halaman yang dibuka untuk menampilkan situs dan menjaga keamanannya.',
  ),

  heading('Cookie dan penyimpanan serupa'),
  paragraph(
    'Kami memakai Google Analytics untuk memahami cara pengunjung memakai situs ini, tetapi hanya bila Anda menerima cookie analitik di banner. Sebelum itu, tidak ada apa pun dari Google Analytics yang dimuat. Bila Anda menerima, Google memasang cookie bernama _ga dan _ga_ diikuti sebuah ID, yang bisa bertahan hingga dua tahun. Anda bisa menarik persetujuan kapan saja lewat Pengaturan cookie di bagian bawah setiap halaman; kami lalu menghentikan Google Analytics dan menghapus cookie-nya dari situs ini.',
  ),
  paragraph(
    'Browser Anda juga menyimpan pilihan cookie, tema terang atau gelap, dan pengaturan tampilan serupa. Semua itu tetap di perangkat Anda dan tidak dikirim ke kami. Area admin kami memakai cookie login khusus untuk tim kami. Kami tidak memakai cookie iklan.',
  ),

  heading('Untuk apa kami memakai informasi Anda'),
  bulletList(
    'Untuk membalas pesan Anda dan menindaklanjuti permintaan Anda. Dasarnya adalah persetujuan yang Anda berikan di formulir.',
    'Untuk memberi tahu Anda saat produk kami siap, bila Anda bergabung dengan daftar tunggu. Dasarnya adalah persetujuan Anda.',
    'Untuk mengukur cara situs ini dipakai, hanya dengan persetujuan Anda atas cookie analitik.',
    'Untuk menjaga situs dan formulir kami tetap aman dan bebas spam. Dasarnya adalah kepentingan sah kami untuk melindungi situs dan orang yang memakainya.',
  ),
  paragraph(
    'Anda bisa menarik persetujuan kapan saja. Penarikan tidak memengaruhi pemrosesan yang sudah terjadi sebelumnya.',
  ),

  heading('Siapa yang menerima informasi Anda'),
  paragraph(
    'Hanya anggota tim Sineva yang berwenang yang bisa melihat pesan dan data daftar tunggu di area admin kami. Kami memakai penyedia layanan berikut:',
  ),
  bulletList(
    'Vercel menjalankan hosting situs ini. Servernya berada di Amerika Serikat.',
    'Neon menyimpan basis data kami, di Singapura.',
    'Cloudflare menjalankan Turnstile, pemeriksaan spam pada formulir kami.',
    'Google menjalankan Google Analytics, hanya bila Anda menerima cookie analitik.',
    'WhatsApp menyampaikan pesan yang Anda pilih untuk dikirim kepada kami di sana.',
    'Penyedia layanan email mengirim balasan dan pemberitahuan kami melalui email.',
  ),
  paragraph('Kami tidak menjual data pribadi Anda.'),

  heading('Transfer ke luar Indonesia'),
  paragraph(
    'Sebagian penyedia ini memproses data di luar Indonesia, termasuk di Singapura dan Amerika Serikat. Kami memilih penyedia yang melindungi data pribadi berdasarkan ketentuan dan pengamanan mereka sendiri, dan kami hanya membagikan apa yang dibutuhkan setiap layanan.',
  ),

  heading('Berapa lama kami menyimpannya'),
  bulletList(
    'Pesan formulir kontak: 24 bulan setelah kontak terakhir kami dengan Anda.',
    'Data daftar tunggu: sampai 12 bulan setelah produk dirilis, atau lebih cepat bila Anda meminta kami menghapusnya.',
    'Alamat IP acak untuk membatasi pengiriman formulir: 24 jam.',
    'Cookie Google Analytics: hingga dua tahun, atau sampai Anda menarik persetujuan.',
  ),
  paragraph(
    'Saat masa simpan berakhir, kami menghapus data itu atau membuatnya anonim. Salinan pesan yang Anda kirim lewat WhatsApp atau email tetap berada di layanan tersebut sesuai ketentuan mereka.',
  ),

  heading('Hak Anda'),
  paragraph(
    'Berdasarkan Undang-Undang Pelindungan Data Pribadi, Anda bisa meminta untuk melihat data pribadi Anda yang kami simpan, memperbaikinya, menghapusnya, menarik persetujuan, atau menolak cara kami memakainya. Kirim permintaan Anda ke sinevatech@gmail.com. Kami mungkin meminta informasi untuk memastikan bahwa itu memang Anda, dan kami akan membalas dalam jangka waktu yang diwajibkan hukum.',
  ),

  heading('Perubahan kebijakan ini'),
  paragraph(
    'Kami memperbarui kebijakan ini saat situs, penyedia layanan, atau cara kerja kami berubah. Tanggal di bagian atas menunjukkan kapan versi ini mulai berlaku.',
  ),
)
