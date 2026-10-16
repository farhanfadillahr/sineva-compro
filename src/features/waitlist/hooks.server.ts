import 'server-only'

/** Runs after a new signup is committed (notification to the lead inbox, CPR-50). */
export async function afterWaitlistJoined(id: string): Promise<void> {
  const { sendWaitlistNotice } = await import('../leads/emails.server')
  await sendWaitlistNotice(id)
}
