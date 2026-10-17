import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { sql } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { lead } from '../../src/features/leads/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let dashboard: typeof import('../../src/features/dashboard/service.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  dashboard = await import('../../src/features/dashboard/service.server')
  await ctx.connection.db.delete(lead)
  // 10k leads spread over the last 90 days, inserted in one statement.
  await ctx.connection.db.execute(sql`
    INSERT INTO lead (name, email, phone, segment, interest, message, consent_at, locale, source_page, status, is_demo, created_at)
    SELECT 'Load test', 'load' || g || '@example.com', '6281234567890',
      (ARRAY['Small business','Company','Startup','Other'])[1 + g % 4],
      (ARRAY['AI Discovery','AI Build','AI Enablement','AI Agents product','Not sure yet'])[1 + g % 5],
      'Load test lead for the dashboard budget.', now(), 'en', '/contact',
      (ARRAY['new','contacted','qualified','won','lost'])[1 + g % 5], true,
      now() - (g % 90) * interval '1 day'
    FROM generate_series(1, 10000) AS g`)
}, 60_000)
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(lead)
  await ctx.cleanup()
})

it('never computes lead or waitlist numbers for an Editor', async () => {
  const data = await dashboard.loadDashboard(ctx.editorHeaders, 30)
  expect(data.leads).toBeNull()
  expect(JSON.stringify(data)).not.toContain('Load test')
  await expect(dashboard.loadDashboard(ctx.anonymous, 30)).rejects.toThrow()
})

it('aggregates 10k leads in SQL within the one second budget', async () => {
  const started = performance.now()
  const data = await dashboard.loadDashboard(ctx.adminHeaders, 90)
  const elapsed = performance.now() - started
  expect(elapsed).toBeLessThan(1000)
  expect(data.leads?.series).toHaveLength(90)
  expect(data.leads?.series.reduce((sum, p) => sum + p.leads, 0)).toBe(data.leads?.leads.value)
  expect(data.leads?.perStatus.reduce((sum, p) => sum + p.value, 0)).toBe(data.leads?.leads.value)
  expect(data.leads?.latest).toHaveLength(5)
})
