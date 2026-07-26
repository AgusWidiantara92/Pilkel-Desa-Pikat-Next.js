'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTpsList() {
  return prisma.tps.findMany({
    include: { _count: { select: { voters: true } } },
    orderBy: { nomor_tps: 'asc' },
  })
}

export async function createTps(formData: FormData) {
  const nomor_tps = (formData.get('nomor_tps') as string)?.trim()
  const nama_lokasi = (formData.get('nama_lokasi') as string)?.trim()
  const dusun = (formData.get('dusun') as string)?.trim() || null
  const kuota_pemilih = parseInt(formData.get('kuota_pemilih') as string) || 0
  const keterangan = (formData.get('keterangan') as string)?.trim() || null

  if (!nomor_tps || !nama_lokasi) {
    return { error: 'Nomor TPS dan Nama Lokasi wajib diisi.' }
  }

  try {
    await prisma.tps.create({
      data: { nomor_tps, nama_lokasi, dusun, kuota_pemilih, keterangan },
    })
    revalidatePath('/admin/tps')
    return { success: true }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'Nomor TPS sudah ada. Gunakan nomor yang berbeda.' }
    }
    return { error: 'Gagal menambahkan TPS.' }
  }
}

export async function updateTps(id: number, formData: FormData) {
  const nomor_tps = (formData.get('nomor_tps') as string)?.trim()
  const nama_lokasi = (formData.get('nama_lokasi') as string)?.trim()
  const dusun = (formData.get('dusun') as string)?.trim() || null
  const kuota_pemilih = parseInt(formData.get('kuota_pemilih') as string) || 0
  const keterangan = (formData.get('keterangan') as string)?.trim() || null

  if (!nomor_tps || !nama_lokasi) {
    return { error: 'Nomor TPS dan Nama Lokasi wajib diisi.' }
  }

  try {
    await prisma.tps.update({
      where: { id },
      data: { nomor_tps, nama_lokasi, dusun, kuota_pemilih, keterangan },
    })
    revalidatePath('/admin/tps')
    return { success: true }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'Nomor TPS sudah ada.' }
    }
    return { error: 'Gagal memperbarui TPS.' }
  }
}

export async function deleteTps(id: number) {
  try {
    await prisma.tps.delete({ where: { id } })
    revalidatePath('/admin/tps')
    return { success: true }
  } catch {
    return { error: 'Gagal menghapus TPS. Pastikan tidak ada pemilih terdaftar di TPS ini.' }
  }
}
