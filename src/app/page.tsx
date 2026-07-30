'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { searchDpt, type SearchResult } from './actions'

export default function Home() {
  const [nik, setNik] = useState('')
  const [realtimeFeedback, setRealtimeFeedback] = useState('')
  const [feedbackClass, setFeedbackClass] = useState('text-gray-400')
  const [clientError, setClientError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  
  const [result, setResult] = useState<SearchResult | null>(null)
  const [isPending, startTransition] = useTransition()
  
  const formRef = useRef<HTMLFormElement>(null)

  // ── Helper: Trigger Shake Animation ──
  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  // ── Validasi Realtime NIK (saat mengetik) ──
  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '') // Filter hanya angka
    if (val.length > 16) {
      val = val.substring(0, 16)
    }
    setNik(val)
    setClientError(null) // Hapus error saat mengetik ulang

    const len = val.length
    if (len === 0) {
      setRealtimeFeedback('')
    } else if (len < 16) {
      setFeedbackClass('text-amber-500')
      setRealtimeFeedback(`NIK kurang ${16 - len} digit lagi`)
    } else {
      setFeedbackClass('text-green-600')
      setRealtimeFeedback('✓ Format NIK 16 digit sesuai')
    }
  }

  // ── Submit Handler ──
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const rawValue = nik.trim()

    // Aturan 1: Wajib diisi
    if (rawValue === '') {
      setClientError('Nomor Induk Kependudukan (NIK) wajib diisi.')
      triggerShake()
      return
    }

    // Aturan 2: Hanya angka
    if (/\D/.test(rawValue)) {
      setClientError('NIK hanya boleh berisi karakter angka (0-9).')
      triggerShake()
      return
    }

    // Aturan 3: Tepat 16 digit
    if (rawValue.length !== 16) {
      setClientError(`NIK harus tepat 16 digit angka. Saat ini baru ${rawValue.length} digit.`)
      triggerShake()
      return
    }

    // Lolos validasi, kirim ke Server Action
    startTransition(async () => {
      const formData = new FormData()
      formData.append('nik', rawValue)
      const res = await searchDpt(formData)
      setResult(res)
    })
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════ */}
      {/* HEADER — Background Merah (~40% layar)         */}
      {/* ═══════════════════════════════════════════════ */}
      <header className="relative bg-red-600 text-white flex flex-col items-center justify-center px-4 pb-32 pt-12 sm:pt-16 md:pt-20 min-h-[42vh] overflow-hidden">
        {/* Dot Pattern Overlay */}
        <div className="absolute inset-0 dot-pattern pointer-events-none"></div>

        {/* Konten Header */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo Desa */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-lg flex items-center justify-center mb-5 ring-4 ring-white/20 overflow-hidden p-2 relative">
            <Image 
              src="/logo.png" 
              alt="Logo Pilkel Desa Pikat" 
              width={112} 
              height={112} 
              className="rounded-full object-contain"
              priority
            />
          </div>

          {/* Judul Utama */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-wide text-white leading-tight">
            Pilkel Desa Pikat
          </h1>

          {/* Subjudul */}
          <p className="mt-2 sm:mt-3 text-sm sm:text-base font-medium text-white/85 tracking-wide">
            Cek Lokasi TPS Berdasarkan NIK
          </p>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════ */}
      {/* CARD PENCARIAN — Posisi Tengah (overlap header) */}
      {/* ═══════════════════════════════════════════════ */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 -mt-20 relative z-20 mb-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">

          {/* Session/Server Error Alert */}
          {result && !result.success && result.error && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start animate-fade-in-up">
              <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{result.error}</span>
            </div>
          )}

          {/* Form Pencarian */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {/* Label NIK */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="nik" className="block text-sm font-semibold text-gray-700">
                  Nomor Induk Kependudukan (NIK)
                </label>
                {/* Counter Digit Realtime */}
                <span className={`text-xs font-semibold ${nik.length === 0 ? 'text-gray-400' : nik.length < 16 ? 'text-amber-500' : 'text-green-600'}`}>
                  {nik.length} / 16
                </span>
              </div>

              {/* Input NIK */}
              <input
                type="text"
                name="nik"
                id="nik"
                maxLength={16}
                inputMode="numeric"
                autoComplete="off"
                value={nik}
                onChange={handleNikChange}
                placeholder="Masukkan 16 Digit NIK"
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                  clientError 
                    ? 'border-red-400 bg-red-50' 
                    : 'border-gray-300 bg-gray-50 focus:bg-white'
                } ${shake ? 'animate-shake' : ''}`}
              />

              {/* Realtime Feedback */}
              {realtimeFeedback && (
                <div className={`mt-1.5 text-xs font-medium ${feedbackClass}`}>
                  {realtimeFeedback}
                </div>
              )}

              {/* Client-Side Validation Error */}
              {clientError && (
                <div className="mt-3 animate-fade-in-up">
                  <div className="flex items-start p-3 rounded-lg bg-red-50 border border-red-200">
                    <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-xs font-semibold text-red-700">{clientError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Cek Data Pemilih */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 animate-spin-custom text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memproses...</span>
                </span>
              ) : (
                <span>Cek Data Pemilih</span>
              )}
            </button>

            {/* Keterangan Bawah Tombol */}
            <p className="text-center text-xs text-gray-400 mt-1">
              Masukkan NIK dengan benar untuk mengetahui lokasi TPS Anda.
            </p>
          </form>

          {/* ═══════════════════════════════════════ */}
          {/* HASIL PENCARIAN: DITEMUKAN              */}
          {/* ═══════════════════════════════════════ */}
          {result && result.success && result.voter && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in-up">
              {result.voter.status.toLowerCase() === 'tms' ? (
                /* TAMPILAN WARNING UNTUK TMS */
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6">
                  {/* Icon Exclamation Mark + Judul */}
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-amber-200/50">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-amber-900">Data Pemilih Ditemukan</h3>
                    <p className="text-xs text-amber-700 mt-0.5">Status: Tidak Memenuhi Syarat (TMS)</p>
                  </div>

                  {/* Data Pemilih */}
                  <div className="bg-white rounded-xl border border-amber-100 divide-y divide-amber-50">
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">Nama</span>
                      <span className="text-sm font-bold text-gray-900 text-right break-words max-w-[70%]">{result.voter.nama_masked}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">NIK</span>
                      <span className="text-sm font-bold text-gray-900 font-mono tracking-wide text-right break-all max-w-[70%]">{result.voter.nik_masked}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0">Nomor TPS</span>
                      <span className="text-sm font-extrabold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg flex-shrink-0">
                        {result.voter.nomor_tps}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">Banjar / Dusun</span>
                      <span className="text-sm font-semibold text-gray-800 text-right break-words max-w-[70%]">{result.voter.dusun}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">Lokasi TPS</span>
                      <span className="text-sm font-semibold text-gray-800 text-right break-words max-w-[70%]">{result.voter.nama_lokasi_tps}</span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-amber-600 mt-4 font-semibold">
                    Status: Tidak Memenuhi Syarat (TMS)
                    {result.voter.keterangan && !result.voter.keterangan.toLowerCase().includes('imported via excel') && ` — ${result.voter.keterangan}`}
                  </p>

                  {result.whatsappUrl && (
                    <div className="mt-4">
                      <a
                        href={result.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        Hubungi Panitia (Klarifikasi Status)
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* TAMPILAN NORMAL (AKTIF) - HIJAU */
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 sm:p-6">
                  {/* Icon Centang Hijau + Judul */}
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-green-200/50">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-green-900">Data Pemilih Ditemukan</h3>
                    <p className="text-xs text-green-700 mt-0.5">Berikut informasi lokasi TPS Anda</p>
                  </div>

                  {/* Data Pemilih */}
                  <div className="bg-white rounded-xl border border-green-100 divide-y divide-green-50">
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">Nama</span>
                      <span className="text-sm font-bold text-gray-900 text-right break-words max-w-[70%]">{result.voter.nama_masked}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">NIK</span>
                      <span className="text-sm font-bold text-gray-900 font-mono tracking-wide text-right break-all max-w-[70%]">{result.voter.nik_masked}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0">Nomor TPS</span>
                      <span className="text-sm font-extrabold text-green-700 bg-green-100 px-3 py-1 rounded-lg flex-shrink-0">
                        {result.voter.nomor_tps}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">Banjar / Dusun</span>
                      <span className="text-sm font-semibold text-gray-800 text-right break-words max-w-[70%]">{result.voter.dusun}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-0.5">Lokasi TPS</span>
                      <span className="text-sm font-semibold text-gray-800 text-right break-words max-w-[70%]">{result.voter.nama_lokasi_tps}</span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-green-600 mt-4 font-medium">
                    Status: {result.voter.status.charAt(0).toUpperCase() + result.voter.status.slice(1)}
                    {result.voter.keterangan && !result.voter.keterangan.toLowerCase().includes('imported via excel') && ` — ${result.voter.keterangan}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* HASIL PENCARIAN: TIDAK DITEMUKAN        */}
          {/* ═══════════════════════════════════════ */}
          {result && result.success && result.notFound && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in-up">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                {/* Icon Peringatan */}
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>

                <h3 className="text-base font-bold text-red-900 mb-4">NIK tidak terdaftar dalam DPT.</h3>

                {/* Tombol Hubungi Panitia (WhatsApp) */}
                {result.whatsappUrl && (
                  <a
                    href={result.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-3.5 px-5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    Hubungi Panitia
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ═══════════════════════════════════════════════ */}
      {/* FOOTER                                         */}
      {/* ═══════════════════════════════════════════════ */}
      <footer className="w-full py-6 text-center mt-auto bg-white border-t border-red-100">
        <p className="text-xs text-gray-400 font-medium">
          Sistem Cek Data Pemilih Pemilihan Perbekel Desa Pikat
        </p>
      </footer>
    </>
  )
}
