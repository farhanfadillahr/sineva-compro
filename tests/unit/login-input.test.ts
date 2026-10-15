import { expect, it } from 'vitest'
import { normalizeLoginRequest } from '../../src/features/auth/login-input'
const req = (body: unknown) =>
  new Request('http://localhost/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify(body),
  })
it('normalizes email while preserving password, origin and validated library options', async () => {
  const result = await normalizeLoginRequest(
    req({ email: ' A@Example.Test ', password: ' a ', rememberMe: false, callbackURL: '/admin' }),
  )
  expect(result.email).toBe('a@example.test')
  expect(await result.request.json()).toEqual({
    email: 'a@example.test',
    password: ' a ',
    rememberMe: false,
    callbackURL: '/admin',
  })
  expect(result.request.headers.get('origin')).toBe('http://localhost')
})
it.each([
  null,
  [],
  {},
  { email: 'bad', password: 'x' },
  { email: 'a@example.test', password: '' },
  { email: 'a@example.test', password: 'x'.repeat(129) },
  { email: 'a@example.test', password: 'x', role: 'admin' },
  { email: 'a@example.test', password: 'x', actorId: 'x' },
  { email: 'a@example.test', password: 'x', rememberMe: 1 },
  { email: 'a@example.test', password: 'x', callbackURL: 'x'.repeat(2049) },
])('rejects malformed or extra credential fields: %j', async (input) => {
  await expect(normalizeLoginRequest(req(input))).rejects.toThrow()
})
it('bounds streamed JSON and rejects unsupported content type and broken JSON', async () => {
  await expect(
    normalizeLoginRequest(
      req({ email: 'a@example.test', password: 'x', padding: 'x'.repeat(9000) }),
    ),
  ).rejects.toMatchObject({ status: 413 })
  for (const headers of [new Headers(), new Headers({ 'content-type': 'application/json' })]) {
    await expect(
      normalizeLoginRequest(
        new Request('http://localhost', { method: 'POST', headers, body: '{' }),
      ),
    ).rejects.toMatchObject({ status: 400 })
  }
})
