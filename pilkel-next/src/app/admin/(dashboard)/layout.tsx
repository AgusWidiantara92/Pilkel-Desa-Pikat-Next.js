import { getCurrentUser } from './auth-actions'
import { redirect } from 'next/navigation'
import AdminShell from './AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/admin/login')
  }

  return <AdminShell user={user}>{children}</AdminShell>
}
