'use server'

import { prisma } from '@/lib/prisma'
import { createSession, destroySession, getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function login(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { error: 'Email atau kata sandi salah.' }
    }

    if (!['admin', 'panitia'].includes(user.role)) {
      return { error: 'Akun Anda tidak memiliki hak akses ke panel admin.' }
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return { error: 'Email atau kata sandi salah.' }
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (err) {
    console.error('Login error:', err)
    return { error: 'Terjadi kesalahan pada sistem. Silakan coba lagi.' }
  }

  redirect('/admin')
}

export async function logout() {
  await destroySession()
  redirect('/admin/login')
}

export async function getCurrentUser() {
  return await getSession()
}
