'use server'

import { prisma } from '@/lib/prisma'

export interface SearchResult {
  success: boolean
  error?: string
  voter?: {
    nik_masked: string
    nama_masked: string
    dusun: string
    nomor_tps: string
    nama_lokasi_tps: string
    status: string
    keterangan: string
  }
  whatsappUrl?: string
  notFound?: boolean
  searchedNik?: string
}

// ── Helper: Masking NIK ──
function maskNik(nik: string): string {
  if (nik.length !== 16) {
    return nik
  }
  return nik.substring(0, 6) + '******' + nik.substring(12, 16)
}

// ── Helper: Masking Nama ──
function maskName(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 0) return ''
  
  if (words.length === 1) {
    return words[0].substring(0, 1) + '***'
  }

  const lastWord = words.pop()!
  const maskedLast = lastWord.substring(0, 1) + '***'
  words.push(maskedLast)

  return words.join(' ')
}

export async function searchDpt(formData: FormData): Promise<SearchResult> {
  const nikInput = formData.get('nik')

  if (!nikInput || typeof nikInput !== 'string') {
    return {
      success: false,
      error: 'Nomor Induk Kependudukan (NIK) wajib diisi.',
    }
  }

  const cleanNik = nikInput.trim()

  // 1. Validasi NIK
  if (!/^\d+$/.test(cleanNik)) {
    return {
      success: false,
      error: 'NIK hanya boleh berisi karakter angka.',
    }
  }

  if (cleanNik.length !== 16) {
    return {
      success: false,
      error: 'NIK harus tepat 16 digit angka.',
    }
  }

  try {
    // 2. Query ke SQLite Database
    const voter = await prisma.voter.findUnique({
      where: {
        nik: cleanNik,
      },
      select: {
        id: true,
        nik: true,
        nama: true,
        dusun: true,
        status: true,
        keterangan: true,
        tps: {
          select: {
            nomor_tps: true,
            nama_lokasi: true,
          },
        },
      },
    })

    // 3. Hasil: Pemilih Ditemukan
    if (voter) {
      const maskedVoter = {
        nik_masked: maskNik(voter.nik),
        nama_masked: maskName(voter.nama),
        dusun: voter.dusun || 'Desa Pikat',
        nomor_tps: voter.tps?.nomor_tps || 'TPS -',
        nama_lokasi_tps: voter.tps?.nama_lokasi || 'Lokasi TPS',
        status: voter.status,
        keterangan: voter.keterangan || 'Terdaftar dalam DPT',
      }

      let whatsappUrl: string | undefined
      if (voter.status.toLowerCase() === 'tms') {
        const message = encodeURIComponent(
          `Halo Panitia Pilkel Desa Pikat, NIK saya (${voter.nik}) ` +
          `terdaftar dengan status Tidak Memenuhi Syarat (TMS). Mohon bantuan klarifikasinya.`
        )
        whatsappUrl = `https://wa.me/6282145568591?text=${message}`
      }

      return {
        success: true,
        voter: maskedVoter,
        searchedNik: cleanNik,
        whatsappUrl,
      }
    }

    // 4. Hasil: Pemilih Tidak Ditemukan
    const message = encodeURIComponent(
      `Halo Panitia Pilkel Desa Pikat, NIK saya (${cleanNik}) ` +
      `belum terdaftar dalam DPT. Mohon dibantu pengecekannya.`
    )
    const whatsappUrl = `https://wa.me/6282145568591?text=${message}`

    return {
      success: true,
      notFound: true,
      searchedNik: cleanNik,
      whatsappUrl,
    }

  } catch (err: unknown) {
    console.error('Error during DPT search:', err)
    return {
      success: false,
      error: 'Terjadi kendala teknis pada sistem pencarian. Silakan coba beberapa saat lagi.',
    }
  }
}
