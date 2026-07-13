"use client";
import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface DayData {
  dateStr: string;
  dayName: string;
  fullDate: string;
  pengeluaran: number; // expenses (amount > 0)
  pemasukan: number;   // income   (amount < 0, stored as positive)
}

export default function SpendingChart() {
  const { transactions, isLoading: loading } = useStore();
  const [data, setData] = useState<DayData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading) {
      // Initialize last 7 days
      const last7: DayData[] = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          dateStr: d.toLocaleDateString('en-CA'),
          dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          fullDate: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          pengeluaran: 0,
          pemasukan: 0,
        };
      });

      // Aggregate
      transactions.forEach((trx: any) => {
        const dateStr = new Date(trx.date).toLocaleDateString('en-CA');
        const idx = last7.findIndex(d => d.dateStr === dateStr);
        if (idx === -1) return;
        const amt = Number(trx.amount);
        if (amt > 0) last7[idx].pengeluaran += amt;      // expense
        else         last7[idx].pemasukan  += Math.abs(amt); // income
      });

      setData(last7);
    }
  }, [transactions, loading]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as DayData;
    return (
      <div className="bg-surface-container-highest px-4 py-3 rounded-2xl shadow-xl border border-outline-variant/10 text-xs space-y-1.5">
        <p className="font-bold text-on-surface/80 uppercase tracking-widest text-[10px] mb-2">{d.fullDate}</p>
        {d.pengeluaran > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" />
            <span className="text-on-surface-variant">Keluar:</span>
            <span className="font-bold text-on-surface">Rp {d.pengeluaran.toLocaleString('id-ID')}</span>
          </div>
        )}
        {d.pemasukan > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
            <span className="text-on-surface-variant">Masuk:</span>
            <span className="font-bold text-on-surface">Rp {d.pemasukan.toLocaleString('id-ID')}</span>
          </div>
        )}
        {d.pengeluaran === 0 && d.pemasukan === 0 && (
          <p className="text-on-surface-variant/50">Tidak ada transaksi</p>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-base font-bold tracking-tight text-on-surface">Tren 7 hari</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-error/80" />
            <span className="text-[9px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Keluar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary/80" />
            <span className="text-[9px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Masuk</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="bg-surface-container-lowest px-4 pt-5 pb-3 rounded-2xl border border-outline-variant/6 card-spotlight">
        {!mounted || loading ? (
          <div className="flex justify-center items-center h-[180px]">
            <div className="flex flex-col items-center gap-2">
              <div className="h-[80px] w-full skeleton-wave rounded-xl" />
              <p className="text-[10px] text-on-surface-variant/40 font-medium">Menganalisis data...</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="30%">
              <XAxis
                dataKey="dayName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--app-outline)', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em' }}
                dy={8}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--app-surface-container)', rx: 6, ry: 6 }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="pengeluaran" radius={[5, 5, 3, 3]} barSize={9} fill="var(--app-error)" opacity={0.75} />
              <Bar dataKey="pemasukan"   radius={[5, 5, 3, 3]} barSize={9} fill="var(--app-secondary)" opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
