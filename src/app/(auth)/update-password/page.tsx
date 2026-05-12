'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TopAppBar from '@/components/TopAppBar'
import { toast } from 'react-hot-toast'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      toast.success('Password berhasil diperbarui!')
      // Redirect to home/dashboard or login depending on whether they have an active session
      // Usually updateUser keeps them logged in, so we go home
      router.replace('/')
    }
  }

  return (
    <>
      <TopAppBar />
      
      <main className="pt-24 px-4 pb-24 max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold text-on-surface">Password Baru</h1>
          <p className="text-on-surface-variant mt-2">
            Silakan masukkan password baru untuk akun Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
              Password Baru
            </label>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-xl">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 rounded-full bg-primary text-on-primary font-headline font-bold text-base shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait cursor-pointer"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </main>
    </>
  )
}
