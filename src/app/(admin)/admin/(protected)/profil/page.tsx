import { headers } from 'next/headers'
import { PageHeader } from '@/components/admin/shell'
import { loadProfile } from '@/features/profile/service.server'
import { ProfileView } from '@/features/profile/components/profile-view'

export const metadata = { title: 'Profil saya' }

export default async function ProfilePage() {
  const data = await loadProfile(await headers())
  return (
    <main>
      <PageHeader title="Profil saya" description="Profil, keamanan, sesi aktif dan preferensi." />
      <ProfileView data={data} />
    </main>
  )
}
