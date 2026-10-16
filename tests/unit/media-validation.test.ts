import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { validateUpload, parseMediaMetadata, MediaError } from '@/features/media/validation'

const metadata = {
  translations: { en: { alt: 'Our team at work', caption: '' } },
  focalX: 0.5,
  focalY: 0.5,
  credit: '',
}
describe('media metadata', () => {
  it('requires all enabled locale alt text on upload and rejects unsafe copy/limits', () => {
    expect(parseMediaMetadata(metadata, true, ['en']).translations.en.alt).toBe('Our team at work')
    for (const value of [
      { ...metadata, translations: {} },
      { ...metadata, focalX: 2 },
      { ...metadata, credit: 'x'.repeat(161) },
      { ...metadata, translations: { en: { alt: 'Team — work', caption: '' } } },
      { ...metadata, translations: { en: { alt: 'Team', caption: 'Office – team' } } },
    ])
      expect(() => parseMediaMetadata(value, true, ['en'])).toThrow(MediaError)
    // Both locales are enabled (CPR-101), so an upload needs Indonesian alt text too.
    expect(() => parseMediaMetadata(metadata, true)).toThrow()
    const bilingual = {
      ...metadata,
      translations: { ...metadata.translations, id: { alt: 'Tim kami bekerja', caption: '' } },
    }
    expect(parseMediaMetadata(bilingual, true).translations.id.alt).toBe('Tim kami bekerja')
    expect(
      parseMediaMetadata({ ...metadata, translations: { en: { alt: '', caption: '' } } }, false)
        .translations.en.alt,
    ).toBe('')
  })
})
describe('binary upload validation', () => {
  it('sniffs real PNG and stores clean dimensions, dominant colour and content hash', async () => {
    const input = await sharp({
      create: { width: 8, height: 4, channels: 3, background: '#ff0000' },
    })
      .png()
      .toBuffer()
    const value = await validateUpload(input, 'fake-name.pdf', 'image/png')
    expect(value).toMatchObject({ contentType: 'image/png', extension: 'png', width: 8, height: 4 })
    expect(value.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(value.dominantColor).toMatch(/^#[a-f0-9]{6}$/)
  })
  it('rejects disguised HTML, SVG, corrupt images, MIME mismatch, excessive bytes and dimensions', async () => {
    for (const data of [
      Buffer.from('<html>fake</html>'),
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ])
      await expect(validateUpload(data, 'fake.png', 'image/png')).rejects.toThrow(MediaError)
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer()
    await expect(validateUpload(png, 'file.png', 'text/html')).rejects.toThrow(MediaError)
    await expect(
      validateUpload(Buffer.alloc(20 * 1024 * 1024 + 1), 'large.mp4', 'video/mp4'),
    ).rejects.toThrow(MediaError)
    const wide = await sharp({ create: { width: 6001, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer()
    await expect(validateUpload(wide, 'wide.png', 'image/png')).rejects.toThrow(MediaError)
  })
  it('strips EXIF including GPS data from a JPEG photo', async () => {
    const photo = await sharp({ create: { width: 8, height: 4, channels: 3, background: 'blue' } })
      .jpeg()
      .withExif({
        IFD0: { Artist: 'Private author' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 30/1 0/1' },
      })
      .toBuffer()
    expect((await sharp(photo).metadata()).exif).toBeDefined()
    const clean = await validateUpload(photo, 'photo.jpg', 'image/jpeg')
    expect((await sharp(clean.body).metadata()).exif).toBeUndefined()
  })
  it('accepts PDF and video signatures with appropriate limits', async () => {
    const pdf = await validateUpload(
      Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF'),
      'guide.pdf',
      'application/pdf',
    )
    expect(pdf.extension).toBe('pdf')
    await expect(
      validateUpload(
        Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(10 * 1024 * 1024)]),
        'large.pdf',
        'application/pdf',
      ),
    ).rejects.toThrow()
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from('ftypisom'),
      Buffer.alloc(12),
    ])
    expect((await validateUpload(mp4, 'clip.mp4', 'video/mp4')).contentType).toBe('video/mp4')
    expect(
      (
        await validateUpload(
          Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x42, 0x82, 0x84, ...Buffer.from('webm')]),
          'clip.webm',
          'video/webm',
        )
      ).extension,
    ).toBe('webm')
  })
})
