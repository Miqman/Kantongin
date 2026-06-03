"use client";
import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function HeroSection() {
  const { transactions: txData, budgets: bdgData, isLoading: loading } = useStore();
  
  const [totalDana, setTotalDana] = useState(0);
  const [totalHariIni, setTotalHariIni] = useState(0);
  const [totalBulanIni, setTotalBulanIni] = useState(0);
  const [sisaBudget, setSisaBudget] = useState(0);
  const [growth, setGrowth] = useState(0);

  useEffect(() => {
    if (!loading) {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalIncome = txData
        .filter(t => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const totalExpense = txData
        .filter(t => Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const currentBalance = totalIncome - totalExpense;
      setTotalDana(currentBalance);

      const prevIncome = txData
        .filter(t => new Date(t.date) < firstDayOfMonth && Number(t.amount) < 0)
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      const prevExpense = txData
        .filter(t => new Date(t.date) < firstDayOfMonth && Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const prevBalance = prevIncome - prevExpense;

      if (prevBalance !== 0) {
        const pct = ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100;
        setGrowth(pct);
      } else if (currentBalance !== 0 && prevBalance === 0) {
        setGrowth(100);
      } else {
        setGrowth(0);
      }

      // 4. Total Hari Ini (Expenses only, amount > 0)
      const todayStr = new Date().toLocaleDateString('en-CA');
      const todayExps = txData
        .filter(t => new Date(t.date).toLocaleDateString('en-CA') === todayStr && Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalHariIni(todayExps);

      // 5. Total Bulan Ini (Expenses only, amount > 0)
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const monthExps = txData
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && Number(t.amount) > 0;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalBulanIni(monthExps);

      // 6. Sisa Budget
      let monthBudget = 0;
      if (Array.isArray(bdgData) && bdgData.length > 0) {
          monthBudget = bdgData.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0);
      }
      setSisaBudget(monthBudget - monthExps);
    }
  }, [txData, bdgData, loading]);

  // Helpers
  const formatCompact = (num: number) => {
    return new Intl.NumberFormat('id-ID', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <>
      {/* Hero Section: Total Balance */}
      <section className="space-y-2">
        <p className="font-label text-[11px] font-medium tracking-widest uppercase text-on-surface-variant">Total Dana</p>
        <div className="flex items-baseline gap-2">
          {loading ? (
             <div className="h-10 w-48 bg-surface-container-high animate-pulse rounded-lg mt-1"></div>
          ) : (
              <>
                <span className="text-display-md font-headline text-4xl font-extrabold tracking-tight text-on-surface">Rp {formatCurrency(totalDana)}</span>
                <span className={`text-sm font-bold md:opacity-100 transition-opacity ${growth >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </span>
              </>
          )}
        </div>
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
        
        {/* Sisa Budget — only shown when a budget is set */}
        {sisaBudget !== 0 || (Array.isArray(bdgData) && bdgData.length > 0) ? (
          <div className={`col-span-2 md:col-span-1 p-5 rounded-[1.5rem] flex flex-col justify-between aspect-auto border transition-all duration-300 ${
            sisaBudget < 0
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
                <p className={`font-headline text-lg font-extrabold ${
                  sisaBudget < 0 ? 'text-error' : 'text-on-surface'
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
