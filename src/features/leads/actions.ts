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
export type ContactSaveResult = { ok: true } | Exclude<ContactResult, { ok: true }>

/**
 * Same intake as `submitContact` (validation, anti-spam, storage, emails) without the redirect
 * (CPR-105). The contact form opens WhatsApp in the submit gesture and decides where to go
 * itself: to the thank-you page once the lead is stored, or it stays on the page to offer the
 * WhatsApp fallback when the browser blocked the new tab. The lead id never reaches the browser.
 */
export async function saveContact(
  input: unknown,
  meta: { locale?: string; sourcePage?: string } = {},
): Promise<ContactSaveResult> {
  const result = await createContactLead(input, { headers: await headers(), ...meta })
  return result.ok ? { ok: true } : result
}

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
