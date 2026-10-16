import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { like } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { teamMember } from '../../src/features/collections/tables'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let service: typeof import('../../src/features/collections/service.server')
let reads: typeof import('../../src/features/team/public.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  service = await import('../../src/features/collections/service.server')
  reads = await import('../../src/features/team/public.server')
  await ctx.connection.db.delete(teamMember)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(auditLog).where(like(auditLog.entityId, 'team:%'))
  await ctx.cleanup()
})

const member = (key: string, showOnAbout: boolean) => ({
  key,
  global: {
    name: 'Ayu Lestari',
    photo: { kind: 'static', url: '/brand/team/ayu.webp', width: 400, height: 400, alt: 'Ayu' },
    socialUrl: 'https://www.linkedin.com/in/example',
    showOnAbout,
  },
  locales: { en: { role: 'Consultant', bio: '' } },
})

it('starts empty (no one agreed to be listed) and purges demo rows', async () => {
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=team', '--demo'], 'test')
  expect(await reads.teamReads.listTeam('en')).toEqual([])
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=team', '--purge-demo'], 'test')
  expect(await ctx.connection.db.select().from(teamMember)).toHaveLength(0)
})

it('lists only members shown on About; authors resolve whether shown or not', async () => {
  await expect(
    service.saveCollectionItem(ctx.anonymous, 'team', member('anon', true)),
  ).rejects.toThrow()
  const shown = await service.saveCollectionItem(
    ctx.editorHeaders,
    'team',
    member('ayu-lestari', true),
  )
  const hidden = await service.saveCollectionItem(
    ctx.editorHeaders,
    'team',
    member('hidden-author', false),
  )
  const team = await reads.teamReads.listTeam('en')
  expect(team).toEqual([
    {
      name: 'Ayu Lestari',
      role: 'Consultant',
      bio: null,
      photo: {
        url: '/brand/team/ayu.webp',
        width: 400,
        height: 400,
        alt: 'Ayu',
        blurDataUrl: null,
      },
      socialUrl: 'https://www.linkedin.com/in/example',
    },
  ])
  expect(await reads.authorSummary(hidden, 'en')).toMatchObject({
    name: 'Ayu Lestari',
    role: 'Consultant',
  })
  // Editing the profile keeps the stable id the author relation points to.
  await service.saveCollectionItem(ctx.editorHeaders, 'team', {
    ...member('ayu-lestari', true),
    id: shown,
    locales: { en: { role: 'Lead consultant', bio: 'Helps teams start.' } },
  })
  expect((await reads.authorSummary(shown, 'en'))?.role).toBe('Lead consultant')
})
