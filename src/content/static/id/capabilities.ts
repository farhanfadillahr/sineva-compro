import type { Industry, ProductCapability } from '../../../features/content/types'
import { capabilities as capabilitiesEn, industries as industriesEn } from '../capabilities'

// Indonesian copy for ../capabilities.ts. Product names stay consistent across locales.
const capabilityCopy: Record<string, Pick<ProductCapability, 'title' | 'body' | 'mockupLines'>> = {
  'people-experience': {
    title: 'SinoPeople',
    body: 'Mesin HR dan Pengalaman Karyawan yang Cerdas. Asisten AI untuk setiap tahap perjalanan karyawan. SinoPeople menyaring CV, menyiapkan onboarding personal, serta memantau sentimen dan insight kinerja secara real time.',
    mockupLines: [
      'SinoPeople, siapkan rencana onboarding untuk karyawan baru',
      'Ini rencana personal untuk beberapa minggu pertama.',
    ],
  },
  'financial-intelligence': {
    title: 'SinoMoney',
    body: 'Kecerdasan Keuangan Otonom. Asisten keuangan AI yang mengotomatisasi pemrosesan faktur, menandai pengeluaran tidak biasa, memproyeksikan arus kas, serta membuat laporan kepatuhan dan audit dengan presisi saat dibutuhkan. Informasi ini bukan nasihat keuangan.',
    mockupLines: [
      'SinoMoney, periksa faktur dan pengeluaran bulan ini',
      'Saya menemukan beberapa hal untuk ditinjau dan menyiapkan ringkasan bulanan.',
    ],
  },
  'sales-acceleration': {
    title: 'SinoSales',
    body: 'Akselerasi Penjualan dan Kesepakatan Prediktif. Asisten penjualan yang menilai prospek masuk, memperkirakan peluang deal, menyiapkan proposal personal, dan memberi saran real time saat berinteraksi dengan pelanggan.',
    mockupLines: [
      'SinoSales, tinjau prospek baru ini',
      'Ini prioritas dan saran tindak lanjut untuk tiap prospek.',
    ],
  },
  'social-content': {
    title: 'SinoSocial',
    body: 'Mesin Konten dan Media Sosial Adaptif. Strategi brand berbasis AI yang memantau tren, menyiapkan draf kampanye multi-kanal, menjadwalkan konten secara dinamis, dan menganalisis sentimen interaksi pelanggan di berbagai platform.',
    mockupLines: [
      'SinoSocial, siapkan draf unggahan kampanye minggu ini',
      'Ini ide kampanye dan draf konten untuk Anda tinjau.',
    ],
  },
  'support-automation': {
    title: 'SinoHelp',
    body: 'Otomasi Proses dan Dukungan Cerdas. Platform dukungan 24/7 yang menangani tiket rutin pelanggan dan tim, mengatur alur lintas divisi, serta menjawab pertanyaan kompleks lewat percakapan AI.',
    mockupLines: [
      'SinoHelp, kelompokkan permintaan dukungan yang masuk ini',
      'Permintaan sudah dikelompokkan dengan saran langkah berikutnya.',
    ],
  },
  'enterprise-intelligence': {
    title: 'SinoInsights',
    body: 'Pusat Insight dan Keputusan Perusahaan. Dasbor AI terpusat yang merangkum data kompleks lintas divisi menjadi insight percakapan, ringkasan eksekutif, dan proyeksi tren.',
    mockupLines: [
      'SinoInsights, rangkum kinerja kuartal ini',
      'Ini ringkasan eksekutif beserta tren utamanya.',
    ],
  },
}

const industryCopy: Record<string, Pick<Industry, 'label' | 'exampleDay'>> = {
  'online-shop': {
    label: 'Toko online',
    exampleDay:
      'Pagi hari, Sino menyiapkan draf balasan untuk pertanyaan pesanan. Anda cek, kirim, lalu kembali mengemas barang.',
  },
  'cafe-and-restaurant': {
    label: 'Kafe dan restoran',
    exampleDay:
      'Sino membantu menjawab pertanyaan soal jam buka dan menu, lalu memberi Anda daftar singkat chat yang perlu Anda tangani.',
  },
  'local-services': {
    label: 'Jasa lokal',
    exampleDay:
      'Sino membantu mengumpulkan permintaan booking dan menyiapkan pesan tindak lanjut, sehingga Anda bisa mengonfirmasinya di sela pekerjaan.',
  },
}

function translated<C>(copy: Record<string, C>, key: string): C {
  const found = copy[key]
  if (!found) throw new Error(`Missing Indonesian copy for ${key}`)
  return found
}

export const capabilities: readonly ProductCapability[] = capabilitiesEn.map((item) => ({
  ...item,
  ...translated(capabilityCopy, item.key),
}))

export const industries: readonly Industry[] = industriesEn.map((item) => ({
  ...item,
  ...translated(industryCopy, item.key),
}))
