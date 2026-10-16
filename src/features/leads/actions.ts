'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { routing } from '../../i18n/routing'
import { localizedPath } from '../cms/paths'
import { createContactLead, type ContactResult } from './intake.server'

/**
 * Public server action of the contact form (CPR-78). Stores the lead, then redirects to the
 * thank-you page; on failure returns errors and the submitted values. The redirect is outside the
 * save so a failed save never redirects. There is no public `/api/leads` route.
 */
export async function submitContact(
  input: unknown,
  meta: { locale?: string; sourcePage?: string } = {},
): Promise<Exclude<ContactResult, { ok: true }>> {
  const result = await createContactLead(input, { headers: await headers(), ...meta })
  if (!result.ok) return result
  const locale = (routing.locales as readonly string[]).includes(meta.locale ?? '')
    ? meta.locale!
    : routing.defaultLocale
  redirect(localizedPath(locale, '/contact/thank-you'))
}
