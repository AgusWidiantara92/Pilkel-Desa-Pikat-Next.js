'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface ImportResult {
  imported: number
  skipped: number
  totalRows: number
  errors: string[]
  tpsCreated: string[]
}

/**
 * Normalisasi nama sheet menjadi format TPS standar
 * "TPS 01" → "TPS 001", "TPS 1" → "TPS 001", "1" → "TPS 001"
 */
function normalizeSheetToTps(sheetName: string): string {
  const match = sheetName.match(/\d+/)
  const number = match ? match[0] : '1'
  return 'TPS ' + number.padStart(3, '0')
}

/**
 * Parse status perkawinan (B / S / P)
 */
function parseStatusPerkawinan(val: string | null | undefined): string {
  if (!val) return 'B'
  const upper = String(val).toUpperCase().trim()
  if (['S', 'SUDAH', 'SUDAH KAWIN', 'KAWIN'].includes(upper)) return 'S'
  if (['P', 'PERNAH', 'PERNAH KAWIN', 'DUDA', 'JANDA'].includes(upper)) return 'P'
  return 'B'
}

/**
 * Parse tanggal lahir dari berbagai format Excel
 */
function parseTanggalLahir(raw: unknown): string | null {
  if (raw == null || raw === '') return null

  try {
    let dateObj: Date | null = null

    // Excel serial date number
    if (typeof raw === 'number') {
      const excelEpoch = new Date(1899, 11, 30)
      const msPerDay = 24 * 60 * 60 * 1000
      dateObj = new Date(excelEpoch.getTime() + raw * msPerDay)
    } else {
      const str = String(raw).trim().replace(/[|/.]/g, '-')

      // DD-MM-YYYY format
      const ddmmyyyy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
      if (ddmmyyyy) {
        dateObj = new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]))
      } else {
        // YYYY-MM-DD format
        const yyyymmdd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
        if (yyyymmdd) {
          dateObj = new Date(Number(yyyymmdd[1]), Number(yyyymmdd[2]) - 1, Number(yyyymmdd[3]))
        } else {
          // Fallback: try Date.parse
          const parsed = new Date(str)
          if (!isNaN(parsed.getTime())) dateObj = parsed
        }
      }
    }

    if (dateObj) {
      return dateObj.toISOString().slice(0, 10)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Process parsed Excel data from client-side XLSX parsing.
 * 
 * Mapping kolom Excel (berdasarkan posisi indeks):
 *  A (0): KELURAHAN
 *  B (1): NKK        ← Lengkap (DIGUNAKAN)
 *  C (2): NKK        ← Disensor (DIABAIKAN)
 *  D (3): NIK        ← Lengkap (DIGUNAKAN)
 *  E (4): NIK        ← Disensor (DIABAIKAN)
 *  F (5): NAMA
 *  G (6): TEMPAT LAHIR
 *  H (7): TANGGAL LAHIR
 *  I (8): STS KAWIN
 *  J (9): KELAMIN
 *  K (10): ALAMAT
 */
export async function importExcelData(
  sheets: { name: string; rows: (string | number | null)[][] }[]
): Promise<ImportResult> {
  const session = await getSession()
  if (!session || !['admin', 'panitia'].includes(session.role)) {
    return { imported: 0, skipped: 0, totalRows: 0, errors: ['Anda tidak memiliki akses.'], tpsCreated: [] }
  }

  let imported = 0
  let skipped = 0
  let totalRows = 0
  const errors: string[] = []
  const tpsCreated: string[] = []

  for (const sheet of sheets) {
    const nomorTps = normalizeSheetToTps(sheet.name)

    // Auto-create TPS if it doesn't exist
    let tps = await prisma.tps.findUnique({ where: { nomor_tps: nomorTps } })
    if (!tps) {
      tps = await prisma.tps.create({
        data: {
          nomor_tps: nomorTps,
          nama_lokasi: 'Lokasi ' + nomorTps,
          dusun: 'Desa Pikat',
          kuota_pemilih: 0,
        },
      })
      tpsCreated.push(nomorTps)
    }

    for (const row of sheet.rows) {
      // Skip header rows
      const colB = String(row[1] ?? '').trim()
      const colD = String(row[3] ?? '').trim()
      const colF = String(row[5] ?? '').trim()
      const colA = String(row[0] ?? '').trim()

      if (
        colB.toUpperCase() === 'NKK' ||
        colD.toUpperCase() === 'NIK' ||
        colF.toUpperCase() === 'NAMA' ||
        colA.toUpperCase() === 'KELURAHAN' ||
        colA.toUpperCase() === 'NO'
      ) {
        continue
      }

      const nkk = colB
      const nik = colD

      if (!nik || !/^\d+$/.test(nik)) {
        continue // Skip rows without valid NIK
      }

      const nama = colF
      if (!nama) continue

      totalRows++

      const tempatLahir = String(row[6] ?? '').trim() || null
      const tanggalLahir = parseTanggalLahir(row[7])
      const statusPerkawinan = parseStatusPerkawinan(row[8] as string)

      let jenisKelamin = String(row[9] ?? 'L').toUpperCase().trim()
      if (!['L', 'P'].includes(jenisKelamin)) jenisKelamin = 'L'

      const alamat = String(row[10] ?? '').trim() || null

      try {
        await prisma.voter.upsert({
          where: { nik },
          update: {
            nkk,
            nama,
            tempat_lahir: tempatLahir,
            tanggal_lahir: tanggalLahir,
            jenis_kelamin: jenisKelamin,
            status_perkawinan: statusPerkawinan,
            alamat,
            dusun: alamat, // Alamat also used as dusun, matching Laravel behavior
            tps_id: tps.id,
            status: 'aktif',
            keterangan: null,
          },
          create: {
            nkk,
            nik,
            nama,
            tempat_lahir: tempatLahir,
            tanggal_lahir: tanggalLahir,
            jenis_kelamin: jenisKelamin,
            status_perkawinan: statusPerkawinan,
            alamat,
            dusun: alamat,
            tps_id: tps.id,
            status: 'aktif',
            keterangan: null,
          },
        })
        imported++
      } catch (err) {
        skipped++
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (errors.length < 15) {
          errors.push(`NIK ${nik}: ${message}`)
        }
      }
    }
  }

  revalidatePath('/admin/voters')
  revalidatePath('/admin/tps')
  revalidatePath('/admin')

  return { imported, skipped, totalRows, errors, tpsCreated }
}
