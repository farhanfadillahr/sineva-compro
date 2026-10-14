import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => (req.user ? { id: { equals: req.user.id } } : false),
    update: ({ req }) => (req.user ? { id: { equals: req.user.id } } : false),
    delete: () => false,
  },
  fields: [],
}
