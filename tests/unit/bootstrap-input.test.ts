import { expect, it } from 'vitest'
import { validateBootstrapInput } from '../../src/features/auth/bootstrap-input'

it('normalizes operator identity without changing the password', () => {
  expect(
    validateBootstrapInput({
      name: ' Founder ',
      email: ' FOUNDER@EXAMPLE.TEST ',
      password: 'long pass phrase!',
    }),
  ).toEqual({
    name: 'Founder',
    email: 'founder@example.test',
    password: 'long pass phrase!',
  })
})

it.each([
  null,
  {},
  { name: 'A', email: 'a@example.test', password: 'a'.repeat(20) },
  { name: 'Founder', email: 'invalid', password: 'a'.repeat(20) },
  { name: 'Founder', email: 'a@example.test', password: 'short' },
  { name: 'Founder', email: 'a@example.test', password: 'a'.repeat(129) },
  { name: 'Founder', email: 'a@example.test', password: ' '.repeat(16) },
])('rejects incomplete or unusable bootstrap identity without printing its input', (input) => {
  expect(() => validateBootstrapInput(input)).toThrow(/Bootstrap input/)
})
