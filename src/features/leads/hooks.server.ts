import 'server-only'

/**
 * Extension points of the contact intake. Anti-spam (CPR-49) decides before anything is stored;
 * the email step (CPR-50) runs after the lead is committed and never fails the submission.
 */
export type SpamVerdict = { ok: true } | { ok: false; reason: 'honeypot' | 'captcha' | 'rate' }
export type IntakeContext = Readonly<{
  kind: 'contact' | 'waitlist'
  input: Readonly<Record<string, unknown>>
  headers: Headers
}>

export async function checkSpam(context: IntakeContext): Promise<SpamVerdict> {
  void context
  return { ok: true }
}

export async function afterLeadCreated(id: string): Promise<void> {
  void id
}
