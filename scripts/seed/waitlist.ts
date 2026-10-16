import { and, eq, like } from 'drizzle-orm'
import { waitlist } from '../../src/features/waitlist/schema'
import type { SeedModule } from './types'

const demo = ['Small business', 'Startup', null].map((segment, index) => ({
  email: `demo-waitlist-${index + 1}@example.com`,
  segment,
  locale: 'en',
  consentAt: new Date('2026-10-16T00:00:00Z'),
  isDemo: true,
}))

/** Demo signups only, flagged and on example.com; purge removes exactly those. */
export const waitlistSeed: SeedModule = {
  key: 'waitlist',
  async base() {},
  async demo(tx) {
    for (const row of demo) {
      const [existing] = await tx.select().from(waitlist).where(eq(waitlist.email, row.email))
      if (existing && !existing.isDemo)
        throw new Error('Reserved demo waitlist email belongs to real data')
      if (!existing) await tx.insert(waitlist).values(row)
    }
  },
  async purgeDemo(tx) {
    await tx
      .delete(waitlist)
      .where(and(eq(waitlist.isDemo, true), like(waitlist.email, 'demo-waitlist-%@example.com')))
  },
}
