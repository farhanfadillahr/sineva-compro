import type { Category, PostDetail, RichTextDocument } from '../../../features/content/types'
import { bulletList, doc, heading, paragraph, plainText, seo } from '../helpers'

// Indonesian counterpart of ../posts.ts (CPR-107). Same categories (by slug), covers, authorship
// and publication dates as English. Article slugs are Indonesian, so `EN_SLUG_BY_ID_SLUG` pairs each
// one with its English article: the seed adds the `id` translation to that same item.

export const categories: readonly Category[] = [
  { slug: 'ai-basics', name: 'Dasar AI' },
  { slug: 'small-business', name: 'Usaha kecil' },
  { slug: 'project-prep', name: 'Persiapan proyek' },
]
const [aiBasics, smallBusiness, projectPrep] = categories

const author = { name: 'Tim Sineva', role: null, photo: null } as const

/** Same reading speed as English, rounded up so a short article never shows "0 menit". */
const WORDS_PER_MINUTE = 200
const readingMinutes = (body: RichTextDocument) =>
  Math.max(1, Math.ceil(plainText(body).trim().split(/\s+/).length / WORDS_PER_MINUTE))

const whereToStart = doc(
  heading('Versi singkatnya'),
  paragraph(
    'Kebanyakan pemilik usaha kecil tidak butuh strategi AI. Anda butuh satu tugas yang menyita waktu, gambaran jelas tentang hasil yang baik, dan satu uji coba kecil. Mulai dari situ, dan keputusan berikutnya jadi lebih mudah.',
  ),
  heading('Mulai dari pekerjaannya, bukan alatnya'),
  paragraph(
    'Alat AI baru muncul setiap minggu, dan mudah sekali merasa tertinggal. Memilih alat lebih dulu adalah kesalahan yang paling umum. Sebuah alat baru berguna kalau Anda tahu pekerjaan apa yang ingin diserahkan kepadanya.',
  ),
  paragraph(
    'Ingat kembali minggu kerja Anda yang biasa. Tugas apa yang Anda ulang? Tugas apa yang Anda tunda karena terasa lambat atau membosankan? Tulis dengan kata-kata sederhana, walaupun daftarnya terlihat berantakan.',
  ),
  heading('Pilih tugas yang kecil, berulang, dan mudah diperiksa'),
  paragraph('Tidak semua tugas cocok jadi yang pertama. Cari tiga hal ini:'),
  bulletList(
    'Kecil: selesai dalam hitungan menit, bukan hari, dan jelas awal serta akhirnya.',
    'Berulang: sering terjadi, jadi perbaikan kecil pun terasa hasilnya.',
    'Mudah diperiksa: dalam semenit Anda bisa tahu apakah hasilnya baik.',
  ),
  paragraph(
    'Contoh yang umum adalah menjawab pertanyaan pelanggan yang sama, menulis draf pertama sebuah unggahan, atau merangkum percakapan yang panjang. Tugas yang butuh pertimbangan mendalam, atau yang satu kesalahannya bisa mahal, kurang cocok untuk memulai.',
  ),
  heading('Tulis cara Anda mengerjakannya sekarang'),
  paragraph(
    'Sebelum menyerahkan apa pun ke AI, jelaskan tugas itu seolah Anda sedang melatih rekan kerja baru. Apa yang Anda lihat pertama kali? Apa yang tidak akan pernah Anda katakan kepada pelanggan? Seperti apa hasil yang baik?',
  ),
  paragraph(
    'Langkah ini terasa lambat, tetapi justru di sinilah sebagian besar pekerjaannya. Kalau Anda tidak bisa menjelaskan tugasnya, alat AI juga tidak bisa menebaknya untuk Anda. Langkah ini juga menunjukkan apakah tugas itu memang sesederhana yang Anda kira.',
  ),
  heading('Lakukan uji coba kecil'),
  paragraph(
    'Coba tugas itu dengan AI pada beberapa kasus nyata, bukan pada satu contoh yang sempurna. Tetap libatkan orang: Anda membaca hasilnya sebelum sampai ke pelanggan. Catat apa yang bagus, apa yang salah, dan apa yang harus Anda perbaiki.',
  ),
  paragraph(
    'Setelah beberapa putaran, Anda akan tahu apakah tugas itu layak dilanjutkan. Kalau tidak, kerugiannya sangat kecil. Itulah gunanya mulai dari yang kecil.',
  ),
  heading('Pahami batasnya'),
  paragraph(
    'AI bisa salah sambil terdengar yakin. AI juga bisa melewatkan konteks yang bagi Anda sudah jelas. Anggap hasil pertama sebagai draf, dan periksa apa pun yang menyangkut uang, janji, atau data pribadi.',
  ),
  paragraph(
    'Hati-hati juga dengan informasi pribadi. Jangan menempelkan data pelanggan atau kata sandi ke sebuah alat kecuali Anda paham bagaimana alat itu memperlakukannya.',
  ),
  heading('Coba dengan satu pertanyaan pelanggan'),
  paragraph(
    'Bayangkan Anda punya toko roti kecil. Orang sering bertanya kapan pesanan ditutup dan apakah Anda mengantar ke daerah mereka. Kumpulkan aturan pengantaran, jam buka, dan batas waktu pesanan yang berlaku sekarang. Minta alat AI menyusun draf balasan hanya dari catatan itu. Minta juga agar alat itu bertanya kepada Anda bila ada jawaban yang tidak tersedia.',
  ),
  paragraph(
    'Sekarang uji kasus yang sulit. Seorang pelanggan ingin pesanan untuk besok diantar ke luar area biasa Anda. Draf yang berguna akan menjelaskan batasnya atau meminta Anda memeriksanya. Janji ramah yang tidak bisa ditepati tim Anda tetap dihitung gagal, seenak apa pun kalimatnya.',
  ),
  heading('Simpan catatan sederhana'),
  paragraph(
    'Gunakan satu lembar kerja kecil berisi permintaan asli, draf, koreksi Anda, dan waktu yang dipakai untuk memeriksanya. Bandingkan dengan mengerjakan tugas itu sendiri. Masukkan waktu pemeriksaan dalam pertimbangan Anda. Kalau setiap jawaban harus ditulis ulang, ubah instruksinya atau pilih tugas yang lebih sederhana sebelum mencoba lagi.',
  ),
  heading('Kapan perlu meminta bantuan'),
  paragraph(
    'Sebagian bisnis bisa melakukan semua ini sendiri. Sebagian lagi ingin ada orang lain yang ikut memetakan pekerjaan dan memilih langkah pertama. Untuk itulah layanan AI Discovery kami ada.',
  ),
  paragraph(
    'Kami melihat cara bisnis Anda berjalan, menunjukkan bagian yang realistis untuk dibantu AI, dan menyarankan langkah pertama. Kalau Anda ingin membicarakannya, jadwalkan konsultasi gratis.',
  ),
)

const everydayTasks = doc(
  heading('Versi singkatnya'),
  paragraph(
    'AI agent adalah perangkat lunak yang menerima permintaan dalam bahasa sehari-hari dan mengerjakan sebagian pekerjaan untuk Anda. AI agent tidak akan menjalankan bisnis Anda. Ia bisa mengambil alih tugas berulang yang risikonya rendah, sehingga Anda punya lebih banyak waktu untuk pekerjaan yang memang butuh Anda.',
  ),
  paragraph(
    'Berikut lima tugas sehari-hari yang cocok. Ini juga jenis permintaan yang kami pikirkan untuk Sino, AI agent yang sedang kami bangun di Sineva.',
  ),
  heading('1. Membalas pertanyaan pelanggan yang umum'),
  paragraph(
    'Banyak pesan pelanggan menanyakan hal yang sama: jam buka, pengantaran, cara memesan. AI agent bisa menyusun draf balasan untuk masing-masing, berdasarkan jawaban yang sudah Anda setujui.',
  ),
  paragraph(
    'Kendali tetap di tangan Anda. Baca drafnya, ubah sesuai keinginan, lalu kirim. Lama-lama Anda juga akan melihat pertanyaan mana yang paling sering muncul, dan itu menunjukkan apa yang perlu dijelaskan lebih baik di situs Anda.',
  ),
  heading('2. Menyusun draf unggahan media sosial'),
  paragraph(
    'Rutin mengunggah itu sulit saat Anda sibuk. AI agent bisa memberi ide untuk seminggu, menulis caption pertama, dan menawarkan beberapa cara lain untuk menyampaikan hal yang sama.',
  ),
  paragraph(
    'Gaya bicara Anda penting, jadi anggap hasilnya sebagai draf pertama. Sunting sampai terdengar seperti Anda, dan periksa setiap detail produk sebelum diunggah.',
  ),
  heading('3. Menindaklanjuti orang yang pernah bertanya'),
  paragraph(
    'Seseorang bertanya tentang produk Anda, Anda membalas, lalu percakapannya berhenti. Pesan lanjutan yang singkat dan ramah sering bisa menghidupkannya lagi, tetapi mudah sekali terlupa.',
  ),
  paragraph(
    'AI agent bisa mencatat siapa menanyakan apa, lalu menyusun pesan untuk setiap orang. Anda yang memutuskan siapa yang dihubungi dan kapan.',
  ),
  heading('4. Mencatat keuangan sederhana'),
  paragraph(
    'Banyak usaha kecil mencatat uang di buku atau lembar kerja. AI agent bisa membantu Anda mencatat transaksi sederhana lalu merangkumnya, misalnya per kategori di akhir bulan.',
  ),
  paragraph(
    'Ini bantuan pembukuan, bukan nasihat keuangan. Untuk pajak, pinjaman, atau keputusan besar, bicarakan dengan orang yang memang ahlinya.',
  ),
  heading('5. Merencanakan hari'),
  paragraph(
    'Setiap pagi dimulai dengan pertanyaan yang sama: apa yang harus dikerjakan hari ini? AI agent bisa mengumpulkan tugas Anda menjadi daftar singkat dan mengingatkan hal yang sudah jatuh tempo.',
  ),
  paragraph(
    'Hasilnya paling baik bila Anda memberi tahu prioritas Anda. Anggap saja seperti buku catatan rapi yang bisa diajak bicara.',
  ),
  heading('Kesamaan dari tugas-tugas ini'),
  paragraph(
    'Setiap tugas di atas berulang, mudah diperiksa, dan risikonya rendah bila drafnya perlu diperbaiki. Karena itulah tugas ini cocok untuk memulai. Tugas yang melibatkan pembayaran besar, janji yang mengikat secara hukum, atau data pribadi yang sensitif butuh kehati-hatian lebih dan tetap perlu orang yang memeriksa.',
  ),
  heading('Beri AI agent batas yang jelas'),
  paragraph(
    'Permintaan yang membantu menyebutkan tugasnya, informasi yang dipakai, dan titik di mana AI agent harus berhenti. Daripada memintanya menangani layanan pelanggan, minta ia menyusun draf balasan untuk pertanyaan pengantaran dengan catatan pengantaran Anda yang terbaru. Sebutkan bahwa permintaan yang tidak biasa harus dikembalikan kepada Anda.',
  ),
  paragraph(
    'Batas yang sama berlaku untuk tugas lainnya. Draf caption harus memakai harga yang Anda berikan. Pesan lanjutan hanya dikirim ke orang yang Anda pilih. Daftar harian harus menunjukkan informasi yang belum ada, bukan diam-diam mengarangnya. Instruksi kecil seperti ini membuat hasilnya lebih mudah diperiksa.',
  ),
  heading('Periksa tugasnya secara utuh'),
  paragraph(
    'Coba beberapa contoh biasa dan beberapa contoh yang sulit sebelum Anda mengandalkannya. Periksa faktanya, juga nadanya. Catat apa yang Anda ubah dan alasannya, lalu perbarui instruksinya. Hitung juga waktu yang dipakai untuk memperbaiki draf. Lanjutkan tugas itu hanya bila keseluruhan prosesnya terasa berguna bagi tim Anda.',
  ),
  heading('Cara mencobanya dengan aman'),
  bulletList(
    'Pilih satu tugas, bukan kelimanya.',
    'Pastikan ada orang yang bertanggung jawab atas apa pun yang dikirim ke pelanggan.',
    'Tulis seperti apa hasil yang baik sebelum Anda mulai.',
    'Periksa hasil pertama dengan teliti, dan longgarkan pemeriksaan hanya saat kepercayaan Anda tumbuh.',
  ),
  paragraph(
    'Kalau Anda ingin dibantu memilih tugas pertama, layanan AI Discovery kami dibuat untuk itu. Kalau Anda lebih suka mencoba AI agent sendiri, minta kabar saat Sino siap.',
  ),
)

const prepareData = doc(
  heading('Versi singkatnya'),
  paragraph(
    'Proyek AI bisa macet bila informasi yang dibutuhkan tersebar, sudah usang, atau hanya diketahui satu orang. Sedikit persiapan sebelum mulai membuat proyeknya lebih lancar dan hasilnya lebih berguna.',
  ),
  paragraph(
    'Anda tidak butuh tim data. Anda perlu tahu apa yang Anda punya, di mana tempatnya, dan apa yang aman untuk dibagikan.',
  ),
  heading('Apa yang kami maksud dengan data bisnis'),
  paragraph(
    'Data bukan hanya angka di dalam basis data. Bagi kebanyakan usaha kecil, data adalah bahan sehari-hari yang sudah dipakai tim Anda:',
  ),
  bulletList(
    'Daftar harga, menu, dan deskripsi produk',
    'Jawaban yang Anda berikan kepada pelanggan berulang kali',
    'Lembar kerja berisi pesanan, reservasi, atau pelanggan',
    'Dokumen yang menjelaskan cara Anda bekerja, seperti langkah kerja dan daftar periksa',
    'Riwayat chat dan email, bila memang pantas dipakai',
  ),
  heading('Langkah 1: catat apa yang Anda punya dan di mana tempatnya'),
  paragraph(
    'Buat daftar sederhana: informasi apa saja yang ada, siapa yang menyimpannya, dan di mana disimpan. Masukkan juga catatan kertas dan ponsel pribadi, karena sering kali jawaban yang sebenarnya ada di sana.',
  ),
  paragraph('Tujuannya peta, bukan arsip yang sempurna. Cukup satu sore, bukan sebulan.'),
  heading('Langkah 2: pilih informasi untuk tugas pertama'),
  paragraph(
    'Jangan siapkan semuanya. Pilih satu tugas yang ingin dibantu AI, lalu kumpulkan hanya informasi yang dibutuhkan tugas itu. Kalau tugasnya menjawab pertanyaan pelanggan, artinya pertanyaan yang umum, jawaban yang sudah Anda setujui, dan harga yang berlaku sekarang.',
  ),
  heading('Langkah 3: rapikan hal-hal dasar'),
  paragraph(
    'Hapus yang ganda, perbaiki kesalahan yang jelas, dan perbarui apa pun yang sudah usang. Kalau dua dokumen saling bertentangan, putuskan mana yang benar. AI akan mengulang apa pun yang diberikan kepadanya, termasuk harga lama dan aturan yang saling bertentangan.',
  ),
  paragraph(
    'Pakai nama yang jelas dan istilah yang konsisten. Kalau satu produk punya tiga nama berbeda, beri tahu tim Anda nama mana yang dipakai.',
  ),
  heading('Langkah 4: tentukan apa yang bersifat pribadi'),
  paragraph(
    'Tandai apa yang harus tetap di dalam bisnis Anda: data pribadi pelanggan, informasi pembayaran, kata sandi, dan apa pun yang terikat kontrak. Jauhkan semua itu dari alat yang belum Anda pahami sepenuhnya.',
  ),
  paragraph(
    'Data pribadi bisa diatur oleh aturan pelindungan data. Kalau Anda belum yakin aturan apa yang berlaku, tanyakan kepada penasihat yang kompeten sebelum membagikannya.',
  ),
  heading('Langkah 5: tulis seperti apa hasil yang baik'),
  paragraph(
    'Kumpulkan beberapa contoh nyata dari hasil yang baik: balasan yang Anda banggakan, ringkasan yang akurat, laporan yang jelas. Contoh ini menjadi standar untuk menguji.',
  ),
  paragraph(
    'Catat juga beberapa contoh yang buruk dan alasannya. Kedua jenis contoh ini membantu siapa pun yang membangun atau menyetel solusinya.',
  ),
  heading('Langkah 6: tunjuk penanggung jawab'),
  paragraph(
    'Informasi selalu berubah. Harus ada orang yang bertugas menjaganya tetap terbaru, misalnya memperbarui harga atau menghapus jawaban lama. Tanpa penanggung jawab, susunan yang bagus pun pelan-pelan jadi usang.',
  ),
  heading('Buat paket rujukan kecil'),
  paragraph(
    'Untuk uji coba balasan pelanggan, paket Anda bisa berisi satu daftar harga terbaru, satu panduan pengantaran, dan satu halaman jawaban yang sudah disetujui. Beri tanggal dan nama penanggung jawab di setiap berkas. Tambahkan catatan singkat tentang berkas mana yang berlaku bila dua jawaban berbeda. Simpan daftar terpisah untuk pertanyaan yang harus dijawab orang.',
  ),
  paragraph(
    'Pakai nama samaran dalam kasus uji bila identitas asli tidak menambah apa pun pada tugasnya. Misalnya, Anda bisa memeriksa apakah balasan soal pengantaran sudah benar tanpa membagikan seluruh percakapan pelanggan. Tanyakan pada diri sendiri informasi apa yang dibutuhkan untuk menjawab, lalu tinggalkan sisanya di luar paket rujukan.',
  ),
  heading('Periksa bersama orang yang mengerjakannya'),
  paragraph(
    'Minta rekan kerja menjawab beberapa contoh pertanyaan hanya dengan paket itu. Kalau ia perlu bertanya kepada Anda soal detail yang tidak ada, AI juga akan membutuhkan detail itu. Lengkapi kekurangannya sebelum uji coba. Catat setiap perubahan agar nanti Anda bisa menjelaskan mengapa sebuah hasil berubah.',
  ),
  heading('Yang bisa Anda lewati'),
  paragraph(
    'Anda tidak perlu memindahkan semuanya ke satu sistem lebih dulu. Anda tidak perlu format yang sempurna. Anda bisa mulai dengan sekumpulan kecil informasi yang terbaru, lalu menambah lagi setelah tugas pertama berjalan.',
  ),
  heading('Di mana kami bisa membantu'),
  paragraph(
    'Kalau Anda belum yakin apa yang perlu dikumpulkan, sesi AI Discovery bisa memetakannya bersama Anda. Kalau tugasnya sudah jelas, layanan AI Build kami dimulai dengan melihat informasi yang dimiliki tim Anda saat ini. Jadwalkan konsultasi gratis dan ceritakan apa yang Anda punya.',
  ),
)

const safeAi = doc(
  heading('Versi singkatnya'),
  paragraph(
    'Alat AI yang berjalan tetapi membocorkan data, mengambil keputusan tanpa diperiksa siapa pun, atau tidak bisa dijelaskan, bukanlah kemenangan. AI yang aman direncanakan sejak hari pertama: apa yang boleh dilihatnya, apa yang boleh dilakukannya, siapa yang memeriksanya, dan bagaimana Anda tahu bila ada yang salah.',
  ),
  heading('Mulai dari apa yang boleh dilihat AI'),
  paragraph(
    'Berikan hanya informasi yang dibutuhkan tugasnya. Alat yang menjawab pertanyaan pengantaran tidak butuh data pembayaran atau seluruh daftar pelanggan Anda. Makin sedikit akses, makin sedikit yang hilang bila ada yang salah.',
  ),
  bulletList(
    'Jauhkan kata sandi, data pembayaran, dan nomor identitas dari alat AI.',
    'Periksa di mana alat itu menyimpan apa yang Anda kirim, dan berapa lama.',
    'Pakai akun terpisah untuk setiap orang, agar aksesnya bisa dicabut saat seseorang keluar.',
  ),
  heading('Tentukan apa yang boleh dilakukan AI sendiri'),
  paragraph(
    'Menyusun draf balasan risikonya rendah. Mengirim uang, mengubah harga, atau menjanjikan pengembalian dana tidak. Tulis tindakan mana yang boleh dilakukan AI sendiri dan mana yang harus disetujui orang lebih dulu. Mulai dengan aturan yang ketat dan longgarkan hanya bila hasilnya sudah membuktikan.',
  ),
  heading('Tetap libatkan orang'),
  paragraph(
    'Harus ada orang yang membaca hasilnya, setidaknya di awal, dan bisa menjelaskan mengapa sebuah hasil benar atau salah. Tunjuk orangnya. Bila tidak ada yang bertanggung jawab atas pemeriksaan, kesalahan kecil terus berulang tanpa disadari.',
  ),
  heading('Simpan catatan'),
  paragraph(
    'Untuk tugas yang penting, simpan log sederhana berisi apa yang diminta dari AI dan apa yang dihasilkannya. Saat pelanggan bertanya mengapa ia mendapat jawaban tertentu, Anda bisa mengeceknya, bukan menebak. Catatan ini juga menunjukkan apakah alatnya makin baik atau makin buruk dari waktu ke waktu.',
  ),
  heading('Rencanakan bila terjadi kesalahan'),
  paragraph(
    'AI bisa salah sambil terdengar yakin. Tentukan dari awal apa yang terjadi bila itu terjadi: siapa yang diberi tahu, bagaimana kesalahannya diperbaiki, dan bagaimana Anda mematikan alatnya bila perlu. Rencana yang jelas membuat momen buruk jadi masalah kecil.',
  ),
  heading('Periksa alatnya sebelum Anda percaya'),
  paragraph(
    'Sebelum alat AI baru menyentuh pekerjaan nyata, ajukan beberapa pertanyaan sederhana. Siapa pembuatnya, dan di mana mereka berada? Apakah alat itu menyimpan apa yang Anda ketik, dan bisakah Anda menghapusnya? Bisakah Anda mengatur siapa saja di tim yang punya akses? Kalau jawabannya sulit ditemukan, anggap itu juga sebagai jawaban.',
  ),
  paragraph(
    'Alat gratis tidak selalu pilihan buruk, dan alat berbayar tidak selalu aman. Yang penting adalah apakah Anda paham apa yang terjadi pada informasi Anda setelah Anda menekan kirim.',
  ),
  heading('Uji dengan kasus nyata sebelum mengandalkannya'),
  paragraph(
    'Demo hanya menunjukkan kondisi terbaik. Pelanggan Anda akan datang dengan pertanyaan aneh, salah ketik, dan pesan yang marah. Coba alatnya pada sekumpulan kasus nyata sehari-hari, termasuk beberapa yang sulit, lalu catat di mana ia gagal. Coba juga minta ia melakukan sesuatu yang seharusnya ditolak, dan pastikan ia menolaknya.',
  ),
  paragraph(
    'Pakai sebuah tugas sehari-hari hanya setelah hasilnya cukup baik sehingga pemeriksaannya cepat. Kalau setiap jawaban perlu banyak perbaikan, alatnya belum siap, semenarik apa pun kelihatannya di awal.',
  ),
  heading('Tinjau secara berkala'),
  paragraph(
    'Alat berubah, harga berubah, dan bisnis Anda juga berubah. Jadwalkan tinjauan singkat setiap beberapa bulan: apakah alatnya masih menjalankan tugasnya, adakah yang memakainya dengan cara yang tidak Anda rencanakan, dan apakah aturannya masih cocok? Kepercayaan perlu terus dijaga, bukan diatur sekali lalu dilupakan.',
  ),
  heading('Buat aturan tim yang sederhana'),
  paragraph(
    'Sebagian besar risiko datang dari pemakaian sehari-hari, bukan dari alatnya sendiri. Panduan satu halaman lebih membantu daripada kebijakan panjang yang tidak dibaca siapa pun:',
  ),
  bulletList(
    'Alat AI mana yang boleh dipakai tim, dan untuk apa.',
    'Apa yang tidak boleh ditempelkan ke dalamnya.',
    'Kepada siapa bertanya sebelum mencoba alat baru atau cara pakai baru.',
  ),
  paragraph(
    'Sebagian data diatur oleh aturan pelindungan data. Kalau Anda belum yakin aturan apa yang berlaku untuk bisnis Anda, tanyakan kepada penasihat yang kompeten sebelum membagikannya.',
  ),
  heading('Di mana kami bisa membantu'),
  paragraph(
    'Dalam AI Build, kami merancang pengaman ini ke dalam solusinya sejak awal: akses yang terbatas, data yang terlindungi, aturan yang jelas tentang apa yang boleh dilakukan AI, dan catatan pekerjaannya. Dalam AI Enablement, kami membantu tim Anda menyepakati aturan sederhana untuk pemakaian sehari-hari yang aman. Jadwalkan konsultasi gratis dan ceritakan apa yang ingin Anda lindungi.',
  ),
)

// Newest first, same order and dates as English.
export const postDetails: readonly PostDetail[] = [
  {
    slug: 'mulai-dari-mana-dengan-ai-di-usaha-kecil',
    locale: 'id',
    title: 'Mulai dari mana dengan AI di usaha kecil',
    excerpt:
      'Mulai dari satu tugas yang berulang, bukan dari alatnya. Panduan singkat memilih langkah pertama.',
    cover: { kind: 'cover-kit', pose: 'magnifier', gradient: 'teal' },
    category: smallBusiness,
    author,
    publishedAt: '2026-10-16T02:00:00.000Z',
    readingMinutes: readingMinutes(whereToStart),
    body: whereToStart,
    updatedAt: null,
    seo: seo(
      'Mulai dari mana dengan AI di usaha kecil | Sineva',
      'Pilih satu tugas kecil yang berulang dan uji pada pekerjaan nyata. Panduan sederhana langkah pertama Anda dengan AI.',
    ),
  },
  {
    slug: 'lima-tugas-harian-yang-bisa-diambil-alih-ai-agent',
    locale: 'id',
    title: 'Lima tugas harian yang bisa diambil alih AI agent',
    excerpt:
      'Balasan, unggahan, tindak lanjut, catatan, dan rencana harian: di mana AI agent bisa membantu pekerjaan rutin.',
    cover: { kind: 'cover-kit', pose: 'handover', gradient: 'sun' },
    category: aiBasics,
    author,
    publishedAt: '2026-10-15T02:00:00.000Z',
    readingMinutes: readingMinutes(everydayTasks),
    body: everydayTasks,
    updatedAt: null,
    seo: seo(
      'Lima tugas harian untuk AI agent | Sineva',
      'Balasan pelanggan, unggahan media sosial, tindak lanjut, catatan sederhana, dan rencana harian: lima tugas rutin yang bisa dibantu AI agent.',
    ),
  },
  {
    slug: 'cara-menyiapkan-data-bisnis-sebelum-proyek-ai',
    locale: 'id',
    title: 'Cara menyiapkan data bisnis sebelum proyek AI',
    excerpt:
      'Hasil AI yang baik dimulai dari informasi yang rapi. Daftar periksa sederhana untuk menyiapkan data bisnis Anda.',
    cover: { kind: 'cover-kit', pose: 'whiteboard', gradient: 'mint' },
    category: projectPrep,
    author,
    publishedAt: '2026-10-14T02:00:00.000Z',
    readingMinutes: readingMinutes(prepareData),
    body: prepareData,
    updatedAt: null,
    seo: seo(
      'Menyiapkan data bisnis untuk proyek AI | Sineva',
      'Enam langkah untuk mengumpulkan, merapikan, dan melindungi informasi bisnis sebelum proyek AI. Baca, lalu ngobrol dengan Sineva.',
    ),
  },
  {
    slug: 'cara-memakai-ai-dengan-aman-di-bisnis-anda',
    locale: 'id',
    title: 'Cara memakai AI dengan aman di bisnis Anda',
    excerpt:
      'AI yang berjalan saja belum cukup. Panduan sederhana soal keamanan, aturan yang jelas, dan kepercayaan sebelum Anda mengandalkannya.',
    cover: { kind: 'cover-kit', pose: 'typing-laptop', gradient: 'teal' },
    category: aiBasics,
    author,
    publishedAt: '2026-10-13T02:00:00.000Z',
    readingMinutes: readingMinutes(safeAi),
    body: safeAi,
    updatedAt: null,
    seo: seo(
      'Cara memakai AI dengan aman di bisnis | Sineva',
      'Batasi apa yang bisa dilihat dan dilakukan AI, tetap libatkan orang, simpan catatan, dan buat aturan tim yang sederhana. Baca panduannya.',
    ),
  },
]

export const posts = postDetails.map(
  ({ slug, locale, title, excerpt, cover, category, author, publishedAt, readingMinutes }) => ({
    slug,
    locale,
    title,
    excerpt,
    cover,
    category,
    author,
    publishedAt,
    readingMinutes,
  }),
)

/** Indonesian article slug to the English article it translates, for the seed. */
export const EN_SLUG_BY_ID_SLUG: Readonly<Record<string, string>> = {
  'mulai-dari-mana-dengan-ai-di-usaha-kecil': 'where-to-start-with-ai-in-a-small-business',
  'lima-tugas-harian-yang-bisa-diambil-alih-ai-agent':
    'five-everyday-tasks-an-ai-agent-can-take-off-your-plate',
  'cara-menyiapkan-data-bisnis-sebelum-proyek-ai':
    'how-to-prepare-your-business-data-before-an-ai-project',
  'cara-memakai-ai-dengan-aman-di-bisnis-anda': 'how-to-use-ai-safely-in-your-business',
}
