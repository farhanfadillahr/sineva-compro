/**
 * Shown on the public site while an editor previews unsaved or draft content (CPR-106). The
 * preview looked exactly like the live site, so a draft could be mistaken for a published page.
 * Rendered only when `isPreviewRequest()` is true (Draft Mode plus a valid admin session), so
 * visitors never see it. The copy is the admin's language, like every admin screen.
 *
 * "Keluar dari pratinjau" posts to `/admin/preview/exit` (POST only, so a prefetch can never end
 * the preview), which turns Draft Mode off and returns to the admin.
 */
export function PreviewBar() {
  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-[2147483000] flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-3 rounded-md border border-border-strong bg-canvas px-4 py-3 text-body-sm text-text shadow-lg"
    >
      <span>
        <strong>Mode pratinjau.</strong> Halaman ini menampilkan isi yang belum terbit.
      </span>
      <form method="post" action="/admin/preview/exit">
        <button
          type="submit"
          className="min-h-11 rounded-sm border border-border-strong px-3 text-label underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Keluar dari pratinjau
        </button>
      </form>
    </div>
  )
}
