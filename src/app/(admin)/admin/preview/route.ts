import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPrincipal } from '@/features/auth/session.server'
import { previewPath } from '@/features/cms/preview-target.server'

export const dynamic = 'force-dynamic'

/**
 * Starts an authorised preview: requires an admin session, resolves the public path from the
 * database and turns on Draft Mode for this browser. The public page then reads drafts (only while
 * the session stays valid), is not cached and is served with `X-Robots-Tag: noindex`.
 */
export async function GET(request: Request) {
  await headers()
  if (!(await getPrincipal())) redirect('/admin/login')
  const path = await previewPath(new URL(request.url).searchParams)
  if (!path) return new Response('Pratinjau tidak ditemukan.', { status: 404 })
  ;(await draftMode()).enable()
  redirect(path)
}
