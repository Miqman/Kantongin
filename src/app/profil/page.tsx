"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import GoogleSheetsCard from '@/components/GoogleSheetsCard';
import BudgetCard from '@/components/BudgetCard';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export default function Profil() {
  const router = useRouter();
  const { user, transactions } = useStore();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  // ── EXPORT CSV ──
  const handleExportCsv = () => {
    if (transactions.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor.');
      return;
    }
    setIsExportingCsv(true);
    try {
      const header = ['Tanggal', 'Kategori', 'Catatan', 'Jumlah (Rp)', 'Tipe'];
      const rows = transactions.map((t) => [
        new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        t.category?.name ?? 'Tanpa Kategori',
        t.note ?? '',
        Math.abs(Number(t.amount)),
        Number(t.amount) < 0 ? 'Pemasukan' : 'Pengeluaran',
      ]);

      const csvContent =
        '\uFEFF' + // BOM agar Excel bisa baca karakter ID
        [header, ...rows]
          .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `uangmu-transaksi-${new Date().toLocaleDateString('en-CA')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV berhasil diunduh!');
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error('Gagal mengekspor CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // ── EXPORT PDF ──
  const handleExportPdf = async () => {
    if (transactions.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor.');
      return;
    }
    setIsExportingPdf(true);
    try {
      // Dynamic import agar tidak mempengaruhi bundle size
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // ── Header ──
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Uangmu – Laporan Transaksi', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(
        `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        14,
        25
      );
      doc.setTextColor(0);

      // ── Summary ──
      const totalPemasukan = transactions
        .filter((t) => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const totalPengeluaran = transactions
        .filter((t) => Number(t.amount) >= 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      doc.setFontSize(9);
      doc.text(
        `Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}   |   Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`,
        14,
        31
      );

      // ── Table ──
      const head = [['Tanggal', 'Kategori', 'Catatan', 'Tipe', 'Jumlah (Rp)']];
      const body = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((t) => [
          new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          t.category?.name ?? 'Tanpa Kategori',
          t.note ?? '-',
          Number(t.amount) < 0 ? 'Pemasukan' : 'Pengeluaran',
          Math.abs(Number(t.amount)).toLocaleString('id-ID'),
        ]);

      const foot = [[
        { content: 'TOTAL PENGELUARAN', colSpan: 4, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
        { content: `Rp ${totalPengeluaran.toLocaleString('id-ID')}`, styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
      ]];

      autoTable(doc, {
        head,
        body,
        foot,
        startY: 36,
        showFoot: 'lastPage',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        footStyles: { fillColor: [232, 232, 250], textColor: [50, 50, 120], fontSize: 8.5 },
        columnStyles: { 4: { halign: 'right' } },
      });

      doc.save(`uangmu-transaksi-${new Date().toLocaleDateString('en-CA')}.pdf`);
      toast.success('PDF berhasil diunduh!');
    } catch (err) {
      console.error('Export PDF error:', err);
      toast.error('Gagal mengekspor PDF.');
    } finally {
      setIsExportingPdf(false);
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
                  {(user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'Pengguna'}
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

            <BudgetCard />
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
            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all py-4 rounded-full border border-outline-variant/10 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {isExportingCsv ? (
                <span className="material-symbols-outlined text-on-surface-variant text-lg animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant text-lg">csv</span>
              )}
              <span className="font-medium text-sm">{isExportingCsv ? 'Mengekspor...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all py-4 rounded-full border border-outline-variant/10 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {isExportingPdf ? (
                <span className="material-symbols-outlined text-on-surface-variant text-lg animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant text-lg">picture_as_pdf</span>
              )}
              <span className="font-medium text-sm">{isExportingPdf ? 'Mengekspor...' : 'Export PDF'}</span>
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
            Uangmu v1.0 • {user ? 'Cloud Mode' : 'Guest Mode'}
          </p>
        </footer>
      </main>
      <BottomNavBar />
    </>
  );
}
