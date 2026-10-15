export function invalidCredentials() {
  return Response.json(
    { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
    { status: 401 },
  )
}
export function authenticationUnavailable() {
  return Response.json(
    { code: 'SERVICE_UNAVAILABLE', message: 'Authentication unavailable' },
    { status: 503 },
  )
}
export async function credentialFailure(response: Response) {
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null)
  const code = body && typeof body === 'object' && 'code' in body ? body.code : undefined
  return {
    invalid: response.status === 401 && code === 'INVALID_EMAIL_OR_PASSWORD',
    banned: response.status === 403 && code === 'BANNED_USER',
  }
}
