import { faq as faqEn, type FaqEntry } from '../faq'
import { paragraphs } from '../helpers'

// Indonesian answers to ../faq.ts, in the same order and with the same tags (taken from the
// English entry, so the two lists cannot drift). The seed pairs them by position.
const answers: readonly (readonly [question: string, ...answer: string[]])[] = [
  [
    'Apa itu Sineva Product Suite?',
    'Sineva Product Suite mencakup produk AI untuk pekerjaan tim, keuangan, penjualan, konten sosial, dukungan pelanggan dan internal, serta insight bisnis. Setiap produk membantu kebutuhan yang berbeda dalam pekerjaan bisnis sehari-hari.',
  ],
  [
    'Untuk siapa Sineva?',
    'Kami bekerja dengan usaha kecil, perusahaan yang sedang bertumbuh, dan startup yang ingin memakai AI dalam pekerjaan sehari-hari.',
  ],
  [
    'Apakah saya perlu keahlian teknis untuk memakai Sino?',
    'Tidak. Anda cukup meminta dengan bahasa sehari-hari, seperti meminta tolong ke rekan kerja.',
  ],
  [
    'Bisakah Anda membangun sesuatu untuk bisnis saya?',
    'Bisa. Ceritakan apa yang memperlambat tim Anda dan kami sarankan langkah awalnya. Layanan AI Build memang untuk itu.',
  ],
  [
    'Apakah Sino sudah tersedia?',
    'Belum. Minta dikabari, dan kami akan memberi tahu Anda saat Sino sudah siap.',
  ],
  [
    'Bagaimana sebuah proyek dimulai?',
    'Kami mulai dengan konsultasi gratis. Anda ceritakan tujuan Anda, lalu kami balas dengan langkah berikutnya.',
  ],
  [
    'Bagaimana kalau saya belum yakin butuh layanan yang mana?',
    'Mulailah dengan AI Discovery. Kami pelajari cara bisnis Anda berjalan dan membantu memilih langkah awal.',
  ],
  [
    'Apa saja produk dalam Sineva Product Suite?',
    'SinoPeople membantu HR dan pengalaman karyawan, SinoMoney mendukung pekerjaan keuangan, SinoSales membantu penjualan, SinoSocial membantu konten sosial, SinoHelp mendukung pelanggan dan tim, serta SinoInsights merangkum data perusahaan untuk membantu pengambilan keputusan.',
  ],
  [
    'Apakah Sino akan menggantikan tim saya?',
    'Tidak. Sino dibuat untuk mengambil alih tugas berulang, sehingga Anda bisa memakai waktu untuk pekerjaan yang butuh sentuhan manusia.',
  ],
  [
    'Apakah Anda hanya bekerja dengan perusahaan besar?',
    'Tidak. Kami bekerja dengan usaha kecil, perusahaan yang sedang bertumbuh, dan startup.',
  ],
  [
    'Apa yang kami dapat dari AI Discovery?',
    'Peta bagian yang bisa dibantu AI, daftar pendek ide yang sudah diurutkan, dan rekomendasi langkah awal dalam bahasa sederhana.',
  ],
  [
    'Apakah kami perlu paham AI terlebih dulu?',
    'Tidak. Bawa pertanyaan Anda dan gambaran cara bisnis Anda berjalan. Sisanya kami jelaskan dengan bahasa sederhana.',
  ],
  [
    'Apa yang kami dapat dari AI Build?',
    'Solusi yang berjalan untuk satu tugas yang jelas, sudah diuji pada pekerjaan nyata Anda, lengkap dengan catatan sederhana untuk tim.',
  ],
  [
    'Bisakah Anda bekerja dengan alat yang sudah kami pakai?',
    'Kami mulai dengan melihat cara kerja tim Anda saat ini, dan berusaha menyesuaikan dengan alat yang sudah Anda pakai. Kami akan jujur soal apa yang mungkin.',
  ],
  [
    'Apakah Anda membuat website?',
    'Ya, bila aplikasi web menjadi bagian dari solusi AI. Kami tidak menawarkan pembuatan website sebagai layanan tersendiri.',
  ],
  [
    'Bagaimana AI Enablement berjalan?',
    'Kami menjalankan sesi praktik yang disusun dari tugas tim Anda, dan memberikan panduan bersama untuk pemakaian sehari-hari.',
  ],
  [
    'Untuk siapa AI Enablement?',
    'Tim yang baru mulai memakai AI, atau yang pemakaiannya belum merata dan ingin punya kebiasaan bersama.',
  ],
  [
    'Apakah Anda membantu setelah sesi selesai?',
    'Ya. Kami menyediakan pendampingan lanjutan, sehingga tim Anda bisa bertanya saat mulai mempraktikkannya.',
  ],
]

if (answers.length !== faqEn.length)
  throw new Error('Indonesian FAQ must translate every English entry, in order')

export const faq: readonly FaqEntry[] = faqEn.map((entry, i) => {
  const [question, ...answer] = answers[i]
  return { tags: entry.tags, item: { question, answer: paragraphs(...answer) } }
})
