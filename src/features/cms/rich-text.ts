/**
 * Server-side validation of Tiptap JSON before it is stored. The public renderer
 * (`src/components/content/rich-text-model.ts`) sanitises again on read; this pass rejects what
 * the editor should never have produced, so stored content stays within the allowed node list
 * (admin-ui.md section 4.6) and within the copy rules.
 */
import { findForbiddenDashes, FORBIDDEN_DASH_MESSAGE } from '../../lib/copy/dash-rule'
import type { RichTextDocument, RichTextNode } from '../content/types'

const BLOCKS = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'image',
  'horizontalRule',
])
const INLINE = new Set(['text', 'hardBreak'])
const MARKS = new Set(['bold', 'italic', 'code', 'strike', 'link'])
/** Short answers (FAQ): paragraphs and lists with bold, italic and links only. */
const ANSWER_BLOCKS = new Set(['paragraph', 'bulletList', 'orderedList', 'listItem'])
const ANSWER_MARKS = new Set(['bold', 'italic', 'link'])
export type RichTextProfile = 'full' | 'answer'
const MAX_DEPTH = 12
const MAX_BYTES = 200_000

export type RichTextResult = { ok: true; value: RichTextDocument } | { ok: false; message: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function safeHref(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || /[\s\\]/.test(value.trim())) return false
  const href = value.trim()
  if (href.startsWith('#')) return true
  if (href.startsWith('/')) return !href.startsWith('//')
  try {
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(href).protocol)
  } catch {
    return false
  }
}

function attrs(
  input: unknown,
  allowed: readonly string[],
): Record<string, string | number | boolean | null> | undefined {
  if (!isRecord(input)) return undefined
  const output: Record<string, string | number | boolean | null> = {}
  for (const key of allowed) {
    const value = input[key]
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value))
      output[key] = value as string | number | boolean | null
  }
  return Object.keys(output).length ? output : undefined
}

class Invalid extends Error {}

function node(input: unknown, depth: number, profile: RichTextProfile): RichTextNode {
  if (depth > MAX_DEPTH) throw new Invalid('Struktur teks terlalu dalam.')
  if (!isRecord(input) || typeof input.type !== 'string') throw new Invalid('Isi teks tidak valid.')
  const type = input.type
  if (!BLOCKS.has(type) && !INLINE.has(type))
    throw new Invalid(`Elemen "${type}" tidak didukung editor.`)
  if (profile === 'answer' && !ANSWER_BLOCKS.has(type) && !INLINE.has(type))
    throw new Invalid('Jawaban hanya boleh berisi paragraf dan daftar.')
  if (type === 'text') {
    if (typeof input.text !== 'string' || !input.text) throw new Invalid('Isi teks tidak valid.')
    if (findForbiddenDashes(input.text).length) throw new Invalid(FORBIDDEN_DASH_MESSAGE)
    const marks = Array.isArray(input.marks)
      ? input.marks.map((mark) => {
          if (!isRecord(mark) || typeof mark.type !== 'string' || !MARKS.has(mark.type))
            throw new Invalid('Format teks tidak didukung.')
          if (profile === 'answer' && !ANSWER_MARKS.has(mark.type))
            throw new Invalid('Jawaban hanya boleh memakai tebal, miring dan tautan.')
          if (mark.type === 'link') {
            const href = isRecord(mark.attrs) ? mark.attrs.href : undefined
            if (!safeHref(href)) throw new Invalid('Tautan harus https, mailto, tel atau path /.')
            return { type: 'link', attrs: { href: (href as string).trim() } }
          }
          return { type: mark.type }
        })
      : undefined
    return { type, text: input.text, ...(marks?.length ? { marks } : {}) } as RichTextNode
  }
  let nodeAttrs: ReturnType<typeof attrs>
  if (type === 'heading') {
    const level = isRecord(input.attrs) ? input.attrs.level : undefined
    if (![2, 3, 4].includes(level as number)) throw new Invalid('Gunakan judul H2, H3 atau H4.')
    nodeAttrs = { level: level as number }
  } else if (type === 'image') {
    nodeAttrs = attrs(input.attrs, ['src', 'alt', 'width', 'height', 'title', 'mediaId'])
    const src = nodeAttrs?.src
    if (
      typeof src !== 'string' ||
      !(src.startsWith('/') ? !src.startsWith('//') : /^https?:\/\//.test(src))
    )
      throw new Invalid('Gambar harus berasal dari pustaka media.')
    if (typeof nodeAttrs?.alt !== 'string' || !nodeAttrs.alt.trim())
      throw new Invalid('Gambar dalam artikel wajib memiliki teks alternatif.')
  } else if (type === 'codeBlock') nodeAttrs = attrs(input.attrs, ['language'])
  else if (type === 'orderedList') nodeAttrs = attrs(input.attrs, ['start'])
  const content = Array.isArray(input.content)
    ? input.content.map((child) => node(child, depth + 1, profile))
    : undefined
  return {
    type,
    ...(nodeAttrs ? { attrs: nodeAttrs } : {}),
    ...(content?.length ? { content } : {}),
  }
}

/** Accepts a Tiptap document (`{ type: 'doc', content: [...] }`) and returns a clean copy. */
export function parseRichText(input: unknown, profile: RichTextProfile = 'full'): RichTextResult {
  try {
    if (!isRecord(input) || input.type !== 'doc') throw new Invalid('Isi teks tidak valid.')
    if (JSON.stringify(input).length > MAX_BYTES) throw new Invalid('Isi teks terlalu panjang.')
    const content = Array.isArray(input.content) ? input.content.map((child) => node(child, 1, profile)) : []
    // An editor's empty document is one empty paragraph; store it as an empty document.
    const meaningful = content.filter(
      (child) => child.type !== 'paragraph' || child.content?.length,
    )
    return { ok: true, value: { type: 'doc', content: meaningful.length ? content : [] } }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Invalid ? error.message : 'Isi teks tidak valid.',
    }
  }
}

/** Plain text of a document, for word counts and search. */
export function richTextToPlain(document: RichTextDocument | RichTextNode): string {
  const own = 'text' in document && document.text ? [document.text] : []
  return [...own, ...(document.content ?? []).map(richTextToPlain)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
