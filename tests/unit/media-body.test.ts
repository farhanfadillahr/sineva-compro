import { expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { readBoundedBody } from '@/features/media/body'
it('enforces actual streamed byte count even with a forged content length', async () => {
  let cancelled = false
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3, 4]))
    },
    cancel() {
      cancelled = true
    },
  })
  const request = new Request('http://localhost/upload', {
    method: 'POST',
    headers: { 'content-length': '1' },
    body: stream,
    duplex: 'half',
  } as RequestInit)
  await expect(readBoundedBody(request, 3)).rejects.toThrow()
  expect(cancelled).toBe(true)
})
it('accepts bounded data and rejects an advertised oversized body before reading', async () => {
  expect(
    (
      await readBoundedBody(new Request('http://localhost', { method: 'POST', body: 'ok' }), 3)
    ).toString(),
  ).toBe('ok')
  await expect(
    readBoundedBody(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-length': '100' },
        body: 'x',
      }),
      3,
    ),
  ).rejects.toThrow()
})
