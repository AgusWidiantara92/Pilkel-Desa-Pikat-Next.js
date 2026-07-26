'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

export async function getVoters(params: {
  page?: number
  search?: string
  tpsId?: number
  status?: string
  dusun?: string
}) {
  const { page = 1, search, tpsId, status, dusun } = params

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { nik: { contains: search } },
      { nama: { contains: search } },
      { nkk: { contains: search } },
    ]
  }
  if (tpsId) where.tps_id = tpsId
  if (status) where.status = status
  if (dusun) where.dusun = dusun

  const [voters, total] = await Promise.all([
    prisma.voter.findMany({
      where,
      include: { tps: { select: { nomor_tps: true, nama_lokasi: true } } },
      orderBy: { nama: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.voter.count({ where }),
  ])

  return { voters, total, totalPages: Math.ceil(total / PAGE_SIZE), page }
}

export async function getFilterOptions() {
  const [tpsList, dusunList] = await Promise.all([
    prisma.tps.findMany({ select: { id: true, nomor_tps: true }, orderBy: { nomor_tps: 'asc' } }),
    prisma.voter.findMany({ where: { dusun: { not: null } }, select: { dusun: true }, distinct: ['dusun'] }),
  ])
  return { tpsList, dusunList: dusunList.map((d) => d.dusun).filter(Boolean) as string[] }
}

export async function createVoter(formData: FormData) {
  const data = {
    nkk: (formData.get('nkk') as string)?.trim(),
    nik: (formData.get('nik') as string)?.trim(),
    nama: (formData.get('nama') as string)?.trim(),
    jenis_kelamin: (formData.get('jenis_kelamin') as string) || 'L',
    tempat_lahir: (formData.get('tempat_lahir') as string)?.trim() || null,
    tanggal_lahir: formData.get('tanggal_lahir') ? new Date(formData.get('tanggal_lahir') as string) : null,
    status_perkawinan: (formData.get('status_perkawinan') as string) || 'B',
    dusun: (formData.get('dusun') as string)?.trim() || null,
    tps_id: parseInt(formData.get('tps_id') as string),
    alamat: (formData.get('alamat') as string)?.trim() || null,
    status: (formData.get('status') as string) || 'aktif',
    keterangan: (formData.get('keterangan') as string)?.trim() || null,
  }

  if (!data.nkk || !data.nik || !data.nama || !data.tps_id) {
    return { error: 'NKK, NIK, Nama, dan TPS wajib diisi.' }
  }

  try {
    await prisma.voter.create({ data })
    revalidatePath('/admin/voters')
    return { success: true }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'NIK sudah terdaftar.' }
    }
    return { error: 'Gagal menambahkan pemilih.' }
  }
}

export async function updateVoter(id: number, formData: FormData) {
  const data = {
    nkk: (formData.get('nkk') as string)?.trim(),
    nik: (formData.get('nik') as string)?.trim(),
    nama: (formData.get('nama') as string)?.trim(),
    jenis_kelamin: (formData.get('jenis_kelamin') as string) || 'L',
    tempat_lahir: (formData.get('tempat_lahir') as string)?.trim() || null,
    tanggal_lahir: formData.get('tanggal_lahir') ? new Date(formData.get('tanggal_lahir') as string) : null,
    status_perkawinan: (formData.get('status_perkawinan') as string) || 'B',
    dusun: (formData.get('dusun') as string)?.trim() || null,
    tps_id: parseInt(formData.get('tps_id') as string),
    alamat: (formData.get('alamat') as string)?.trim() || null,
    status: (formData.get('status') as string) || 'aktif',
    keterangan: (formData.get('keterangan') as string)?.trim() || null,
  }

  if (!data.nkk || !data.nik || !data.nama || !data.tps_id) {
    return { error: 'NKK, NIK, Nama, dan TPS wajib diisi.' }
  }

  try {
    await prisma.voter.update({ where: { id }, data })
    revalidatePath('/admin/voters')
    return { success: true }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      return { error: 'NIK sudah terdaftar.' }
    }
    return { error: 'Gagal memperbarui pemilih.' }
  }
}

export async function deleteVoter(id: number) {
  try {
    await prisma.voter.delete({ where: { id } })
    revalidatePath('/admin/voters')
    return { success: true }
  } catch {
    return { error: 'Gagal menghapus pemilih.' }
  }
}

export async function bulkImportVoters(rows: Array<{
  nkk: string; nik: string; nama: string; jenis_kelamin: string
  tempat_lahir?: string; tanggal_lahir?: string; status_perkawinan?: string
  dusun?: string; tps_id: number; alamat?: string; status?: string; keterangan?: string
}>) {
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      await prisma.voter.upsert({
        where: { nik: row.nik },
        update: {
          nkk: row.nkk,
          nama: row.nama,
          jenis_kelamin: row.jenis_kelamin || 'L',
          tempat_lahir: row.tempat_lahir || null,
          tanggal_lahir: row.tanggal_lahir ? new Date(row.tanggal_lahir) : null,
          status_perkawinan: row.status_perkawinan || 'B',
          dusun: row.dusun || null,
          tps_id: row.tps_id,
          alamat: row.alamat || null,
          status: row.status || 'aktif',
          keterangan: row.keterangan || 'Imported via Excel',
        },
        create: {
          nkk: row.nkk,
          nik: row.nik,
          nama: row.nama,
          jenis_kelamin: row.jenis_kelamin || 'L',
          tempat_lahir: row.tempat_lahir || null,
          tanggal_lahir: row.tanggal_lahir ? new Date(row.tanggal_lahir) : null,
          status_perkawinan: row.status_perkawinan || 'B',
          dusun: row.dusun || null,
          tps_id: row.tps_id,
          alamat: row.alamat || null,
          status: row.status || 'aktif',
          keterangan: row.keterangan || 'Imported via Excel',
        },
      })
      imported++
    } catch (err) {
      skipped++
      errors.push(`NIK ${row.nik}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  revalidatePath('/admin/voters')
  return { imported, skipped, errors: errors.slice(0, 10) }
}
