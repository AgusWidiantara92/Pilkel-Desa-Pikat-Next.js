'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function isAdmin() {
  return (await getSession())?.role === 'admin'
}

export async function getUsers() {
  if (!await isAdmin()) return []
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, created_at: true },
    orderBy: { name: 'asc' },
  })
}

export async function saveUser(id: number | null, formData: FormData) {
  if (!await isAdmin()) return { error: 'Hanya administrator yang dapat mengelola pengguna.' }
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const role = String(formData.get('role') || 'panitia')
  const password = String(formData.get('password') || '')
  if (!name || !email) return { error: 'Nama dan email wajib diisi.' }
  if (!['admin', 'panitia', 'user'].includes(role)) return { error: 'Peran tidak valid.' }
  if (!id && password.length < 8) return { error: 'Kata sandi minimal 8 karakter.' }

  try {
    if (id) {
      const data = { name, email, role, ...(password ? { password: await bcrypt.hash(password, 12) } : {}) }
      await prisma.user.update({ where: { id }, data })
    } else {
      await prisma.user.create({ data: { name, email, role, password: await bcrypt.hash(password, 12) } })
    }
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') return { error: 'Email sudah digunakan.' }
    return { error: 'Gagal menyimpan pengguna.' }
  }
}

export async function deleteUser(id: number) {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: 'Hanya administrator yang dapat mengelola pengguna.' }
  if (session.userId === id) return { error: 'Akun yang sedang digunakan tidak dapat dihapus.' }
  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath('/admin/users')
    return { success: true }
  } catch { return { error: 'Gagal menghapus pengguna.' } }
}
