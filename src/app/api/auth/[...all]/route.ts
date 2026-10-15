import { handlePasswordLogin } from '../../../../features/auth/login-handler.server'
import { db } from '../../../../lib/db/client.server'
import { readServerEnv } from '../../../../env/server'
import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '../../../../lib/auth/server'

const handler = toNextJsHandler(auth)
// The foundation only exposes session/login/logout and a disabled sign-up path.
// Operator-only admin APIs are never dispatched through the HTTP handler.
const paths = new Set(['/sign-in/email', '/sign-out', '/get-session', '/sign-up/email'])
function allowed(request: Request): boolean {
  return paths.has(new URL(request.url).pathname.slice('/api/auth'.length))
}
export async function GET(request: Request) {
  return allowed(request) ? handler.GET(request) : new Response(null, { status: 404 })
}
export async function POST(request: Request) {
  if (new URL(request.url).pathname === '/api/auth/sign-in/email')
    return handlePasswordLogin(db, readServerEnv(process.env), request)
  return allowed(request) ? handler.POST(request) : new Response(null, { status: 404 })
}
