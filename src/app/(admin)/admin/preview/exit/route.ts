import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/** Ends the preview for this browser. POST only: a prefetch must not end it by accident. */
export async function POST() {
  ;(await draftMode()).disable()
  redirect('/admin')
}
