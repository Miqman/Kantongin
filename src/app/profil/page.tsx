"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import GoogleSheetsCard from '@/components/GoogleSheetsCard';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export default function Profil() {
  const router = useRouter();
  const { user } = useStore();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      !localStorage.getItem('theme');
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // ── Sync Browser Client ──
      const supabase = createClient();
      await supabase.auth.signOut(); // Still call this locally to clear browser state
      
      // Explicitly update store for instant UI feedback
      useStore.getState().setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <TopAppBar />
      <main className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-10">

        {/* ── PROFILE HEADER ── */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary">
              <div className="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center">
                {user ? (
                  <span className="text-on-surface font-extrabold text-4xl select-none">
                    {getInitials(user.email ?? 'U')}
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-5xl">
                    person
                  </span>
                )}
              </div>
            </div>
            {user && (
              <button className="absolute bottom-0 right-0 bg-primary text-on-primary p-1.5 rounded-full shadow-lg">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            )}
          </div>

          <div>
            {user ? (
              <>
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
                  {user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Pengguna'}
                </h1>
                <p className="text-on-surface-variant font-medium mt-1">{user.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Cloud Sync Aktif
                </span>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">
                  Mode Tamu
                </h1>
                <p className="text-on-surface-variant font-medium mt-1 text-sm">
                  Data tersimpan di perangkat ini saja
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-outline-variant/20 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-xs">device_unknown</span>
                  Lokal Saja
                </span>
              </>
            )}
          </div>
        </section>

        {/* ── GUEST CTA BANNER ── */}
        {!user && (
          <section className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-3xl p-6 text-center space-y-4">
            <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">Backup Data ke Cloud</h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Buat akun gratis untuk menyimpan data secara aman dan sinkron di semua perangkat.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link
                href="/register"
                className="px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md active:scale-95 transition-transform"
              >
                Buat Akun Gratis
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-full bg-surface-container-high text-on-surface font-bold text-sm active:scale-95 transition-transform"
              >
                Sudah Punya Akun
              </Link>
            </div>
          </section>
        )}

        {/* ── INTEGRATIONS (only for logged in users) ── */}
        {user && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GoogleSheetsCard />

            <div className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col justify-between border border-primary/10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                </div>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg">Budget Limit</h3>
                <p className="text-on-surface-variant text-sm mt-1">Atur batas pengeluaran bulanan</p>
              </div>
            </div>
          </section>
        )}

        {/* ── PREFERENCES ── */}
        <section className="space-y-6">
          <h2 className="text-xs font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">
            Preferensi
          </h2>
          <div className="bg-surface-container-low rounded-[1.5rem] overflow-hidden">
            {/* Theme Toggle */}
            <div
              onClick={toggleTheme}
              className="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <div
                className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-300 ${
                  isDarkMode ? 'bg-primary' : 'bg-outline-variant'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-6 bg-on-primary' : 'translate-x-0 bg-surface'
                  }`}
                />
              </div>
            </div>

            <Link href="/profil/categories" className="p-5 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group border-b border-outline-variant/5">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  category
                </span>
                <span className="font-medium">Kelola Kategori</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                chevron_right
              </span>
            </Link>
          </div>
        </section>

        {/* ── DATA OPERATIONS ── */}
        <section className="space-y-6">
          <h2 className="text-xs font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-2">
            Operasi Data
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest transition-all py-4 rounded-full border border-outline-variant/10 cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">csv</span>
              <span className="font-medium text-sm">Export CSV</span>
            </button>
            <button className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest transition-all py-4 rounded-full border border-outline-variant/10 cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">picture_as_pdf</span>
              <span className="font-medium text-sm">Export PDF</span>
            </button>
          </div>
        </section>

        {/* ── FOOTER: Logout (only for logged-in users) ── */}
        <footer className="pt-4 pb-4 space-y-4">
          {user ? (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-error-container/10 border border-error-container/20 text-error hover:bg-error-container/20 transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-bold tracking-wide">
                {isLoggingOut ? 'Keluar...' : 'Keluar dari Akun'}
              </span>
            </button>
          ) : null}
          <p className="text-center text-[10px] text-on-surface-variant/40 mt-4 uppercase tracking-widest font-label">
            Kantongin v1.0 • {user ? 'Cloud Mode' : 'Guest Mode'}
          </p>
        </footer>
      </main>
      <BottomNavBar />
    </>
  );
}
