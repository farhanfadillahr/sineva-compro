/**
 * Code-defined choice lists for select fields (3d-asset-requirements.md). Editors pick from these;
 * free uploads are not accepted for poses, icons or tints, which keeps the visuals consistent.
 */
import { ICON_KEYS, POSE_KEYS, type IconKey, type PoseKey } from '../content/types'
import { f } from './fields'

const poseLabels: Record<PoseKey, string> = {
  wave: 'Melambai',
  'holding-phone': 'Memegang ponsel',
  'typing-laptop': 'Mengetik di laptop',
  megaphone: 'Megafon',
  'coins-clipboard': 'Koin dan papan klip',
  handover: 'Menyerahkan kertas',
  magnifier: 'Kaca pembesar',
  'building-blocks': 'Menyusun balok',
  whiteboard: 'Papan tulis',
  'thumbs-up': 'Jempol',
  confused: 'Bingung',
  peeking: 'Mengintip',
  'relaxed-mug': 'Santai dengan mug',
  headshot: 'Wajah depan',
}

const iconLabels: Record<IconKey, string> = {
  'chat-bubble': 'Gelembung chat',
  calendar: 'Kalender',
  'coin-wallet': 'Dompet koin',
  megaphone: 'Megafon',
  'chart-rising': 'Grafik naik',
  'puzzle-plug': 'Puzzle dan colokan',
  shield: 'Perisai',
  lightbulb: 'Bola lampu',
}

export const poseOptions = POSE_KEYS.map((value) => ({ value, label: poseLabels[value] }))
export const iconOptions = ICON_KEYS.map((value) => ({ value, label: iconLabels[value] }))
export const tintOptions = [
  { value: 'teal', label: 'Teal' },
  { value: 'sun', label: 'Sun' },
  { value: 'mint', label: 'Mint' },
  { value: 'neutral', label: 'Netral' },
] as const
export const gradientOptions = [
  { value: 'teal', label: 'Teal' },
  { value: 'sun', label: 'Sun' },
  { value: 'mint', label: 'Mint' },
] as const

export const poseField = (label = 'Pose Sino') => f.select(label, poseOptions)
export const iconField = (label = 'Ikon') => f.select(label, iconOptions)
