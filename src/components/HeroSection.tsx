"use client";
import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function HeroSection() {
  const { transactions: txData, budgets: bdgData, isLoading: loading } = useStore();
  
  const [totalDana, setTotalDana] = useState(0);
  const [totalHariIni, setTotalHariIni] = useState(0);
  const [totalBulanIni, setTotalBulanIni] = useState(0);
  const [sisaBudget, setSisaBudget] = useState(0);

  useEffect(() => {
    if (!loading) {
      // Base logic: Positive = Expense, Negative = Income
      const totalNetExps = txData.reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Total Dana represents true cumulative net worth. 
      // Starting from 0, incomes (negative amount) increase it, expenses (positive amount) decrease it.
      setTotalDana( -totalNetExps ); 

      // Total Hari Ini (Only sum Expenses, i.e., amount > 0)
      const todayStr = new Date().toLocaleDateString('en-CA');
      const todayExps = txData
        .filter(t => new Date(t.date).toLocaleDateString('en-CA') === todayStr && Number(t.amount) > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalHariIni(todayExps);

      // Total Bulan Ini (Only sum Expenses, i.e., amount > 0)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthExps = txData
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && Number(t.amount) > 0;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalBulanIni(monthExps);

      // Sisa Budget Murni 
      let monthBudget = 0; // Starts strictly at real database value 0
      if (Array.isArray(bdgData) && bdgData.length > 0) {
          // Schema matches limit_amount not limit
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
               <span className="text-secondary text-sm font-bold opacity-0 md:opacity-100">+2.4%</span>
             </>
          )}
        </div>
      </section>

      {/* Bento Grid: Summary Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Hari Ini */}
        <div className="col-span-1 p-5 rounded-[1.5rem] bg-surface-container-low flex flex-col justify-between aspect-square md:aspect-auto border border-outline-variant/5">
          <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
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
        <div className="col-span-1 p-5 rounded-[1.5rem] bg-surface-container-high flex flex-col justify-between aspect-square md:aspect-auto border border-outline-variant/10">
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
        
        {/* Sisa Budget (Spans 2 on mobile) */}
        <div className="col-span-2 md:col-span-1 p-5 rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-container text-on-primary-container flex flex-col justify-between aspect-auto shadow-lg">
          <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
          <div className="mt-4">
            <p className="font-label text-[10px] font-bold text-on-primary-container/70 tracking-wider">Sisa Budget</p>
            {loading ? (
              <div className="h-6 w-24 bg-primary-fixed/20 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="font-headline text-lg font-extrabold">Rp {formatCurrency(sisaBudget)}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
