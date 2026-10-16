/** Server-safe query contract. Consumers must apply these fields in authorized server queries. */
export type TableQuery = {
  page: number
  pageSize: number
  search: string
  sort?: string
  direction: 'asc' | 'desc'
}
export function readTableQuery(
  params: URLSearchParams,
  sortColumns: readonly string[] = [],
): TableQuery {
  const rawPage = Number(params.get('page') ?? 1)
  const size = Number(params.get('pageSize') ?? 20)
  const sort = params.get('sort') ?? ''
  return {
    page: Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1,
    pageSize: [20, 50, 100].includes(size) ? size : 20,
    search: (params.get('search') ?? '').trim().slice(0, 100),
    sort: sortColumns.includes(sort) ? sort : undefined,
    direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
  }
}
export function tableUrl(
  pathname: string,
  current: URLSearchParams,
  patch: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams(current)
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === '') params.delete(key)
    else params.set(key, String(value))
  }
  const query = params.toString()
  return `${pathname}${query ? `?${query}` : ''}`
}
export function lastPageRedirect(
  pathname: string,
  params: URLSearchParams,
  total: number,
  page: number,
  pageSize: number,
): string | null {
  const last = Math.max(1, Math.ceil(total / pageSize))
  return page > last ? tableUrl(pathname, params, { page: last }) : null
}
