import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '../../lib/db/client.server'
import { readServerEnv } from '../../env/server'
import { loadPrincipal, assertCapability } from './access.server'
import type { Capability, Principal } from './types'

export async function getPrincipal(): Promise<Principal | null> {
  return loadPrincipal(db, readServerEnv(process.env), await headers())
}

export async function requirePrincipal(): Promise<Principal> {
  const principal = await getPrincipal()
  if (!principal) redirect('/admin/login')
  return principal
}

export async function requireCapability(capability: Capability): Promise<Principal> {
  const principal = await requirePrincipal()
  return assertCapability(principal, capability)
}
