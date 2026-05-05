'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'
import TopAppBar from '@/components/TopAppBar'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      <TopAppBar />
      <main className="px-6 pt-12 max-w-sm mx-auto flex flex-col justify-center min-h-[70vh]">
        <div className="text-center mb-10">
          <h1 className="font-headline text-3xl font-bold tracking-tight mb-2">Masuk</h1>
          <p className="text-on-surface-variant text-sm font-medium">Sinkronkan data Kantongin Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1">Email</label>
            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3 border border-outline-variant/5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">mail</span>
              <input
                name="email"
                type="email"
                required
                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface"
                placeholder="email@anda.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1">Kata Sandi</label>
            <div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-3 border border-outline-variant/5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">lock</span>
              <input
                name="password"
                type="password"
                required
                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-full bg-primary text-on-primary font-headline font-bold text-base shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-on-surface-variant">
          Belum punya akun?{' '}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Daftar sekarang
          </Link>
        </div>
      </main>
    </>
  )
}
