import type { ReactNode } from 'react'
import { ICON_KEYS, type IconKey, type MediaAsset } from '@/features/content/types'

// Stand-in artwork for the sections gallery. The real Sino stills, poses and icons do not exist
// yet (3d-asset-requirements.md), and the fixture media URLs point at a host that next/image
// is not configured for, so the gallery draws its own pictures as data URLs. This file is a
// developer aid: it is not part of the design system and its colours are not design tokens.

function figure(width: number, height: number): string {
  const cx = width / 2
  const head = Math.min(width, height) * 0.22
  const bodyW = Math.min(width, height) * 0.44
  const bodyH = Math.min(width, height) * 0.4
  const bodyY = height - bodyH
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect x="${cx - bodyW / 2}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${bodyW * 0.3}" fill="#a6dedf"/>`,
    `<circle cx="${cx}" cy="${bodyY - head * 0.35}" r="${head}" fill="#eaf6f6" stroke="#6cc6c9" stroke-width="6"/>`,
    `<circle cx="${cx - head * 0.35}" cy="${bodyY - head * 0.4}" r="${head * 0.1}" fill="#083f4c"/>`,
    `<circle cx="${cx + head * 0.35}" cy="${bodyY - head * 0.4}" r="${head * 0.1}" fill="#083f4c"/>`,
    `</svg>`,
  ].join('')
}

function scene(width: number, height: number): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#d3eeee"/>`,
    `<circle cx="${width * 0.7}" cy="${height * 0.35}" r="${height * 0.22}" fill="#fff4e5"/>`,
    `<rect x="0" y="${height * 0.72}" width="${width}" height="${height * 0.28}" fill="#a6dedf"/>`,
    `</svg>`,
  ].join('')
}

const toDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

/** A Sino-like placeholder figure. */
export function placeholderPose(alt: string, width = 640, height = 640): MediaAsset {
  return { url: toDataUrl(figure(width, height)), width, height, alt, blurDataUrl: null }
}

/** A flat scene placeholder (hero scene variant). */
export function placeholderScene(alt: string, width = 1200, height = 800): MediaAsset {
  return { url: toDataUrl(scene(width, height)), width, height, alt, blurDataUrl: null }
}

/** A plain glyph per icon key, so every audience card shows an icon tile. */
export const placeholderIcons: Partial<Record<IconKey, ReactNode>> = Object.fromEntries(
  ICON_KEYS.map((key) => [
    key,
    <svg
      key={key}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>,
  ]),
)
