import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const [totalTps, totalVoters, totalAktif, totalTms] = await Promise.all([
    prisma.tps.count(),
    prisma.voter.count(),
    prisma.voter.count({ where: { status: 'aktif' } }),
    prisma.voter.count({ where: { status: 'tms' } }),
  ])

  const tpsList = await prisma.tps.findMany({
    select: {
      id: true,
      nomor_tps: true,
      nama_lokasi: true,
      kuota_pemilih: true,
      _count: { select: { voters: true } },
    },
    orderBy: { nomor_tps: 'asc' },
  })

  const stats = [
    {
      label: 'Total TPS',
      value: totalTps,
      color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-blue-200/50 dark:ring-blue-700/30',
    },
    {
      label: 'Total Pemilih',
      value: totalVoters,
      color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 ring-purple-200/50 dark:ring-purple-700/30',
    },
    {
      label: 'Pemilih Aktif',
      value: totalAktif,
      color: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 ring-green-200/50 dark:ring-green-700/30',
    },
    {
      label: 'Pemilih TMS',
      value: totalTms,
      color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-amber-200/50 dark:ring-amber-700/30',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ringkasan data Pemilihan Perbekel Desa Pikat 2026</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.color} rounded-2xl p-5 ring-1 transition-all hover:shadow-md`}
          >
            <p className="text-2xl font-extrabold">{s.value.toLocaleString('id-ID')}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* TPS Summary Table */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Ringkasan per TPS</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Jumlah pemilih terdaftar di masing-masing TPS</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">TPS</th>
                <th className="text-left px-5 py-3 font-semibold">Lokasi</th>
                <th className="text-center px-5 py-3 font-semibold">Kuota</th>
                <th className="text-center px-5 py-3 font-semibold">Terdaftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tpsList.map((tps) => {
                return (
                  <tr key={tps.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">{tps.nomor_tps}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{tps.nama_lokasi}</td>
                    <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300">{tps.kuota_pemilih}</td>
                    <td className="px-5 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">{tps._count.voters}</td>
                  </tr>
                )
              })}
              {tpsList.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                    Belum ada data TPS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
