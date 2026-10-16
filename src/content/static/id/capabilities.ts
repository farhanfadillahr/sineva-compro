import type { Industry, ProductCapability } from '../../../features/content/types'
import { capabilities as capabilitiesEn, industries as industriesEn } from '../capabilities'

// Indonesian copy for ../capabilities.ts. Keys, tints, poses and the featured flag come from the
// English list, so only the words can differ. Same claim limits: no channel, integration, price
// or date, and finance stays "not advice".
const capabilityCopy: Record<string, Pick<ProductCapability, 'title' | 'body' | 'mockupLines'>> = {
  'customer-chat': {
    title: 'Sino, balas chat pelanggan hari ini',
    body: 'Sino membantu menyiapkan draf balasan untuk pertanyaan pelanggan yang umum, sehingga Anda tinggal membaca, menyesuaikan, dan mengirimnya.',
    mockupLines: ['Sino, balas chat pelanggan hari ini', 'Sudah. Drafnya siap untuk Anda cek.'],
  },
  'social-media': {
    title: 'Sino, siapkan draf unggahan minggu ini',
    body: 'Sino membantu mencari ide unggahan dan draf caption yang bisa Anda ubah sebelum dibagikan.',
    mockupLines: ['Sino, siapkan draf unggahan minggu ini', 'Ini tiga ide lengkap dengan caption.'],
  },
  'sales-follow-up': {
    title: 'Sino, hubungi lagi calon pembeli minggu lalu',
    body: 'Sino membantu mengingat siapa saja yang bertanya soal produk Anda dan menyiapkan pesan tindak lanjut yang ramah untuk masing-masing.',
    mockupLines: [
      'Sino, hubungi lagi calon pembeli minggu lalu',
      'Saya sudah tulis pesan singkat untuk tiap orang.',
    ],
  },
  'finance-admin': {
    title: 'Sino, ringkas pengeluaran bulan ini',
    body: 'Sino membantu mencatat transaksi sederhana dan membacanya sebagai ringkasan singkat. Ini alat bantu, bukan nasihat keuangan.',
    mockupLines: ['Sino, ringkas pengeluaran bulan ini', 'Ini ringkasannya per kategori.'],
  },
  operations: {
    title: 'Sino, apa saja yang perlu dikerjakan hari ini',
    body: 'Sino membantu Anda memulai hari dengan daftar tugas dan pengingat yang singkat, sehingga lebih sedikit yang terlewat.',
    mockupLines: [
      'Sino, apa saja yang perlu dikerjakan hari ini',
      'Ada empat tugas. Mau mulai sekarang?',
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
