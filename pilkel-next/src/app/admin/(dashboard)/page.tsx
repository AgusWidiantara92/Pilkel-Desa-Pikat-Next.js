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
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      icon: (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      ),
    },
    {
      label: 'Total Pemilih',
      value: totalVoters,
      color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 ring-purple-200/50 dark:ring-purple-700/30',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      icon: (
        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
    },
    {
      label: 'Pemilih Aktif',
      value: totalAktif,
      color: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 ring-green-200/50 dark:ring-green-700/30',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
    {
      label: 'Pemilih TMS',
      value: totalTms,
      color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-amber-200/50 dark:ring-amber-700/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      icon: (
        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      ),
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
            <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
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
