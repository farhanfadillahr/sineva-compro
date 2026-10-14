import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '../../lib/auth/server'
import { can, toPrincipal } from './authorization'
import type { Capability, Principal } from './types'

export async function getPrincipal(): Promise<Principal | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  })
  return session ? toPrincipal(session.user) : null
}

export async function requirePrincipal(): Promise<Principal> {
  const principal = await getPrincipal()
  if (!principal) redirect('/admin/login')
  return principal
}

export async function requireCapability(capability: Capability): Promise<Principal> {
  const principal = await requirePrincipal()
  if (!can(principal, capability)) throw new Error('Access denied')
  return principal
}
