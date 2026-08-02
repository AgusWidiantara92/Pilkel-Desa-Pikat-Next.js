import type { Metadata } from 'next'
import { getCurrentUser } from '../auth-actions'
import { redirect } from 'next/navigation'
import AdminShell from '../AdminShell'
import { ThemeProvider } from './components/ThemeProvider'

export const metadata: Metadata = {
  title: {
    template: '%s | Admin Pilkel',
    default: 'Dashboard | Admin Pilkel',
  },
  description: 'Panel administrasi Pemilihan Perbekel Desa Pikat 2026',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <ThemeProvider>
      <AdminShell user={user}>{children}</AdminShell>
    </ThemeProvider>
  )
}
