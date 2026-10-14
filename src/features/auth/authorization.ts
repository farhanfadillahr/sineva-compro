import type { Capability, Principal } from './types'

export function toPrincipal(user: {
  id: string
  name: string
  role?: string | null
}): Principal | null {
  if (user.role !== 'admin' && user.role !== 'editor') return null
  return { id: user.id, name: user.name, role: user.role }
}

export function can(principal: Principal, capability: Capability): boolean {
  return (
    principal.role === 'admin' || (principal.role === 'editor' && capability === 'content:write')
  )
}
