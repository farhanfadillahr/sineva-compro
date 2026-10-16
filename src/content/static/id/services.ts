import type { ServiceDetail, ServiceSummary, StepItem } from '../../../features/content/types'
import { seo, step } from '../helpers'

// Indonesian counterpart of ../services.ts. Same slugs, icons, poses and tools as English, so the
// language switcher lands on the same service and the seed pairs the two translations by slug.

/** Empat langkah di Beranda dan Ringkasan layanan. */
export const processSteps: readonly StepItem[] = [
  step(
    'Ceritakan kebutuhan Anda',
    'Sampaikan bagian hari kerja yang ingin Anda buat lebih ringan.',
  ),
  step('Susun rencana', 'Kami pilih satu langkah awal yang berguna dan sepakati hasil yang baik.'),
  step(
    'Bangun bersama',
    'Anda mencobanya pada pekerjaan nyata, lalu kami sempurnakan dari masukan Anda.',
  ),
  step('Jaga tetap berguna', 'Kami bantu tim Anda terbiasa dan menjaga pekerjaan tetap berjalan.'),
]

export const serviceDetails: readonly ServiceDetail[] = [
  {
    slug: 'ai-discovery',
    locale: 'id',
    title: 'AI Discovery',
    summary:
      'Untuk bisnis yang belum tahu harus mulai dari mana. Temukan bagian yang bisa dibantu AI dan putuskan apa yang dicoba lebih dulu.',
    icon: 'lightbulb',
    pose: 'magnifier',
    problems: [
      {
        title: 'Terlalu banyak ide',
        body: 'Anda mendengar soal AI di mana-mana dan bingung harus mulai dari mana.',
      },
      {
        title: 'Manfaatnya belum jelas',
        body: 'Anda ingin tahu tugas mana yang layak diserahkan ke AI.',
      },
      {
        title: 'Belum ada rencana',
        body: 'Anda butuh rencana singkat dan jujur yang bisa diikuti tim.',
      },
    ],
    deliverables: [
      'Peta tugas yang bisa dibantu AI',
      'Daftar pendek ide yang diurutkan, lengkap dengan alasannya',
      'Catatan risiko dan batasan dalam bahasa sederhana',
      'Rekomendasi langkah awal yang bisa langsung Anda mulai',
    ],
    process: [
      step('Ngobrol', 'Kami mendengarkan cara bisnis Anda berjalan dan ke mana waktu habis.'),
      step('Petakan', 'Kami memetakan tugas dan alat yang dipakai tim Anda saat ini.'),
      step('Urutkan', 'Kami menimbang setiap ide dari usaha, manfaat, dan risikonya.'),
      step('Rekomendasikan', 'Kami berikan rencana singkat dengan langkah awal yang jelas.'),
    ],
    tools: ['Workshops', 'Process mapping', 'Opportunity scoring', 'Prototype sketches'],
    ctaLabel: 'Rencanakan proyek AI',
    seo: seo(
      'AI Discovery: temukan peluang AI | Sineva',
      'Bingung mulai dari mana dengan AI? Petakan pekerjaan, urutkan ide, dan pilih langkah awal. Jadwalkan konsultasi gratis dengan Sineva.',
    ),
  },
  {
    slug: 'ai-build',
    locale: 'id',
    title: 'AI Build',
    summary:
      'Untuk bisnis yang sudah tahu masalahnya. Kami membangun solusi AI yang cocok dengan cara kerja tim Anda, dari prototipe sampai siap dipakai, dengan aman.',
    icon: 'puzzle-plug',
    pose: 'building-blocks',
    problems: [
      {
        title: 'Alat yang tidak cocok',
        body: 'Alat siap pakai tidak mengikuti cara kerja tim Anda.',
      },
      { title: 'Tidak sempat membangun', body: 'Tim Anda sibuk menjalankan bisnis.' },
      {
        title: 'Berhenti di prototipe',
        body: 'Demo Anda sudah jalan, tetapi belum siap dipakai setiap hari.',
      },
      {
        title: 'Sistem tersebar',
        body: 'Informasi Anda ada di banyak tempat dan perlu bisa saling terhubung.',
      },
    ],
    deliverables: [
      'Solusi AI yang berjalan untuk satu tugas yang jelas',
      'Pengujian pada pekerjaan nyata Anda',
      'Sambungan ke sistem yang sudah Anda pakai, bila masuk akal',
      'Rilis siap pakai yang bisa diandalkan tim setiap hari',
      'Keamanan sejak awal: akses terbatas, data terlindungi, dan catatan atas apa yang dikerjakan AI',
      'Aturan jelas soal apa yang boleh dan tidak boleh dilakukan AI, dan siapa yang memeriksa hasilnya',
      'Catatan sederhana yang mudah diikuti tim Anda',
    ],
    process: [
      step(
        'Tentukan cakupan',
        'Kami sepakati satu tugas yang jelas dan seperti apa hasil yang baik.',
      ),
      step(
        'Bangun',
        'Kami bangun versi pertama dalam langkah kecil dan menunjukkannya sambil jalan.',
      ),
      step(
        'Uji',
        'Kami coba pada pekerjaan nyata Anda, memeriksa risiko keamanan dan privasinya, lalu memperbaiki temuan.',
      ),
      step(
        'Luncurkan',
        'Kami bawa dari prototipe ke tahap siap pakai dan serahkan catatan sederhana.',
      ),
    ],
    tools: ['Language models', 'Workflow automation', 'Chat interfaces', 'Web apps'],
    ctaLabel: 'Rencanakan proyek AI',
    seo: seo(
      'AI Build: AI khusus untuk tim Anda | Sineva',
      'Kami membangun AI yang cocok dengan cara kerja tim Anda, dari asisten chat sampai otomasi alur kerja. Jadwalkan konsultasi gratis.',
    ),
  },
  {
    slug: 'ai-enablement',
    locale: 'id',
    title: 'AI Enablement',
    summary:
      'Untuk tim yang baru mulai memakai AI. Kami bantu tim Anda belajar memakai AI dengan baik dan aman dalam pekerjaan sehari-hari.',
    icon: 'chart-rising',
    pose: 'whiteboard',
    problems: [
      {
        title: 'Kemampuan tidak merata',
        body: 'Sebagian orang memakai AI setiap hari, yang lain belum pernah mencoba.',
      },
      {
        title: 'Belum ada kebiasaan bersama',
        body: 'Setiap orang punya cara sendiri dan hasilnya berbeda-beda.',
      },
      {
        title: 'Ragu soal batasan',
        body: 'Tim belum yakin apa yang aman diserahkan ke AI.',
      },
    ],
    deliverables: [
      'Sesi praktik yang disusun dari tugas Anda sendiri',
      'Panduan bersama untuk pemakaian sehari-hari, termasuk apa yang aman dibagikan ke AI',
      'Cara sederhana untuk menyetujui alat dan pemakaian AI baru, agar tidak ada yang berjalan tanpa diperiksa',
      'Latihan dan contoh prompt',
      'Pendampingan lanjutan setelah sesi',
    ],
    process: [
      step('Pahami', 'Kami pelajari pekerjaan tim Anda dan cara mereka memakai AI saat ini.'),
      step('Rancang', 'Kami susun sesi berdasarkan tugas nyata Anda.'),
      step('Latih', 'Kami jalankan sesi praktik, peserta berlatih pada pekerjaan mereka sendiri.'),
      step('Dampingi', 'Kami jawab pertanyaan dan perbarui panduan seiring tim belajar.'),
    ],
    tools: ['Training sessions', 'Playbooks', 'Prompt libraries', 'Practice exercises'],
    ctaLabel: 'Rencanakan proyek AI',
    seo: seo(
      'AI Enablement: latih tim Anda soal AI | Sineva',
      'Bantu tim Anda memakai AI dengan baik dalam pekerjaan sehari-hari lewat sesi praktik dan panduan yang jelas. Ngobrol dengan Sineva.',
    ),
  },
]

export const services: readonly ServiceSummary[] = serviceDetails.map(
  ({ slug, locale, title, summary, icon, pose }) => ({ slug, locale, title, summary, icon, pose }),
)
