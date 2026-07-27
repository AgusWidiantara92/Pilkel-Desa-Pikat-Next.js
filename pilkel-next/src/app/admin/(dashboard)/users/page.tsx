import type { Metadata } from 'next'
import UsersClient from './UsersClient'
import { getUsers } from './user-actions'

export const metadata: Metadata = { title: 'Pengguna & Panitia' }

export default async function UsersPage() {
  return <UsersClient initialUsers={await getUsers()} />
}
