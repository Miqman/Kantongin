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
  return date.toLocaleDateString('en-CA'); // "YYYY-MM-DD" lokal
}

// ── Helper: first/last day of a month as YYYY-MM-DD strings ──────────────────
function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export default function HeroSection() {
  const { budgets: bdgData, isLoading: storeLoading, user } = useStore();

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

    // Hari ini (pengeluaran)
    const todayExp = monthTxs.filter(t => t.date === todayStr && Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
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
        fetch(`/api/transactions?limit=100000`).then(r => r.json()).then(j => j.data ?? []),
        // Transaksi bulan ini saja
        fetch(`/api/transactions?limit=10000&start_date=${mStart}&end_date=${mEnd}`).then(r => r.json()).then(j => j.data ?? []),
        // Transaksi bulan lalu saja
        fetch(`/api/transactions?limit=10000&start_date=${pStart}&end_date=${pEnd}`).then(r => r.json()).then(j => j.data ?? []),
      ])
        .then(([allTxs, monthTxs, prevTxs]) => {
          calcSummary(allTxs, monthTxs, prevTxs, todayStr);
        })
        .catch(console.error)
        .finally(() => setSummaryLoading(false));
    } else {
      // ── Mode guest: ambil dari Dexie (semua transaksi tersedia lokal) ───────
      import('@/lib/dexie').then(async ({ default: db }) => {
        const all = await db.transactions.toArray();

        // Slice berdasarkan YYYY-MM string (tidak ada masalah timezone)
        const monthTxs = all.filter(t => t.date.slice(0, 7) === currentYM);
        const prevTxs = all.filter(t => t.date.slice(0, 7) === prevYM);

        calcSummary(all as Transaction[], monthTxs as Transaction[], prevTxs as Transaction[], todayStr);
        setSummaryLoading(false);
      }).catch(console.error);
    }
  }, [storeLoading, user, calcSummary]);

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
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-label text-[11px] font-medium tracking-widest uppercase text-on-surface-variant">
            {showAllTime ? 'Total Dana (Semua)' : 'Total Dana Bulan Ini'}
          </p>
          {/* Toggle all-time / bulan ini */}
          <button
            onClick={() => setShowAllTime(prev => !prev)}
            title={showAllTime ? 'Tampilkan bulan ini' : 'Tampilkan semua waktu'}
            className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide border transition-all duration-200
              border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[12px]!">
              {showAllTime ? 'calendar_month' : 'all_inclusive'}
            </span>
            {showAllTime ? 'Bulan ini' : 'Semua'}
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          {loading ? (
            <div className="h-10 w-48 bg-surface-container-high animate-pulse rounded-lg mt-1"></div>
          ) : (
            <>
              <span className="text-display-md font-headline text-4xl font-extrabold tracking-tight text-on-surface">
                Rp {formatCurrency(displayDana)}
              </span>
              {growth !== null && (
                <span className={`text-sm font-bold transition-opacity ${growth >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </span>
              )}
            </>
          )}
        </div>
        {/* {!loading && !showAllTime && (
          <p className="text-[10px] text-on-surface-variant/60">
            vs bulan lalu
          </p>
        )} */}
      </section>

      {/* Bento Grid: Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Hari Ini */}
        <div className="col-span-1 p-5 rounded-[1.5rem] bg-surface-container-low flex flex-col justify-between border border-outline-variant/5">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          <div className="mt-4">
            <p className="font-label text-[10px] font-bold text-on-surface-variant tracking-wider">Total Hari Ini</p>
            {loading ? (
              <div className="h-6 w-16 bg-surface-container-highest animate-pulse rounded mt-1"></div>
            ) : (
              <p className="font-headline text-lg font-bold text-on-surface">Rp {formatCompact(totalHariIni)}</p>
            )}
          </div>
        </div>

        {/* Total Bulan Ini */}
        <div className="col-span-1 p-5 rounded-[1.5rem] bg-surface-container-high flex flex-col justify-between border border-outline-variant/10">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
          <div className="mt-4">
            <p className="font-label text-[10px] font-bold text-on-surface-variant tracking-wider">Total Bulan Ini</p>
            {loading ? (
              <div className="h-6 w-16 bg-surface-container-highest animate-pulse rounded mt-1"></div>
            ) : (
              <p className="font-headline text-lg font-bold text-on-surface">Rp {formatCompact(totalBulanIni)}</p>
            )}
          </div>
        </div>

        {/* Sisa Budget — only shown when a monthly budget is set */}
        {sisaBudget !== 0 || (Array.isArray(bdgData) && bdgData.some(b => b.period === 'monthly')) ? (
          <div className={`col-span-2 md:col-span-1 p-5 rounded-[1.5rem] flex flex-col justify-between aspect-auto border transition-all duration-300 ${sisaBudget < 0
            ? 'bg-error/8 border-error/25'
            : 'bg-surface-container-low border-outline-variant/5'
            }`}>
            <span
              className={`material-symbols-outlined ${sisaBudget < 0 ? 'text-error' : 'text-primary'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {sisaBudget < 0 ? 'warning' : 'analytics'}
            </span>
            <div className="mt-4">
              <p className="font-label text-[10px] font-bold text-on-surface-variant tracking-wider">Sisa Budget</p>
              {loading ? (
                <div className="h-6 w-24 bg-surface-container-highest animate-pulse rounded mt-1" />
              ) : (
                <p className={`font-headline text-lg font-extrabold ${sisaBudget < 0 ? 'text-error' : 'text-on-surface'
                  }`}>
                  Rp {formatCurrency(sisaBudget)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="col-span-2 md:col-span-1 p-5 rounded-[1.5rem] bg-surface-container-low border border-dashed border-outline-variant/30 flex flex-col justify-between aspect-auto opacity-60">
            <span className="material-symbols-outlined text-on-surface-variant">savings</span>
            <div className="mt-4">
              <p className="font-label text-[10px] font-bold text-on-surface-variant tracking-wider">Budget Bulanan</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">Belum diset</p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
