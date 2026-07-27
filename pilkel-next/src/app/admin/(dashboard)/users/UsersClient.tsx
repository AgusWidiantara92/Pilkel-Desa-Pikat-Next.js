'use client'

import { useState, useTransition } from 'react'
import { deleteUser, saveUser } from './user-actions'
import { useToast, ToastContainer } from '../components/Toast'

// ─── Types ────────────────────────────────────────────────────
type User = {
  id: number
  name: string
  email: string
  role: string
  created_at: Date
}

// ─── Role Badge Config ────────────────────────────────────────
const roleBadge: Record<string, { label: string; className: string }> = {
  admin: {
    label: 'Administrator',
    className: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-200/60 dark:ring-red-700/40',
  },
  panitia: {
    label: 'Panitia Pilkel',
    className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200/60 dark:ring-blue-700/40',
  },
  user: {
    label: 'User Biasa',
    className: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200/60 dark:ring-gray-600',
  },
}

// ─── Reusable Input ───────────────────────────────────────────
function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm font-normal text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
      />
    </label>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [editing, setEditing] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const { toasts, toast, removeToast } = useToast()

  const submit = (data: FormData) => {
    startTransition(async () => {
      setError(null)
      const result = await saveUser(editing?.id ?? null, data)
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      toast.success(editing ? 'Pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.')
      window.location.reload()
    })
  }

  const remove = (id: number) => {
    if (!confirm('Hapus pengguna ini? Tindakan ini tidak dapat dibatalkan.')) return
    startTransition(async () => {
      const result = await deleteUser(id)
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success('Pengguna berhasil dihapus.')
        setUsers((items) => items.filter((item) => item.id !== id))
      }
    })
  }

  const openCreate = () => {
    setEditing(null)
    setError(null)
    setOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setError(null)
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setError(null)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* ═══ Page Header ═══ */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Pengguna &amp; Panitia</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Kelola akses panel administrasi — {users.length} pengguna terdaftar
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 px-4 py-2.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
          </svg>
          Tambah Pengguna
        </button>
      </div>

      {/* ═══ Error Banner ═══ */}
      {error && !open && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2 animate-fade-in-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Create / Edit User                      */}
      {/* ═══════════════════════════════════════════════ */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editing ? 'Perbarui informasi pengguna' : 'Buat akun baru untuk panitia atau admin'}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
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

            <form action={submit} className="space-y-4">
              <Input
                label="Nama Lengkap"
                name="name"
                required
                defaultValue={editing?.name}
                placeholder="Masukkan nama lengkap"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                required
                defaultValue={editing?.email}
                placeholder="contoh@email.com"
              />

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Peran / Hak Akses
                <select
                  name="role"
                  defaultValue={editing?.role ?? 'panitia'}
                  className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2.5 text-sm font-normal text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="admin">Administrator Utama</option>
                  <option value="panitia">Panitia Pemilihan Desa</option>
                  <option value="user">User Biasa</option>
                </select>
              </label>

              <Input
                label={editing ? 'Kata Sandi Baru (opsional)' : 'Kata Sandi'}
                name="password"
                type="password"
                required={!editing}
                minLength={editing ? undefined : 8}
                placeholder={editing ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 8 karakter'}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TABLE: User List                               */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-5 py-3 font-semibold">Nama</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Peran</th>
                <th className="px-5 py-3 font-semibold">Terdaftar</th>
                <th className="px-5 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => {
                const badge = roleBadge[user.role] || roleBadge.user
                return (
                  <tr key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : user.role === 'panitia'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => remove(user.id)}
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
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Tidak ada pengguna terdaftar</p>
                    </div>
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
