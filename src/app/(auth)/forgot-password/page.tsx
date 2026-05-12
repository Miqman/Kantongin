'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import TopAppBar from '@/components/TopAppBar'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
    })

    if (error) {
      setErrorMessage(error.message)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  return (
    <>
      <TopAppBar />
      
      <main className="pt-24 px-4 pb-24 max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold text-on-surface">Reset Password</h1>
          <p className="text-on-surface-variant mt-2">
            Masukkan email Anda dan kami akan mengirimkan instruksi untuk mereset password.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-primary-container text-on-primary-container p-4 rounded-xl mb-6">
            <h3 className="font-bold mb-1">Email Terkirim!</h3>
            <p className="text-sm">Silakan periksa kotak masuk (atau spam) email Anda untuk instruksi selanjutnya.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
                {errorMessage}
              </div>
            )}

            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">
                Email
              </label>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-on-surface-variant mr-2 text-xl">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 p-0 text-sm w-full outline-none text-on-surface placeholder:text-on-surface-variant/30 font-medium"
                  placeholder="anda@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 mt-4 rounded-full bg-primary text-on-primary font-headline font-bold text-base shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              {status === 'loading' ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-on-surface-variant">
          Ingat password Anda?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Masuk sekarang
          </Link>
        </div>
      </main>
    </>
  )
}
