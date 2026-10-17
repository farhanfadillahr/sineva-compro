import type { RichTextDocument } from '../../../features/content/types'
import { bulletList, doc, heading, paragraph } from '../helpers'

// Indonesian translation of ../privacy.ts, section for section. It carries the same open items
// (responsible operator, final retention periods, response process, legal basis for technical
// processing) and is under the same Founder and legal review: a translation does not settle them.

export const privacyBody: RichTextDocument = doc(
  paragraph(
    'Kebijakan ini menjelaskan cara Sineva menangani informasi yang dikumpulkan melalui situs kami, termasuk formulir kontak, pilihan untuk dikabari soal produk kami, dan area admin kami. Kebijakan ini mencakup alasan kami memakai informasi, layanan yang mendukung situs kami, berapa lama kami menyimpan informasi, dan cara mengajukan permintaan terkait data Anda.',
  ),
  paragraph(
    'Sineva adalah nama yang kami pakai untuk bisnis kami. Halaman Kontak menunjukkan cara menghubungi kami untuk permintaan terkait privasi. Kami akan menyebutkan pihak pengelola yang bertanggung jawab dan tanggal berlakunya sebelum kebijakan ini berlaku.',
  ),

  heading('Informasi yang Anda berikan'),
  paragraph(
    'Formulir kontak di situs ini tidak mengirim data Anda ke server kami. Formulir menyiapkan pesan dari isian Anda: nama, jenis bisnis, bidang yang diminati dan pesan, ditambah nama perusahaan dan kisaran anggaran bila Anda memilih mengisinya. Anda lalu mengirim pesan itu sendiri melalui WhatsApp atau aplikasi email Anda. Kami tidak menyimpan isian formulir di server kami.',
  ),
  paragraph(
    'Saat Anda mengirim pesan, kami menerima apa yang Anda tulis, bersama nomor WhatsApp atau alamat email Anda, melalui layanan tersebut. WhatsApp dan penyedia email Anda menangani pesan itu berdasarkan ketentuan dan kebijakan privasi mereka sendiri.',
  ),
  paragraph(
    'Bila Anda minta dikabari soal Sineva Product Suite, Anda melakukannya dengan mengirim pesan dengan cara yang sama. Permintaan untuk dikabari hanya mencatat minat Anda. Permintaan itu tidak membuat akun produk dan tidak membuat produk tersedia.',
  ),
  paragraph(
    'Mohon jangan mencantumkan password, data pembayaran, atau informasi sensitif lain di dalam pesan. Kami mungkin meminta informasi tambahan saat membahas kebutuhan Anda, tetapi formulir kontak bukan saluran untuk materi proyek yang bersifat rahasia.',
  ),

  heading('Informasi teknis'),
  paragraph(
    'Situs dan infrastruktur hosting kami dapat memproses informasi permintaan seperti alamat IP, waktu, detail browser, alamat halaman yang diminta, dan peristiwa keamanan. Kami memakai informasi ini untuk menjalankan situs, menyelidiki gangguan, dan melindunginya dari penyalahgunaan.',
  ),
  paragraph(
    'Kami dapat memakai analitik situs tanpa cookie iklan, serta pemantauan error untuk menemukan gangguan teknis. Data analitik dan error seharusnya tidak memuat pesan, password, atau token autentikasi Anda.',
  ),
  paragraph(
    'Area admin hanya untuk tim kami. Area ini memakai cookie autentikasi untuk menjaga sesi masuk dan menerapkan kontrol keamanan. Kami tidak memakai piksel iklan di situs ini.',
  ),

  heading('Alasan kami memakai informasi'),
  paragraph(
    'Kami memakai pesan yang Anda kirim untuk meninjau permintaan Anda, membalasnya, dan mengelola tindak lanjut. Kami memakai permintaan untuk dikabari agar bisa memberi tahu Anda saat Sineva Product Suite sudah siap.',
  ),
  paragraph(
    'Mengirim pesan kepada kami adalah pilihan Anda, dan formulir meminta Anda menyatakan bahwa Anda memahami cara pesan itu dikirim. Anda dapat meminta kami berhenti memakai informasi Anda, atau menghapusnya, dengan menghubungi kami. Penarikan persetujuan tidak membatalkan pemrosesan yang sudah terjadi sebelum permintaan Anda.',
  ),
  paragraph(
    'Pemrosesan teknis dan keamanan mendukung operasional dan perlindungan situs. Kami akan menetapkan dasar hukumnya sebagai bagian dari peninjauan kebijakan sebelum peluncuran. Pernyataan pada formulir tidak mencakup setiap jenis pemrosesan teknis.',
  ),

  heading('Siapa yang dapat mengakses informasi'),
  paragraph(
    'Anggota tim Sineva yang berwenang menangani pesan yang kami terima. Akses mengikuti tanggung jawab yang diperlukan untuk menjalankan situs dan menanggapi permintaan.',
  ),
  paragraph('Kami memakai penyedia layanan untuk operasional situs tertentu:'),
  bulletList(
    'Penyedia hosting kami menjalankan server yang menayangkan situs ini.',
    'Layanan jaringan dan pengiriman konten membantu menayangkan situs dan melindunginya dari penyalahgunaan.',
    'WhatsApp dan penyedia email Anda membawa pesan yang Anda pilih untuk dikirim kepada kami.',
    'Layanan analitik dan pemantauan error, bila diaktifkan, membantu kami memahami dan memperbaiki situs.',
  ),
  paragraph(
    'Kami akan menyebutkan nama penyedia tersebut dalam kebijakan ini setelah dipastikan untuk situs yang berjalan.',
  ),

  heading('Lokasi pemrosesan'),
  paragraph(
    'Penyedia hosting dan layanan kami dapat memproses informasi di luar Indonesia. Sebelum mengaktifkan sebuah layanan, kami meninjau lokasi pemrosesannya, ketentuannya, dan perlindungan yang diperlukan untuk transfer tersebut. Kebijakan final akan menjelaskan pengaturan yang sudah diverifikasi. Nama penyedia saja tidak akan dianggap sebagai bukti perlindungan yang memadai.',
  ),

  heading('Masa penyimpanan'),
  paragraph(
    'Usulan masa simpan untuk pesan adalah 24 bulan setelah interaksi terakhir kami dengan Anda. Usulan masa simpan untuk permintaan dikabari berlaku sampai 12 bulan setelah produk diluncurkan, atau sampai ada permintaan penghapusan lebih awal. Kami akan menetapkan masa simpan ini sebelum peluncuran.',
  ),
  paragraph(
    'Situs ini tidak menyimpan isian formulir, sehingga isian itu tidak ada di cadangan situs kami. Pesan yang Anda kirim lewat WhatsApp atau email tetap berada di akun tersebut dan mengikuti masa simpan yang sama. Menghapus pesan di satu tempat belum tentu menghapus salinan yang disimpan layanan yang membawanya.',
  ),

  heading('Permintaan terkait informasi Anda'),
  paragraph(
    'Anda dapat menghubungi kami untuk menanyakan cara kami memproses informasi Anda, atau meminta akses, perbaikan, penarikan persetujuan, atau penghapusan bila berlaku. Anda juga dapat menanyakan hak lain yang tersedia berdasarkan aturan pelindungan data pribadi yang berlaku.',
  ),
  paragraph(
    'Kirim pesan melalui pilihan kontak di halaman Kontak dan jelaskan permintaan Anda. Kami mungkin memerlukan informasi untuk memastikan identitas Anda dan menemukan pesan yang dimaksud. Berikan hanya yang diperlukan, dan jangan mengirim password atau dokumen identitas kecuali kita sudah menyepakati cara yang sesuai.',
  ),
  paragraph(
    'Anggota tim akan meninjau permintaan dan menjelaskan langkah berikutnya, termasuk batasan yang berlaku karena masa simpan atau kewajiban hukum lain. Kami akan menetapkan proses tanggapan dan tenggat waktunya sebelum peluncuran.',
  ),

  heading('Pembaruan dan kontak'),
  paragraph(
    'Kami dapat memperbarui kebijakan ini saat situs, penyedia, atau praktik kami berubah. Versi yang terbit menunjukkan tanggal berlakunya. Perubahan yang memerlukan pemberitahuan atau persetujuan lebih lanjut akan mengikuti proses yang sudah ditinjau.',
  ),
  paragraph(
    'Untuk pertanyaan atau permintaan terkait privasi, gunakan pilihan kontak di halaman Kontak.',
  ),
)
