import { describe, expect, it } from 'vitest'
import { can, toPrincipal } from '../../src/features/auth/authorization'

describe('server-owned admin capabilities', () => {
  it('allows editors to edit content but refuses private-data and user administration', () => {
    const editor = { id: 'editor-id', name: 'Editor', role: 'editor' as const }
    expect(can(editor, 'content:write')).toBe(true)
    expect(can(editor, 'leads:manage')).toBe(false)
    expect(can(editor, 'users:manage')).toBe(false)
    expect(can(editor, 'waitlist:export')).toBe(false)
  })
  it('allows admins to access the private-data capabilities', () => {
    const admin = { id: 'admin-id', name: 'Admin', role: 'admin' as const }
    expect(can(admin, 'users:manage')).toBe(true)
    expect(can(admin, 'leads:manage')).toBe(true)
    expect(can(admin, 'waitlist:export')).toBe(true)
  })
  it.each([undefined, null, 'user', 'admin,editor', 'owner'])(
    'rejects unrecognized roles',
    (role) => {
      expect(toPrincipal({ id: 'person', name: 'Person', role })).toBeNull()
    },
  )
  it('projects only identity fields rather than returning an account/session object', () => {
    const user = {
      id: 'person',
      name: 'Person',
      role: 'admin',
      email: 'private@example.test',
      token: 'private-token',
    }
    expect(toPrincipal(user)).toEqual({ id: 'person', name: 'Person', role: 'admin' })
  })
})
