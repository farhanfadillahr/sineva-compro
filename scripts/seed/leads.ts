import { and, eq, like } from 'drizzle-orm'
import { lead } from '../../src/features/leads/schema'
import type { SeedModule } from './types'

/** Demo leads only (no launch data): example.com emails and 62800… numbers, flagged `is_demo`. */
const demoLeads = [
  ['Ayu (demo)', 'Small business', 'AI Discovery', 'new'],
  ['Budi (demo)', 'Company', 'AI Build', 'contacted'],
  ['Citra (demo)', 'Startup', 'Not sure yet', 'qualified'],
].map(([name, segment, interest, status], index) => ({
  name,
  email: `demo-lead-${index + 1}@example.com`,
  phone: `628000000000${index + 1}`,
  company: null,
  segment,
  interest,
  budget: null,
  message: '[Demo] Sample lead for development and tests. Not a real person.',
  consentAt: new Date('2026-10-16T00:00:00Z'),
  locale: 'en',
  sourcePage: '/contact',
  status,
  isDemo: true,
}))

export const leadsSeed: SeedModule = {
  key: 'leads',
  async base() {},
  async demo(tx) {
    for (const row of demoLeads) {
      const [existing] = await tx.select().from(lead).where(eq(lead.email, row.email))
      if (existing && !existing.isDemo)
        throw new Error('Reserved demo lead email belongs to real data')
      if (!existing) await tx.insert(lead).values(row)
    }
  },
  async purgeDemo(tx) {
    await tx
      .delete(lead)
      .where(and(eq(lead.isDemo, true), like(lead.email, 'demo-lead-%@example.com')))
  },
}
