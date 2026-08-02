'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { createVoter, deleteVoter, deleteVoters, deleteAllVoters, getVoters, updateVoter } from './voter-actions'
import { importExcelData, type ImportResult } from './excel-import-action'
import { useToast, ToastContainer } from '../components/Toast'

// ─── Types ────────────────────────────────────────────────────
type TpsOption = { id: number; nomor_tps: string }
type Voter = {
  id: number; nkk: string; nik: string; nama: string; jenis_kelamin: string
  tempat_lahir: string | null; tanggal_lahir: string | null; status_perkawinan: string
  dusun: string | null; tps_id: number; alamat: string | null; status: string; keterangan: string | null
  tps: { nomor_tps: string; nama_lokasi: string }
}
type Results = { voters: Voter[]; total: number; totalPages: number; page: number }

// ─── Reusable Form Components ─────────────────────────────────
function Field({
  label, name, type = 'text', ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
      <input
        name={name}
        type={type}
        {...props}
        className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm font-normal text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
      />
    </label>
  )
}

function Select({
  label, name, options, ...props
}: { label: string; name: string; options: string[][] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
      <select
        name={name}
        {...props}
        className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm font-normal text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
      >
        <option value="">Pilih {label}</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </label>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function VotersClient({
  initialData,
  filters,
}: {
  initialData: Results
  filters: { tpsList: TpsOption[]; dusunList: string[] }
}) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [tpsId, setTpsId] = useState('')
  const [status, setStatus] = useState('')
  const [dusun, setDusun] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Voter | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toasts, toast, removeToast } = useToast()

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Excel Import state
  const [showImport, setShowImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Data Loading ──
  const load = useCallback((page = 1) => {
    startTransition(async () => {
      const results = await getVoters({
        page,
        search: search.trim() || undefined,
        tpsId: tpsId ? Number(tpsId) : undefined,
        status: status || undefined,
        dusun: dusun || undefined,
      })
      setData(results)
      setSelectedIds([])
    })
  }, [search, tpsId, status, dusun, startTransition])

  // ── CRUD Handlers ──
  const submit = (formData: FormData) => {
    startTransition(async () => {
      setError(null)
      const response = editing
        ? await updateVoter(editing.id, formData)
        : await createVoter(formData)
      if (response.error) {
        setError(response.error)
        toast.error(response.error)
        return
      }
      toast.success(editing ? 'Data pemilih berhasil diperbarui.' : 'Pemilih baru berhasil ditambahkan.')
      setShowForm(false)
      setEditing(null)
      load(data.page)
    })
  }

  const remove = (id: number) => {
    if (!window.confirm('Hapus data pemilih ini? Tindakan ini tidak dapat dibatalkan.')) return
    startTransition(async () => {
      const response = await deleteVoter(id)
      if (response.error) {
        setError(response.error)
        toast.error(response.error)
      } else {
        toast.success('Data pemilih berhasil dihapus.')
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        load(data.voters.length === 1 && data.page > 1 ? data.page - 1 : data.page)
      }
    })
  }

  // ── Bulk Delete Handlers ──
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.voters.map((v) => v.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} data pemilih yang dipilih?`)) return

    startTransition(async () => {
      const response = await deleteVoters(selectedIds)
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(`${response.count} data pemilih berhasil dihapus.`)
        setSelectedIds([])
        load(data.page)
      }
    })
  }

  const handleDeleteAllMatching = () => {
    const isFiltered = Boolean(search || tpsId || status || dusun)
    const confirmMsg = isFiltered
      ? `PERINGATAN KETAT! Yakin ingin menghapus SELURUH data pemilih hasil filter (${data.total.toLocaleString('id-ID')} pemilih)?`
      : `PERINGATAN SANGAT KETAT! Yakin ingin menghapus SELURUH DATABASE DPT (${data.total.toLocaleString('id-ID')} pemilih)? Data tidak dapat dikembalikan!`

    if (!window.confirm(confirmMsg)) return

    startTransition(async () => {
      const response = await deleteAllVoters({
        search: search.trim() || undefined,
        tpsId: tpsId ? Number(tpsId) : undefined,
        status: status || undefined,
        dusun: dusun || undefined,
      })
      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success(`Berhasil menghapus ${response.count} data DPT.`)
        setSelectedIds([])
        load(1)
      }
    })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setError(null)
  }

  const dateValue = (date: string | null) => {
    if (!date) return ''
    return date.substring(0, 10)
  }

  // ── Excel Import Handlers ──
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && /\.(xlsx|xls)$/i.test(file.name)) {
      setImportFile(file)
      setImportResult(null)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
    }
  }, [])

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)

    try {
      // Dynamically import xlsx (client-side only)
      const XLSX = await import('xlsx')
      const buffer = await importFile.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      // Convert each sheet to array of rows
      const sheets = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name]
        const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
          header: 1,
          defval: null,
          blankrows: false,
        })
        return { name, rows }
      })

      // Send parsed data to server action
      const result = await importExcelData(sheets)
      setImportResult(result)

      // Reload voter data
      load(1)
    } catch (err) {
      setImportResult({
        imported: 0,
        skipped: 0,
        totalRows: 0,
        errors: [err instanceof Error ? err.message : 'Gagal memproses file Excel.'],
        tpsCreated: [],
      })
    } finally {
      setImporting(false)
    }
  }

  const closeImport = () => {
    setShowImport(false)
    setImportFile(null)
    setImportResult(null)
    setDragOver(false)
  }

  // ── Render ──
  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100">Data Pemilih (DPT)</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola daftar pemilih tetap Desa Pikat ({data.total.toLocaleString('id-ID')} pemilih terdaftar)
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setShowImport(true); setImportResult(null); setImportFile(null) }}
            className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); setError(null) }}
            className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Tambah Pemilih</span>
          </button>
          <button
            onClick={handleDeleteAllMatching}
            className="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5"
            title="Hapus semua DPT sesuai filter atau seluruh database"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            <span>{search || tpsId || status || dusun ? 'Hapus Hasil Filter' : 'Kosongkan DPT'}</span>
          </button>
        </div>
      </div>

      {/* ═══ Bulk Action Floating Bar ═══ */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 animate-fade-in-up">
          <div className="flex items-center gap-2 px-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300">
              {selectedIds.length} data pemilih dipilih
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-all"
            >
              Batal Pilih
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Hapus {selectedIds.length} Data
            </button>
          </div>
        </div>
      )}

      {/* ═══ Error Banner ═══ */}
      {error && !showForm && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2 animate-fade-in-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {/* ═══ Filters ═══ */}
      <div className="mb-4 grid gap-2.5 sm:gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3.5 sm:p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Cari nama, NIK, NKK..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="col-span-1 lg:col-span-2">
          <select
            value={tpsId}
            onChange={(e) => setTpsId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          >
            <option value="">Semua TPS</option>
            {filters.tpsList.map((t) => (
              <option key={t.id} value={t.id}>{t.nomor_tps}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          >
            <option value="">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="tms">TMS</option>
          </select>
        </div>
        {filters.dusunList.length > 0 && (
          <div className="col-span-1 lg:col-span-2">
            <select
              value={dusun}
              onChange={(e) => setDusun(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              <option value="">Semua dusun</option>
              {filters.dusunList.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        )}
        <div className={`col-span-1 ${filters.dusunList.length > 0 ? 'lg:col-span-2' : 'lg:col-span-4'}`}>
          <button
            onClick={() => load()}
            disabled={isPending}
            className="w-full rounded-xl bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2.5 text-sm font-bold text-white dark:text-gray-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span>{isPending ? 'Memuat...' : 'Cari'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Create / Edit Voter                     */}
      {/* ═══════════════════════════════════════════════ */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editing ? 'Edit Pemilih' : 'Tambah Pemilih Baru'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editing ? 'Perbarui data pemilih yang sudah ada' : 'Isi data pemilih yang akan didaftarkan'}
                </p>
              </div>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400 font-medium animate-fade-in-up">
                {error}
              </div>
            )}

            <form action={submit} className="grid gap-4 sm:grid-cols-2">
              <Field label="NKK" name="nkk" required maxLength={16} defaultValue={editing?.nkk} placeholder="16 digit NKK" />
              <Field label="NIK" name="nik" required maxLength={16} defaultValue={editing?.nik} placeholder="16 digit NIK" />
              <Field label="Nama Lengkap" name="nama" required defaultValue={editing?.nama} placeholder="Nama sesuai KTP" />
              <Select
                label="Jenis Kelamin" name="jenis_kelamin"
                defaultValue={editing?.jenis_kelamin ?? 'L'}
                options={[['L', 'Laki-laki'], ['P', 'Perempuan']]}
              />
              <Field label="Tempat Lahir" name="tempat_lahir" defaultValue={editing?.tempat_lahir ?? ''} />
              <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" defaultValue={dateValue(editing?.tanggal_lahir ?? null)} />
              <Select
                label="Status Perkawinan" name="status_perkawinan"
                defaultValue={editing?.status_perkawinan ?? 'B'}
                options={[['B', 'Belum Kawin'], ['S', 'Sudah Kawin'], ['P', 'Pernah Kawin']]}
              />
              <Field label="Banjar / Dusun" name="dusun" defaultValue={editing?.dusun ?? ''} placeholder="Contoh: Banjar Pikat" />
              <Select
                label="TPS Terdaftar" name="tps_id" required
                defaultValue={String(editing?.tps_id ?? '')}
                options={filters.tpsList.map((t) => [String(t.id), t.nomor_tps])}
              />
              <Select
                label="Status Hak Pilih" name="status"
                defaultValue={editing?.status ?? 'aktif'}
                options={[['aktif', 'Aktif'], ['tms', 'TMS']]}
              />

              <label className="sm:col-span-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Alamat
                <textarea
                  name="alamat"
                  defaultValue={editing?.alamat ?? ''}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm font-normal text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </label>
              <label className="sm:col-span-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Keterangan
                <textarea
                  name="keterangan"
                  defaultValue={editing?.keterangan ?? ''}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm font-normal text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </label>

              <div className="flex gap-3 sm:col-span-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Import Excel                            */}
      {/* ═══════════════════════════════════════════════ */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeImport}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Import Data DPT</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload file Excel (.xlsx) dengan format DPT standar
                </p>
              </div>
              <button onClick={closeImport} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                dragOver
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : importFile
                    ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              {importFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{importFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(importFile.size / 1024).toFixed(1)} KB • klik untuk ganti file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Drag & drop file Excel, atau <span className="text-emerald-600 dark:text-emerald-400 font-bold">klik di sini</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Format: .xlsx atau .xls • Setiap sheet = 1 TPS</p>
                </div>
              )}
            </div>

            {/* Format Info */}
            <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">📋 Format Kolom Excel</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                B: NKK &bull; D: NIK &bull; F: Nama &bull; G: Tempat Lahir &bull; H: Tgl Lahir &bull; I: Status Kawin &bull; J: JK &bull; K: Alamat
              </p>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`mt-4 p-4 rounded-xl border animate-fade-in-up ${
                importResult.errors.length > 0 && importResult.imported === 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {importResult.imported > 0 ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {importResult.imported > 0 ? 'Import Berhasil!' : 'Import Gagal'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {importResult.imported.toLocaleString('id-ID')} data diimport
                      {importResult.skipped > 0 && ` • ${importResult.skipped} dilewati`}
                    </p>
                  </div>
                </div>

                {importResult.tpsCreated.length > 0 && (
                  <p className="text-xs text-emerald-700 mb-2">
                    🏛️ TPS baru dibuat: {importResult.tpsCreated.join(', ')}
                  </p>
                )}

                {importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-24 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700 leading-relaxed">• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={closeImport}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                {importResult ? 'Tutup' : 'Batal'}
              </button>
              {!importResult && (
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    'Mulai Import'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* VOTER LIST: Mobile Cards & Desktop Table       */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 shadow-sm">
        {/* Mobile View: Card List (< md breakpoint) */}
        <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {/* Mobile Select All Bar */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={data.voters.length > 0 && selectedIds.length === data.voters.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span>Pilih Semua ({data.voters.length})</span>
            </label>
            <span className="text-[11px] text-gray-400">Hal. {data.page} dari {data.totalPages || 1}</span>
          </div>

          {data.voters.map((voter) => (
            <div
              key={voter.id}
              className={`p-3.5 flex flex-col gap-2.5 transition-colors ${
                selectedIds.includes(voter.id)
                  ? 'bg-red-50/70 dark:bg-red-950/25'
                  : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(voter.id)}
                    onChange={() => handleSelectOne(voter.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug truncate">
                      {voter.nama}
                    </p>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      NIK: {voter.nik}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold flex-shrink-0 ${
                  voter.jenis_kelamin === 'L'
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300'
                }`}>
                  {voter.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-2 text-xs pt-1 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <span className="text-gray-400">Banjar:</span>
                  <span className="font-medium">{voter.dusun || '-'}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">TPS:</span>
                  <span className="rounded bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 text-[11px] font-bold text-green-700 dark:text-green-400">
                    {voter.tps.nomor_tps}
                  </span>
                </div>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                    voter.status === 'aktif'
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {voter.status === 'aktif' ? 'Aktif' : 'TMS'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => { setEditing(voter); setShowForm(true); setError(null) }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => remove(voter.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  Hapus
                </button>
              </div>
            </div>
          ))}

          {data.voters.length === 0 && (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Tidak ada data pemilih</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View: Table (>= md breakpoint) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={data.voters.length > 0 && selectedIds.length === data.voters.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3 font-semibold">Nama / NIK</th>
                <th className="px-5 py-3 font-semibold">JK</th>
                <th className="px-5 py-3 font-semibold">Dusun</th>
                <th className="px-5 py-3 font-semibold">TPS</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.voters.map((voter) => (
                <tr
                  key={voter.id}
                  className={`transition-colors ${
                    selectedIds.includes(voter.id)
                      ? 'bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(voter.id)}
                      onChange={() => handleSelectOne(voter.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{voter.nama}</p>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">{voter.nik}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${
                      voter.jenis_kelamin === 'L'
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300'
                    }`}>
                      {voter.jenis_kelamin}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{voter.dusun || '-'}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-bold text-green-700 dark:text-green-400">
                      {voter.tps.nomor_tps}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                      voter.status === 'aktif'
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {voter.status === 'aktif' ? 'Aktif' : 'TMS'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(voter); setShowForm(true); setError(null) }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(voter.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.voters.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Tidak ada data pemilih</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700 px-4 sm:px-5 py-3 text-sm">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {data.total.toLocaleString('id-ID')} pemilih terdaftar
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={data.page <= 1 || isPending}
              onClick={() => load(data.page - 1)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Sebelumnya
            </button>
            <span className="px-2 py-1.5 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {data.page} / {data.totalPages || 1}
            </span>
            <button
              disabled={data.page >= data.totalPages || isPending}
              onClick={() => load(data.page + 1)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
