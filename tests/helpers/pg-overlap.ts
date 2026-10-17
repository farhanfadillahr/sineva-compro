import { vi } from 'vitest'

/**
 * Counts queries sent to a pg client that is still busy with another one. A transaction is a single
 * connection, so `Promise.all` over its queries overlaps them; pg warns about that (removed in
 * pg 9) but only once per process, so tests check the condition itself.
 */
export async function countOverlappingQueries(run: () => Promise<unknown>): Promise<number> {
  const { Client } = await import('pg')
  const query = Client.prototype.query
  let overlapping = 0
  const spy = vi.spyOn(Client.prototype, 'query').mockImplementation(function (
    this: { _activeQuery: unknown; _queryQueue: unknown[]; pipeline?: boolean },
    ...args: unknown[]
  ) {
    if ((this._activeQuery || this._queryQueue.length > 0) && !this.pipeline) overlapping++
    return (query as (...a: unknown[]) => unknown).apply(this, args)
  } as typeof query)
  try {
    await run()
  } finally {
    spy.mockRestore()
  }
  return overlapping
}
