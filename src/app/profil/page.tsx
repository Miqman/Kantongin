"use client";
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopAppBar from '@/components/TopAppBar';
import BottomNavBar from '@/components/BottomNavBar';
import GoogleSheetsCard from '@/components/GoogleSheetsCard';
import BudgetCard from '@/components/BudgetCard';
import { useStore } from '@/store/useStore';
import ThemePicker from '@/components/ThemePicker';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

/* ── Mobile Calendar: nav arrows sit beside the month title ── */
function MobileCalendar({ selected, onSelect, disabledBefore, disabledAfter }: {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabledBefore?: Date;
  disabledAfter?: Date;
}) {
  const disabled: import('react-day-picker').Matcher[] = [];
  if (disabledBefore) disabled.push({ before: disabledBefore });
  if (disabledAfter)  disabled.push({ after: disabledAfter });

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      locale={id}
      showOutsideDays
      disabled={disabled.length ? disabled : undefined}
      defaultMonth={selected ?? (disabledBefore ?? disabledAfter)}
      className="w-full p-0"
      classNames={{
        months: "w-full",
        month: "w-full space-y-3",
        month_caption: "flex items-center justify-between px-1 py-2",
        caption_label: "text-base font-semibold text-on-surface",
        nav: "flex items-center gap-1",
        button_previous: "h-9 w-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer",
        button_next: "h-9 w-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-on-surface-variant/60 font-bold text-[0.72rem] uppercase tracking-wider text-center flex-1 py-2",
        week: "flex w-full mt-1",
        day: "flex-1 aspect-square text-center text-base p-0 relative focus-within:relative focus-within:z-20",
        day_button: "w-full h-full p-0 font-medium text-on-surface hover:bg-surface-container-high rounded-full transition-colors aria-selected:opacity-100",
        selected: "bg-primary text-on-primary hover:bg-primary hover:text-on-primary focus:bg-primary focus:text-on-primary rounded-full",
        today: "bg-primary/10 text-primary font-bold border border-primary/20 rounded-full",
        outside: "text-on-surface-variant opacity-30",
        disabled: "text-on-surface-variant opacity-30",
        hidden: "invisible",
      }}
      components={{
        Chevron: (props) => props.orientation === 'left'
          ? <ChevronLeft className="h-5 w-5" />
          : <ChevronRight className="h-5 w-5" />,
      }}
    />
  );
}

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export default function Profil() {
  const router = useRouter();
  const { user, transactions } = useStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  const [dateRangeType, setDateRangeType] = useState<'all' | 'this_month' | 'last_month' | 'last_30_days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getDateRangeParams = () => {
    let start: string | null = null;
    let end: string | null = null;
    const today = new Date();

    if (dateRangeType === 'this_month') {
      const y = today.getFullYear();
      const m = today.getMonth();
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      
      const toISO = (d: Date) => d.toLocaleDateString('en-CA');
      start = toISO(firstDay);
      end = toISO(lastDay);
    } else if (dateRangeType === 'last_month') {
      const y = today.getFullYear();
      const m = today.getMonth();
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      
      const toISO = (d: Date) => d.toLocaleDateString('en-CA');
      start = toISO(firstDay);
      end = toISO(lastDay);
    } else if (dateRangeType === 'last_30_days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      
      const toISO = (d: Date) => d.toLocaleDateString('en-CA');
      start = toISO(past);
      end = toISO(today);
    } else if (dateRangeType === 'custom') {
      start = customStartDate || null;
      end = customEndDate || null;
    }

    return { start, end };
  };

  const fetchTransactionsForExport = async () => {
    const { start, end } = getDateRangeParams();

    if (dateRangeType === 'custom') {
      if (!start || !end) {
        toast.error('Silakan pilih rentang tanggal mulai dan selesai.');
        return null;
      }
      if (start > end) {
        toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
        return null;
      }
    }

    try {
      if (user) {
        let url = `/api/transactions?limit=10000`;
        if (start) url += `&start_date=${start}`;
        if (end) url += `&end_date=${end}`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Gagal mengambil data dari server');
        const json = await res.json();
        return json.data ?? [];
      } else {
        const dbModule = await import('@/lib/dexie');
        const db = dbModule.default;
        const txs = await db.transactions.toArray();
        const catData = await db.categories.toArray();
        const catMap = new Map(catData.map((c) => [c.id, c]));
        
        let filtered = txs.map((tx) => ({
          ...tx,
          category: catMap.get(tx.category_id) ?? null,
        }));

        if (start) {
          filtered = filtered.filter((tx) => tx.date >= start);
        }
        if (end) {
          filtered = filtered.filter((tx) => tx.date <= end);
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch (err) {
      console.error('Error fetching transactions for export:', err);
      toast.error('Gagal mengambil data transaksi untuk diekspor.');
      return null;
    }
  };

  // ── EXPORT CSV ──
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const dataToExport = await fetchTransactionsForExport();
      if (!dataToExport) return;

      if (dataToExport.length === 0) {
        toast.error('Tidak ada data transaksi pada rentang tanggal ini.');
        return;
      }

      const header = ['Tanggal', 'Kategori', 'Catatan', 'Jumlah (Rp)', 'Tipe'];
      const rows = dataToExport.map((t: any) => [
        new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        t.category?.name ?? 'Tanpa Kategori',
        t.note ?? '',
        Math.abs(Number(t.amount)),
        Number(t.amount) < 0 ? 'Pemasukan' : 'Pengeluaran',
      ]);

      const csvContent =
        '\uFEFF' + // BOM agar Excel bisa baca karakter ID
        [header, ...rows]
          .map((row: any) =>
            row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const { start, end } = getDateRangeParams();
      const filenameSuffix = dateRangeType === 'all' ? 'semua' : `${start}_ke_${end}`;
      link.href = url;
      link.download = `uangmu-transaksi-${filenameSuffix}.csv`;
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
    setIsExportingPdf(true);
    try {
      const dataToExport = await fetchTransactionsForExport();
      if (!dataToExport) return;

      if (dataToExport.length === 0) {
        toast.error('Tidak ada data transaksi pada rentang tanggal ini.');
        return;
      }

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

      const { start, end } = getDateRangeParams();
      let rangeText = 'Semua Waktu';
      if (dateRangeType === 'this_month') rangeText = 'Bulan Ini';
      else if (dateRangeType === 'last_month') rangeText = 'Bulan Lalu';
      else if (dateRangeType === 'last_30_days') rangeText = '30 Hari Terakhir';
      else if (dateRangeType === 'custom' && start && end) {
        const formatIndo = (dStr: string) => new Date(dStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        rangeText = `${formatIndo(start)} - ${formatIndo(end)}`;
      }

      doc.text(
        `Periode: ${rangeText}   |   Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        14,
        25
      );
      doc.setTextColor(0);

      // ── Summary ──
      const totalPemasukan = dataToExport
        .filter((t: any) => Number(t.amount) < 0)
        .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);
      const totalPengeluaran = dataToExport
        .filter((t: any) => Number(t.amount) >= 0)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      doc.setFontSize(9);
      doc.text(
        `Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}   |   Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`,
        14,
        31
      );

      // ── Table ──
      const head = [['Tanggal', 'Kategori', 'Catatan', 'Tipe', 'Jumlah (Rp)']];
      const body = [...dataToExport]
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

      const filenameSuffix = dateRangeType === 'all' ? 'semua' : `${start}_ke_${end}`;
      doc.save(`uangmu-transaksi-${filenameSuffix}.pdf`);
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
            {/* Theme Picker */}
            <div className="p-5">
              <ThemePicker />
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

          {/* Premium Date Range Picker */}
          <div className="bg-surface-container-low rounded-[1.5rem] p-5 border border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-2 text-on-surface-variant ml-1">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Rentang Tanggal Ekspor
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { value: 'all', label: 'Semua Waktu' },
                { value: 'this_month', label: 'Bulan Ini' },
                { value: 'last_month', label: 'Bulan Lalu' },
                { value: 'last_30_days', label: '30 Hari' },
                { value: 'custom', label: 'Kustom' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDateRangeType(opt.value as any)}
                  className={`px-3 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer text-center ${
                    dateRangeType === opt.value
                      ? 'bg-primary text-on-primary border-primary shadow-md'
                      : 'bg-surface-container hover:bg-surface-container-highest border-outline-variant/10 text-on-surface-variant'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {dateRangeType === 'custom' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-fadeIn">
                {/* Tanggal Mulai */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 ml-1">
                    Tanggal Mulai
                  </span>
                  {!isMobile ? (
                    <Popover open={openStart} onOpenChange={setOpenStart}>
                      <PopoverTrigger className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm hover:bg-surface-container-low focus:border-primary/45 transition-all text-xs font-medium cursor-pointer text-left">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <CalendarIcon className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-on-surface">
                            {customStartDate ? format(parseISO(customStartDate), "d MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={customStartDate ? parseISO(customStartDate) : undefined}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              setCustomStartDate(format(selectedDate, "yyyy-MM-dd"));
                              // jika start > end, reset end
                              if (customEndDate && format(selectedDate, "yyyy-MM-dd") > customEndDate) {
                                setCustomEndDate('');
                              }
                              setOpenStart(false);
                            }
                          }}
                          disabled={customEndDate ? { after: parseISO(customEndDate) } : undefined}
                          initialFocus
                          locale={id}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenStart(true)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm hover:bg-surface-container-low focus:border-primary/45 transition-all text-xs font-medium cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <CalendarIcon className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-on-surface">
                            {customStartDate ? format(parseISO(customStartDate), "d MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                          </span>
                        </div>
                      </button>

                      {openStart && typeof window !== "undefined" && ReactDOM.createPortal(
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
                            onClick={() => setOpenStart(false)}
                          />
                          {/* Bottom Sheet */}
                          <div
                            className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl z-[9999] flex flex-col max-h-[85dvh] animate-slide-up"
                          >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                              <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 flex-shrink-0">
                              <h3 className="font-headline font-bold text-base text-on-surface">Pilih Tanggal Mulai</h3>
                              <button
                                type="button"
                                onClick={() => setOpenStart(false)}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
                              </button>
                            </div>

                            {/* Calendar content */}
                            <div className="px-5 pb-6 pt-2 overflow-y-auto">
                              <MobileCalendar
                                selected={customStartDate ? parseISO(customStartDate) : undefined}
                                onSelect={(selectedDate) => {
                                  if (selectedDate) {
                                    setCustomStartDate(format(selectedDate, "yyyy-MM-dd"));
                                    // jika start > end, reset end
                                    if (customEndDate && format(selectedDate, "yyyy-MM-dd") > customEndDate) {
                                      setCustomEndDate('');
                                    }
                                    setOpenStart(false);
                                  }
                                }}
                                disabledAfter={customEndDate ? parseISO(customEndDate) : undefined}
                              />
                            </div>
                          </div>
                        </>,
                        document.body
                      )}
                    </>
                  )}
                </div>

                {/* Tanggal Selesai */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 ml-1">
                    Tanggal Selesai
                  </span>
                  {!isMobile ? (
                    <Popover open={openEnd} onOpenChange={setOpenEnd}>
                      <PopoverTrigger className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm hover:bg-surface-container-low focus:border-primary/45 transition-all text-xs font-medium cursor-pointer text-left">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <CalendarIcon className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-on-surface">
                            {customEndDate ? format(parseISO(customEndDate), "d MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-lg" align="start">
                        <Calendar
                          mode="single"
                          selected={customEndDate ? parseISO(customEndDate) : undefined}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              setCustomEndDate(format(selectedDate, "yyyy-MM-dd"));
                              setOpenEnd(false);
                            }
                          }}
                          disabled={customStartDate ? { before: parseISO(customStartDate) } : undefined}
                          initialFocus
                          locale={id}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenEnd(true)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm hover:bg-surface-container-low focus:border-primary/45 transition-all text-xs font-medium cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <CalendarIcon className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-on-surface">
                            {customEndDate ? format(parseISO(customEndDate), "d MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                          </span>
                        </div>
                      </button>

                      {openEnd && typeof window !== "undefined" && ReactDOM.createPortal(
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
                            onClick={() => setOpenEnd(false)}
                          />
                          {/* Bottom Sheet */}
                          <div
                            className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-2xl z-[9999] flex flex-col max-h-[85dvh] animate-slide-up"
                          >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                              <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 flex-shrink-0">
                              <h3 className="font-headline font-bold text-base text-on-surface">Pilih Tanggal Selesai</h3>
                              <button
                                type="button"
                                onClick={() => setOpenEnd(false)}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
                              </button>
                            </div>

                            {/* Calendar content */}
                            <div className="px-5 pb-6 pt-2 overflow-y-auto">
                              <MobileCalendar
                                selected={customEndDate ? parseISO(customEndDate) : undefined}
                                onSelect={(selectedDate) => {
                                  if (selectedDate) {
                                    setCustomEndDate(format(selectedDate, "yyyy-MM-dd"));
                                    setOpenEnd(false);
                                  }
                                }}
                                disabledBefore={customStartDate ? parseISO(customStartDate) : undefined}
                              />
                            </div>
                          </div>
                        </>,
                        document.body
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Validation hint */}
              {customStartDate && customEndDate && customStartDate > customEndDate && (
                <p className="flex items-center gap-1.5 text-xs text-error mt-1 px-1 animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">error</span>
                  Tanggal mulai tidak boleh lebih baru dari tanggal selesai.
                </p>
              )}
              </>
            )}
          </div>

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
