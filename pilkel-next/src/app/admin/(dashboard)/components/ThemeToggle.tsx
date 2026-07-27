'use client'

import { useTheme } from './ThemeProvider'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
  }

  const themes: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Terang',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Gelap',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: 'Sistem',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  const activeTheme = themes.find((t) => t.value === theme) || themes[2]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm"
        title="Pilih Tema"
      >
        {activeTheme.icon}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 shadow-xl z-20 animate-fade-in-up">
            {themes.map((t) => {
              const isSelected = theme === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => {
                    setTheme(t.value)
                    setOpen(false)
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white font-bold shadow-sm'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>
                    {t.icon}
                  </span>
                  {t.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
