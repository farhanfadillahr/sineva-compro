import { cookies, draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPrincipal } from '@/features/auth/session.server'
import { openPreview, PREVIEW_COOKIE } from '@/features/preview/service.server'

export const dynamic = 'force-dynamic'

/**
 * Opens a preview of unsaved editor state (CPR-88). Needs an admin session AND a valid, unexpired,
 * untampered token; the public page then renders the state through the normal DTO path while
 * Draft Mode keeps it out of every cache and the proxy marks it noindex.
 */
export async function GET(request: Request) {
  if (!(await getPrincipal())) redirect('/admin/login')
  const token = new URL(request.url).searchParams.get('token')
  const preview = await openPreview(token)
  if (!preview)
    return new Response('Tautan pratinjau tidak valid atau sudah kedaluwarsa.', { status: 403 })
  ;(await cookies()).set(PREVIEW_COOKIE, token!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: preview.expiresAt,
  })
  ;(await draftMode()).enable()
  redirect(preview.path)
}
