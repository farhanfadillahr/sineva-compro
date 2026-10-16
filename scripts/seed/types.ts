import type { DatabaseTransaction } from '../../src/lib/db/connection'

export type SeedModule = {
  key: string
  base(tx: DatabaseTransaction): Promise<void>
  demo(tx: DatabaseTransaction): Promise<void>
  purgeDemo(tx: DatabaseTransaction): Promise<void>
}
