import type { MediaMetadata } from './metadata'
export type MediaItem = MediaMetadata & {
  isDemo?: boolean
  id: string
  filename: string
  kind: string
  contentType: string
  size: number
  width: number | null
  height: number | null
  dominantColor: string | null
  previewUrl: string
  publicUrl: string | null
  usageCount: number
  usages: { entity: string; entityId: string; field: string; label: string; published: boolean }[]
}
export type MediaPage = { items: MediaItem[]; total: number; page: number; pageSize: number }
export type MediaOwner = {
  entity: 'pages' | 'services' | 'posts' | 'portfolio' | 'team' | 'settings' | 'product'
  id: string
  label: string
}
export type MediaReference = { field: string; mediaId: string; published: boolean }
