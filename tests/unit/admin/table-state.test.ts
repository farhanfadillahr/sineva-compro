import { expect, it } from 'vitest'
import { tableUrl, readTableQuery, lastPageRedirect } from '@/components/admin/table-state'
it('normalizes invalid pagination, whitelist sort columns and preserves unrelated query filters', () => {
  expect(
    readTableQuery(new URLSearchParams('page=-3&pageSize=999&sort=password&direction=no'), [
      'name',
    ]),
  ).toEqual({ page: 1, pageSize: 20, search: '', sort: undefined, direction: 'asc' })
  expect(
    tableUrl('/admin/leads', new URLSearchParams('status=new&page=9'), { search: 'a b', page: 1 }),
  ).toBe('/admin/leads?status=new&page=1&search=a+b')
  expect(
    readTableQuery(new URLSearchParams('page=3&pageSize=100&sort=name&direction=desc&search=AI'), [
      'name',
    ]),
  ).toEqual({ page: 3, pageSize: 100, search: 'AI', sort: 'name', direction: 'desc' })
})
it('redirects excessive pages to the last page, including empty results, without losing filters', () => {
  expect(
    lastPageRedirect(
      '/admin/users',
      new URLSearchParams('search=editor&page=8&pageSize=20'),
      41,
      8,
      20,
    ),
  ).toBe('/admin/users?search=editor&page=3&pageSize=20')
  expect(lastPageRedirect('/admin/users', new URLSearchParams('page=8'), 0, 8, 20)).toBe(
    '/admin/users?page=1',
  )
  expect(lastPageRedirect('/admin/users', new URLSearchParams('page=2'), 41, 2, 20)).toBeNull()
})
