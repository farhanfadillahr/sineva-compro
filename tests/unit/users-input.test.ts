import { expect, it } from 'vitest'
import {
  parseCreateEditor,
  parseUpdateEditor,
  parseEditorStatus,
  parseEditorPassword,
  parseUserList,
} from '../../src/features/users/input'
const valid = {
  name: '  Editor Test ',
  email: ' EDITOR@example.test ',
  password: 'valid-test-password',
}
it('normalizes identity and fixes allowed fields', () => {
  expect(parseCreateEditor(valid)).toEqual({
    ...valid,
    name: 'Editor Test',
    email: 'editor@example.test',
  })
  expect(parseUpdateEditor({ userId: 'id', name: valid.name, email: valid.email })).toEqual({
    userId: 'id',
    name: 'Editor Test',
    email: 'editor@example.test',
  })
})
it.each([
  null,
  [],
  { ...valid, role: 'admin' },
  { ...valid, password: ' ' },
  { ...valid, email: 'x' },
  { ...valid, name: 'x' },
  { ...valid, name: 'x'.repeat(81) },
  { ...valid, password: 'x'.repeat(129) },
  { ...valid, password: { name: 'file' } },
])('rejects invalid account input %j', (input) => {
  expect(() => parseCreateEditor(input)).toThrow()
})
it('validates status password ID and extra fields', () => {
  expect(parseEditorStatus({ userId: 'id', active: false })).toEqual({
    userId: 'id',
    active: false,
  })
  for (const input of [
    { userId: '', active: true },
    { userId: 'id', active: 'false' },
    { userId: 'id', active: true, banned: false },
  ])
    expect(() => parseEditorStatus(input)).toThrow()
  expect(parseEditorPassword({ userId: 'id', newPassword: valid.password })).toEqual({
    userId: 'id',
    newPassword: valid.password,
  })
  for (const input of [
    { userId: 'id', newPassword: 'short' },
    { userId: 'x'.repeat(129), newPassword: valid.password },
    { userId: 'id', newPassword: valid.password, role: 'admin' },
  ])
    expect(() => parseEditorPassword(input)).toThrow()
})
it('bounds search pagination and accepts literal wildcard searches', () => {
  expect(parseUserList({ search: ' %_ ', page: 1 })).toEqual({
    search: '%_',
    page: 1,
    pageSize: 20,
  })
  for (const input of [
    { page: 0 },
    { page: 1.2 },
    { page: 100001 },
    { pageSize: 51 },
    { pageSize: 0 },
    { search: 'x'.repeat(101) },
    { search: [] },
    { role: 'admin' },
  ])
    expect(() => parseUserList(input)).toThrow()
})
