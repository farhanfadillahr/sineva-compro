import type { CollectionConfig } from 'payload'
import { protectFirstUser } from './hooks/protectFirstUser'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  hooks: { beforeOperation: [protectFirstUser] },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => (req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (req.user ? { id: { equals: req.user.id } } : false),
    delete: () => false,
  },
  fields: [],
}
