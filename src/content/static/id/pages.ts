import type { IconCardItem, PageContentMap, StepItem } from '../../../features/content/types'
import { work } from '../empty'
import { asset, doc, heading, paragraph, seo, step } from '../helpers'
import { pages as pagesEn } from '../pages'
import { privacyBody } from './privacy'
import { processSteps } from './services'

// Indonesian copy for every page, translated from ../pages.ts. Same rules (copywriting.md): sentence
// case, no em or en dash, no invented numbers, CTAs of 2 to 4 words. "Kami" is Sineva and "Anda" is
// the visitor. Structure, poses, icons and switches come from the English pages, so a design
// change there cannot be forgotten here.

const audienceCards: readonly IconCardItem[] = [
  {
    title: 'Usaha kecil',
    body: 'Pemilik usaha yang ingin lebih sedikit waktu untuk tugas berulang dan lebih banyak untuk pelanggan.',
    icon: 'chat-bubble',
  },
  {
    title: 'Perusahaan yang bertumbuh',
    body: 'Tim yang ingin AI menyesuaikan diri dengan alat dan kebiasaan yang sudah ada.',
    icon: 'puzzle-plug',
  },
  {
    title: 'Startup',
    body: 'Pendiri yang ingin mencoba ide dengan cepat dan belajar darinya.',
    icon: 'lightbulb',
  },
]

const productSteps: readonly StepItem[] = [
  step('Sampaikan kebutuhan Anda', 'Minta tugas dengan bahasa sehari-hari.'),
  step('Sino menyiapkannya', 'Sino membantu menyiapkan draf, daftar, atau ringkasan.'),
  step('Anda periksa', 'Baca hasilnya dan ubah apa pun yang Anda mau.'),
  step('Lanjutkan hari Anda', 'Pakai hasilnya dan beralih ke pekerjaan berikutnya.'),
]

const consultation = 'Jadwalkan konsultasi gratis'

export const pages: PageContentMap = {
  home: {
    key: 'home',
    locale: 'id',
    seo: seo(
      'Sedikit bantuan untuk kerja sehari-hari | Sineva',
      'Lebih banyak ruang untuk pekerjaan yang penting. Temukan bantuan AI yang praktis untuk bisnis Anda, dan ngobrol dengan kami soal langkah awal.',
    ),
    hero: {
      eyebrow: null,
      headline: 'AI untuk bisnis Anda, tanpa ribet',
      lead: 'Sedikit bantuan untuk tugas yang memenuhi hari Anda. Mari temukan bagian yang bisa dibuat lebih mudah dengan AI.',
      primaryCtaLabel: consultation,
      secondaryCtaLabel: 'Kabari saya soal Sino',
      poster: asset(
        '/mascot/poster/v008/sino-hero.webp',
        1600,
        1600,
        'Sino, teman AI yang ramah, sedang melambaikan tangan',
      ),
    },
    twoPaths: {
      product: {
        ...pagesEn.home.twoPaths.product,
        eyebrow: 'Produk',
        title: 'Pakai sendiri',
        body: 'Sineva AI Agents membuat Sino membantu tugas harian Anda. Segera hadir, dan Anda bisa minta dikabari.',
        ctaLabel: 'Kenali AI Agents',
      },
      services: {
        ...pagesEn.home.twoPaths.services,
        eyebrow: 'Layanan',
        title: 'Kami bangun bersama Anda',
        body: 'Belum tahu harus mulai dari mana, atau siap mencoba sebuah ide? Kami kerjakan langkah berikutnya bersama Anda.',
        ctaLabel: 'Lihat layanan',
      },
    },
    meetSino: {
      title: 'Kenalan dengan Sino',
      body: 'Sino adalah teman yang ramah untuk pekerjaan sehari-hari. Minta dengan bahasa biasa, dan Sino bisa membantu membalas pesan, mencari ide, dan tugas kecil berikutnya.',
    },
    capabilities: {
      title: 'Yang bisa dibantu Sino',
      intro: 'Serahkan tugas cukup dengan meminta, seperti meminta tolong ke rekan kerja.',
    },
    howWeWork: { title: 'Cara kami bekerja', steps: processSteps },
    whoWeHelp: { title: 'Siapa yang kami bantu', cards: audienceCards },
    selectedWork: { ...pagesEn.home.selectedWork, title: 'Karya pilihan' },
    fromBlog: { ...pagesEn.home.fromBlog, title: 'Dari blog' },
    faq: {
      title: 'Pertanyaan yang sering muncul',
      intro: 'Jawaban singkat soal Sino dan layanan kami.',
    },
    finalCta: {
      headline: 'Kami siap kapan pun Anda siap',
      body: 'Ceritakan apa yang ingin Anda serahkan. Kami bantu temukan langkah awalnya.',
      primaryCtaLabel: consultation,
      secondaryCtaLabel: 'Kabari saya soal Sino',
      whatsappCtaLabel: 'Chat di WhatsApp',
    },
  },

  product: {
    key: 'product',
    locale: 'id',
    seo: seo(
      'Sineva AI Agents: kenalan dengan Sino | Sineva',
      'Kenalan dengan Sino, AI agent untuk tugas bisnis sehari-hari. Sino belum tersedia. Minta dikabari saat sudah siap.',
    ),
    productStatus: pagesEn.product.productStatus,
    hero: {
      eyebrow: null,
      headline: 'Serahkan pekerjaan rutin ke Sino',
      lead: 'Minta tugas ke Sino seperti Anda meminta tolong ke rekan kerja. Anda periksa hasilnya sebelum dipakai.',
      primaryCtaLabel: 'Kabari saya',
      waitlistIntro: 'Kirim pesan singkat, dan kami kabari Anda saat Sino sudah siap.',
      mockup: {
        bubbles: [
          { from: 'user', text: 'Sino, balas chat pelanggan hari ini' },
          { from: 'sino', text: 'Sudah. Drafnya siap untuk Anda cek.' },
          { from: 'user', text: 'Tunjukkan yang pertama' },
          { from: 'sino', text: 'Ini dia. Ubah apa pun yang Anda mau.' },
        ],
        chips: ['Draf siap', 'Untuk Anda periksa', 'Selesai'],
      },
    },
    capabilities: {
      title: 'Yang bisa dibantu Sino',
      intro: 'Setiap tugas adalah permintaan yang bisa Anda serahkan ke Sino.',
    },
    howItWorks: { title: 'Cara kerjanya', steps: productSteps },
    madeForYou: {
      title: 'Dibuat untuk bisnis Anda',
      intro: 'Lihat seperti apa hari bersama Sino untuk jenis bisnis Anda.',
    },
    control: {
      title: 'Anda tetap memegang kendali',
      features: [
        {
          title: 'Anda yang memutuskan',
          body: 'Sino membantu pekerjaannya. Anda memilih apa yang dipakai dan apa yang diubah.',
          icon: 'shield',
        },
        {
          title: 'Bahasa sehari-hari',
          body: 'Minta seperti Anda berbicara. Tidak perlu mempelajari perintah khusus.',
          icon: 'chat-bubble',
        },
        {
          title: 'Jujur soal batasan',
          body: 'AI bisa keliru, jadi kami sarankan Anda memeriksa hasilnya.',
          icon: 'lightbulb',
        },
      ],
    },
    comparison: { ...pagesEn.product.comparison, title: 'Cara bekerja' },
    faq: { title: 'Pertanyaan soal Sino', intro: null },
    finalCta: {
      headline: 'Jadilah yang pertama mengenal Sino',
      body: 'Minta dikabari saat Sino sudah siap, atau ngobrol dengan kami soal solusi khusus.',
      primaryCtaLabel: 'Kabari saya',
      secondaryCtaLabel: consultation,
    },
  },

  servicesOverview: {
    key: 'servicesOverview',
    locale: 'id',
    seo: seo(
      'Temukan langkah AI berikutnya | Sineva',
      'Temukan, bangun, dan jalankan AI yang cocok untuk bisnis Anda lewat AI Discovery, AI Build, dan AI Enablement. Jadwalkan konsultasi gratis.',
    ),
    hero: {
      eyebrow: null,
      headline: 'Bantuan AI yang cocok untuk bisnis Anda',
      lead: 'Ceritakan bagian pekerjaan yang terasa ruwet. Kami bantu temukan langkah awal yang berguna dan membangun dari sana.',
      primaryCtaLabel: consultation,
    },
    servicesIntro: {
      title: 'Tiga cara kami membantu',
      body: 'Sudut pandang baru, solusi yang berjalan, atau pendampingan agar terbiasa dengan AI. Mulai dari yang Anda butuhkan.',
    },
    howWeWork: { title: 'Cara kami bekerja', steps: processSteps },
    whoWeHelp: { title: 'Siapa yang kami bantu', cards: audienceCards },
    selectedWork: { ...pagesEn.servicesOverview.selectedWork, title: 'Karya pilihan' },
    faq: { title: 'Pertanyaan yang sering muncul', intro: null },
    finalCta: {
      headline: 'Rencanakan langkah awal Anda',
      body: 'Ceritakan apa yang ingin Anda perbaiki. Kami balas dengan langkah berikutnya.',
      primaryCtaLabel: consultation,
      secondaryCtaLabel: null,
    },
  },

  about: {
    key: 'about',
    locale: 'id',
    seo: seo(
      'Tentang Sineva | Sineva',
      'Setiap hari bisnis membawa banyak hal untuk diurus. Sineva membantu pekerjaan sehari-hari terasa lebih ringan, dengan dukungan praktis untuk Anda dan tim.',
    ),
    hero: {
      title: 'Lebih banyak ruang untuk yang penting',
      lead: 'Anda punya bisnis untuk diurus. Kami hadir untuk membuat pekerjaan sehari-hari sedikit lebih ringan.',
      scene: asset(
        '/mascot/poses/v008/sino-relaxed.webp',
        1200,
        1200,
        'Sino bersantai dengan secangkir minuman',
      ),
    },
    // Same status as English: a proposal, not an approved company story.
    story: doc(
      heading('Cerita kami'),
      paragraph(
        'Hari kerja bisa bergerak ke banyak arah. Pertanyaan pelanggan, tugas berulang, dan rencana semuanya butuh perhatian Anda. Sineva membantu memberi ruang untuk pekerjaan yang Anda pedulikan.',
      ),
      paragraph(
        'Bantuan itu bisa dimulai dari memilih tugas yang berguna untuk AI, atau membentuk solusi sesuai cara kerja tim Anda. Kami mulai dengan mendengarkan, lalu melangkah bersama.',
      ),
      paragraph(
        'Kami sedang membangun Sino sebagai teman AI yang ramah untuk tugas bisnis sehari-hari. Anda bisa meminta dengan bahasa biasa dan memeriksa setiap hasil dengan teman yang siap membantu.',
      ),
    ),
    mission: {
      title: 'Mengapa kami ada',
      body: 'Kami membantu orang memberi ruang untuk pekerjaan, orang, dan rencana yang penting bagi mereka.',
    },
    values: {
      title: 'Yang kami pegang',
      items: [
        {
          title: 'Tetap sederhana',
          body: 'Kata yang jelas dan langkah kecil lebih baik dari janji besar.',
        },
        {
          title: 'Jujur',
          body: 'Kami menjelaskan AI dengan jelas dan memasang harapan yang realistis.',
        },
        {
          title: 'Membangun bersama',
          body: 'Tim Anda paling paham pekerjaannya, jadi kami bekerja bersama.',
        },
      ],
    },
    meetSino: {
      title: 'Kenalan dengan Sino',
      body: 'Sino adalah teman yang ramah untuk pekerjaan sehari-hari. Minta dengan bahasa biasa, dan Sino bisa membantu menyusun ide, menyiapkan balasan, dan merencanakan langkah berikutnya.',
    },
    team: { ...pagesEn.about.team, title: 'Orang di balik Sineva' },
    finalCta: {
      headline: 'Mari bicarakan tujuan Anda',
      body: 'Ceritakan apa yang ingin Anda perbaiki. Kami balas dengan langkah berikutnya.',
      primaryCtaLabel: consultation,
      secondaryCtaLabel: null,
    },
  },

  contact: {
    key: 'contact',
    locale: 'id',
    seo: seo(
      'Hubungi kami | Sineva',
      'Ceritakan proyek Anda dan dapatkan konsultasi gratis. Kirim pesan lewat WhatsApp dan kami balas dengan langkah berikutnya.',
    ),
    metaChips: ['Konsultasi gratis', 'Bahasa sederhana, tanpa jargon'],
    headline: 'Ceritakan proyek Anda',
    lead: 'Sampaikan tujuan Anda. Kami ubah menjadi pesan yang bisa Anda kirim lewat WhatsApp.',
    steps: [
      step('Sampaikan tujuan Anda', 'Isi formulir dengan beberapa detail.'),
      step(
        'Kirim lewat WhatsApp',
        'Kami siapkan pesannya. Anda mengirimnya dari WhatsApp Anda sendiri.',
      ),
      step(
        'Rencanakan bersama',
        'Kami balas dengan langkah berikutnya dan sepakati langkah awal yang pas.',
      ),
    ],
    responseTimeText: null,
    form: {
      intro:
        'Ceritakan sedikit soal bisnis dan kebutuhan Anda. Tidak ada yang terkirim sampai Anda menekan kirim di WhatsApp.',
      consentLabel: {
        before: 'Saya paham ini membuka WhatsApp dengan pesan yang siap dikirim. Baca ',
        linkLabel: 'kebijakan privasi',
        after: '.',
      },
    },
  },

  thankYou: {
    key: 'thankYou',
    locale: 'id',
    seo: seo(
      'Terima kasih | Sineva',
      'Terima kasih sudah menghubungi Sineva. Kami balas dengan langkah berikutnya, atau chat dengan kami di WhatsApp untuk jawaban lebih cepat.',
      true,
    ),
    headline: 'Terima kasih sudah menghubungi kami',
    body: 'Bila pesan Anda sudah terkirim, kami akan membalas dengan langkah berikutnya. Ingin jawaban lebih cepat? Chat dengan kami di WhatsApp.',
    whatsappCtaLabel: 'Chat di WhatsApp',
    // The Indonesian blog has no articles yet, so the second link points at services instead.
    nextLinks: [
      { label: 'Lihat layanan kami', target: 'services' },
      { label: 'Kenali AI Agents', target: 'product' },
    ],
  },

  notFound: {
    key: 'notFound',
    locale: 'id',
    seo: seo(
      'Halaman tidak ditemukan | Sineva',
      'Sino tidak menemukan halaman ini. Kembali ke beranda, lihat layanan kami, atau ngobrol dengan kami soal proyek Anda.',
      true,
    ),
    headline: 'Sino tidak menemukan halaman ini',
    body: 'Yuk, kembali ke jalur yang benar.',
    links: [
      { label: 'Ke beranda', target: 'home' },
      { label: 'Lihat layanan', target: 'services' },
      { label: 'Hubungi kami', target: 'contact' },
    ],
  },

  privacy: {
    key: 'privacy',
    locale: 'id',
    seo: seo(
      'Kebijakan privasi | Sineva',
      'Cara Sineva menangani data yang Anda bagikan: apa yang kami kumpulkan, alasannya, berapa lama disimpan, dan cara mengajukan permintaan.',
    ),
    body: privacyBody,
    effectiveDate: pagesEn.privacy.effectiveDate,
  },

  blogIndex: {
    key: 'blogIndex',
    locale: 'id',
    seo: seo(
      'Blog | Sineva',
      'Catatan praktis soal memakai AI dalam pekerjaan sehari-hari dari tim Sineva. Baca artikelnya, atau ngobrol dengan kami soal proyek Anda.',
    ),
    title: 'Blog',
    intro: 'Catatan praktis soal memakai AI dalam pekerjaan sehari-hari.',
    emptyState: 'Belum ada artikel. Kunjungi lagi nanti, atau ngobrol dengan kami hari ini.',
  },

  workIndex: {
    key: 'workIndex',
    locale: 'id',
    seo: seo(
      'Karya kami | Sineva',
      'Proyek yang sudah Sineva bangun dan bisa kami ceritakan. Belum ada yang bisa ditampilkan, jadi ceritakan proyek Anda dan rencanakan langkah awal.',
      work.length === 0,
    ),
    title: 'Karya kami',
    intro: 'Proyek yang sudah kami bangun akan tampil di sini saat siap dibagikan.',
    emptyState: 'Belum ada proyek untuk ditampilkan. Ceritakan proyek Anda.',
  },
}
