"use client";
import React from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import TransactionItem from './TransactionItem';

export default function RecentTransactions() {
  const { transactions, isLoading: loading } = useStore();

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-lg font-bold tracking-tight">Transaksi Terakhir</h2>
        <Link href="/riwayat" className='text-primary text-xs font-bold uppercase tracking-widest hover:opacity-80 active:scale-95 transition-all'>
          Lihat Semua
        </Link>
      </div>
      <div className="space-y-2.5">
        {loading ? (
          <p className="text-sm text-on-surface-variant text-center my-6">Memuat log transaksi...</p>
        ) : transactions.length > 0 ? (
          transactions.slice(0, 5).map((trx: any) => {
            const isIncome = Number(trx.amount) < 0;
            const absoluteAmountStr = Math.abs(Number(trx.amount)).toLocaleString('id-ID');
            
            return (
              <TransactionItem
                key={trx.id}
                icon={trx.category?.icon || 'payments'}
                category={trx.category?.name || 'Tanpa Kategori'}
                vendor={trx.note || 'Transaksi Biasa'}
                amount={isIncome ? `+ Rp ${absoluteAmountStr}` : `- Rp ${absoluteAmountStr}`}
                date={new Date(trx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                isIncome={isIncome}
                iconColorClass={isIncome ? "text-secondary" : "text-primary"}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <span className="material-symbols-outlined text-3xl mb-2 text-on-surface-variant/40">receipt_long</span>
            <p className="text-sm text-on-surface-variant font-medium">Belum ada transaksi.</p>
          </div>
        )}
      </div>
    </section>
  );
}
