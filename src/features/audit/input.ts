// Extend this registry with schema field names when adding an audited service.
// Never derive these names from submitted values, titles, email addresses or notes.
export const auditFields = {
  users: ['name', 'email', 'role', 'active', 'password'],
  profile: ['name', 'image', 'password', 'sessions', 'preferences'],
  media: ['file', 'alt', 'caption', 'focalPoint', 'credit'],
  services: [
    'slug',
    'title',
    'summary',
    'icon',
    'pose',
    'problems',
    'deliverables',
    'process',
    'tools',
    'ctaLabel',
    'order',
    'seo',
    'published',
  ],
  pages: ['data', 'visibility', 'seo'],
  settings: [
    'siteName',
    'defaultOgImage',
    'logo',
    'publicEmail',
    'whatsapp',
    'businessHours',
    'address',
    'legalEntity',
    'whatsappTemplates',
    'social',
    'leadRecipients',
    'waitlistNotification',
    'featureToggles',
    'analytics',
    'verificationToken',
    'seo',
    'brand',
    'contact',
    'leadRouting',
    'features',
    'verification',
  ],
  email_settings: [
    'mode',
    'smtpHost',
    'smtpPort',
    'smtpSecurity',
    'smtpUsername',
    'smtpPassword',
    'apiKey',
    'fromName',
    'fromEmail',
    'replyTo',
    'templates',
  ],
  redirects: ['fromPath', 'toPath', 'status'],
  leads: [
    'name',
    'email',
    'phone',
    'company',
    'service',
    'segment',
    'message',
    'status',
    'notes',
    'consent',
  ],
  waitlist: ['email', 'segment', 'consent'],
  posts: [
    'slug',
    'title',
    'excerpt',
    'cover',
    'body',
    'category',
    'author',
    'publishedAt',
    'seo',
    'published',
  ],
  portfolio: [
    'slug',
    'title',
    'projectType',
    'summary',
    'challenge',
    'solution',
    'result',
    'stack',
    'cover',
    'gallery',
    'demoUrl',
    'relatedService',
    'featured',
    'seo',
    'published',
  ],
  team: ['name', 'role', 'photo', 'bio', 'social', 'showOnAbout', 'order'],
  faq: ['question', 'answer', 'tags', 'order'],
  product: [
    'key',
    'title',
    'body',
    'tint',
    'pose',
    'mockupLines',
    'order',
    'featured',
    'status',
    'label',
    'exampleDay',
  ],
  categories: ['slug', 'name'],
} as const
export type AuditEntity = keyof typeof auditFields
export const auditActions = [
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'activate',
  'deactivate',
  'password_change',
] as const
export type AuditAction = (typeof auditActions)[number]
export type AuditEntryInput = {
  entity: AuditEntity
  entityId: string
  action: AuditAction
  changedFields: readonly string[]
}
export type AuditListInput = {
  actor: string
  entity: AuditEntity | ''
  page: number
  pageSize: number
}
export class AuditInputError extends Error {
  constructor() {
    super('Parameter log audit tidak valid.')
  }
}
function invalid(): never {
  throw new AuditInputError()
}
function record(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  const data = value as Record<string, unknown>
  if (Object.keys(data).some((key) => !keys.includes(key))) return invalid()
  return data
}
function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9:_-]{1,128}$/.test(value)) return invalid()
  return value
}
function entity(value: unknown): AuditEntity {
  if (typeof value !== 'string' || !Object.hasOwn(auditFields, value)) return invalid()
  return value as AuditEntity
}
export function parseAuditEntry(input: unknown): AuditEntryInput {
  const data = record(input, ['entity', 'entityId', 'action', 'changedFields'])
  const kind = entity(data.entity)
  if (!auditActions.includes(data.action as AuditAction)) return invalid()
  const fields: readonly string[] = auditFields[kind]
  if (
    !Array.isArray(data.changedFields) ||
    !data.changedFields.length ||
    data.changedFields.length > 100 ||
    data.changedFields.some((field) => typeof field !== 'string' || !fields.includes(field))
  )
    return invalid()
  return {
    entity: kind,
    entityId: identifier(data.entityId),
    action: data.action as AuditAction,
    changedFields: [...new Set<string>(data.changedFields)].sort(),
  }
}
export function parseAuditList(input: unknown): AuditListInput {
  const data = record(input, ['actor', 'entity', 'page', 'pageSize'])
  const number = (value: unknown, fallback: number, max: number) => {
    if (value === undefined) return fallback
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)))
      return invalid()
    const n = Number(value)
    if (!Number.isSafeInteger(n) || n < 1 || n > max) return invalid()
    return n
  }
  return {
    actor: data.actor === undefined || data.actor === '' ? '' : identifier(data.actor),
    entity: data.entity === undefined || data.entity === '' ? '' : entity(data.entity),
    page: number(data.page, 1, 100000),
    pageSize: number(data.pageSize, 20, 100),
  }
}
export function auditPageHref(input: AuditListInput): string {
  const params = new URLSearchParams({
    actor: input.actor,
    entity: input.entity,
    page: String(input.page),
    pageSize: String(input.pageSize),
  })
  return `/admin/audit?${params}`
}
