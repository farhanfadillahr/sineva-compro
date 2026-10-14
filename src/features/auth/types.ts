export type AdminRole = 'admin' | 'editor'
export type Principal = { id: string; name: string; role: AdminRole }
export type Capability = 'content:write' | 'users:manage' | 'leads:manage' | 'waitlist:export'
