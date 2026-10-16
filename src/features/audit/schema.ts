import { sql } from 'drizzle-orm'
import { boolean, check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from '../auth/schema'

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action').notNull(),
    changedFields: text('changed_fields').array().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    isDemo: boolean('is_demo').default(false).notNull(),
  },
  (table) => [
    index('audit_log_created_idx').on(table.createdAt.desc(), table.id.desc()),
    index('audit_log_actor_created_idx').on(table.actorId, table.createdAt.desc(), table.id.desc()),
    index('audit_log_entity_created_idx').on(table.entity, table.createdAt.desc(), table.id.desc()),
    check('audit_log_fields_nonempty', sql`cardinality(${table.changedFields}) BETWEEN 1 AND 100`),
  ],
)
