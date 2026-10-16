import { and, eq } from 'drizzle-orm'
import { redirect } from '../../src/features/redirects/schema'
import type { SeedModule } from './types'

const demo = { fromPath: '/demo-old-path', toPath: '/blog', status: 301 }

/** Base: no redirects exist at launch. Demo: one flagged rule; purge removes only that row. */
export const redirectsSeed: SeedModule = {
  key: 'redirects',
  async base() {},
  async demo(tx) {
    const [existing] = await tx.select().from(redirect).where(eq(redirect.fromPath, demo.fromPath))
    if (existing && !existing.isDemo) throw new Error('Reserved demo redirect belongs to real data')
    if (!existing) await tx.insert(redirect).values({ ...demo, source: 'manual', isDemo: true })
  },
  async purgeDemo(tx) {
    await tx
      .delete(redirect)
      .where(and(eq(redirect.fromPath, demo.fromPath), eq(redirect.isDemo, true)))
  },
}
