import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { session } from '../../src/features/auth/schema'
import { authLockout } from '../../src/features/auth/lockout-schema'
import { userPreference } from '../../src/features/profile/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let profile: typeof import('../../src/features/profile/service.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  profile = await import('../../src/features/profile/service.server')
})
afterAll(async () => {
  if (ctx) await ctx.cleanup()
})

it('counts a wrong current password toward the lockout without revealing details', async () => {
  const user = await ctx.create('editor')
  const headers = await ctx.headersFor(user)
  const attempt = profile.changePassword(headers, {
    currentPassword: 'wrong-password-123',
    newPassword: 'brand-new-password-1',
    confirmPassword: 'brand-new-password-1',
  })
  await expect(attempt).rejects.toMatchObject({ code: 'INVALID', message: 'Password tidak cocok.' })
  const [state] = await ctx.connection.db
    .select()
    .from(authLockout)
    .where(eq(authLockout.userId, user.id))
  expect(state.failedAttempts).toBe(1)
})

it('changes the password and revokes every other session in the same transaction', async () => {
  const user = await ctx.create('editor')
  const first = await ctx.headersFor(user)
  await ctx.headersFor(user)
  await ctx.headersFor(user)
  const before = await ctx.connection.db.select().from(session).where(eq(session.userId, user.id))
  expect(before.length).toBe(3)
  await profile.changePassword(first, {
    currentPassword: user.password,
    newPassword: 'brand-new-password-1',
    confirmPassword: 'brand-new-password-1',
  })
  const after = await ctx.connection.db.select().from(session).where(eq(session.userId, user.id))
  expect(after).toHaveLength(1)
  expect((await profile.loadProfile(first)).sessions).toHaveLength(1)
})

it('lists and revokes only the user own sessions, with safe fields', async () => {
  const owner = await ctx.create('editor')
  const other = await ctx.create('editor')
  const ownerHeaders = await ctx.headersFor(owner)
  await ctx.headersFor(owner)
  await ctx.headersFor(other)
  const [otherSession] = await ctx.connection.db
    .select()
    .from(session)
    .where(eq(session.userId, other.id))
  const view = await profile.loadProfile(ownerHeaders)
  expect(view.sessions).toHaveLength(2)
  expect(JSON.stringify(view.sessions)).not.toContain(otherSession.token)
  expect(Object.keys(view.sessions[0]).sort()).toEqual([
    'current',
    'device',
    'id',
    'ipAddress',
    'lastActive',
  ])
  await expect(
    profile.revokeSessions(ownerHeaders, { sessionId: otherSession.id }),
  ).rejects.toMatchObject({
    code: 'NOT_FOUND',
  })
  expect(
    await ctx.connection.db
      .select()
      .from(session)
      .where(and(eq(session.id, otherSession.id))),
  ).toHaveLength(1)
  expect(await profile.revokeSessions(ownerHeaders, { sessionId: 'others' })).toBe(1)
})

it('stores preferences per user and rejects a non-image avatar by its content', async () => {
  await profile.savePreferences(ctx.editorHeaders, { density: 'compact', sidebarCollapsed: true })
  const [row] = await ctx.connection.db.select().from(userPreference)
  expect(row).toMatchObject({ density: 'compact', sidebarCollapsed: true })
  await expect(
    profile.uploadAvatar(ctx.editorHeaders, {
      body: Buffer.from('%PDF-1.7 not an image'),
      filename: 'me.png',
      contentType: 'image/png',
    }),
  ).rejects.toThrow()
})
