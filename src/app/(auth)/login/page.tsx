'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import Link from 'next/link'
import TopAppBar from '@/components/TopAppBar'

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Already logged in → go home
  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      // ── Hit API Login instead of direct Supabase ──
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal masuk');
        setLoading(false);
        return;
      }

      // ── Sync Browser Client with Server Cookies ──
      // This is necessary so the singleton client knows we are logged in
      const supabase = createClient();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      // Update store immediately for instant UI feedback
      if (supabaseUser) {
        setUser(supabaseUser);
      }

      router.push('/')
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
      setLoading(false);
    }
  }

  if (user) return null

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

          <div className="space-y-2 group">
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1 group-focus-within:text-primary transition-colors">Email</label>
            <div className="bg-surface-container-low hover:bg-surface-container transition-all p-4 rounded-2xl flex items-center gap-4 border border-outline-variant/5 focus-within:bg-surface-bright focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/20">
              <span className="material-symbols-outlined text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">mail</span>
              <input
                name="email"
                type="email"
                required
                autoFocus
                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
                placeholder="email@anda.com"
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant/80 ml-1 group-focus-within:text-primary transition-colors">Kata Sandi</label>
            <div className="bg-surface-container-low hover:bg-surface-container transition-all p-4 rounded-2xl flex items-center gap-4 border border-outline-variant/5 focus-within:bg-surface-bright focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/20">
              <span className="material-symbols-outlined text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">lock</span>
              <input
                name="password"
                type="password"
                required
                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-full bg-primary text-on-primary font-headline font-bold text-base shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait cursor-pointer"
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
