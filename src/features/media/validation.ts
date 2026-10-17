import 'server-only'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { MediaError } from './metadata'
export { parseMediaMetadata, MediaError } from './metadata'
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const IMAGE_LIMIT = 10 * 1024 * 1024
const formats = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
} as const
function sniff(data: Buffer): keyof typeof formats | null {
  if (data.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'jpeg'
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP')
    return 'webp'
  if (data.length >= 20 && data.toString('ascii', 4, 8) === 'ftyp') {
    const brands = data.toString('ascii', 8, Math.min(data.length, 64))
    if (/avif|avis/.test(brands)) return 'avif'
    if (/isom|iso[2-9]|mp4[12]|avc1|M4V /.test(brands)) return 'mp4'
  }
  if (
    data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) &&
    data.subarray(0, 4096).includes(Buffer.from('webm'))
  )
    return 'webm'
  if (
    /^%PDF-1\.[0-9]|^%PDF-2\.0/.test(data.toString('ascii', 0, 8)) &&
    data.subarray(-2048).includes(Buffer.from('%%EOF'))
  )
    return 'pdf'
  return null
}
export type CleanUpload = {
  body: Buffer
  filename: string
  contentType: string
  extension: string
  width: number | null
  height: number | null
  dominantColor: string | null
  hash: string
  kind: 'image' | 'video' | 'document'
}
export async function validateUpload(
  input: Buffer,
  filename: string,
  declaredType: string,
): Promise<CleanUpload> {
  const fail = (): never => {
    throw new MediaError(
      'INVALID',
      'File tidak valid. Gunakan gambar maksimal 10 MB/6000 px, video 20 MB, atau PDF 10 MB. SVG tidak didukung.',
    )
  }
  if (!input.length || input.length > MAX_UPLOAD_BYTES) return fail()
  const format = sniff(input)
  if (
    !format ||
    (declaredType &&
      declaredType !== 'application/octet-stream' &&
      declaredType !== formats[format])
  )
    return fail()
  const image = ['jpeg', 'png', 'webp', 'avif'].includes(format)
  if ((image || format === 'pdf') && input.length > IMAGE_LIMIT) return fail()
  let body = input,
    width: number | null = null,
    height: number | null = null,
    dominantColor: string | null = null
  if (image) {
    try {
      const pipeline = sharp(input, { limitInputPixels: 36_000_000, failOn: 'warning' })
      const info = await pipeline.metadata()
      if (
        !info.width ||
        !info.height ||
        Math.max(info.width, info.height) > 6000 ||
        (info.pages ?? 1) > 1
      )
        return fail()
      const cleaned = await pipeline
        .rotate()
        .toFormat(format as 'jpeg' | 'png' | 'webp' | 'avif')
        .toBuffer({ resolveWithObject: true })
      body = cleaned.data
      width = cleaned.info.width
      height = cleaned.info.height
      if (body.length > IMAGE_LIMIT) return fail()
      const color = (await sharp(body).stats()).dominant
      dominantColor = `#${[color.r, color.g, color.b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
    } catch {
      return fail()
    }
  }
  const extension = format === 'jpeg' ? 'jpg' : format
  const base =
    filename
      .split(/[\\/]/)
      .at(-1)
      ?.normalize('NFKC')
      .replace(/\.[^.]*$/, '')
      .replace(/[^\p{L}\p{N} ._-]/gu, '_')
      .slice(0, 140)
      .trim() || 'media'
  return {
    body: Buffer.from(body),
    filename: `${base}.${extension}`,
    contentType: formats[format],
    extension,
    width,
    height,
    dominantColor,
    hash: createHash('sha256').update(body).digest('hex'),
    kind: image ? 'image' : format === 'pdf' ? 'document' : 'video',
  }
}
