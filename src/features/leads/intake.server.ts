import 'server-only'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import {
  cleanLead,
  LEAD_ERROR_MESSAGES,
  readContactSubmission,
  validateContactSubmission,
  type ContactSubmission,
} from '../../lib/leads/contact-schema'
import { afterLeadCreated, checkSpam } from './hooks.server'
import { lead } from './schema'

export type ContactResult =
  | { ok: true; id: string }
  | {
      ok: false
      /** Field errors in English, by field name. */
      errors: Record<string, string>
      /** A message for the whole form (storage or spam failure). */
      formError: string | null
      /** The submitted values, so the form keeps the inputs and offers the WhatsApp fallback. */
      values: ContactSubmission
    }

const SOURCE = /^\/(?!\/)[a-z0-9\-/]{0,200}$/

/** Runs after the response when possible; never lets an email failure reach the visitor. */
async function scheduleAfter(task: () => Promise<void>) {
  try {
    const { after } = await import('next/server')
    after(() => task().catch(() => console.error('Lead follow-up failed.')))
  } catch {
    void task().catch(() => console.error('Lead follow-up failed.'))
  }
}

/**
 * Validates and stores a contact submission. Status starts as "new" (set here, never from input);
 * locale and source page come from the server. A failed save stores nothing and returns the values.
 */
export async function createContactLead(
  input: unknown,
  context: { headers: Headers; locale?: string; sourcePage?: unknown },
): Promise<ContactResult> {
  const values = readContactSubmission(input)
  const codes = validateContactSubmission(values)
  if (Object.keys(codes).length)
    return {
      ok: false,
      errors: Object.fromEntries(
        Object.entries(codes).map(([field, code]) => [field, LEAD_ERROR_MESSAGES[code!]]),
      ),
      formError: null,
      values,
    }
  const verdict = await checkSpam({
    kind: 'contact',
    input: (input && typeof input === 'object' ? input : {}) as Record<string, unknown>,
    headers: context.headers,
  })
  if (!verdict.ok)
    return {
      ok: false,
      errors: {},
      formError:
        verdict.reason === 'rate'
          ? 'Too many messages in a short time. Please try again later or chat with us on WhatsApp.'
          : 'We could not verify this message. Please try again or chat with us on WhatsApp.',
      values,
    }
  const locale = (routing.locales as readonly string[]).includes(context.locale ?? '')
    ? context.locale!
    : routing.defaultLocale
  const sourcePage =
    typeof context.sourcePage === 'string' && SOURCE.test(context.sourcePage)
      ? context.sourcePage
      : '/contact'
  try {
    const [row] = await db
      .insert(lead)
      .values({ ...cleanLead(values), consentAt: new Date(), locale, sourcePage })
      .returning({ id: lead.id })
    await scheduleAfter(() => afterLeadCreated(row.id))
    return { ok: true, id: row.id }
  } catch {
    console.error('Lead could not be stored.')
    return {
      ok: false,
      errors: {},
      formError: 'Your message could not be sent. Please try again or chat with us on WhatsApp.',
      values,
    }
  }
}
