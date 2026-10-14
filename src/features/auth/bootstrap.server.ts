import { user } from './schema'
import { validateBootstrapInput } from './bootstrap-input'
import { createAuth } from '../../lib/auth/options'
import type { createDatabase } from '../../lib/db/connection'
import type { readServerEnv } from '../../env/server'

const bootstrapLock = 73492017

export async function bootstrapAdmin(
  connection: ReturnType<typeof createDatabase>,
  env: ReturnType<typeof readServerEnv>,
  input: unknown,
): Promise<{ status: 'created'; userId: string } | { status: 'already-initialized' }> {
  const identity = validateBootstrapInput(input)
  const lock = await connection.pool.connect()
  let acquired = false
  try {
    await lock.query("SET lock_timeout = '5s'")
    await lock.query('SELECT pg_advisory_lock($1)', [bootstrapLock])
    acquired = true
    return await connection.db.transaction(
      async (tx) => {
        const existing = await tx.select({ id: user.id }).from(user).limit(1)
        if (existing.length) return { status: 'already-initialized' as const }
        // The library's createUser does not wrap user + credential writes itself.
        // Binding the adapter to this transaction makes either both commit or neither.
        const created = await createAuth(tx, env).api.createUser({
          body: { ...identity, role: 'admin' },
        })
        return { status: 'created' as const, userId: created.user.id }
      },
      { isolationLevel: 'read committed' },
    )
  } finally {
    try {
      if (acquired) await lock.query('SELECT pg_advisory_unlock($1)', [bootstrapLock])
      await lock.query('RESET lock_timeout')
    } finally {
      lock.release()
    }
  }
}
