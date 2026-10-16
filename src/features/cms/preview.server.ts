import 'server-only'

/**
 * True when the request is an authorised preview: Draft Mode is on (cookie set by
 * `/admin/preview`) and the visitor still has a valid admin session. Draft Mode alone is not
 * trusted, so a leaked cookie without a session never shows drafts. Outside a request (build,
 * scripts, tests) this is always false.
 */
export async function isPreviewRequest(): Promise<boolean> {
  try {
    const { draftMode } = await import('next/headers')
    if (!(await draftMode()).isEnabled) return false
    const { getPrincipal } = await import('../auth/session.server')
    return !!(await getPrincipal())
  } catch {
    return false
  }
}
