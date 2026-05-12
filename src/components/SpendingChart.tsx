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
    <section className="space-y-4">
      <div className="flex justify-between items-end">
        <h2 className="font-headline text-lg font-semibold tracking-tight">Tren Pengeluaran</h2>
        <span className="font-label text-[11px] font-medium text-on-surface-variant uppercase tracking-widest">7 Hari Terakhir</span>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-error" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pengeluaran</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-secondary" />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pemasukan</span>
        </div>
      </div>

      <div className="bg-surface-container-lowest px-6 pt-6 pb-4 rounded-[2rem] border border-outline-variant/5">
        {!mounted || loading ? (
          <div className="flex justify-center items-center h-[200px]">
            <p className="text-on-surface-variant/50 text-sm animate-pulse font-medium">Menganalisis pengeluaran...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barGap={2}>
              <XAxis
                dataKey="dayName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--app-outline)', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--app-surface-container)' }}
                content={<CustomTooltip />}
              />
              {/* Pengeluaran — red/error */}
              <Bar dataKey="pengeluaran" radius={[6, 6, 4, 4]} barSize={10} fill="var(--app-error)" opacity={0.85} />
              {/* Pemasukan — green/secondary */}
              <Bar dataKey="pemasukan"   radius={[6, 6, 4, 4]} barSize={10} fill="var(--app-secondary)" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
