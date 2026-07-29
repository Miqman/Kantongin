"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import type { Transaction } from '@/types';

// ── Helper: YYYY-MM dari waktu lokal ─────────────────────────────────────────
function getLocalYM(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ── Helper: YYYY-MM-DD dari waktu lokal ──────────────────────────────────────
function getLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Helper: Normalisasi string tanggal ke YYYY-MM-DD ─────────────────────────
function normalizeDateStr(dStr: string): string {
  if (!dStr) return '';
  if (dStr.length >= 10 && dStr[4] === '-' && dStr[7] === '-') {
    return dStr.slice(0, 10);
  }
  try {
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch {}
  return dStr;
}

// ── Helper: first/last day of a month as YYYY-MM-DD strings ──────────────────
function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export default function HeroSection() {
  const { transactions: storeTxs, budgets: bdgData, isLoading: storeLoading, user, lastFetchedAt } = useStore();

  // Toggle: false = bulan ini, true = semua waktu
  const [showAllTime, setShowAllTime] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [totalDanaBulanIni, setTotalDanaBulanIni] = useState(0);
  const [totalDanaAllTime, setTotalDanaAllTime] = useState(0);
  const [growthBulanIni, setGrowthBulanIni] = useState(0);
  const [totalHariIni, setTotalHariIni] = useState(0);
  const [totalBulanIni, setTotalBulanIni] = useState(0);
  const [sisaBudget, setSisaBudget] = useState(0);

  // ── Kalkulasi dari array transaksi ──────────────────────────────────────────
  const calcSummary = useCallback((
    allTxs: Transaction[],
    monthTxs: Transaction[],
    prevMonthTxs: Transaction[],
    todayStr: string,
  ) => {
    // All-time
    const atIncome = allTxs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const atExpense = allTxs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
    setTotalDanaAllTime(atIncome - atExpense);

    // Bulan ini
    const mIncome = monthTxs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const mExpense = monthTxs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
    const mBalance = mIncome - mExpense;
    setTotalDanaBulanIni(mBalance);
    setTotalBulanIni(mExpense);

    // Hari ini (pengeluaran: amount > 0)
    // Gunakan allTxs yang sudah digabung & normalizeDateStr untuk hindari masalah format timestamp/timezone
    const todayExp = allTxs
      .filter(t => normalizeDateStr(t.date) === todayStr && Number(t.amount) > 0)
      .reduce((s, t) => s + Number(t.amount), 0);
    setTotalHariIni(todayExp);

    // Growth vs bulan lalu
    const pIncome = prevMonthTxs.filter(t => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const pExpense = prevMonthTxs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
    const pBalance = pIncome - pExpense;
    if (pBalance !== 0) {
      setGrowthBulanIni(((mBalance - pBalance) / Math.abs(pBalance)) * 100);
    } else if (mBalance !== 0) {
      setGrowthBulanIni(100);
    } else {
      setGrowthBulanIni(0);
    }

    // Sisa budget (hanya monthly)
    const monthBudget = Array.isArray(bdgData)
      ? bdgData.filter(b => b.period === 'monthly').reduce((s, b) => s + Number(b.limit_amount || 0), 0)
      : 0;
    setSisaBudget(monthBudget - mExpense);
  }, [bdgData]);

  // ── Fetch semua transaksi yang dibutuhkan ────────────────────────────────────
  useEffect(() => {
    if (storeLoading) return;

    const now = new Date();
    const todayStr = getLocalDate(now);
    const currentYM = getLocalYM(now);

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYM = getLocalYM(prevDate);

    const { start: mStart, end: mEnd } = monthBounds(now.getFullYear(), now.getMonth());
    const { start: pStart, end: pEnd } = monthBounds(prevDate.getFullYear(), prevDate.getMonth());

    if (user) {
      // ── Mode online: fetch langsung dari API dengan filter tanggal ──────────
      // Ini menghindari masalah paginasi store (hanya 50 tx terbaru)
      setSummaryLoading(true);

      Promise.all([
        // Semua transaksi (untuk all-time balance)
        fetch(`/api/transactions?limit=100000`, { cache: 'no-store' }).then(r => r.json()).then(j => j.data ?? []),
        // Transaksi bulan ini saja
        fetch(`/api/transactions?limit=10000&start_date=${mStart}&end_date=${mEnd}`, { cache: 'no-store' }).then(r => r.json()).then(j => j.data ?? []),
        // Transaksi bulan lalu saja
        fetch(`/api/transactions?limit=10000&start_date=${pStart}&end_date=${pEnd}`, { cache: 'no-store' }).then(r => r.json()).then(j => j.data ?? []),
      ])
        .then(([allTxs, monthTxs, prevTxs]) => {
          // Gabungkan dengan storeTxs agar transaksi terbaru di Zustand store (termasuk yang baru di-add) langsung terhitung
          const txMap = new Map<string, Transaction>();
          (allTxs as Transaction[]).forEach((t) => txMap.set(t.id, t));
          (storeTxs as Transaction[]).forEach((t) => txMap.set(t.id, t));
          const combinedAll = Array.from(txMap.values());

          calcSummary(combinedAll, monthTxs, prevTxs, todayStr);
        })
        .catch(console.error)
        .finally(() => setSummaryLoading(false));
    } else {
      // ── Mode guest: ambil dari Dexie (semua transaksi tersedia lokal) ───────
      import('@/lib/dexie').then(async ({ default: db }) => {
        const all = await db.transactions.toArray();

        // Slice berdasarkan YYYY-MM string (tidak ada masalah timezone)
        const monthTxs = all.filter(t => normalizeDateStr(t.date).slice(0, 7) === currentYM);
        const prevTxs = all.filter(t => normalizeDateStr(t.date).slice(0, 7) === prevYM);

        calcSummary(all as Transaction[], monthTxs as Transaction[], prevTxs as Transaction[], todayStr);
        setSummaryLoading(false);
      }).catch(console.error);
    }
  }, [storeLoading, user, storeTxs, lastFetchedAt, calcSummary]);

  // ── Re-hitung sisa budget saat bdgData berubah ───────────────────────────────
  useEffect(() => {
    const monthBudget = Array.isArray(bdgData)
      ? bdgData.filter(b => b.period === 'monthly').reduce((s, b) => s + Number(b.limit_amount || 0), 0)
      : 0;
    setSisaBudget(monthBudget - totalBulanIni);
  }, [bdgData, totalBulanIni]);

  // Helpers
  const formatCompact = (num: number) =>
    new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('id-ID').format(num);

  const loading = storeLoading || summaryLoading;
  const displayDana = showAllTime ? totalDanaAllTime : totalDanaBulanIni;
  const growth = showAllTime ? null : growthBulanIni;

  return (
    <>
      {/* Hero Section: Total Balance */}
      <section className="relative space-y-3 hero-glow">
        {/* Label + toggle */}
        <div className="relative z-10 flex items-center gap-2">
          <p className="font-label text-[10px] font-semibold tracking-[0.12em] uppercase text-on-surface-variant/70">
            {showAllTime ? 'Semua waktu' : 'Bulan ini'}
          </p>
          <button
            onClick={() => setShowAllTime(prev => !prev)}
            title={showAllTime ? 'Tampilkan bulan ini' : 'Tampilkan semua waktu'}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide border border-outline-variant/20 text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface hover:border-outline-variant/40 transition-all duration-200 active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
              {showAllTime ? 'calendar_month' : 'all_inclusive'}
            </span>
            {showAllTime ? 'Bulan ini' : 'Semua'}
          </button>
        </div>

        {/* Balance + growth */}
        <div className="relative z-10 flex items-end gap-3">
          {loading ? (
            <div className="h-12 w-52 skeleton-wave rounded-xl" />
          ) : (
            <>
              <span className="font-headline text-[2.6rem] font-extrabold tracking-[-0.04em] text-on-surface leading-none amount-badge">
                Rp {formatCurrency(displayDana)}
              </span>
              {growth !== null && (
                <span className={`mb-1 inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full transition-all
                  ${growth >= 0
                    ? 'bg-secondary/10 text-secondary'
                    : 'bg-error/10 text-error'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                    {growth >= 0 ? 'trending_up' : 'trending_down'}
                  </span>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </span>
              )}
            </>
          )}
        </div>

        {!loading && !showAllTime && (
          <p className="relative z-10 text-[10px] text-on-surface-variant/40 font-medium">
            dibandingkan bulan lalu
          </p>
        )}
      </section>

      {/* Bento Grid: Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Total Hari Ini */}
        <div className="col-span-1 p-4 rounded-2xl bg-surface-container-low flex flex-col justify-between gap-4 border border-outline-variant/8 card-spotlight transition-all duration-200">
          <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              account_balance_wallet
            </span>
          </div>
          <div>
            <p className="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">Hari ini</p>
            {loading ? (
              <div className="h-5 w-16 skeleton-wave rounded" />
            ) : (
              <p className="font-headline text-base font-bold text-on-surface amount-badge">Rp {formatCompact(totalHariIni)}</p>
            )}
          </div>
        </div>

        {/* Total Bulan Ini */}
        <div className="col-span-1 p-4 rounded-2xl bg-surface-container-high flex flex-col justify-between gap-4 border border-outline-variant/10 card-spotlight transition-all duration-200">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              calendar_month
            </span>
          </div>
          <div>
            <p className="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">Bulan ini</p>
            {loading ? (
              <div className="h-5 w-16 skeleton-wave rounded" />
            ) : (
              <p className="font-headline text-base font-bold text-on-surface amount-badge">Rp {formatCompact(totalBulanIni)}</p>
            )}
          </div>
        </div>

        {/* Sisa Budget */}
        {sisaBudget !== 0 || (Array.isArray(bdgData) && bdgData.some(b => b.period === 'monthly')) ? (
          <div className={`col-span-2 md:col-span-1 p-4 rounded-2xl flex flex-col justify-between gap-4 border transition-all duration-300 card-spotlight
            ${sisaBudget < 0
              ? 'bg-error/6 border-error/20'
              : 'bg-surface-container-low border-outline-variant/8'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${sisaBudget < 0 ? 'bg-error/10' : 'bg-primary/10'}`}>
              <span
                className={`material-symbols-outlined ${sisaBudget < 0 ? 'text-error' : 'text-primary'}`}
                style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
              >
                {sisaBudget < 0 ? 'warning' : 'analytics'}
              </span>
            </div>
            <div>
              <p className="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">Sisa budget</p>
              {loading ? (
                <div className="h-5 w-24 skeleton-wave rounded" />
              ) : (
                <p className={`font-headline text-base font-extrabold amount-badge ${sisaBudget < 0 ? 'text-error' : 'text-on-surface'}`}>
                  Rp {formatCompact(Math.abs(sisaBudget))}{sisaBudget < 0 ? ' lebih' : ''}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/20 flex flex-col justify-between gap-4 opacity-50">
            <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>savings</span>
            </div>
            <div>
              <p className="font-label text-[9px] font-semibold text-on-surface-variant/60 tracking-[0.1em] uppercase mb-1">Budget bulanan</p>
              <p className="text-xs text-on-surface-variant/50 font-medium">Belum diatur</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
