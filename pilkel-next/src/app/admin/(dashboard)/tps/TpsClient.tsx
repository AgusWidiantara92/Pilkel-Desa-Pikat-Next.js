'use client'

import { useState, useTransition } from 'react'
import { createTps, updateTps, deleteTps } from './tps-actions'
import { useRouter } from 'next/navigation'
import { useToast, ToastContainer } from '../components/Toast'

type TpsItem = {
  id: number
  nomor_tps: string
  nama_lokasi: string
  dusun: string | null
  kuota_pemilih: number
  keterangan: string | null
  created_at: Date
  updated_at: Date
  _count: { voters: number }
}

export default function TpsClient({ initialData }: { initialData: TpsItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<TpsItem | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const { toasts, toast, removeToast } = useToast()

  const filtered = initialData.filter(
    (t) =>
      t.nomor_tps.toLowerCase().includes(search.toLowerCase()) ||
      t.nama_lokasi.toLowerCase().includes(search.toLowerCase()) ||
      (t.dusun && t.dusun.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = async (formData: FormData) => {
    setFormError(null)
    startTransition(async () => {
      const res = editItem
        ? await updateTps(editItem.id, formData)
        : await createTps(formData)
      if (res.error) {
        setFormError(res.error)
        toast.error(res.error)
      } else {
        toast.success(editItem ? 'TPS berhasil diperbarui.' : 'TPS baru berhasil ditambahkan.')
        setShowForm(false)
        setEditItem(null)
        router.refresh()
      }
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Yakin ingin menghapus TPS ini? Data pemilih di TPS ini juga akan terhapus.')) return
    startTransition(async () => {
      const res = await deleteTps(id)
      if (res.error) {
        alert(res.error)
        toast.error(res.error)
      } else {
        toast.success('TPS berhasil dihapus.')
        router.refresh()
      }
    })
  }

  const openEdit = (item: TpsItem) => {
    setEditItem(item)
    setShowForm(true)
    setFormError(null)
  }

  const openCreate = () => {
    setEditItem(null)
    setShowForm(true)
    setFormError(null)
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500'
  const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1'

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Data TPS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola data Tempat Pemungutan Suara</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
          </svg>
          Tambah TPS
        </button>
      </div>

      {/* ═══ Search ═══ */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari TPS, lokasi, atau dusun..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* ═══ Modal Form ═══ */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setShowForm(false); setEditItem(null) }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editItem ? 'Edit TPS' : 'Tambah TPS Baru'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editItem ? 'Perbarui data TPS yang sudah ada' : 'Isi data TPS baru'}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditItem(null) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm font-medium">
                {formError}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Nomor TPS</label>
                <input name="nomor_tps" defaultValue={editItem?.nomor_tps} required maxLength={10} placeholder="TPS 001" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nama Lokasi</label>
                <input name="nama_lokasi" defaultValue={editItem?.nama_lokasi} required placeholder="SD Negeri 1 Pikat" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Banjar / Dusun</label>
                <input name="dusun" defaultValue={editItem?.dusun ?? ''} placeholder="Banjar Pikat" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kuota Pemilih</label>
                <input name="kuota_pemilih" type="number" defaultValue={editItem?.kuota_pemilih ?? 0} min={0} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Keterangan</label>
                <textarea
                  name="keterangan"
                  defaultValue={editItem?.keterangan ?? ''}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditItem(null) }}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-60"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Table ═══ */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">TPS</th>
                <th className="text-left px-5 py-3 font-semibold">Lokasi</th>
                <th className="text-left px-5 py-3 font-semibold">Dusun</th>
                <th className="text-center px-5 py-3 font-semibold">Pemilih</th>
                <th className="text-center px-5 py-3 font-semibold">Kuota</th>
                <th className="text-right px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((tps) => (
                <tr key={tps.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 font-bold text-gray-900 dark:text-gray-100">{tps.nomor_tps}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{tps.nama_lokasi}</td>
                  <td className="px-5 py-3">
                    {tps.dusun ? (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-md">{tps.dusun}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-md">{tps._count.voters}</span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300">{tps.kuota_pemilih}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(tps)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(tps.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" title="Hapus">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                    {search ? 'Tidak ada TPS yang cocok' : 'Belum ada data TPS'}
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
