export type BootstrapInput = { name: string; email: string; password: string }

export function validateBootstrapInput(input: unknown): BootstrapInput {
  const invalid = () =>
    new Error('Bootstrap input must include a valid name, email and a 12–128 character password.')
  if (!input || typeof input !== 'object') throw invalid()
  const data = input as Record<string, unknown>
  if (
    typeof data.name !== 'string' ||
    typeof data.email !== 'string' ||
    typeof data.password !== 'string'
  )
    throw invalid()
  const name = data.name.trim()
  const email = data.email.trim().toLowerCase()
  if (
    name.length < 2 ||
    name.length > 80 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    data.password.length < 12 ||
    data.password.length > 128 ||
    !data.password.trim()
  )
    throw invalid()
  return { name, email, password: data.password }
}
