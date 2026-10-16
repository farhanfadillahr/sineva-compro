import { notFound } from 'next/navigation'
import { KitGallery } from '@/components/admin/kit-gallery'
export const metadata = { title: 'Galeri antarmuka admin' }
export default function AdminUiGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <KitGallery />
}
