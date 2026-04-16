"use client";
import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SpendingChart() {
  const { transactions, isLoading: loading } = useStore();
  const [data, setData] = useState<{ dateStr: string; dayName: string; fullDate: string; amount: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading) {
      // Initialize last 7 days payload
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        // Map dates in chronological order (7 days ago up to today)
        d.setDate(d.getDate() - (6 - i));
        return {
          dateStr: d.toLocaleDateString('en-CA'),
          dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }), 
          fullDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          amount: 0
        };
      });

      // Group amounts
      transactions.forEach((trx: any) => {
        const dateStr = new Date(trx.date).toLocaleDateString('en-CA');
        const dayIndex = last7Days.findIndex(d => d.dateStr === dateStr);
        if (dayIndex !== -1) {
          last7Days[dayIndex].amount += Number(trx.amount);
        }
      });
      
      setData(last7Days);
    }
  }, [transactions, loading]);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="font-headline text-lg font-semibold tracking-tight">Spending Trends</h2>
        <span className="font-label text-[11px] font-medium text-on-surface-variant uppercase tracking-widest">7 Hari Terakhir</span>
      </div>
      <div className="bg-surface-container-lowest p-6 rounded-[2rem] h-64 border border-outline-variant/5">
        {!mounted || loading ? (
          <div className="w-full h-full flex justify-center items-center">
            <p className="text-on-surface-variant/50 text-sm animate-pulse font-medium">Menganalisis pengeluaran...</p>
          </div>
        ) : (
          <ResponsiveContainer width="99%" height={200}>
            <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="dayName" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--app-outline)', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface-container-highest p-3 rounded-2xl shadow-xl border border-outline-variant/10">
                        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface/80 mb-1 font-bold">{payload[0].payload.fullDate}</p>
                        <p className="font-headline text-on-surface font-extrabold">
                          Rp {Number(payload[0].value).toLocaleString('id-ID')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={24}>
                {data.map((entry, index) => {
                  const maxAmount = Math.max(...data.map(d => d.amount));
                  // Extremely subtle distinct color for zero amounts or very low interaction
                  if (entry.amount === 0) return <Cell key={`cell-${index}`} fill="var(--app-surface-container-highest)" opacity={0.2} />;
                  
                  // Highlight visually highest spending behavior with distinct shade
                  if (entry.amount === maxAmount && maxAmount > 0) {
                     return <Cell key={`cell-${index}`} fill="var(--app-error-container)" />;
                  }
                  // Normal day trend
                  return <Cell key={`cell-${index}`} fill="var(--app-primary)" opacity={0.8} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
