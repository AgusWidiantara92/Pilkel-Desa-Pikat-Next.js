import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── 1. Seed Admin User ──
  const adminPassword = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pilkel.id' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@pilkel.id',
      password: adminPassword,
      role: 'admin',
    },
  })
  console.log(`  ✅ Admin user: ${admin.email}`)

  const panitiaPassword = await bcrypt.hash('panitia123', 12)
  const panitia = await prisma.user.upsert({
    where: { email: 'panitia@pilkel.id' },
    update: {},
    create: {
      name: 'Panitia Pilkel',
      email: 'panitia@pilkel.id',
      password: panitiaPassword,
      role: 'panitia',
    },
  })
  console.log(`  ✅ Panitia user: ${panitia.email}`)

  // ── 2. Seed TPS Data ──
  const tpsData = [
    {
      nomor_tps: 'TPS 001',
      nama_lokasi: 'SD Negeri 1 Pikat',
      dusun: 'Banjar Pikat',
      kuota_pemilih: 350,
      keterangan: 'TPS Wilayah Utara Desa Pikat',
    },
    {
      nomor_tps: 'TPS 002',
      nama_lokasi: 'Balai Banjar Gelgel',
      dusun: 'Banjar Gelgel',
      kuota_pemilih: 400,
      keterangan: 'TPS Wilayah Tengah Desa Pikat',
    },
    {
      nomor_tps: 'TPS 003',
      nama_lokasi: 'Balai Desa Pikat',
      dusun: 'Banjar Tengah',
      kuota_pemilih: 380,
      keterangan: 'TPS Wilayah Selatan Desa Pikat',
    },
  ]

  const tpsList: { id: number; nomor_tps: string }[] = []
  for (const data of tpsData) {
    const tps = await prisma.tps.upsert({
      where: { nomor_tps: data.nomor_tps },
      update: data,
      create: data,
    })
    tpsList.push({ id: tps.id, nomor_tps: tps.nomor_tps })
    console.log(`  ✅ TPS: ${tps.nomor_tps} — ${tps.nama_lokasi}`)
  }

  // ── 3. Seed Sample Voters ──
  const voters = [
    {
      nkk: '5105011203040001',
      nik: '5105011508900001',
      nama: 'I Wayan Sudiarta',
      tempat_lahir: 'Klungkung',
      tanggal_lahir: '1990-08-15',
      jenis_kelamin: 'L',
      status_perkawinan: 'S',
      alamat: 'Jl. Perbekel Pikat No. 12',
      dusun: 'Banjar Pikat',
      tps_id: tpsList[0].id,
      status: 'aktif',
      keterangan: 'Pemilih Terdaftar',
    },
    {
      nkk: '5105011203040001',
      nik: '5105015005920002',
      nama: 'Ni Made Astini',
      tempat_lahir: 'Klungkung',
      tanggal_lahir: '1992-05-10',
      jenis_kelamin: 'P',
      status_perkawinan: 'S',
      alamat: 'Jl. Perbekel Pikat No. 12',
      dusun: 'Banjar Pikat',
      tps_id: tpsList[0].id,
      status: 'aktif',
      keterangan: 'Pemilih Terdaftar',
    },
    {
      nkk: '5105011203040002',
      nik: '5105012011850003',
      nama: 'I Nyoman Suardana',
      tempat_lahir: 'Pikat',
      tanggal_lahir: '1985-11-20',
      jenis_kelamin: 'L',
      status_perkawinan: 'S',
      alamat: 'Banjar Gelgel RT 02/RW 01',
      dusun: 'Banjar Gelgel',
      tps_id: tpsList[1].id,
      status: 'aktif',
      keterangan: 'Pemilih Terdaftar',
    },
    {
      nkk: '5105011203040003',
      nik: '5105016501980004',
      nama: 'Ni Ketut Putrini',
      tempat_lahir: 'Klungkung',
      tanggal_lahir: '1998-01-25',
      jenis_kelamin: 'P',
      status_perkawinan: 'B',
      alamat: 'Jl. Raya Desa Pikat No. 45',
      dusun: 'Banjar Tengah',
      tps_id: tpsList[2].id,
      status: 'aktif',
      keterangan: 'Pemilih Pemula',
    },
  ]

  for (const voter of voters) {
    await prisma.voter.upsert({
      where: { nik: voter.nik },
      update: voter,
      create: voter,
    })
    console.log(`  ✅ Voter: ${voter.nama} (${voter.nik})`)
  }

  console.log('\n🎉 Seeding complete!')
  console.log('   Login: admin@pilkel.id / password123')
  console.log('   Login: panitia@pilkel.id / panitia123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
